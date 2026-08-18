// Endpoint de producción del catálogo público en n8n.
const N8N_DATA_URL = "https://tasks.nukeador.com/webhook/segundavida/data";
const N8N_ITEM_URL = "https://tasks.nukeador.com/webhook/c2b5eab6-9f26-48e9-9561-81dc6d3347ec/segundavida/item";
const N8N_PUBLISH_URL = "https://tasks.nukeador.com/webhook/segundavida/publish";
const N8N_COMPLETE_URL = "https://tasks.nukeador.com/webhook/segundavida/complete";
const N8N_MINE_URL = "https://tasks.nukeador.com/webhook/segundavida/mine";
const NOCODB_BASE_URL = "https://proyectos.aldeapucela.org";

let catalogInFlight = null;
const itemInFlight = new Map();
let mineInFlight = null;
let mineInFlightSession = "";

function asAttachmentList(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return [value];
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object") return [parsed];
  } catch {
    return [];
  }

  return [];
}

function normalizeAttachmentUrl(value) {
  const attachment = typeof value === "string"
    ? value
    : value?.url ?? value?.signedUrl ?? value?.signed_url
      ?? value?.path ?? value?.signedPath ?? value?.signed_path
      ?? value?.thumbnails?.small?.signedPath
      ?? value?.thumbnails?.small?.signedUrl
      ?? value?.thumbnails?.card_cover?.signedPath
      ?? value?.thumbnails?.card_cover?.signedUrl
      ?? "";
  const url = String(attachment).trim();

  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${NOCODB_BASE_URL}${url}`;
  if (url.startsWith("download/") || url.startsWith("dltemp/")) {
    return `${NOCODB_BASE_URL}/${url}`;
  }
  return "";
}

function extractImageUrls(value) {
  return asAttachmentList(value)
    .map(normalizeAttachmentUrl)
    .filter(Boolean);
}

function normalizeItem(record, { privateFields = false } = {}) {
  const fields = record?.fields ?? record ?? {};
  const imageUrls = [...new Set([
    ...extractImageUrls(fields.image_urls),
    ...extractImageUrls(fields.Fotos ?? fields.fotos ?? fields.photos),
  ])];
  const imageUrl = normalizeAttachmentUrl(fields.image_url) || imageUrls[0] || null;

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
    reservedAt: privateFields ? fields.reserved_at ?? null : null,
    reservationExpiresAt: privateFields ? fields.reservation_expires_at ?? null : null,
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

  const sessionKey = String(initData ?? "");
  if (mineInFlight && mineInFlightSession === sessionKey) {
    return mineInFlight;
  }

  const request = (async () => {
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
  })();

  mineInFlight = request;
  mineInFlightSession = sessionKey;
  try {
    return await request;
  } finally {
    if (mineInFlight === request) {
      mineInFlight = null;
      mineInFlightSession = "";
    }
  }
}

async function listItems() {
  if (!N8N_DATA_URL) {
    return [];
  }

  if (catalogInFlight) {
    return catalogInFlight;
  }

  const request = (async () => {
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
  })();

  catalogInFlight = request;
  try {
    return await request;
  } finally {
    if (catalogInFlight === request) {
      catalogInFlight = null;
    }
  }
}

async function getItem(itemId) {
  const publicId = String(itemId ?? "").trim();
  if (!publicId) {
    throw new Error("Identificador público vacío");
  }

  if (itemInFlight.has(publicId)) {
    return itemInFlight.get(publicId);
  }

  const request = (async () => {
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
  })();

  itemInFlight.set(publicId, request);
  try {
    return await request;
  } finally {
    if (itemInFlight.get(publicId) === request) {
      itemInFlight.delete(publicId);
    }
  }
}

function invalidateCatalog() {
  // The catalog cache only contains the pending promise. Keep it alive so an
  // invalidation cannot create a second request while the first is running.
}

function invalidateMine() {
  // Private data is not persisted; pending-request deduplication remains active.
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
    throw new Error("El endpoint de gestión todavía no está configurado.");
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
  return result ?? { ok: false, error: "Respuesta vacía del endpoint de gestión." };
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
  invalidateCatalog,
  invalidateMine,
  publishItem,
  completeItem,
});
