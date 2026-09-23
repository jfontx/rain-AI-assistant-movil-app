"""
Definición de las herramientas (tools) en formato OpenAI-compatible para Ollama.
Cada función de secretary.py y financial.py tiene su schema aquí.
"""

TOOLS = [
    # ─────────────────────────────
    # HERRAMIENTAS FINANCIERAS
    # ─────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "registrar_transaccion",
            "description": (
                "Registra un ingreso o gasto en la base de datos financiera. "
                "Úsala cuando el usuario mencione que gastó, pagó, recibió o ingresó dinero. "
                "La categoría debe ser una de: alimentación, transporte, servicios, "
                "educación, ocio, salud, vivienda, ropa, tecnología, otro."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "tipo": {
                        "type": "string",
                        "enum": ["ingreso", "gasto"],
                        "description": "Tipo de transacción: ingreso o gasto.",
                    },
                    "monto": {
                        "type": "number",
                        "description": "Valor monetario de la transacción en pesos colombianos (COP).",
                    },
                    "categoria": {
                        "type": "string",
                        "description": "Categoría del gasto/ingreso (alimentación, transporte, servicios, educación, ocio, salud, vivienda, ropa, tecnología, otro).",
                    },
                    "descripcion": {
                        "type": "string",
                        "description": "Descripción breve de la transacción.",
                    },
                    "comercio": {
                        "type": "string",
                        "description": "Nombre del establecimiento o comercio (opcional).",
                    },
                    "medio_pago": {
                        "type": "string",
                        "description": "Medio de pago usado: efectivo, tarjeta débito, tarjeta crédito, transferencia, Nequi, Daviplata (opcional).",
                    },
                },
                "required": ["tipo", "monto", "categoria", "descripcion"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "consultar_balance",
            "description": (
                "Consulta el balance financiero (ingresos - gastos). "
                "Úsala cuando el usuario pregunte cuánto ha gastado, cuánto tiene, "
                "cuál es su balance o resumen financiero del mes/semana."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "fecha_desde": {
                        "type": "string",
                        "description": "Fecha de inicio del periodo en formato ISO 8601 (ej: '2026-09-01T00:00:00'). Opcional.",
                    },
                    "fecha_hasta": {
                        "type": "string",
                        "description": "Fecha de fin del periodo en formato ISO 8601 (ej: '2026-09-30T23:59:59'). Opcional.",
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "consultar_meta",
            "description": (
                "Consulta el progreso de una meta de ahorro específica. "
                "Úsala cuando el usuario pregunte por una meta de ahorro, "
                "cuánto le falta para ahorrar algo, o el avance de un objetivo financiero."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "nombre": {
                        "type": "string",
                        "description": "Nombre o parte del nombre de la meta de ahorro.",
                    },
                },
                "required": ["nombre"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "actualizar_meta",
            "description": (
                "Abona un monto a una meta de ahorro, actualizando el progreso. "
                "Úsala cuando el usuario diga que ahorró, apartó o añadió dinero a una meta."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "nombre": {
                        "type": "string",
                        "description": "Nombre o parte del nombre de la meta de ahorro.",
                    },
                    "monto_abonado": {
                        "type": "number",
                        "description": "Monto en pesos colombianos (COP) a abonar a la meta.",
                    },
                },
                "required": ["nombre", "monto_abonado"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "consultar_tarjeta",
            "description": (
                "Consulta el cupo disponible y fechas de una tarjeta de crédito. "
                "Úsala cuando el usuario pregunte por el cupo de su tarjeta, "
                "fecha de pago o corte, o información de una tarjeta específica."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "nombre": {
                        "type": "string",
                        "description": "Nombre o banco de la tarjeta de crédito (ej: 'Bancolombia', 'Nu', 'Davivienda').",
                    },
                },
                "required": ["nombre"],
            },
        },
    },
    # ─────────────────────────────
    # HERRAMIENTAS DE AGENDA
    # ─────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "crear_tarea",
            "description": (
                "Crea una nueva tarea o recordatorio en la agenda. "
                "Úsala cuando el usuario pida que le recuerdes algo, que crees una tarea, "
                "que agendemos algo, o que registres un pendiente."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "titulo": {
                        "type": "string",
                        "description": "Título o descripción breve de la tarea.",
                    },
                    "fecha_limite": {
                        "type": "string",
                        "description": "Fecha y hora límite en formato ISO 8601 (ej: '2026-09-25T18:00:00').",
                    },
                    "prioridad": {
                        "type": "string",
                        "enum": ["baja", "media", "alta"],
                        "description": "Nivel de prioridad de la tarea. Por defecto 'media'.",
                    },
                    "notas": {
                        "type": "string",
                        "description": "Notas adicionales sobre la tarea (opcional).",
                    },
                    "categoria": {
                        "type": "string",
                        "description": "Categoría de la tarea (ej: trabajo, personal, estudio, salud). Opcional.",
                    },
                },
                "required": ["titulo", "fecha_limite"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "consultar_eventos",
            "description": (
                "Consulta los eventos y tareas de la agenda en un rango de fechas. "
                "Úsala cuando el usuario pregunte qué tiene pendiente, qué tiene mañana, "
                "qué hay esta semana, o qué tareas están por hacer."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "fecha_desde": {
                        "type": "string",
                        "description": "Inicio del rango en formato ISO 8601. Opcional (por defecto: ahora).",
                    },
                    "fecha_hasta": {
                        "type": "string",
                        "description": "Fin del rango en formato ISO 8601. Opcional.",
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "mover_evento",
            "description": (
                "Cambia la fecha de un evento o tarea existente. "
                "Úsala cuando el usuario diga que quiere mover, cambiar o reprogramar algo de su agenda."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "evento_id": {
                        "type": "integer",
                        "description": "ID numérico del evento a mover.",
                    },
                    "nueva_fecha": {
                        "type": "string",
                        "description": "Nueva fecha en formato ISO 8601.",
                    },
                },
                "required": ["evento_id", "nueva_fecha"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "marcar_completado",
            "description": (
                "Marca una tarea como completada/terminada. "
                "Úsala cuando el usuario diga que ya hizo algo, que terminó una tarea "
                "o que puede marcar algo como listo."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "evento_id": {
                        "type": "integer",
                        "description": "ID numérico del evento/tarea a marcar como completado.",
                    },
                },
                "required": ["evento_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "resumir_correos_urgentes",
            "description": (
                "Obtiene el resumen de los correos urgentes no leídos. "
                "Úsala cuando el usuario pregunte si hay correos importantes, urgentes "
                "o que requieren atención inmediata."
            ),
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
]
