// One place that manages "who is logged in" for the whole frontend.

export function saveLogin(token, user, rememberMe) {
  // Clear any older login first CANNOT MIX 2 SESSIONS UNDER ANY CONDITION
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');

  // remember me ON  -> localStorage   (survives closing the browser)
  // remember me OFF -> sessionStorage (cleared when the tab closes)
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem('token', token);
  storage.setItem('user', JSON.stringify(user));
}

export function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

export function getUser() {
  const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
}