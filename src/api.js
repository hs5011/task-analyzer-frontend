const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export async function analyzeTask(input, temperature) {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Input: input, Temperature: temperature })
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`Invalid JSON: ${text}`); }
  if (!res.ok) {
    const msg = json?.detail || json?.title || res.statusText;
    throw new Error(msg);
  }
  return json;
}
