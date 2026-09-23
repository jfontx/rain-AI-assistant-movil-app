"""
Configuración del motor SQLite y session de base de datos.
"""
from sqlmodel import SQLModel, create_engine, Session
from typing import Generator

import os
from dotenv import load_dotenv

load_dotenv()  # Cargar variables del .env si existe

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    print("✅ Conectando a Supabase (PostgreSQL)")
    # Supabase / PostgreSQL
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True,  # Importante para conexiones remotas
    )
else:
    print("⚠️  DATABASE_URL no encontrada, usando SQLite local como fallback")
    # Base de datos SQLite local (fallback)
    SQLITE_URL = "sqlite:///./raín.db"
    engine = create_engine(
        SQLITE_URL,
        echo=False,
        connect_args={"check_same_thread": False},  # necesario para SQLite
    )


def create_db_and_tables():
    """Crea todas las tablas si no existen. Llamado al iniciar la app."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Dependency injection de FastAPI para obtener una sesión de base de datos."""
    with Session(engine) as session:
        yield session
