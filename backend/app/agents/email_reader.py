"""
Agente lector de correos IMAP.
Usa imap-tools para conectarse a Gmail via App Password,
luego usa el LLM para resumir cada correo y detectar urgencia.
"""
import os
import asyncio
from datetime import datetime
from typing import List

from imap_tools import MailBox, AND
from dotenv import load_dotenv
from sqlmodel import Session

from app.db.models import Correo
from app.db.session import engine
from app.llm.ollama_client import chat_with_tools

load_dotenv()

EMAIL_USER = os.getenv("EMAIL_USER", "")
EMAIL_APP_PASSWORD = os.getenv("EMAIL_APP_PASSWORD", "")
IMAP_SERVER = "imap.gmail.com"


async def _resumir_correo_con_llm(remitente: str, asunto: str, cuerpo: str) -> dict:
    """
    Usa el LLM para generar un resumen corto del correo y determinar si es urgente.
    Retorna {'resumen': str, 'urgente': bool}
    """
    prompt = f"""Analiza este correo electrónico y responde ÚNICAMENTE con un JSON válido con dos campos:
- "resumen": un resumen de 1 a 2 frases en español del contenido del correo
- "urgente": true si requiere atención inmediata (pago vencido, cita, fecha límite, problema de seguridad), false en caso contrario

Correo:
De: {remitente}
Asunto: {asunto}
Cuerpo: {cuerpo[:2000]}

Responde solo con el JSON, sin markdown ni texto adicional."""

    respuesta = await chat_with_tools(
        messages=[
            {"role": "system", "content": "Eres un asistente que analiza correos. Responde siempre en JSON válido."},
            {"role": "user", "content": prompt},
        ],
        format="json",
    )

    import json
    contenido = respuesta.get("message", {}).get("content", "{}")
    try:
        datos = json.loads(contenido)
        return {
            "resumen": datos.get("resumen", asunto),
            "urgente": bool(datos.get("urgente", False)),
        }
    except json.JSONDecodeError:
        # Si el LLM no retorna JSON válido, usar valores por defecto
        return {"resumen": f"Correo de {remitente}: {asunto}", "urgente": False}


async def leer_correos_no_leidos(limite: int = 10) -> List[dict]:
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

    with MailBox(IMAP_SERVER).login(EMAIL_USER, EMAIL_APP_PASSWORD) as buzón:
        # Buscar correos no leídos (UNSEEN)
        mensajes = list(buzón.fetch(AND(seen=False), limit=limite, reverse=True))

    # Procesar cada mensaje fuera del context manager del buzón
    for msg in mensajes:
        remitente = msg.from_ or "desconocido"
        asunto = msg.subject or "(sin asunto)"
        cuerpo = msg.text or msg.html or ""

        # Resumir con LLM
        analisis = await _resumir_correo_con_llm(remitente, asunto, cuerpo[:3000])

        # Guardar en base de datos
        with Session(engine) as session:
            # Evitar duplicados por fecha_recibido + remitente
            correo = Correo(
                remitente=remitente,
                asunto=asunto,
                resumen=analisis["resumen"],
                urgente=analisis["urgente"],
                leido=False,
                fecha_recibido=msg.date or datetime.now(),
            )
            session.add(correo)
            session.commit()
            session.refresh(correo)

            correos_procesados.append({
                "id": correo.id,
                "remitente": correo.remitente,
                "asunto": correo.asunto,
                "resumen": correo.resumen,
                "urgente": correo.urgente,
                "fecha_recibido": correo.fecha_recibido.isoformat(),
            })

    return correos_procesados
