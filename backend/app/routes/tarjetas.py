"""
Rutas CRUD para Tarjetas de Crédito.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, SQLModel
from typing import List, Optional

from app.db.models import TarjetaCredito
from app.db.session import get_session
from app.core.deps import get_current_user
from app.db.models import Usuario

router = APIRouter(prefix="/api/tarjetas", tags=["Tarjetas de Crédito"])

class TarjetaCreditoCreate(SQLModel):
    nombre: str
    cupo_total: float
    cupo_utilizado: float = 0.0
    fecha_corte: int
    fecha_pago: int
    tasa_interes: Optional[float] = None


@router.get("/", response_model=List[TarjetaCredito])
def listar_tarjetas(session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user)):
    """Lista todas las tarjetas de crédito registradas."""
    return session.exec(select(TarjetaCredito).where(TarjetaCredito.usuario_id == current_user.id)).all()


@router.get("/{tarjeta_id}", response_model=TarjetaCredito)
def obtener_tarjeta(tarjeta_id: int, session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user)):
    """Obtiene una tarjeta por ID."""
    tarjeta = session.get(TarjetaCredito, tarjeta_id)
    if not tarjeta or tarjeta.usuario_id != current_user.id:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
    return tarjeta


@router.post("/", response_model=TarjetaCredito, status_code=201)
def crear_tarjeta(datos: TarjetaCreditoCreate, session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user)):
    """Registra una nueva tarjeta de crédito."""
    tarjeta = TarjetaCredito(**datos.model_dump(), usuario_id=current_user.id)
    tarjeta.id = None
    session.add(tarjeta)
    session.commit()
    session.refresh(tarjeta)
    return tarjeta


@router.put("/{tarjeta_id}", response_model=TarjetaCredito)
def actualizar_tarjeta(
    tarjeta_id: int,
    datos: TarjetaCredito,
    session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user),
):
    """Actualiza los datos de una tarjeta (cupo utilizado, fechas, etc.)."""
    tarjeta = session.get(TarjetaCredito, tarjeta_id)
    if not tarjeta or tarjeta.usuario_id != current_user.id:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")

    datos_dict = datos.model_dump(exclude_unset=True, exclude={"id"})
    for campo, valor in datos_dict.items():
        setattr(tarjeta, campo, valor)

    session.add(tarjeta)
    session.commit()
    session.refresh(tarjeta)
    return tarjeta


@router.delete("/{tarjeta_id}", status_code=204)
def eliminar_tarjeta(tarjeta_id: int, session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user)):
    """Elimina una tarjeta de crédito."""
    tarjeta = session.get(TarjetaCredito, tarjeta_id)
    if not tarjeta or tarjeta.usuario_id != current_user.id:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
    session.delete(tarjeta)
    session.commit()
