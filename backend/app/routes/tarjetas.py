"""
Rutas CRUD para Tarjetas de Crédito.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, SQLModel
from typing import List, Optional

from app.db.models import TarjetaCredito
from app.db.session import get_session

router = APIRouter(prefix="/api/tarjetas", tags=["Tarjetas de Crédito"])

class TarjetaCreditoCreate(SQLModel):
    nombre: str
    cupo_total: float
    cupo_utilizado: float = 0.0
    fecha_corte: int
    fecha_pago: int
    tasa_interes: Optional[float] = None


@router.get("/", response_model=List[TarjetaCredito])
def listar_tarjetas(session: Session = Depends(get_session)):
    """Lista todas las tarjetas de crédito registradas."""
    return session.exec(select(TarjetaCredito)).all()


@router.get("/{tarjeta_id}", response_model=TarjetaCredito)
def obtener_tarjeta(tarjeta_id: int, session: Session = Depends(get_session)):
    """Obtiene una tarjeta por ID."""
    tarjeta = session.get(TarjetaCredito, tarjeta_id)
    if not tarjeta:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
    return tarjeta


@router.post("/", response_model=TarjetaCredito, status_code=201)
def crear_tarjeta(datos: TarjetaCreditoCreate, session: Session = Depends(get_session)):
    """Registra una nueva tarjeta de crédito."""
    tarjeta = TarjetaCredito(**datos.model_dump())
    tarjeta.id = None
    session.add(tarjeta)
    session.commit()
    session.refresh(tarjeta)
    return tarjeta


@router.put("/{tarjeta_id}", response_model=TarjetaCredito)
def actualizar_tarjeta(
    tarjeta_id: int,
    datos: TarjetaCredito,
    session: Session = Depends(get_session),
):
    """Actualiza los datos de una tarjeta (cupo utilizado, fechas, etc.)."""
    tarjeta = session.get(TarjetaCredito, tarjeta_id)
    if not tarjeta:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")

    datos_dict = datos.model_dump(exclude_unset=True, exclude={"id"})
    for campo, valor in datos_dict.items():
        setattr(tarjeta, campo, valor)

    session.add(tarjeta)
    session.commit()
    session.refresh(tarjeta)
    return tarjeta


@router.delete("/{tarjeta_id}", status_code=204)
def eliminar_tarjeta(tarjeta_id: int, session: Session = Depends(get_session)):
    """Elimina una tarjeta de crédito."""
    tarjeta = session.get(TarjetaCredito, tarjeta_id)
    if not tarjeta:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
    session.delete(tarjeta)
    session.commit()
