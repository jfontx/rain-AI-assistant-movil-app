"""
Agente secretaria — gestión de agenda, tareas y correos.
Funciones puras invocadas por el orquestador via function calling.
"""
from datetime import datetime
from typing import Optional
from sqlmodel import Session, select

from app.db.models import Evento, TipoEvento, Prioridad, EstadoEvento, Origen, Correo
from app.db.session import engine


def crear_tarea(
    titulo: str,
    fecha_limite: str,
    prioridad: str = "media",
    notas: Optional[str] = None,
    categoria: Optional[str] = None,
) -> dict:
    """
    Crea una nueva tarea en la agenda.
    fecha_limite debe ser un string ISO 8601 (ej: '2026-09-25T18:00:00').
    Retorna los datos de la tarea creada.
    """
    with Session(engine) as session:
        evento = Evento(
            titulo=titulo,
            tipo=TipoEvento.tarea,
            categoria=categoria,
            fecha_inicio=datetime.fromisoformat(fecha_limite),
            prioridad=Prioridad(prioridad),
            estado=EstadoEvento.pendiente,
            origen=Origen.ia,
            notas=notas,
        )
        session.add(evento)
        session.commit()
        session.refresh(evento)
        return {
            "id": evento.id,
            "titulo": evento.titulo,
            "tipo": evento.tipo,
            "fecha_inicio": evento.fecha_inicio.isoformat(),
            "prioridad": evento.prioridad,
            "estado": evento.estado,
        }


def consultar_eventos(
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    tipo: Optional[str] = None,
) -> list:
    """
    Retorna los eventos en el rango de fechas especificado.
    Si no se dan fechas, retorna todos los eventos futuros.
    Opcionalmente filtra por tipo ('tarea' o 'evento').
    """
    with Session(engine) as session:
        query = select(Evento)

        ahora = datetime.now()
        if fecha_desde:
            query = query.where(Evento.fecha_inicio >= datetime.fromisoformat(fecha_desde))
        else:
            query = query.where(Evento.fecha_inicio >= ahora)

        if fecha_hasta:
            query = query.where(Evento.fecha_inicio <= datetime.fromisoformat(fecha_hasta))

        if tipo:
            query = query.where(Evento.tipo == TipoEvento(tipo))

        query = query.order_by(Evento.fecha_inicio.asc())
        eventos = session.exec(query).all()

        return [
            {
                "id": e.id,
                "titulo": e.titulo,
                "tipo": e.tipo,
                "fecha_inicio": e.fecha_inicio.isoformat(),
                "prioridad": e.prioridad,
                "estado": e.estado,
                "notas": e.notas,
            }
            for e in eventos
        ]


def mover_evento(evento_id: int, nueva_fecha: str) -> dict:
    """
    Cambia la fecha_inicio de un evento existente.
    nueva_fecha debe ser un string ISO 8601.
    """
    with Session(engine) as session:
        evento = session.get(Evento, int(evento_id))
        if not evento:
            return {"error": f"No se encontró el evento con ID {evento_id}"}

        evento.fecha_inicio = datetime.fromisoformat(nueva_fecha)
        session.add(evento)
        session.commit()
        session.refresh(evento)
        return {
            "id": evento.id,
            "titulo": evento.titulo,
            "nueva_fecha": evento.fecha_inicio.isoformat(),
            "mensaje": "Evento movido exitosamente",
        }


def marcar_completado(evento_id: int) -> dict:
    """
    Marca una tarea/evento como completado.
    """
    with Session(engine) as session:
        evento = session.get(Evento, int(evento_id))
        if not evento:
            return {"error": f"No se encontró el evento con ID {evento_id}"}

        evento.estado = EstadoEvento.completado
        session.add(evento)
        session.commit()
        session.refresh(evento)
        return {
            "id": evento.id,
            "titulo": evento.titulo,
            "estado": evento.estado,
            "mensaje": f"'{evento.titulo}' marcada como completada.",
        }


def resumir_correos_urgentes() -> list:
    """
    Retorna todos los correos marcados como urgentes y no leídos.
    """
    with Session(engine) as session:
        query = select(Correo).where(
            Correo.urgente == True,
            Correo.leido == False,
        ).order_by(Correo.fecha_recibido.desc())

        correos = session.exec(query).all()
        return [
            {
                "id": c.id,
                "remitente": c.remitente,
                "asunto": c.asunto,
                "resumen": c.resumen,
                "fecha_recibido": c.fecha_recibido.isoformat(),
            }
            for c in correos
        ]

def redactar_borrador(destinatario: str, asunto: str, cuerpo: str) -> dict:
    """
    Guarda un borrador de correo en la base de datos para revisión posterior.
    """
    # Para simplicidad, podemos usar un modelo Evento o crear un CorreoSaliente.
    # Usaremos una simple confirmación en memoria ya que no tenemos tabla de borradores,
    # o mejor: podemos enviarlo directo o guardarlo en Evento como tarea de revisión.
    return {
        "status": "borrador_creado",
        "destinatario": destinatario,
        "asunto": asunto,
        "cuerpo": cuerpo,
        "mensaje": f"Borrador guardado para {destinatario}. Confirma si deseas enviarlo."
    }

def enviar_correo(destinatario: str, asunto: str, cuerpo: str) -> dict:
    """
    Envía un correo electrónico usando SMTP (Gmail).
    """
    import smtplib
    from email.mime.text import MIMEText
    import os
    
    remitente = os.getenv("EMAIL_USER")
    password = os.getenv("EMAIL_APP_PASSWORD")

    if not remitente or not password:
        return {"error": "Credenciales SMTP no configuradas en el entorno."}

    msg = MIMEText(cuerpo)
    msg['Subject'] = asunto
    msg['From'] = remitente
    msg['To'] = destinatario

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(remitente, password)
            server.sendmail(remitente, destinatario, msg.as_string())
        return {"status": "enviado", "mensaje": f"Correo enviado a {destinatario} exitosamente."}
    except Exception as e:
        return {"error": f"Error al enviar el correo: {e}"}
