export const API_URL = import.meta.env.VITE_API_URL || "";
const TOKEN_KEY = "adme_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function errorMessage(data) {
  if (data && typeof data.detail === "string") {
    return data.detail;
  }

  if (data && Array.isArray(data.detail) && data.detail.length > 0) {
    const first = data.detail[0];
    const field = first.loc[first.loc.length - 1];
    if (field === "email") {
      return "Enter a valid email address.";
    }
    return `Check the ${field} field.`;
  }

  return "Something went wrong. Try again.";
}

export async function api(path, options = {}) {
  const headers = {};
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(API_URL + path, {
      method: options.method || "GET",
      headers,
      body: JSON.stringify(options.body),
    });
  } catch {
    throw new Error("Can't reach the server. Check that the backend is running.");
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      clearToken();
      window.dispatchEvent(new Event("adme:logged-out"));
    }
    const error = new Error(errorMessage(data));
    error.status = response.status;
    throw error;
  }

  return data;
}
