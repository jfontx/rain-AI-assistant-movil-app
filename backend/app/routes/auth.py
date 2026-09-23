from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import Any
from pydantic import BaseModel

from app.db.session import get_session
from app.db.models import Usuario
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

class RegistroRequest(BaseModel):
    nombre: str
    correo: str
    password: str

class LoginRequest(BaseModel):
    correo: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    usuario: dict


@router.post("/registro", response_model=Token)
def registro(datos: RegistroRequest, session: Session = Depends(get_session)) -> Any:
    # Verificar si el correo ya existe
    usuario_existente = session.exec(select(Usuario).where(Usuario.correo == datos.correo)).first()
    if usuario_existente:
        raise HTTPException(
            status_code=400,
            detail="El correo electrónico ya está registrado.",
        )
        
    usuario = Usuario(
        nombre=datos.nombre,
        correo=datos.correo,
        password_hash=get_password_hash(datos.password)
    )
    session.add(usuario)
    session.commit()
    session.refresh(usuario)
    
    # Generar token
    access_token = create_access_token(subject=usuario.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "usuario": {
            "id": usuario.id,
            "nombre": usuario.nombre,
            "correo": usuario.correo
        }
    }


@router.post("/login", response_model=Token)
def login(datos: LoginRequest, session: Session = Depends(get_session)) -> Any:
    usuario = session.exec(select(Usuario).where(Usuario.correo == datos.correo)).first()
    if not usuario or not verify_password(datos.password, usuario.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(subject=usuario.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "usuario": {
            "id": usuario.id,
            "nombre": usuario.nombre,
            "correo": usuario.correo
        }
    }


@router.get("/me")
def read_users_me(current_user: Usuario = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "nombre": current_user.nombre,
        "correo": current_user.correo
    }
