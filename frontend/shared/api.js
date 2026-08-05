/**
 * Helper compartido: autenticación + llamadas a la API del backend.
 * Se incluye en login.html, dashboard.html y usuarios.html.
 */
const API_BASE = window.VETCLOUD_API_BASE || 'https://vetcloud-backend-production.up.railway.app/api/v1';
function getToken() {
  return localStorage.getItem('vetcloud_token');
}
function getUsuario() {
  const raw = localStorage.getItem('vetcloud_usuario');
  return raw ? JSON.parse(raw) : null;
}
function setSession(token, usuario) {
  localStorage.setItem('vetcloud_token', token);
  localStorage.setItem('vetcloud_usuario', JSON.stringify(usuario));
}
function logout() {
  localStorage.removeItem('vetcloud_token');
  localStorage.removeItem('vetcloud_usuario');
  window.location.href = './login.html';
}
/** Redirige a login si no hay sesión. Llamar al inicio de cada página protegida. */
function requireAuth() {
  if (!getToken() || !getUsuario()) {
    window.location.href = './login.html';
    return null;
  }
  return getUsuario();
}
/** Redirige al dashboard si el usuario no tiene uno de los roles permitidos. */
function requireRole(...rolesPermitidos) {
  const usuario = requireAuth();
  if (!usuario) return null;
  if (!rolesPermitidos.includes(usuario.rol) && usuario.rol !== 'superadmin') {
    window.location.href = './dashboard.html';
    return null;
  }
  return usuario;
}
/**
 * Wrapper de fetch: agrega el token, parsea JSON, y desloguea automáticamente
 * si el backend responde 401 (token vencido o inválido).
 */
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    logout();
    throw new Error('Sesión expirada');
  }
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : null;
  if (!res.ok) {
    const message = body?.error?.message || `Error ${res.status}`;
    throw new Error(message);
  }
  return body;
}
/** Oculta ítems del sidebar que no correspondan al rol de la sesión (atributo data-roles). */
function applyRoleNav(role) {
  document.querySelectorAll('.nav-item[data-roles]').forEach(item => {
    const roles = item.dataset.roles.split(',');
    item.style.display = (roles.includes(role) || role === 'superadmin') ? 'flex' : 'none';
  });
}
function iniciales(nombres, apellidos) {
  return `${(nombres || '?')[0]}${(apellidos || '?')[0]}`.toUpperCase();
}
const ETIQUETAS_ROL = {
  admin: 'Administrador',
  doctor: 'Doctor',
  auxiliar: 'Auxiliar',
  secretaria: 'Secretaria',
  contador: 'Contador',
  superadmin: 'Superadmin',
};
