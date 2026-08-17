// Endpoint de producción del catálogo público en n8n.
const N8N_DATA_URL = "https://tasks.nukeador.com/webhook/segundavida/data";
const N8N_ITEM_URL = "https://tasks.nukeador.com/webhook/c2b5eab6-9f26-48e9-9561-81dc6d3347ec/segundavida/item";
const N8N_PUBLISH_URL = "https://tasks.nukeador.com/webhook/segundavida/publish";
const N8N_COMPLETE_URL = "https://tasks.nukeador.com/webhook/segundavida/complete";
const N8N_MINE_URL = "https://tasks.nukeador.com/webhook/segundavida/mine";

function extractImageUrls(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((attachment) => (
      typeof attachment === "string"
        ? attachment
        : attachment?.url ?? attachment?.signedUrl ?? attachment?.signed_url ?? ""
    ))
    .filter(Boolean);
}

function normalizeItem(record, { privateFields = false } = {}) {
  const fields = record?.fields ?? record ?? {};
  const imageUrls = [...new Set([
    ...extractImageUrls(fields.image_urls),
    ...extractImageUrls(fields.Fotos ?? fields.fotos ?? fields.photos),
  ])];
  const imageUrl = fields.image_url ?? imageUrls[0] ?? null;

  return {
    id: fields.public_id ?? fields["item-id"] ?? record?.public_id ?? record?.id ?? "",
    title: fields.title ?? "Objeto sin título",
    description: fields.description ?? "",
    category: fields.category ?? "Otros",
    zone: fields.zone ?? "Valladolid",
    ownerDisplayName: fields.owner_display_name ?? "Vecindad",
    ownerUsername: fields.owner_username ?? "",
    ownerTelegramId: privateFields ? fields.owner_telegram_id ?? "" : "",
    status: fields.status ?? "hidden",
    createdAt: fields.created_at ?? fields.CreatedAt ?? null,
    completedAt: fields.completed_at ?? null,
    expiresAt: fields.expires_at ?? null,
    imageUrl,
    imageUrls,
    interestCount: Number(fields.interest_count ?? 0),
  };
}

function parseItemsPayload(payload, options = {}) {
  const records = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : null;

  if (!records) {
    throw new Error("Respuesta de catálogo no válida");
  }

  return records.map((record) => normalizeItem(record, options));
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
  const records = parseItemsPayload(payload, { privateFields: true });

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error ?? `n8n respondió con HTTP ${response.status}`);
  }

  return records;
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
  const records = parseItemsPayload(payload);

  if (!Array.isArray(payload) && payload.ok !== true) {
    throw new Error("Respuesta de catálogo no válida");
  }

  return records;
}

async function getItem(itemId) {
  const publicId = String(itemId ?? "").trim();
  if (!publicId) {
    throw new Error("Identificador público vacío");
  }

  const response = await fetch(`${N8N_ITEM_URL}/${encodeURIComponent(publicId)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (response.status === 404 || payload?.error === "not_found") {
    const error = new Error("not_found");
    error.code = "not_found";
    throw error;
  }

  if (!response.ok || payload?.ok !== true || !payload?.item) {
    throw new Error(payload?.error ?? `n8n respondió con HTTP ${response.status}`);
  }

  return normalizeItem(payload.item);
}

async function publishItem(payload, files = []) {
  if (!N8N_PUBLISH_URL) {
    throw new Error("El endpoint de publicación todavía no está configurado.");
  }

  const body = new FormData();
  body.append("payload", JSON.stringify(payload));
  files.forEach((file, index) => {
    body.append(`photo_${index}`, file, file.name);
  });

  const response = await fetch(N8N_PUBLISH_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body,
  });

  let result = null;
  try {
    result = await response.json();
  } catch {
    result = null;
  }

  result = Array.isArray(result) ? result[0] ?? null : result;

  if (!response.ok) {
    const error = new Error(result?.error ?? `n8n respondió con HTTP ${response.status}`);
    error.code = result?.error_code ?? result?.error ?? `http_${response.status}`;
    throw error;
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
  isItemConfigured: Boolean(N8N_ITEM_URL),
  isPublishConfigured: Boolean(N8N_PUBLISH_URL),
  isCompleteConfigured: Boolean(N8N_COMPLETE_URL),
  isMineConfigured: Boolean(N8N_MINE_URL),
  listItems,
  getItem,
  listMineItems,
  publishItem,
  completeItem,
});
