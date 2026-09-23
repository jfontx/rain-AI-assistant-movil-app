"""
Rutas CRUD para Metas de Ahorro.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, SQLModel
from typing import List, Optional
from datetime import datetime

from app.db.models import MetaAhorro
from app.db.session import get_session
from app.core.deps import get_current_user
from app.db.models import Usuario

router = APIRouter(prefix="/api/metas", tags=["Metas de Ahorro"])

class MetaAhorroCreate(SQLModel):
    nombre: str
    monto_objetivo: float
    monto_actual: float = 0.0
    fecha_limite: Optional[datetime] = None


@router.get("/", response_model=List[MetaAhorro])
def listar_metas(session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user)):
    """Lista todas las metas de ahorro."""
    return session.exec(select(MetaAhorro).where(MetaAhorro.usuario_id == current_user.id)).all()


@router.get("/{meta_id}", response_model=MetaAhorro)
def obtener_meta(meta_id: int, session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user)):
    """Obtiene una meta por ID."""
    meta = session.get(MetaAhorro, meta_id)
    if not meta or meta.usuario_id != current_user.id:
        raise HTTPException(status_code=404, detail="Meta no encontrada")
    return meta


@router.post("/", response_model=MetaAhorro, status_code=201)
def crear_meta(datos: MetaAhorroCreate, session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user)):
    """Crea una nueva meta de ahorro."""
    meta = MetaAhorro(**datos.model_dump(), usuario_id=current_user.id)
    meta.id = None
    session.add(meta)
    session.commit()
    session.refresh(meta)
    return meta


@router.put("/{meta_id}", response_model=MetaAhorro)
def actualizar_meta(
    meta_id: int,
    datos: MetaAhorro,
    session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user),
):
    """Actualiza una meta de ahorro."""
    meta = session.get(MetaAhorro, meta_id)
    if not meta or meta.usuario_id != current_user.id:
        raise HTTPException(status_code=404, detail="Meta no encontrada")

    datos_dict = datos.model_dump(exclude_unset=True, exclude={"id"})
    for campo, valor in datos_dict.items():
        setattr(meta, campo, valor)

    session.add(meta)
    session.commit()
    session.refresh(meta)
    return meta


@router.delete("/{meta_id}", status_code=204)
def eliminar_meta(meta_id: int, session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user)):
    """Elimina una meta de ahorro."""
    meta = session.get(MetaAhorro, meta_id)
    if not meta or meta.usuario_id != current_user.id:
        raise HTTPException(status_code=404, detail="Meta no encontrada")
    session.delete(meta)
    session.commit()
