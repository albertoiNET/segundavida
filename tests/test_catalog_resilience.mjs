import assert from "node:assert/strict";
import test from "node:test";

await import("../js/catalog-resilience.js");

const resilience = globalThis.SecondaVidaCatalogResilience;

test("catalogue retry keeps trying until the API recovers", async () => {
  let attempts = 0;
  const failures = [];

  const result = await resilience.retryUntilSuccess({
    load: async () => {
      attempts += 1;
      if (attempts < 4) throw new Error("temporary");
      return ["catalogue"];
    },
    delays: [0],
    onFailure: (_error, attempt) => failures.push(attempt),
  });

  assert.deepEqual(result, ["catalogue"]);
  assert.equal(attempts, 4);
  assert.deepEqual(failures, [0, 1, 2]);
  assert.deepEqual([...resilience.CATALOG_RETRY_DELAYS_MS], [1000, 2000, 4000, 8000, 15000, 30000]);
});

test("catalogue retry stops when the request becomes obsolete", async () => {
  let attempts = 0;

  const result = await resilience.retryUntilSuccess({
    load: async () => {
      attempts += 1;
      throw new Error("temporary");
    },
    shouldStop: () => attempts > 0,
    delays: [0],
  });

  assert.equal(result, null);
  assert.equal(attempts, 1);
});

test("image refresh requests are deduplicated", async () => {
  let refreshCalls = 0;
  const refresh = resilience.createRefreshCoordinator(async () => {
    refreshCalls += 1;
    return { refreshed: true };
  }, { minIntervalMs: 0 });

  const results = await Promise.all([refresh(), refresh(), refresh()]);

  assert.equal(refreshCalls, 1);
  assert.deepEqual(results, [{ refreshed: true }, { refreshed: true }, { refreshed: true }]);
});
