// Adaptador mínimo para Telegram Mini Apps.
(function setupTelegramRuntime() {
  // Si cambia el nombre de usuario o el short name de la Mini App, solo hay que actualizar esta línea.
  const miniAppUrl = "https://t.me/pucelobot/segundavida";
  const webApp = window.Telegram?.WebApp;
  const query = new URLSearchParams(window.location.search);
  const startParam = String(
    webApp?.initDataUnsafe?.start_param
      ?? query.get("tgWebAppStartParam")
      ?? query.get("startapp")
      ?? "",
  ).trim();
  // El SDK también se carga en la web normal; initData solo existe al abrirse desde Telegram.
  const isTelegram = Boolean(webApp?.initData?.trim());

  if (isTelegram && typeof webApp.ready === "function") {
    webApp.ready();
  }

  window.SecondaVidaTelegram = Object.freeze({
    isTelegram,
    sdkAvailable: isTelegram,
    miniAppUrl,
    startParam,
  });
}());
