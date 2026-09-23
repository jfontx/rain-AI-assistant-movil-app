"""
Agente lector de correos IMAP.
Usa imap-tools para conectarse a Gmail via App Password,
luego usa el LLM para resumir cada correo y detectar urgencia.
"""
import os
import asyncio
from datetime import datetime
from typing import List
from sqlmodel import Session, select
from imap_tools import MailBox, AND

from app.db.models import Correo
from app.db.session import engine

from dotenv import load_dotenv

load_dotenv()

EMAIL_USER = os.getenv("EMAIL_USER", "")
EMAIL_APP_PASSWORD = os.getenv("EMAIL_APP_PASSWORD", "")
IMAP_SERVER = "imap.gmail.com"

# Removed internal LLM summarization to speed up IMAP sync.
# The orchestrator LLM will summarize the text returned.


async def leer_correos_no_leidos(usuario_id: int, limite: int = 10) -> List[dict]:
    """
    Conecta al buzón Gmail via IMAP, lee hasta `limite` correos no leídos,
    los resume con el LLM y los guarda en la tabla Correo.

    Retorna lista de dicts con los correos procesados.
    """
    if not EMAIL_USER or not EMAIL_APP_PASSWORD:
        raise ValueError(
            "EMAIL_USER y EMAIL_APP_PASSWORD deben estar configurados en .env"
        )

    correos_procesados = []

    PALABRAS_URGENTES = ["urgente", "importante", "asap", "pago", "vencido", "seguridad"]

    with MailBox(IMAP_SERVER).login(EMAIL_USER, EMAIL_APP_PASSWORD) as buzón:
        # Buscar correos no leídos (UNSEEN)
        mensajes = list(buzón.fetch(AND(seen=False), limit=limite, reverse=True))

    # Procesar cada mensaje fuera del context manager del buzón
    for msg in mensajes:
        remitente = msg.from_ or "desconocido"
        asunto = msg.subject or "(sin asunto)"
        cuerpo = msg.text or msg.html or ""

        # Resumen simple rápido
        resumen_texto = (cuerpo[:200] + "...") if len(cuerpo) > 200 else (cuerpo or "Sin contenido")
        es_urgente = any(p in asunto.lower() for p in PALABRAS_URGENTES)

        # Guardar en base de datos
        with Session(engine) as session:
            # Evitar duplicados por asunto + remitente
            existe = session.exec(
                select(Correo).where(Correo.usuario_id == usuario_id).where(Correo.asunto == asunto, Correo.remitente == remitente)
            ).first()

            if not existe:
                correo = Correo(usuario_id=usuario_id, 
                    remitente=remitente,
                    asunto=asunto,
                    resumen=resumen_texto,
                    urgente=es_urgente,
                    leido=False,
                    fecha_recibido=msg.date or datetime.now(),
                )
                session.add(correo)
                session.commit()

    # Retornar siempre los últimos N correos no leídos de nuestra base de datos,
    # para que la IA tenga contexto, incluso si no se descargaron nuevos hoy.
    with Session(engine) as session:
        ultimos_correos = session.exec(
            select(Correo).where(Correo.usuario_id == usuario_id).where(Correo.leido == False).order_by(Correo.fecha_recibido.desc()).limit(limite)
        ).all()

        return [
            {
                "id": c.id,
                "remitente": c.remitente,
                "asunto": c.asunto,
                "resumen": c.resumen,
                "urgente": c.urgente,
                "fecha_recibido": c.fecha_recibido.isoformat(),
            }
            for c in ultimos_correos
        ]
