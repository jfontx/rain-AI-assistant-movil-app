"""
Orquestador central de Raín.
Recibe el mensaje del usuario, invoca el LLM con function calling,
ejecuta las funciones Python correspondientes y retorna la respuesta final.
"""
import json
import logging
import asyncio
from typing import Any

from app.llm.ollama_client import chat_with_tools
from app.llm.tools_schema import TOOLS
from app.agents import financial, secretary

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────
# Mapeo nombre_herramienta → función Python
# ─────────────────────────────────────────────────
FUNCIONES_DISPONIBLES: dict[str, Any] = {
    # Financieras
    "registrar_transaccion": financial.registrar_transaccion,
    "consultar_balance": financial.consultar_balance,
    "crear_meta": financial.crear_meta,
    "consultar_meta": financial.consultar_meta,
    "actualizar_meta": financial.actualizar_meta,
    "consultar_tarjeta": financial.consultar_tarjeta,
    "crear_tarjeta_credito": financial.crear_tarjeta_credito,
    "crear_prestamo": financial.crear_prestamo,
    "crear_gasto_fijo": financial.crear_gasto_fijo,
    "proyectar_flujo_caja": financial.proyectar_flujo_caja,
    "calcular_intereses_pasivos": financial.calcular_intereses_pasivos,
    # Agenda
    "crear_tarea": secretary.crear_tarea,
    "consultar_eventos": secretary.consultar_eventos,
    "mover_evento": secretary.mover_evento,
    "marcar_completado": secretary.marcar_completado,
    "resumir_correos_urgentes": secretary.resumir_correos_urgentes,
    "redactar_borrador": secretary.redactar_borrador,
    "enviar_correo": secretary.enviar_correo,
}

from app.agents.email_reader import leer_correos_no_leidos
FUNCIONES_DISPONIBLES["sincronizar_correos_nuevos"] = leer_correos_no_leidos

PROMPT_SISTEMA = """Eres Raín, una asistente personal inteligente en español colombiano.
Eres amable, concisa y eficiente. Tu rol es ayudar al usuario con:
- Gestión financiera: registrar gastos/ingresos, consultar balance, metas de ahorro, tarjetas
- Agenda personal: crear tareas, consultar eventos pendientes, mover citas, marcar completados
- Correos: resumir correos urgentes no leídos

REGLAS IMPORTANTES:
1. Siempre responde en español.
2. Cuando el usuario pida registrar un gasto/ingreso, SIEMPRE usa la herramienta registrar_transaccion.
3. Cuando necesites información de la base de datos, usa las herramientas disponibles.
4. Confirma las acciones realizadas con un mensaje claro y amigable.
5. La moneda es SIEMPRE pesos colombianos. Cuando menciones montos, di "pesos" (ej: "50,000 pesos"). NUNCA digas "dólares", "USD", "dollars" ni uses el símbolo "$" seguido de "USD". Solo usa "$" como símbolo de pesos colombianos.
6. Para fechas, calcula la fecha concreta.
7. NUNCA inventes eventos ni tareas. Si la herramienta consultar_eventos retorna vacío, dile al usuario explícitamente que no tiene nada programado.
8. CORREOS: NUNCA inventes los destinatarios, asuntos ni cuerpos de correo. Si falta información para enviar, PREGÚNTALE primero ("¿A qué correo y qué le digo?").
9. CORREOS: Si el usuario te pide "leer mis correos", "revisar mi bandeja" o "cuál es mi último correo", SIEMPRE usa la herramienta sincronizar_correos_nuevos y con base en sus resultados, respóndele al usuario. No uses resumir_correos_urgentes a menos que pida explícitamente solo los urgentes.
10. Hoy es: {fecha_hoy}
"""


