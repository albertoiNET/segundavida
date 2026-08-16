// Punto de entrada del frontend de SegundaVida.
document.documentElement.classList.add("app-ready");

const telegramRuntime = window.SecondaVidaTelegram ?? {
  isTelegram: false,
  sdkAvailable: false,
};

const runtimeName = document.querySelector("#runtime-name");
const telegramSdkState = document.querySelector("#telegram-sdk-state");
const telegramStatus = document.querySelector("#telegram-status");
const telegramStatusLabel = document.querySelector("#telegram-status-label");
const n8nStatus = document.querySelector("#n8n-status");
const n8nStatusLabel = document.querySelector("#n8n-status-label");

if (telegramRuntime.isTelegram) {
  runtimeName.textContent = "Telegram";
  telegramSdkState.textContent = telegramRuntime.sdkAvailable
    ? " · Telegram SDK: disponible ✓"
    : " · Telegram SDK: no disponible";
  telegramSdkState.hidden = false;

  telegramStatus.classList.remove("status-value--pending");
  telegramStatus.classList.add("status-value--connected");
  telegramStatusLabel.textContent = "Conectado ✓";
}

if (window.SecondaVidaApi?.isConfigured) {
  n8nStatusLabel.textContent = "Comprobando...";

  window.SecondaVidaApi.ping().then((result) => {
    if (result.ok && result.service === "SegundaVida") {
      n8nStatus.classList.remove("status-value--pending");
      n8nStatus.classList.add("status-value--connected");
      n8nStatusLabel.textContent = "Conectado ✓";
      return;
    }

    n8nStatus.classList.remove("status-value--pending");
    n8nStatus.classList.add("status-value--error");
    n8nStatusLabel.textContent = "Respuesta no válida";
  }).catch(() => {
    n8nStatus.classList.remove("status-value--pending");
    n8nStatus.classList.add("status-value--error");
    n8nStatusLabel.textContent = "No disponible";
  });
}

window.SecondaVidaAnalytics?.trackPageView();
