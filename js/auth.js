// Cliente mínimo de identidad. La validación real ocurre siempre en n8n.
const N8N_WHOAMI_URL = "https://tasks.nukeador.com/webhook/segundavida/whoami";

function getWebApp() {
  return window.Telegram?.WebApp ?? null;
}

function getInitData() {
  return getWebApp()?.initData?.trim() ?? "";
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
  whoAmI,
});
