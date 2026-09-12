const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_PREFIX = "/api/v1";

function authHeaders(headers = {}) {
  const token = localStorage.getItem("kisan_token");
  if (!token) {
    throw new Error("Not authenticated. Please log in.");
  }
  return { ...headers, Authorization: `Bearer ${token}` };
}

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
    ...options,
    headers: authHeaders(options.headers),
  });
  return handle(response);
}

async function handle(response) {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 401) {
      localStorage.removeItem("kisan_token");
      localStorage.removeItem("kisan_user");
      window.location.reload();
    }
    throw new Error(body.detail || "Something went wrong talking to KISAN EYE.");
  }
  return response.json();
}

export function fileUrl(path) {
  if (!path) return "";
  return path.startsWith("http") ? path : `${BASE_URL}${path}`;
}

export async function analyzeImage(crop, file) {
  const form = new FormData();
  form.append("crop", crop);
  form.append("image", file);
  return request("/analyze", {
    method: "POST",
    body: form,
  });
}

export async function submitAssessment(payload) {
  return request("/assess", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getCases() {
  return request("/cases");
}

export async function getCase(id) {
  return request(`/cases/${id}`);
}

export async function getCasesForCrop(crop) {
  return request(`/crops/${crop}/cases`);
}

export async function compareCases(previousId, currentId) {
  return request(`/monitor?previous_id=${previousId}&current_id=${currentId}`);
}

export async function getDashboard() {
  return request("/dashboard");
}
