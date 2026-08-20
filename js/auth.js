// Cliente mínimo de identidad. La validación real ocurre siempre en n8n.
const N8N_WHOAMI_URL = "https://api.aldeapucela.org/segundavida/whoami";

function getWebApp() {
  return window.Telegram?.WebApp ?? null;
}

function getInitData() {
  return getWebApp()?.initData?.trim() ?? "";
}

function getInitDataAgeSeconds() {
  const initData = getInitData();
  if (!initData) return null;

  try {
    const authDate = Number(new URLSearchParams(initData).get("auth_date"));
    if (!Number.isInteger(authDate)) return null;
    return Math.max(0, Math.floor(Date.now() / 1000) - authDate);
  } catch {
    return null;
  }
}

function isInitDataExpired() {
  const age = getInitDataAgeSeconds();
  return age !== null && age > 600;
}

async function whoAmI() {
  const initData = getInitData();

  if (!initData) {
    return { valid: false, mode: "public" };
  }

  const response = await fetch(N8N_WHOAMI_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ initData }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(`whoami respondió ${response.status}`);
  }

  return payload ?? { valid: false };
}

window.SecondaVidaAuth = Object.freeze({
  endpoint: N8N_WHOAMI_URL,
  isTelegram: Boolean(getWebApp()),
  hasInitData: () => Boolean(getInitData()),
  getInitData,
  getInitDataAgeSeconds,
  isInitDataExpired,
  whoAmI,
});
