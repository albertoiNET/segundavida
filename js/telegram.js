// Adaptador mínimo para Telegram Mini Apps.
(function setupTelegramRuntime() {
  const webApp = window.Telegram?.WebApp;
  const isTelegram = Boolean(webApp);

  if (isTelegram && typeof webApp.ready === "function") {
    webApp.ready();
  }

  window.SecondaVidaTelegram = Object.freeze({
    isTelegram,
    sdkAvailable: isTelegram,
  });
}());
