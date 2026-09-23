"""
Webhook para ingesta bancaria zero-friction.
Recibe el texto de notificaciones bancarias (enviado desde Apple Shortcuts)
y usa el LLM para extraer los campos y crear la transacción automáticamente.
"""
import json
import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from app.llm.ollama_client import chat_with_tools
from app.db.models import Transaccion, TipoTransaccion, Origen
from app.db.session import engine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/webhook", tags=["Webhook Bancario"])


class NotificacionBancaria(BaseModel):
    texto_notificacion: str


PROMPT_EXTRACCION = """Eres un extractor de datos de notificaciones bancarias colombianas.
Analiza el siguiente texto de notificación bancaria y extrae los datos en formato JSON.

Texto de la notificación:
{texto}

Retorna ÚNICAMENTE un JSON válido con estos campos exactos:
{{
  "monto": <número flotante sin separadores de miles, o 0.0 si no se menciona un valor explícito en el texto>,
  "moneda": "COP",
  "comercio": "<nombre del establecimiento o null si no se menciona>",
  "fecha": "<fecha en formato ISO 8601, usar fecha actual si no se menciona>",
  "medio_pago": "<efectivo/tarjeta débito/tarjeta crédito/transferencia/Nequi/Daviplata o null>",
  "categoria": "<una de: alimentación/transporte/servicios/educación/ocio/salud/vivienda/ropa/tecnología/otro>",
  "descripcion": "<descripción concisa de la transacción>"
}}

Reglas:
- El monto debe ser un número positivo sin símbolo de moneda ni puntos de miles. Si NO aparece un monto en el texto, el valor DEBE ser 0.0. No inventes montos.
- Si el texto dice "$45.000" o "45,000" en contexto colombiano, el monto es 45000.0 (este es solo un ejemplo, NO lo copies si no está en el texto).
- Infiere la categoría según el comercio o descripción. Si no es obvio, usa "otro".
- Si no hay fecha, usa la fecha actual: {fecha_hoy}
- Responde solo con el JSON, sin markdown ni texto adicional."""


@router.post("/transaccion-bancaria")
async def recibir_transaccion_bancaria(notificacion: NotificacionBancaria):
    """
    Recibe el texto crudo de una notificación bancaria (desde Apple Shortcut),
    usa el LLM para extraer los datos estructurados y guarda la transacción.

    Ejemplos de texto_notificacion válidos:
    - "Bancolombia: Compra aprobada por $45.000 en RAPPI el 21/09/2026"
    - "Nu: Pago de $120.000 realizado en Éxito"
    - "Davivienda: Retiro cajero $200.000 Av. El Dorado"
    """
    texto = notificacion.texto_notificacion.strip()
    if not texto:
        raise HTTPException(status_code=400, detail="El texto de notificación no puede estar vacío")

    fecha_hoy = datetime.now().isoformat()

    # Llamar al LLM en modo structured output (JSON)
    prompt_usuario = PROMPT_EXTRACCION.format(texto=texto, fecha_hoy=fecha_hoy)

    try:
        respuesta_llm = await chat_with_tools(
            messages=[
                {
                    "role": "system",
                    "content": "Eres un extractor de datos financieros. Siempre responde con JSON válido.",
                },
                {"role": "user", "content": prompt_usuario},
            ],
            format="json",
        )

        contenido_json = respuesta_llm.get("message", {}).get("content", "{}")
        datos = json.loads(contenido_json)

    except (json.JSONDecodeError, Exception) as e:
        logger.error(f"Error extrayendo datos con LLM: {e}")
        raise HTTPException(
            status_code=422,
            detail=f"No se pudo extraer información de la notificación: {str(e)}",
        )

    # Parsear fecha
    try:
        fecha_transaccion = datetime.fromisoformat(datos.get("fecha", fecha_hoy))
    except (ValueError, TypeError):
        fecha_transaccion = datetime.now()

    # Crear transacción en la base de datos
    with Session(engine) as session:
        transaccion = Transaccion(
            tipo=TipoTransaccion.gasto,  # las notificaciones bancarias siempre son gastos
            monto=float(datos.get("monto", 0)),
            moneda=datos.get("moneda", "COP"),
            categoria=datos.get("categoria", "otro"),
            comercio=datos.get("comercio"),
            medio_pago=datos.get("medio_pago"),
            descripcion=datos.get("descripcion", texto[:200]),
            fecha=fecha_transaccion,
            origen=Origen.webhook_bancario,
            texto_crudo=texto,
        )
        session.add(transaccion)
        session.commit()
        session.refresh(transaccion)
        transaccion_id = transaccion.id

    logger.info(f"Transacción bancaria registrada: ID={transaccion_id}, monto={datos.get('monto')}")

    return {
        "status": "registrado",
        "transaccion_id": transaccion_id,
        "datos_extraidos": {
            "monto": datos.get("monto"),
            "moneda": datos.get("moneda", "COP"),
            "comercio": datos.get("comercio"),
            "categoria": datos.get("categoria"),
        },
    }
