// Endpoint de producción del workflow SV · Ping en n8n.
const N8N_PING_URL = "https://tasks.nukeador.com/webhook/segundavida/ping";

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
