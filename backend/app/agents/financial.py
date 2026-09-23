"""
Agente financiero — funciones puras de acceso a la base de datos.
El orquestador invoca estas funciones cuando el LLM hace function calling.
"""
from datetime import datetime
from typing import Optional
from sqlmodel import Session, select

from app.db.models import (
    Transaccion, TipoTransaccion, Origen,
    MetaAhorro, TarjetaCredito, Prestamo, GastoFijo
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


def crear_meta(nombre: str, monto_objetivo: float) -> dict:
    """
    Crea una nueva meta de ahorro en la base de datos.
    """
    with Session(engine) as session:
        meta = MetaAhorro(
            nombre=nombre,
            monto_objetivo=float(monto_objetivo),
            monto_actual=0.0
        )
        session.add(meta)
        session.commit()
        session.refresh(meta)

        return {
            "id": meta.id,
            "nombre": meta.nombre,
            "monto_objetivo": meta.monto_objetivo,
            "monto_actual": meta.monto_actual,
            "mensaje": f"Meta '{nombre}' creada exitosamente."
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

def proyectar_flujo_caja() -> dict:
    """
    Calcula el flujo de caja proyectado a fin de mes.
    Toma el balance actual y le resta las obligaciones (Gastos Fijos activos).
    """
    with Session(engine) as session:
        # Calcular balance actual
        transacciones = session.exec(select(Transaccion)).all()
        ingresos = sum(t.monto for t in transacciones if t.tipo == TipoTransaccion.ingreso)
        gastos = sum(t.monto for t in transacciones if t.tipo == TipoTransaccion.gasto)
        balance_actual = ingresos - gastos

        # Sumar gastos fijos activos
        gastos_fijos = session.exec(select(GastoFijo).where(GastoFijo.activo == True)).all()
        total_obligaciones = sum(gf.monto for gf in gastos_fijos)

        # También sumar cuotas mensuales de préstamos
        prestamos = session.exec(select(Prestamo)).all()
        cuotas_prestamos = sum(p.cuota_mensual for p in prestamos if p.saldo_pendiente > 0)
        
        total_obligaciones += cuotas_prestamos

        proyeccion_fin_de_mes = balance_actual - total_obligaciones

        return {
            "balance_actual": balance_actual,
            "total_obligaciones_pendientes": total_obligaciones,
            "detalle_obligaciones": {
                "gastos_fijos": [{"nombre": gf.nombre, "monto": gf.monto} for gf in gastos_fijos],
                "cuotas_prestamos": [{"nombre": p.nombre, "monto": p.cuota_mensual} for p in prestamos if p.saldo_pendiente > 0]
            },
            "balance_proyectado_fin_de_mes": proyeccion_fin_de_mes,
        }

def calcular_intereses_pasivos() -> dict:
    """
    Calcula un estimado de intereses a pagar por pasivos financieros (Tarjetas de Crédito y Préstamos).
    """
    with Session(engine) as session:
        # Intereses de préstamos
        prestamos = session.exec(select(Prestamo).where(Prestamo.saldo_pendiente > 0)).all()
        detalle_prestamos = []
        total_intereses_prestamos = 0.0
        
        for p in prestamos:
            # Fórmula de interés simple mensual sobre saldo
            interes_mensual = p.saldo_pendiente * (p.tasa_interes_mensual / 100.0)
            total_intereses_prestamos += interes_mensual
            detalle_prestamos.append({
                "nombre": p.nombre,
                "saldo_pendiente": p.saldo_pendiente,
                "tasa_interes": p.tasa_interes_mensual,
                "interes_mensual_estimado": interes_mensual
            })

        # Intereses de tarjetas (asumiendo que pagan interés sobre el saldo utilizado)
        tarjetas = session.exec(select(TarjetaCredito).where(TarjetaCredito.cupo_utilizado > 0)).all()
        detalle_tarjetas = []
        total_intereses_tarjetas = 0.0

        for t in tarjetas:
            if t.tasa_interes:
                interes_mensual = t.cupo_utilizado * (t.tasa_interes / 100.0)
                total_intereses_tarjetas += interes_mensual
                detalle_tarjetas.append({
                    "nombre": t.nombre,
                    "cupo_utilizado": t.cupo_utilizado,
                    "tasa_interes": t.tasa_interes,
                    "interes_mensual_estimado": interes_mensual
                })

        return {
            "intereses_prestamos": total_intereses_prestamos,
            "intereses_tarjetas": total_intereses_tarjetas,
            "total_intereses_estimados": total_intereses_prestamos + total_intereses_tarjetas,
            "detalle_prestamos": detalle_prestamos,
            "detalle_tarjetas": detalle_tarjetas
        }
