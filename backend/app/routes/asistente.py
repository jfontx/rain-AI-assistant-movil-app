"""
Endpoint principal del asistente Raín.
Recibe mensajes de texto (voz convertida a texto o chat directo)
y retorna la respuesta del orquestador.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.agents.orchestrator import procesar_mensaje
from app.core.deps import get_current_user
from app.db.models import Usuario

router = APIRouter(prefix="/api/asistente", tags=["Asistente"])


class MensajeEntrada(BaseModel):
    texto: str


class RespuestaAsistente(BaseModel):
    respuesta: str


@router.post("/mensaje", response_model=RespuestaAsistente)
async def enviar_mensaje(entrada: MensajeEntrada, current_user: Usuario = Depends(get_current_user)):
    """
    Endpoint unificado de chat y voz.
    La app móvil envía el texto del usuario aquí,
    tanto para mensajes escritos como para dictado por micrófono del teclado.
    Retorna la respuesta de Raín en texto, que el móvil también leerá con expo-speech.
    """
    if not entrada.texto.strip():
        raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío")

    try:
        respuesta = await procesar_mensaje(entrada.texto, current_user.id)
        return RespuestaAsistente(respuesta=respuesta)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando el mensaje: {str(e)}",
        )
