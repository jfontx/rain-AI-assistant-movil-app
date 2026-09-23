"""
Configuración del motor SQLite y session de base de datos.
"""
from sqlmodel import SQLModel, create_engine, Session
from typing import Generator

# Base de datos SQLite local — archivo raín.db en la carpeta backend/
SQLITE_URL = "sqlite:///./raín.db"

engine = create_engine(
    SQLITE_URL,
    echo=False,
    connect_args={"check_same_thread": False},  # necesario para SQLite + FastAPI async
)


def create_db_and_tables():
    """Crea todas las tablas si no existen. Llamado al iniciar la app."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Dependency injection de FastAPI para obtener una sesión de base de datos."""
    with Session(engine) as session:
        yield session
