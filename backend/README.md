# Raín — Backend

API REST con FastAPI + Ollama para el asistente personal Raín.

## Requisitos previos

- Python 3.11+
- [Ollama](https://ollama.com) instalado y corriendo localmente
- Cuenta Gmail con **App Password** habilitado (para lectura de correos)

## Instalación

```bash
cd backend

# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate   # macOS/Linux
# venv\Scripts\activate    # Windows

# Instalar dependencias
pip install -r requirements.txt

# Copiar y configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales reales
```

## Configuración del entorno (`.env`)

```env
EMAIL_USER=tu_correo@gmail.com
EMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx   # App Password de Google
OLLAMA_MODEL=llama3.2
OLLAMA_BASE_URL=http://localhost:11434

# Base de datos Supabase (PostgreSQL)
# Si no proporcionas esto, se creará un archivo SQLite local automáticamente
DATABASE_URL=postgresql://postgres.[tu_proyecto]:[tu_password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### Cómo obtener el Connection String de Supabase
1. Entra a tu proyecto en [Supabase](https://supabase.com).
2. Ve a **Project Settings** -> **Database**.
3. En la sección **Connection string**, selecciona la pestaña **URI** y desmarca **Use connection pooling** o usa el puerto 6543 si mantienes el pooling activado.
4. Reemplaza `[YOUR-PASSWORD]` por la contraseña de la base de datos de tu proyecto.

### Cómo obtener el App Password de Gmail
1. Ve a [myaccount.google.com](https://myaccount.google.com)
2. Seguridad → Verificación en dos pasos (debe estar activa)
3. Contraseñas de aplicaciones → Crear nueva → "Correo" en "Mac"
4. Copia la contraseña de 16 caracteres y ponla en `EMAIL_APP_PASSWORD`

## Iniciar el backend

```bash
# Asegúrate de que Ollama esté corriendo:
ollama serve   # en otra terminal, o como servicio del sistema

# Descargar el modelo si no lo tienes:
ollama pull llama3.2

# Iniciar el backend:
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

El backend estará disponible en:
- **Local**: `http://localhost:8000`
- **Swagger UI**: `http://localhost:8000/docs`
- **Via Tailscale**: `http://<IP_TAILSCALE>:8000`

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Verificar que el servidor está activo |
| POST | `/test-llm` | Probar conexión con Ollama |
| POST | `/api/asistente/mensaje` | **Chat principal** — enviar mensaje y recibir respuesta |
| POST | `/api/webhook/transaccion-bancaria` | Recibir notificación bancaria de Apple Shortcut |
| GET | `/api/transacciones/` | Listar transacciones |
| GET | `/api/eventos/` | Listar eventos y tareas |
| GET | `/api/correos/` | Listar correos procesados |
| GET | `/api/metas/` | Listar metas de ahorro |
| GET | `/api/tarjetas/` | Listar tarjetas de crédito |

---

## Configurar Apple Shortcuts para ingesta bancaria automática

Este shortcut se dispara al recibir una notificación de tu banco y envía el texto automáticamente al backend.

### Paso 1: Crear el Shortcut

1. Abre la app **Atajos (Shortcuts)** en tu iPhone
2. Toca **+** para crear un nuevo atajo
3. Nómbralo: **"Raín — Gasto Bancolombia"** (o el banco que uses)

### Paso 2: Agregar las acciones

**Acción 1: Obtener el texto del atajo**
- Agrega la acción: **"Obtener texto del atajo"** (o usa `Shortcut Input`)

**Acción 2: Hacer solicitud URL**
- URL: `http://TU_IP_TAILSCALE:8000/api/webhook/transaccion-bancaria`
- Método: **POST**
- Encabezados: `Content-Type: application/json`
- Cuerpo de la solicitud: **JSON**
  ```json
  {
    "texto_notificacion": "[Texto del atajo]"
  }
  ```

### Paso 3: Automatización con notificaciones

1. Ve a **Automatización** (tab inferior) → **+** → **Notificación**
2. Aplicación: selecciona la app de tu banco (Bancolombia, Nu, Davivienda, etc.)
3. En "Cuando recibas una notificación de..."
4. Acción: Ejecutar el shortcut creado arriba
5. Activa **"Ejecutar automáticamente"** (sin confirmación)

### Ejemplos de notificaciones que el sistema procesa correctamente

```
"Bancolombia: Compra aprobada por $45.000 en RAPPI el 21/09/2026 con TC Visa Gold"
"Nu: Pago realizado por $120.000 en Éxito"
"Davivienda: Retiro cajero $200.000 Av. El Dorado 13:45"
"Nequi: Enviaste $50.000 a Juan García"
```

### Verificar que funciona

```bash
curl -X POST http://localhost:8000/api/webhook/transaccion-bancaria \
  -H "Content-Type: application/json" \
  -d '{"texto_notificacion": "Bancolombia: Compra aprobada por $45.000 en Rappi"}'
```

Respuesta esperada:
```json
{"status": "registrado", "transaccion_id": 1, "datos_extraidos": {...}}
```
