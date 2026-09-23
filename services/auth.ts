

// Export BASE_URL from api to avoid duplicate declaration, or just declare it again
// Since api.ts doesn't export BASE_URL, we'll declare it here:
const API_URL = 'http://100.101.159.17:8000'; 

export async function loginApi(correo: string, password: string) {
  const resp = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, password })
  });
  
  if (!resp.ok) {
    const errorData = await resp.json();
    throw new Error(errorData.detail || 'Error al iniciar sesión');
  }
  
  return resp.json();
}

export async function registroApi(nombre: string, correo: string, password: string) {
  const resp = await fetch(`${API_URL}/api/auth/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, correo, password })
  });
  
  if (!resp.ok) {
    const errorData = await resp.json();
    throw new Error(errorData.detail || 'Error al registrarse');
  }
  
  return resp.json();
}
