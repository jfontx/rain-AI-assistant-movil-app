from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
import logging

from app.llm.ollama_client import chat_with_tools
from app.agents.financial import registrar_transaccion

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])

class WebhookBancosRequest(BaseModel):
    texto_correo: str

@router.post("/bancos")
async def recibir_webhook_bancos(request: WebhookBancosRequest):
    """
    Recibe el texto crudo de un correo/notificación de banco enviado por un atajo (iOS) o tarea en background.
    Usa el LLM para extraer la información y registrarla en la base de datos automáticamente.
    """
    texto = request.texto_correo
    if not texto:
        raise HTTPException(status_code=400, detail="El texto_correo está vacío")

    prompt = f"""Analiza el siguiente texto de un comprobante, notificación o correo bancario.
Extrae los datos para registrar la transacción y responde ÚNICAMENTE con un JSON válido con esta estructura:
- "tipo": "gasto" o "ingreso"
- "monto": número decimal (ejemplo: 15000)
- "moneda": "COP", "USD", etc. Si no dice, asume "COP".
- "categoria": clasifica el gasto (ej: Alimentación, Transporte, Servicios, Transferencia, Otros)
- "descripcion": un breve resumen de 2 a 4 palabras
- "comercio": el nombre del lugar o persona destino
- "medio_pago": el método (ej: Tarjeta, Transferencia, Nequi, Daviplata, Bancolombia)

Texto del banco:
{texto}

Responde SOLO con el objeto JSON, sin markdown, sin explicaciones ni texto adicional."""

    try:
        respuesta_llm = await chat_with_tools(
            messages=[
                {"role": "system", "content": "Eres un asistente experto en finanzas. Devuelves únicamente JSON estructurado."},
                {"role": "user", "content": prompt}
            ],
            format="json"
        )
        
        contenido = respuesta_llm.get("message", {}).get("content", "{}")
        datos = json.loads(contenido)
        
        # Validar y limpiar
        tipo = datos.get("tipo", "gasto").lower()
        if tipo not in ["gasto", "ingreso"]:
            tipo = "gasto"
            
        monto = float(datos.get("monto", 0))
        if monto == 0:
            raise ValueError("No se pudo detectar el monto")
            
        transaccion = registrar_transaccion(
            tipo=tipo,
            monto=monto,
            categoria=datos.get("categoria", "Otros"),
            descripcion=datos.get("descripcion", "Gasto automatizado"),
            comercio=datos.get("comercio", "Desconocido"),
            medio_pago=datos.get("medio_pago", "Desconocido"),
            moneda=datos.get("moneda", "COP").upper(),
            origen="webhook"
        )
        
        return {"status": "ok", "transaccion": transaccion}
        
    except json.JSONDecodeError:
        logger.error(f"Error al decodificar JSON del LLM. Respuesta: {contenido}")
        raise HTTPException(status_code=500, detail="El LLM no devolvió un JSON válido")
    except Exception as e:
        logger.error(f"Error procesando webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
