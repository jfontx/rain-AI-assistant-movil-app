"""
Cliente async para la API de Ollama.
Llama al endpoint /api/chat con soporte de function calling (tools).
"""
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL_DEFAULT = os.getenv("OLLAMA_MODEL", "llama3.2")


async def chat_with_tools(
    messages: list,
    tools: list = None,
    model: str = None,
    format: str = None,
) -> dict:
    """
    Envía una conversación a Ollama y retorna la respuesta completa.

    Args:
        messages: Lista de mensajes con roles (system, user, assistant, tool).
        tools: Lista de herramientas en formato OpenAI-compatible (opcional).
        model: Nombre del modelo. Por defecto usa OLLAMA_MODEL del entorno.
        format: Si se pasa "json", fuerza respuesta en JSON estructurado.

    Returns:
        Diccionario con la respuesta de Ollama (campo "message" con role y content/tool_calls).
    """
    modelo = model or OLLAMA_MODEL_DEFAULT

    payload = {
        "model": modelo,
        "messages": messages,
        "stream": False,
    }

    if tools:
        payload["tools"] = tools

    if format:
        payload["format"] = format

    async with httpx.AsyncClient(timeout=120.0) as cliente:
        respuesta = await cliente.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json=payload,
        )
        respuesta.raise_for_status()
        return respuesta.json()
