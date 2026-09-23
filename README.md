# Raín 🌧️ — Asistente Personal Inteligente

Asistente personal multi-agente con IA local (Ollama/llama3.2), gestión financiera automática, agenda inteligente y lectura de correos. Funciona completamente **offline** con conectividad remota via Tailscale.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Python 3.11 + FastAPI + Uvicorn |
| ORM / DB | SQLModel (SQLAlchemy + Pydantic) + SQLite |
| IA local | Ollama `llama3.2` en `localhost:11434` |
| Correos | `imap-tools` + Gmail App Password |
| App móvil | React Native + Expo SDK 54 (Expo Go) |
| TTS | `expo-speech` (nativo iOS/Android) |
| STT | Micrófono nativo del teclado iOS (sin librería adicional) |
| Conectividad remota | Tailscale |

## Estructura del proyecto

```
rain/                          ← Proyecto Expo (ya existente)
├── App.tsx                    ← Navegación por 4 tabs
├── screens/
│   ├── ChatScreen.tsx         ← Chat + TTS (pantalla principal)
│   ├── FinanzasScreen.tsx     ← CRUD transacciones + balance
│   ├── TareasScreen.tsx       ← CRUD tareas con checkbox
│   └── CalendarioScreen.tsx   ← Eventos agrupados por día
├── services/
│   └── api.ts                 ← Todas las llamadas HTTP al backend
├── backend/                   ← Backend Python (nuevo)
│   ├── app/
│   │   ├── main.py            ← FastAPI + CORS + lifespan
│   │   ├── db/
│   │   │   ├── models.py      ← SQLModel: 5 tablas
│   │   │   └── session.py     ← Engine SQLite + get_session
│   │   ├── llm/
│   │   │   ├── ollama_client.py ← Cliente async Ollama
│   │   │   └── tools_schema.py  ← Definición de 10 herramientas
│   │   ├── agents/
│   │   │   ├── financial.py   ← 5 funciones financieras
│   │   │   ├── secretary.py   ← 5 funciones de agenda
│   │   │   ├── email_reader.py ← Lectura IMAP + resumen LLM
│   │   │   └── orchestrator.py ← Orquestador con function calling
│   │   └── routes/
│   │       ├── transacciones.py
│   │       ├── eventos.py
│   │       ├── correos.py
│   │       ├── metas.py
│   │       ├── tarjetas.py
│   │       ├── asistente.py   ← POST /api/asistente/mensaje
│   │       └── webhook.py     ← POST /api/webhook/transaccion-bancaria
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md              ← Instrucciones detalladas del backend
```

## Instalación y ejecución rápida

### 1. Backend Python

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Editar .env con tus credenciales

# Asegúrate de que Ollama esté corriendo con llama3.2:
ollama pull llama3.2
ollama serve

# Iniciar backend:
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Configurar IP en la app móvil

Editar [`services/api.ts`](./services/api.ts) y cambiar:
```typescript
const BASE_URL = 'http://IP_TAILSCALE:8000';
//                           ↑ Tu IP de Tailscale (ej: 100.64.x.x)
```

Para ver tu IP Tailscale: abre la app de Tailscale en tu Mac, o corre `tailscale ip -4`.

### 3. App móvil

```bash
# En la raíz del proyecto:
npx expo start

# Escanea el QR con Expo Go en tu iPhone
```

## Funcionalidades por pantalla

### 💬 Chat (pantalla principal)
- Escribe mensajes o usa el **🎤 micrófono del teclado iOS** para dictar por voz
- Las respuestas de Raín se **leen automáticamente** en voz alta (expo-speech)
- Raín puede manejar finanzas y agenda en el mismo mensaje

### 💰 Finanzas
- Lista todas las transacciones con balance actualizado
- Formulario para registrar gastos/ingresos manualmente
- Mantén presionado una transacción para eliminarla

### ✅ Tareas
- Lista de tareas con checkbox para marcar completadas
- Formulario para crear nuevas tareas con fecha límite y prioridad
- Mantén presionado para eliminar

### 📅 Calendario
- Todos los eventos y tareas agrupados por día
- Vista cronológica con hora, tipo y estado

## Ingesta bancaria automática

Ver [`backend/README.md`](./backend/README.md) para las instrucciones completas de configuración del Apple Shortcut que envía notificaciones bancarias automáticamente al webhook.

## Verificación del sistema

```bash
# 1. Verificar backend:
curl http://localhost:8000/health

# 2. Probar Ollama:
curl -X POST http://localhost:8000/test-llm \
  -H "Content-Type: application/json" \
  -d '{"mensaje":"hola"}'

# 3. Probar el chat completo:
curl -X POST http://localhost:8000/api/asistente/mensaje \
  -H "Content-Type: application/json" \
  -d '{"texto":"Registra un gasto de 15000 en almuerzo en el campus"}'

# 4. Probar webhook bancario:
curl -X POST http://localhost:8000/api/webhook/transaccion-bancaria \
  -H "Content-Type: application/json" \
  -d '{"texto_notificacion":"Bancolombia: Compra $45.000 en Rappi"}'
```
