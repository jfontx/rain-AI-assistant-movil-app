"""
Punto de entrada de la API de Raín.
FastAPI con CORS habilitado para todos los orígenes (necesario para Expo Go + Tailscale).
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.db.session import create_db_and_tables
from app.llm.ollama_client import chat_with_tools

# Rutas CRUD
from app.routes import (
    transacciones,
    eventos,
    correos,
    metas,
    tarjetas,
    asistente,
    webhook,
    prestamos,
    gastos_fijos,
    auth,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicialización al arrancar el servidor."""
    logger.info("Iniciando Raín Backend — creando tablas de base de datos...")
    create_db_and_tables()
    logger.info("Base de datos lista. Backend Raín en línea.")
    yield
    logger.info("Raín Backend apagado.")


app = FastAPI(
    title="Raín — Asistente Personal Inteligente",
    description="API backend del asistente personal Raín. Gestión financiera, agenda y correos con IA local (Ollama).",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — permitir todos los orígenes para que Expo Go pueda conectarse
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────
# Registrar todos los routers
# ─────────────────────────────────────────────────
app.include_router(transacciones.router)
app.include_router(eventos.router)
app.include_router(correos.router)
app.include_router(metas.router)
app.include_router(tarjetas.router)
app.include_router(asistente.router)
app.include_router(webhook.router)
app.include_router(prestamos.router)
app.include_router(gastos_fijos.router)
app.include_router(auth.router)


# ─────────────────────────────────────────────────
# Endpoints base
# ─────────────────────────────────────────────────
@app.get("/health", tags=["Sistema"])
def health_check():
    """Verificación de salud del servidor."""
    return {"status": "ok", "servicio": "Raín Backend"}


class MensajePrueba(BaseModel):
    mensaje: str


@app.post("/test-llm", tags=["Sistema"])
async def test_llm(entrada: MensajePrueba):
    """
    Endpoint de prueba para verificar la conexión con Ollama.
    Envía un mensaje simple y retorna la respuesta cruda del modelo.
    """
    respuesta = await chat_with_tools(
        messages=[
            {"role": "user", "content": entrada.mensaje},
        ]
    )
    return {
        "mensaje_enviado": entrada.mensaje,
        "respuesta_ollama": respuesta,
    }
