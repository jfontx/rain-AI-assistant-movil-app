"""
Rutas CRUD para Eventos y Tareas de agenda.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, SQLModel
from typing import List, Optional
from datetime import datetime

from app.db.models import Evento, TipoEvento, EstadoEvento, Prioridad, Origen
from app.db.session import get_session
from app.core.deps import get_current_user
from app.db.models import Usuario

router = APIRouter(prefix="/api/eventos", tags=["Eventos"])

class EventoCreate(SQLModel):
    titulo: str
    tipo: TipoEvento = TipoEvento.tarea
    categoria: Optional[str] = None
    fecha_inicio: datetime
    fecha_fin: Optional[datetime] = None
    prioridad: Prioridad = Prioridad.media
    estado: EstadoEvento = EstadoEvento.pendiente
    origen: Origen = Origen.manual
    notas: Optional[str] = None

@router.get("/", response_model=List[Evento])
def listar_eventos(
    tipo: Optional[TipoEvento] = None,
    estado: Optional[EstadoEvento] = None,
    session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user),
):
    """Lista todos los eventos, filtrables por tipo y estado."""
    query = select(Evento).where(Evento.usuario_id == current_user.id)
    if tipo:
        query = query.where(Evento.tipo == tipo)
    if estado:
        query = query.where(Evento.estado == estado)
    query = query.order_by(Evento.fecha_inicio.asc())
    return session.exec(query).all()


@router.get("/{evento_id}", response_model=Evento)
def obtener_evento(evento_id: int, session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user)):
    """Obtiene un evento por ID."""
    evento = session.get(Evento, evento_id)
    if not evento or evento.usuario_id != current_user.id:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    return evento


@router.post("/", response_model=Evento, status_code=201)
def crear_evento(datos: EventoCreate, session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user)):
    """Crea un nuevo evento o tarea."""
    evento = Evento(**datos.model_dump(), usuario_id=current_user.id)
    evento.id = None
    session.add(evento)
    session.commit()
    session.refresh(evento)
    return evento


@router.put("/{evento_id}", response_model=Evento)
def actualizar_evento(
    evento_id: int,
    datos: Evento,
    session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user),
):
    """Actualiza los campos de un evento existente."""
    evento = session.get(Evento, evento_id)
    if not evento or evento.usuario_id != current_user.id:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    datos_dict = datos.model_dump(exclude_unset=True, exclude={"id"})
    for campo, valor in datos_dict.items():
        setattr(evento, campo, valor)

    session.add(evento)
    session.commit()
    session.refresh(evento)
    return evento


@router.delete("/{evento_id}", status_code=204)
def eliminar_evento(evento_id: int, session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user)):
    """Elimina un evento por ID."""
    evento = session.get(Evento, evento_id)
    if not evento or evento.usuario_id != current_user.id:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    session.delete(evento)
    session.commit()