async def procesar_mensaje(texto_usuario: str, usuario_id: int) -> str:
    """
    Procesa el mensaje del usuario con function calling de Ollama.

    Flujo:
    1. Construir conversación con prompt de sistema
    2. Llamar al LLM con las tools definidas
    3. Si hay tool_calls: ejecutar cada función → insertar resultado → segunda llamada
    4. Retornar la respuesta final en texto natural

    Args:
        texto_usuario: El mensaje en texto del usuario.

    Returns:
        Respuesta en texto natural del asistente.
    """
    from datetime import datetime
    fecha_hoy = datetime.now().strftime("%A, %d de %B de %Y, %H:%M")

    mensajes = [
        {
            "role": "system",
            "content": PROMPT_SISTEMA.format(fecha_hoy=fecha_hoy),
        },
        {
            "role": "user",
            "content": texto_usuario,
        },
    ]

    # Primera llamada al LLM (con tools)
    respuesta = await chat_with_tools(messages=mensajes, tools=TOOLS)
    mensaje_asistente = respuesta.get("message", {})
    tool_calls = mensaje_asistente.get("tool_calls", [])

    # Si no hay function calls, retornar la respuesta directamente
    if not tool_calls:
        return mensaje_asistente.get("content", "Lo siento, no pude procesar tu solicitud.")

    # Agregar la respuesta del asistente (con tool_calls) a la conversación
    mensajes.append(mensaje_asistente)

    # Ejecutar cada herramienta invocada
    for tool_call in tool_calls:
        nombre_funcion = tool_call.get("function", {}).get("name", "")
        argumentos_raw = tool_call.get("function", {}).get("arguments", {})

        # Ollama puede retornar argumentos como string JSON o como dict
        if isinstance(argumentos_raw, str):
            try:
                argumentos = json.loads(argumentos_raw)
            except json.JSONDecodeError:
                argumentos = {}
        else:
            argumentos = argumentos_raw

        # Fix para cuando el LLM anida accidentalmente los argumentos dentro de 'parameters'
        if isinstance(argumentos, dict) and "parameters" in argumentos and "type" in argumentos:
            argumentos = argumentos["parameters"]

        # Inyectar el usuario_id de forma transparente para la función
        argumentos["usuario_id"] = usuario_id

        logger.info(f"Ejecutando herramienta: {nombre_funcion} con args: {argumentos}")

        funcion = FUNCIONES_DISPONIBLES.get(nombre_funcion)
        if funcion:
            try:
                if asyncio.iscoroutinefunction(funcion):
                    resultado = await funcion(**argumentos)
                else:
                    resultado = funcion(**argumentos)
            except Exception as e:
                logger.error(f"Error ejecutando {nombre_funcion}: {e}")
                resultado = {"error": str(e)}
        else:
            resultado = {"error": f"Herramienta '{nombre_funcion}' no encontrada"}

        # Insertar resultado como mensaje de rol "tool"
        mensajes.append({
            "role": "tool",
            "content": json.dumps(resultado, ensure_ascii=False, default=str),
        })

    # Segunda llamada al LLM para obtener respuesta en lenguaje natural
    respuesta_final = await chat_with_tools(messages=mensajes, tools=TOOLS)
    contenido_final = respuesta_final.get("message", {}).get("content", "")

    # Si el modelo vuelve a invocar herramientas, procesarlas también
    tool_calls_final = respuesta_final.get("message", {}).get("tool_calls", [])
    if tool_calls_final:
        # Caso recursivo: el modelo quiere otra herramienta — ejecutar una vez más
        mensajes.append(respuesta_final.get("message", {}))
        for tool_call in tool_calls_final:
            nombre_funcion = tool_call.get("function", {}).get("name", "")
            argumentos_raw = tool_call.get("function", {}).get("arguments", {})
            if isinstance(argumentos_raw, str):
                try:
                    argumentos = json.loads(argumentos_raw)
                except json.JSONDecodeError:
                    argumentos = {}
            else:
                argumentos = argumentos_raw
            
            if isinstance(argumentos, dict) and "parameters" in argumentos and "type" in argumentos:
                argumentos = argumentos["parameters"]
                
            argumentos["usuario_id"] = usuario_id
            
            funcion = FUNCIONES_DISPONIBLES.get(nombre_funcion)
            if funcion:
                try:
                    if asyncio.iscoroutinefunction(funcion):
                        resultado = await funcion(**argumentos)
                    else:
                        resultado = funcion(**argumentos)
                except Exception as e:
                    resultado = {"error": str(e)}
            else:
                resultado = {"error": f"Herramienta '{nombre_funcion}' no encontrada"}
            mensajes.append({
                "role": "tool",
                "content": json.dumps(resultado, ensure_ascii=False, default=str),
            })
        respuesta_definitiva = await chat_with_tools(messages=mensajes)
        contenido_final = respuesta_definitiva.get("message", {}).get("content", contenido_final)

    return contenido_final or "Acción completada."
