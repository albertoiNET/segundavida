// Endpoint de producción del workflow SV · Ping en n8n.
const N8N_PING_URL = "https://tasks.nukeador.com/webhook/segundavida/ping";
const N8N_DATA_URL = "https://tasks.nukeador.com/webhook/segundavida/data";

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

function normalizeItem(record) {
  const fields = record?.fields ?? record ?? {};

  return {
    id: fields["item-id"] ?? record?.id ?? "",
    title: fields.title ?? "Objeto sin título",
    description: fields.description ?? "",
    category: fields.category ?? "Otros",
    zone: fields.zone ?? "Valladolid",
    ownerDisplayName: fields.owner_display_name ?? "Vecindad",
    status: fields.status ?? "hidden",
    createdAt: fields.created_at ?? fields.CreatedAt ?? null,
    expiresAt: fields.expires_at ?? null,
    imageUrl: fields.image_url ?? null,
    interestCount: Number(fields.interest_count ?? 0),
  };
}

async function listItems() {
  if (!N8N_DATA_URL) {
    return [];
  }

  const response = await fetch(N8N_DATA_URL, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`n8n respondió con HTTP ${response.status}`);
  }

  const payload = await response.json();
  const records = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.items)
      ? payload.items
      : [];

  return records.map(normalizeItem);
}

window.SecondaVidaApi = Object.freeze({
  isConfigured: Boolean(N8N_PING_URL),
  isDataConfigured: Boolean(N8N_DATA_URL),
  ping,
  listItems,
});
