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
