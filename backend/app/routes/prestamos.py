"""
Rutas CRUD para Préstamos.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, SQLModel
from typing import List, Optional
from datetime import datetime

from app.db.models import Prestamo
from app.db.session import get_session
from app.core.deps import get_current_user
from app.db.models import Usuario

router = APIRouter(prefix="/api/prestamos", tags=["Préstamos"])

class PrestamoCreate(SQLModel):
    nombre: str
    monto_total: float
    saldo_pendiente: float
    cuota_mensual: float
    tasa_interes_mensual: float
    fecha_pago_mensual: int
    fecha_desembolso: Optional[datetime] = None


@router.get("/", response_model=List[Prestamo])
def listar_prestamos(session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user)):
    """Lista todos los préstamos."""
    return session.exec(select(Prestamo).where(Prestamo.usuario_id == current_user.id)).all()


@router.get("/{prestamo_id}", response_model=Prestamo)
def obtener_prestamo(prestamo_id: int, session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user)):
    """Obtiene un préstamo por ID."""
    prestamo = session.get(Prestamo, prestamo_id)
    if not prestamo or prestamo.usuario_id != current_user.id:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")
    return prestamo


@router.post("/", response_model=Prestamo, status_code=201)
def crear_prestamo(datos: PrestamoCreate, session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user)):
    """Registra un nuevo préstamo."""
    prestamo = Prestamo(**datos.model_dump(), usuario_id=current_user.id)
    prestamo.id = None
    session.add(prestamo)
    session.commit()
    session.refresh(prestamo)
    return prestamo


@router.put("/{prestamo_id}", response_model=Prestamo)
def actualizar_prestamo(
    prestamo_id: int,
    datos: Prestamo,
    session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user),
):
    """Actualiza los datos de un préstamo."""
    prestamo = session.get(Prestamo, prestamo_id)
    if not prestamo or prestamo.usuario_id != current_user.id:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")

    datos_dict = datos.model_dump(exclude_unset=True, exclude={"id"})
    for campo, valor in datos_dict.items():
        setattr(prestamo, campo, valor)

    session.add(prestamo)
    session.commit()
    session.refresh(prestamo)
    return prestamo


@router.delete("/{prestamo_id}", status_code=204)
def eliminar_prestamo(prestamo_id: int, session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user)):
    """Elimina un préstamo."""
    prestamo = session.get(Prestamo, prestamo_id)
    if not prestamo or prestamo.usuario_id != current_user.id:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")
    session.delete(prestamo)
    session.commit()
