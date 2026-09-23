/**
 * Servicio de API para Raín.
 * Todas las llamadas al backend pasan por aquí.
 *
 * ⚠️ IMPORTANTE: Cambia IP_TAILSCALE por la IP de Tailscale de tu Mac.
 *    Puedes verla en la app de Tailscale en tu Mac o con el comando: tailscale ip -4
 *    Ejemplo: const BASE_URL = 'http://100.64.1.23:8000';
 */
const BASE_URL = 'http://192.168.1.30:8000'; // WiFi local — no requiere Tailscale en iPhone

// ─────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────

export interface Transaccion {
  id?: number;
  tipo: 'ingreso' | 'gasto';
  monto: number;
  moneda?: string;
  categoria: string;
  comercio?: string;
  medio_pago?: string;
  descripcion: string;
  fecha?: string;
  origen?: string;
  texto_crudo?: string;
}

export interface Evento {
  id?: number;
  titulo: string;
  tipo?: 'tarea' | 'evento';
  categoria?: string;
  fecha_inicio: string;
  fecha_fin?: string;
  prioridad?: 'baja' | 'media' | 'alta';
  estado?: 'pendiente' | 'en_progreso' | 'completado';
  origen?: string;
  notas?: string;
}

// ─────────────────────────────────────────────────
// ASISTENTE (endpoint principal)
// ─────────────────────────────────────────────────

/**
 * Envía un mensaje de texto al asistente Raín y retorna su respuesta.
 * Usado tanto en modo chat escrito como en modo voz (dictado por teclado).
 */
export async function enviarMensaje(texto: string): Promise<string> {
  const respuesta = await fetch(`${BASE_URL}/api/asistente/mensaje`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto }),
  });

  if (!respuesta.ok) {
    throw new Error(`Error del servidor: ${respuesta.status}`);
  }

  const datos = await respuesta.json();
  return datos.respuesta;
}

// ─────────────────────────────────────────────────
// TRANSACCIONES
// ─────────────────────────────────────────────────

export async function obtenerTransacciones(): Promise<Transaccion[]> {
  const resp = await fetch(`${BASE_URL}/api/transacciones/`);
  if (!resp.ok) throw new Error('Error obteniendo transacciones');
  return resp.json();
}

export async function crearTransaccion(datos: Transaccion): Promise<Transaccion> {
  const resp = await fetch(`${BASE_URL}/api/transacciones/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  if (!resp.ok) throw new Error('Error creando transacción');
  return resp.json();
}

export async function eliminarTransaccion(id: number): Promise<void> {
  await fetch(`${BASE_URL}/api/transacciones/${id}`, { method: 'DELETE' });
}

// ─────────────────────────────────────────────────
// EVENTOS / TAREAS
// ─────────────────────────────────────────────────

export async function obtenerEventos(tipo?: 'tarea' | 'evento'): Promise<Evento[]> {
  const url = tipo
    ? `${BASE_URL}/api/eventos/?tipo=${tipo}`
    : `${BASE_URL}/api/eventos/`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Error obteniendo eventos');
  return resp.json();
}

export async function crearEvento(datos: Evento): Promise<Evento> {
  const resp = await fetch(`${BASE_URL}/api/eventos/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  if (!resp.ok) throw new Error('Error creando evento');
  return resp.json();
}

export async function actualizarEvento(id: number, datos: Partial<Evento>): Promise<Evento> {
  const resp = await fetch(`${BASE_URL}/api/eventos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  if (!resp.ok) throw new Error('Error actualizando evento');
  return resp.json();
}

export async function eliminarEvento(id: number): Promise<void> {
  await fetch(`${BASE_URL}/api/eventos/${id}`, { method: 'DELETE' });
}

// ─────────────────────────────────────────────────
// METAS DE AHORRO
// ─────────────────────────────────────────────────

export interface MetaAhorro {
  id?: number;
  nombre: string;
  monto_objetivo: number;
  monto_actual: number;
  fecha_limite?: string;
}

export async function obtenerMetas(): Promise<MetaAhorro[]> {
  const resp = await fetch(`${BASE_URL}/api/metas/`);
  if (!resp.ok) throw new Error('Error obteniendo metas');
  return resp.json();
}
