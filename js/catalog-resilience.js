// Coordinadores pequeños y sin dependencias para que la portada pueda
// recuperarse de fallos transitorios sin multiplicar peticiones al API.
(function exposeCatalogResilience(root) {
  const CATALOG_RETRY_DELAYS_MS = Object.freeze([1000, 2000, 4000, 8000, 15000, 30000]);

  const wait = (delayMs) => new Promise((resolve) => root.setTimeout(resolve, delayMs));

  async function retryUntilSuccess({
    load,
    shouldStop = () => false,
    onFailure,
    delays = CATALOG_RETRY_DELAYS_MS,
  }) {
    let attempt = 0;
    while (!shouldStop()) {
      try {
        return await load(attempt);
      } catch (error) {
        if (shouldStop()) return null;
        onFailure?.(error, attempt);
        const delayMs = delays[Math.min(attempt, delays.length - 1)];
        await wait(delayMs);
        attempt += 1;
      }
    }
    return null;
  }

  function createRefreshCoordinator(refresh, { minIntervalMs = 30000 } = {}) {
    let inFlight = null;
    let lastStartedAt = Number.NEGATIVE_INFINITY;

    return function refreshOnce() {
      if (inFlight) return inFlight;

      const remainingDelay = Math.max(
        0,
        minIntervalMs - (Date.now() - lastStartedAt),
      );
      const request = (async () => {
        if (remainingDelay > 0) await wait(remainingDelay);
        lastStartedAt = Date.now();
        return refresh();
      })();

      inFlight = request;
      const clear = () => {
        if (inFlight === request) inFlight = null;
      };
      request.then(clear, clear);
      return request;
    };
  }

  root.SecondaVidaCatalogResilience = Object.freeze({
    CATALOG_RETRY_DELAYS_MS,
    wait,
    retryUntilSuccess,
    createRefreshCoordinator,
  });
}(typeof window === "undefined" ? globalThis : window));
