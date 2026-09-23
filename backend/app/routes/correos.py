"""
Rutas para Correos. Solo GET y PUT (los correos se crean via el agente IMAP).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from app.db.models import Correo
from app.db.session import get_session

router = APIRouter(prefix="/api/correos", tags=["Correos"])


@router.get("/", response_model=List[Correo])
def listar_correos(
    solo_urgentes: bool = False,
    no_leidos: bool = False,
    session: Session = Depends(get_session),
):
    """Lista correos procesados por el agente IMAP."""
    query = select(Correo)
    if solo_urgentes:
        query = query.where(Correo.urgente == True)
    if no_leidos:
        query = query.where(Correo.leido == False)
    query = query.order_by(Correo.fecha_recibido.desc())
    return session.exec(query).all()


@router.get("/{correo_id}", response_model=Correo)
def obtener_correo(correo_id: int, session: Session = Depends(get_session)):
    """Obtiene un correo por ID."""
    correo = session.get(Correo, correo_id)
    if not correo:
        raise HTTPException(status_code=404, detail="Correo no encontrado")
    return correo


@router.put("/{correo_id}/leido", response_model=Correo)
def marcar_leido(correo_id: int, session: Session = Depends(get_session)):
    """Marca un correo como leído."""
    correo = session.get(Correo, correo_id)
    if not correo:
        raise HTTPException(status_code=404, detail="Correo no encontrado")
    correo.leido = True
    session.add(correo)
    session.commit()
    session.refresh(correo)
    return correo
