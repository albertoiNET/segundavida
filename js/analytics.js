// Wrapper de Matomo para SegundaVida.
const MATOMO_URL = "https://stats.aldeapucela.org/";
const MATOMO_SITE_ID = "27";

const queue = window._paq = window._paq || [];
let trackerLoaded = false;

function isConfigured() {
  return Boolean(MATOMO_URL && MATOMO_SITE_ID);
}

function loadTracker() {
  if (!isConfigured() || trackerLoaded) {
    return;
  }

  queue.push(["setTrackerUrl", `${MATOMO_URL}matomo.php`]);
  queue.push(["setSiteId", MATOMO_SITE_ID]);
  queue.push(["enableLinkTracking"]);

  const script = document.createElement("script");
  const firstScript = document.getElementsByTagName("script")[0];
  script.async = true;
  script.src = `${MATOMO_URL}matomo.js`;
  firstScript.parentNode.insertBefore(script, firstScript);
  trackerLoaded = true;
}

function trackPageView(path = window.location.pathname) {
  if (!isConfigured()) {
    return;
  }

  loadTracker();
  queue.push(["setCustomUrl", path]);
  queue.push(["trackPageView"]);
}

function trackEvent(category, action, name, value) {
  if (!isConfigured()) {
    return;
  }

  loadTracker();
  const event = ["trackEvent", category, action];
  if (name !== undefined) event.push(name);
  if (value !== undefined) event.push(value);
  queue.push(event);
}

window.SecondaVidaAnalytics = Object.freeze({
  isConfigured,
  trackPageView,
  trackEvent,
});
