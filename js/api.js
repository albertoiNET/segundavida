// URL pública del endpoint de prueba de n8n.
// Se completará cuando el workflow SV · Ping esté creado y activo.
const N8N_PING_URL = "";

async function ping() {
  if (!N8N_PING_URL) {
    return { configured: false, ok: false };
  }

  const response = await fetch(N8N_PING_URL, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`n8n respondió con HTTP ${response.status}`);
  }

  return response.json();
}

window.SecondaVidaApi = Object.freeze({
  isConfigured: Boolean(N8N_PING_URL),
  ping,
});
