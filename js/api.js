// Endpoint de producción del catálogo público en n8n.
const N8N_DATA_URL = "https://tasks.nukeador.com/webhook/segundavida/data";
const N8N_PUBLISH_URL = "https://tasks.nukeador.com/webhook/segundavida/publish";
const N8N_COMPLETE_URL = "https://tasks.nukeador.com/webhook/segundavida/complete";
const N8N_MINE_URL = "https://tasks.nukeador.com/webhook/segundavida/mine";

function normalizeItem(record) {
  const fields = record?.fields ?? record ?? {};

  return {
    id: fields["item-id"] ?? record?.id ?? "",
    title: fields.title ?? "Objeto sin título",
    description: fields.description ?? "",
    category: fields.category ?? "Otros",
    zone: fields.zone ?? "Valladolid",
    ownerDisplayName: fields.owner_display_name ?? "Vecindad",
    ownerUsername: fields.owner_username
      ?? fields.owner_telegram_username
      ?? fields.telegram_username
      ?? "",
    ownerTelegramId: fields.owner_telegram_id ?? "",
    status: fields.status ?? "hidden",
    createdAt: fields.created_at ?? fields.CreatedAt ?? null,
    completedAt: fields.completed_at ?? null,
    expiresAt: fields.expires_at ?? null,
    imageUrl: fields.image_url ?? null,
    interestCount: Number(fields.interest_count ?? 0),
  };
}

async function listMineItems(initData) {
  if (!N8N_MINE_URL) {
    return [];
  }

  const response = await fetch(N8N_MINE_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ initData }),
  });

  const payload = await response.json();
  const records = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : null;

  if (!response.ok || !payload?.ok || !records) {
    throw new Error(payload?.error ?? `n8n respondió con HTTP ${response.status}`);
  }

  return records.map(normalizeItem);
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
    : Array.isArray(payload?.items)
      ? payload.items
      : null;

  if (!records || (!Array.isArray(payload) && payload.ok !== true)) {
    throw new Error("Respuesta de catálogo no válida");
  }

  return records.map(normalizeItem);
}

async function publishItem(payload) {
  if (!N8N_PUBLISH_URL) {
    throw new Error("El endpoint de publicación todavía no está configurado.");
  }

  const response = await fetch(N8N_PUBLISH_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let result = null;
  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    throw new Error(result?.error ?? `n8n respondió con HTTP ${response.status}`);
  }

  return result ?? { ok: false, error: "Respuesta vacía del endpoint de publicación." };
}

async function completeItem(payload) {
  if (!N8N_COMPLETE_URL) {
    throw new Error("El endpoint de entrega todavía no está configurado.");
  }

  const response = await fetch(N8N_COMPLETE_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let payloadResult = null;
  try {
    payloadResult = await response.json();
  } catch {
    payloadResult = null;
  }

  if (!response.ok) {
    throw new Error(payloadResult?.error ?? `n8n respondió con HTTP ${response.status}`);
  }

  const result = Array.isArray(payloadResult) ? payloadResult[0] : payloadResult;
  return result ?? { ok: false, error: "Respuesta vacía del endpoint de entrega." };
}

window.SecondaVidaApi = Object.freeze({
  isConfigured: Boolean(N8N_DATA_URL),
  isDataConfigured: Boolean(N8N_DATA_URL),
  isPublishConfigured: Boolean(N8N_PUBLISH_URL),
  isCompleteConfigured: Boolean(N8N_COMPLETE_URL),
  isMineConfigured: Boolean(N8N_MINE_URL),
  listItems,
  listMineItems,
  publishItem,
  completeItem,
});
