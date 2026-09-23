"""
Modelos SQLModel para la base de datos de Raín.
Usar EXACTAMENTE estos modelos según el spec del proyecto.
"""
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum


class TipoTransaccion(str, Enum):
    ingreso = "ingreso"
    gasto = "gasto"


class TipoEvento(str, Enum):
    tarea = "tarea"
    evento = "evento"


class Prioridad(str, Enum):
    baja = "baja"
    media = "media"
    alta = "alta"


class EstadoEvento(str, Enum):
    pendiente = "pendiente"
    en_progreso = "en_progreso"
    completado = "completado"


class Origen(str, Enum):
    ia = "ia"
    manual = "manual"
    webhook_bancario = "webhook_bancario"


class Usuario(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str
    correo: str = Field(unique=True, index=True)
    password_hash: str
    fecha_registro: datetime = Field(default_factory=datetime.now)


class Transaccion(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id", index=True)
    tipo: TipoTransaccion
    monto: float
    moneda: str = "COP"
    categoria: str
    comercio: Optional[str] = None
    medio_pago: Optional[str] = None
    descripcion: str
    fecha: datetime = Field(default_factory=datetime.now, index=True)
    origen: Origen = Origen.manual
    texto_crudo: Optional[str] = None
    tarjeta_id: Optional[int] = Field(default=None, foreign_key="tarjetacredito.id")


class Evento(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id", index=True)
    titulo: str
    tipo: TipoEvento = TipoEvento.tarea
    categoria: Optional[str] = None
    fecha_inicio: datetime = Field(index=True)
    fecha_fin: Optional[datetime] = None
    prioridad: Prioridad = Prioridad.media
    estado: EstadoEvento = EstadoEvento.pendiente
    origen: Origen = Origen.manual
    notas: Optional[str] = None
    created_at: Optional[datetime] = Field(default_factory=datetime.now)


class Correo(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id", index=True)
    remitente: str
    asunto: str
    resumen: str
    urgente: bool = False
    leido: bool = False
    fecha_recibido: datetime
    fecha_procesado: datetime = Field(default_factory=datetime.now)


class MetaAhorro(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id", index=True)
    nombre: str
    monto_objetivo: float
    monto_actual: float = 0.0
    fecha_limite: Optional[datetime] = None
    created_at: Optional[datetime] = Field(default_factory=datetime.now)


class TarjetaCredito(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id", index=True)
    nombre: str
    cupo_total: float
    cupo_utilizado: float = 0.0
    fecha_corte: int
    fecha_pago: int
    tasa_interes: Optional[float] = None
    created_at: Optional[datetime] = Field(default_factory=datetime.now)


class Prestamo(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id", index=True)
    nombre: str
    monto_total: float
    saldo_pendiente: float
    cuota_mensual: float
    tasa_interes_mensual: float
    fecha_pago_mensual: int
    fecha_desembolso: Optional[datetime] = None
    created_at: Optional[datetime] = Field(default_factory=datetime.now)


class GastoFijo(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id", index=True)
    nombre: str
    monto: float
    dia_pago: int
    categoria: str
    activo: bool = True
    created_at: Optional[datetime] = Field(default_factory=datetime.now)
