"""
Rutas CRUD para Transacciones financieras.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, SQLModel
from typing import List, Optional
from datetime import datetime

from app.db.models import Transaccion, TipoTransaccion, Origen
from app.db.session import get_session
from app.core.deps import get_current_user
from app.db.models import Usuario

router = APIRouter(prefix="/api/transacciones", tags=["Transacciones"])


class TransaccionCreate(SQLModel):
    tipo: TipoTransaccion
    monto: float
    categoria: str
    descripcion: str
    comercio: Optional[str] = None
    medio_pago: Optional[str] = None
    fecha: Optional[datetime] = None


@router.get("/", response_model=List[Transaccion])
def listar_transacciones(
    limit: int = 100,
    tipo: Optional[TipoTransaccion] = None,
    session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user),
):
    """Lista todas las transacciones, opcionalmente filtradas por tipo."""
    query = select(Transaccion).where(Transaccion.usuario_id == current_user.id)
    if tipo:
        query = query.where(Transaccion.tipo == tipo)
    query = query.order_by(Transaccion.fecha.desc()).limit(limit)
    return session.exec(query).all()


@router.get("/{transaccion_id}", response_model=Transaccion)
def obtener_transaccion(transaccion_id: int, session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user)):
    """Obtiene una transacción por ID."""
    transaccion = session.get(Transaccion, transaccion_id)
    if not transaccion or transaccion.usuario_id != current_user.id:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    return transaccion


@router.post("/", response_model=Transaccion, status_code=201)
def crear_transaccion(datos: TransaccionCreate, session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user)):
    """Crea una nueva transacción manualmente."""
    transaccion = Transaccion(**datos.model_dump(), usuario_id=current_user.id)
    if not transaccion.fecha:
        transaccion.fecha = datetime.now()
    session.add(transaccion)
    session.commit()
    session.refresh(transaccion)
    return transaccion


@router.put("/{transaccion_id}", response_model=Transaccion)
def actualizar_transaccion(
    transaccion_id: int,
    datos: Transaccion,
    session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user),
):
    """Actualiza los campos de una transacción existente."""
    transaccion = session.get(Transaccion, transaccion_id)
    if not transaccion or transaccion.usuario_id != current_user.id:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")

    datos_dict = datos.model_dump(exclude_unset=True, exclude={"id"})
    for campo, valor in datos_dict.items():
        setattr(transaccion, campo, valor)

    session.add(transaccion)
    session.commit()
    session.refresh(transaccion)
    return transaccion


@router.delete("/{transaccion_id}", status_code=204)
def eliminar_transaccion(transaccion_id: int, session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user)):
    """Elimina una transacción por ID."""
    transaccion = session.get(Transaccion, transaccion_id)
    if not transaccion or transaccion.usuario_id != current_user.id:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    session.delete(transaccion)
    session.commit()
