// Adaptador mínimo para Telegram Mini Apps.
(function setupTelegramRuntime() {
  // Si cambia el nombre de usuario o el short name de la Mini App, solo hay que actualizar esta línea.
  const miniAppUrl = "https://t.me/pucelobot/segundavida";
  const webApp = window.Telegram?.WebApp;
  const isTelegram = Boolean(webApp);

  if (isTelegram && typeof webApp.ready === "function") {
    webApp.ready();
  }

  window.SecondaVidaTelegram = Object.freeze({
    isTelegram,
    sdkAvailable: isTelegram,
    miniAppUrl,
  });
}());
