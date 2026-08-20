// Adaptador mínimo para Telegram Mini Apps.
(function setupTelegramRuntime() {
  // Si cambia el nombre de usuario o el short name de la Mini App, solo hay que actualizar esta línea.
  const miniAppUrl = "https://t.me/pucelobot/segundavida";
  const webApp = window.Telegram?.WebApp;
  const query = new URLSearchParams(window.location.search);
  const startParam = String(
    webApp?.initDataUnsafe?.start_param
      || query.get("tgWebAppStartParam")
      || query.get("startapp")
      || "",
  ).trim();
  // El SDK también se carga en la web normal; initData solo existe al abrirse desde Telegram.
  const isTelegram = Boolean(webApp?.initData?.trim());

  function expandFallback() {
    if (typeof webApp.expand === "function") {
      webApp.expand();
    }
  }

  function requestFullscreen() {
    if (typeof webApp.requestFullscreen !== "function") {
      expandFallback();
      return;
    }

    const onFullscreenFailed = () => expandFallback();
    if (typeof webApp.onEvent === "function") {
      webApp.onEvent("fullscreenFailed", onFullscreenFailed);
    }

    try {
      webApp.requestFullscreen();
    } catch {
      onFullscreenFailed();
    }
  }

  if (isTelegram) {
    document.documentElement.classList.add("is-telegram-mini-app");
    if (typeof webApp.ready === "function") {
      webApp.ready();
    }
    requestFullscreen();
  }

  window.SecondaVidaTelegram = Object.freeze({
    isTelegram,
    sdkAvailable: isTelegram,
    miniAppUrl,
    startParam,
  });
}());
