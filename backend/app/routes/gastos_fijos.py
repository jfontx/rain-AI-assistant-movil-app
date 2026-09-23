"""
Rutas CRUD para Gastos Fijos.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, SQLModel
from typing import List

from app.db.models import GastoFijo
from app.db.session import get_session

router = APIRouter(prefix="/api/gastos-fijos", tags=["Gastos Fijos"])

class GastoFijoCreate(SQLModel):
    nombre: str
    monto: float
    dia_pago: int
    categoria: str
    activo: bool = True


@router.get("/", response_model=List[GastoFijo])
def listar_gastos_fijos(session: Session = Depends(get_session)):
    """Lista todos los gastos fijos."""
    return session.exec(select(GastoFijo)).all()


@router.get("/{gasto_id}", response_model=GastoFijo)
def obtener_gasto_fijo(gasto_id: int, session: Session = Depends(get_session)):
    """Obtiene un gasto fijo por ID."""
    gasto = session.get(GastoFijo, gasto_id)
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto fijo no encontrado")
    return gasto


@router.post("/", response_model=GastoFijo, status_code=201)
def crear_gasto_fijo(datos: GastoFijoCreate, session: Session = Depends(get_session)):
    """Registra un nuevo gasto fijo."""
    gasto = GastoFijo(**datos.model_dump())
    gasto.id = None
    session.add(gasto)
    session.commit()
    session.refresh(gasto)
    return gasto


@router.put("/{gasto_id}", response_model=GastoFijo)
def actualizar_gasto_fijo(
    gasto_id: int,
    datos: GastoFijo,
    session: Session = Depends(get_session),
):
    """Actualiza los datos de un gasto fijo."""
    gasto = session.get(GastoFijo, gasto_id)
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto fijo no encontrado")

    datos_dict = datos.model_dump(exclude_unset=True, exclude={"id"})
    for campo, valor in datos_dict.items():
        setattr(gasto, campo, valor)

    session.add(gasto)
    session.commit()
    session.refresh(gasto)
    return gasto


@router.delete("/{gasto_id}", status_code=204)
def eliminar_gasto_fijo(gasto_id: int, session: Session = Depends(get_session)):
    """Elimina un gasto fijo."""
    gasto = session.get(GastoFijo, gasto_id)
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto fijo no encontrado")
    session.delete(gasto)
    session.commit()
