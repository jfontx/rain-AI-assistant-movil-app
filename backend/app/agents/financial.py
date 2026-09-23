"""
Agente financiero — funciones puras de acceso a la base de datos.
El orquestador invoca estas funciones cuando el LLM hace function calling.
"""
from datetime import datetime
from typing import Optional
from sqlmodel import Session, select

from app.db.models import (
    Transaccion, TipoTransaccion, Origen,
    MetaAhorro, TarjetaCredito,
)
from app.db.session import engine


def registrar_transaccion(
    tipo: str,
    monto: float,
    categoria: str,
    descripcion: str,
    comercio: Optional[str] = None,
    medio_pago: Optional[str] = None,
    moneda: str = "COP",
    origen: str = "ia",
) -> dict:
    """
    Registra una transacción (ingreso o gasto) en la base de datos.
    Retorna un diccionario con los datos de la transacción creada.
    """
    with Session(engine) as session:
        transaccion = Transaccion(
            tipo=TipoTransaccion(tipo),
            monto=float(monto),
            moneda=moneda,
            categoria=categoria,
            descripcion=descripcion,
            comercio=comercio,
            medio_pago=medio_pago,
            fecha=datetime.now(),
            origen=Origen(origen),
        )
        session.add(transaccion)
        session.commit()
        session.refresh(transaccion)
        return {
            "id": transaccion.id,
            "tipo": transaccion.tipo,
            "monto": transaccion.monto,
            "moneda": transaccion.moneda,
            "categoria": transaccion.categoria,
            "descripcion": transaccion.descripcion,
            "comercio": transaccion.comercio,
            "fecha": transaccion.fecha.isoformat(),
        }


def consultar_balance(
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
) -> dict:
    """
    Calcula el balance (ingresos - gastos) en el rango de fechas dado.
    Si no se especifican fechas, usa todo el historial.
    Retorna dict con ingresos_total, gastos_total, balance.
    """
    with Session(engine) as session:
        query = select(Transaccion)
        if fecha_desde:
            query = query.where(Transaccion.fecha >= datetime.fromisoformat(fecha_desde))
        if fecha_hasta:
            query = query.where(Transaccion.fecha <= datetime.fromisoformat(fecha_hasta))

        transacciones = session.exec(query).all()

        ingresos = sum(t.monto for t in transacciones if t.tipo == TipoTransaccion.ingreso)
        gastos = sum(t.monto for t in transacciones if t.tipo == TipoTransaccion.gasto)
        balance = ingresos - gastos

        return {
            "ingresos_total": ingresos,
            "gastos_total": gastos,
            "balance": balance,
            "moneda": "COP",
            "num_transacciones": len(transacciones),
        }


def consultar_meta(nombre: str) -> dict:
    """
    Busca una meta de ahorro por nombre (búsqueda parcial, case-insensitive).
    Retorna sus datos o un error si no existe.
    """
    with Session(engine) as session:
        metas = session.exec(select(MetaAhorro)).all()
        # Búsqueda flexible por nombre
        meta = next(
            (m for m in metas if nombre.lower() in m.nombre.lower()),
            None,
        )
        if not meta:
            return {"error": f"No se encontró ninguna meta con el nombre '{nombre}'"}

        progreso_pct = (meta.monto_actual / meta.monto_objetivo * 100) if meta.monto_objetivo > 0 else 0
        return {
            "id": meta.id,
            "nombre": meta.nombre,
            "monto_objetivo": meta.monto_objetivo,
            "monto_actual": meta.monto_actual,
            "faltante": meta.monto_objetivo - meta.monto_actual,
            "progreso_porcentaje": round(progreso_pct, 1),
            "fecha_limite": meta.fecha_limite.isoformat() if meta.fecha_limite else None,
        }


def actualizar_meta(nombre: str, monto_abonado: float) -> dict:
    """
    Abona un monto a una meta de ahorro existente.
    Busca por nombre, suma el monto_abonado al monto_actual.
    """
    with Session(engine) as session:
        metas = session.exec(select(MetaAhorro)).all()
        meta = next(
            (m for m in metas if nombre.lower() in m.nombre.lower()),
            None,
        )
        if not meta:
            return {"error": f"No se encontró ninguna meta con el nombre '{nombre}'"}

        meta.monto_actual += float(monto_abonado)
        session.add(meta)
        session.commit()
        session.refresh(meta)

        return {
            "id": meta.id,
            "nombre": meta.nombre,
            "monto_actual": meta.monto_actual,
            "monto_objetivo": meta.monto_objetivo,
            "faltante": meta.monto_objetivo - meta.monto_actual,
            "completada": meta.monto_actual >= meta.monto_objetivo,
        }


def consultar_tarjeta(nombre: str) -> dict:
    """
    Obtiene información de una tarjeta de crédito por nombre.
    Retorna cupo disponible, cupo utilizado y próximas fechas de pago/corte.
    """
    with Session(engine) as session:
        tarjetas = session.exec(select(TarjetaCredito)).all()
        tarjeta = next(
            (t for t in tarjetas if nombre.lower() in t.nombre.lower()),
            None,
        )
        if not tarjeta:
            return {"error": f"No se encontró ninguna tarjeta con el nombre '{nombre}'"}

        cupo_disponible = tarjeta.cupo_total - tarjeta.cupo_utilizado
        return {
            "id": tarjeta.id,
            "nombre": tarjeta.nombre,
            "cupo_total": tarjeta.cupo_total,
            "cupo_utilizado": tarjeta.cupo_utilizado,
            "cupo_disponible": cupo_disponible,
            "fecha_corte": tarjeta.fecha_corte,
            "fecha_pago": tarjeta.fecha_pago,
            "tasa_interes": tarjeta.tasa_interes,
        }
