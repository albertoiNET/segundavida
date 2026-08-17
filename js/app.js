// Punto de entrada del frontend de SegundaVida.
document.documentElement.classList.add("app-ready");

const telegramRuntime = window.SecondaVidaTelegram ?? {
  isTelegram: false,
  sdkAvailable: false,
};

const auth = window.SecondaVidaAuth;
const api = window.SecondaVidaApi;
const CONSENT_VERSION = "sv-publish-2026-08-16-v1";
const MAX_OFFER_PHOTOS = 2;
const OWN_ITEMS_STORAGE_KEY = "segundavida:my-items:v1";
const THEME_STORAGE_KEY = "segundavida:theme:v1";
const state = {
  items: [],
  category: "Todo",
  query: "",
  selectedItem: null,
  offerFiles: [],
  telegramUser: null,
  myItems: [],
  postsFilter: "active",
  currentView: "explore",
  currentItemId: "",
  historyMaxIndex: 0,
};

const runtimeName = document.querySelector("#runtime-name");
const telegramSdkState = document.querySelector("#telegram-sdk-state");
const telegramStatus = document.querySelector("#telegram-status");
const telegramStatusLabel = document.querySelector("#telegram-status-label");
const n8nStatus = document.querySelector("#n8n-status");
const n8nStatusLabel = document.querySelector("#n8n-status-label");
const identityStatus = document.querySelector("#identity-status");
const identityStatusLabel = document.querySelector("#identity-status-label");
const searchInput = document.querySelector("#search-input");
const categoryFilters = document.querySelector("#category-filters");
const itemsCount = document.querySelector("#items-count");
const itemsState = document.querySelector("#items-state");
const itemsGrid = document.querySelector("#items-grid");
const catalogIntro = document.querySelector(".catalog-intro");
const catalogTools = document.querySelector(".catalog-tools");
const catalogSection = document.querySelector(".catalog-section");
const offerView = document.querySelector("#offer-view");
const postsView = document.querySelector("#posts-view");
const detailView = document.querySelector("#detail-view");
const detailShare = document.querySelector("#detail-share");
const detailMedia = document.querySelector("#detail-media");
const detailAvailability = document.querySelector("#detail-availability");
const detailTitle = document.querySelector("#detail-title");
const detailCategory = document.querySelector("#detail-category");
const detailDescription = document.querySelector("#detail-description");
const detailZone = document.querySelector("#detail-zone");
const detailOwner = document.querySelector("#detail-owner");
const interestButton = document.querySelector("#interest-button");
const detailActionState = document.querySelector("#detail-action-state");
const detailOwnerActions = document.querySelector("#detail-owner-actions");
const markDeliveredButton = document.querySelector("#mark-delivered-button");
const detailOwnerActionState = document.querySelector("#detail-owner-action-state");
const publishSuccessView = document.querySelector("#publish-success-view");
const successItemTitle = document.querySelector("#success-item-title");
const successItemStatus = document.querySelector("#success-item-status");
const viewPublishedButton = document.querySelector("#view-published-button");
const goPostsButton = document.querySelector("#go-posts-button");
const telegramAuthCard = document.querySelector("#telegram-auth-card");
const brandHomeLink = document.querySelector("#brand-home-link");
const telegramAuthTitle = document.querySelector("#telegram-auth-title");
const telegramAuthMessage = document.querySelector("#telegram-auth-message");
const telegramAuthPrivacy = document.querySelector("#telegram-auth-privacy");
const telegramDownloadLink = document.querySelector("#telegram-download-link");
const telegramOpenLink = document.querySelector("#telegram-open-link");
const telegramUsernameHelp = document.querySelector("#telegram-username-help");
const telegramUsernameDialog = document.querySelector("#telegram-username-dialog");
const telegramUsernameDialogClose = document.querySelector("#telegram-username-dialog-close");
const telegramUsernameRetry = document.querySelector("#telegram-username-retry");
const offerForm = document.querySelector("#offer-form");
const offerImages = document.querySelector("#offer-images");
const offerPreview = document.querySelector("#offer-preview");
const offerFormState = document.querySelector("#offer-form-state");
const offerConsent = document.querySelector("#offer-consent");
const postsList = document.querySelector("#posts-list");
const postsEmptyState = document.querySelector("#posts-empty-state");
const postsEmptyTitle = document.querySelector("#posts-empty-title");
const postsEmptyCopy = document.querySelector("#posts-empty-copy");
const offerEmptyButton = document.querySelector("#offer-empty-button");
const postsTabs = [...document.querySelectorAll(".posts-tab")];
const postsActiveCount = document.querySelector("#posts-active-count");
const postsCompletedCount = document.querySelector("#posts-completed-count");
const appBackButton = document.querySelector("#app-back-button");
const appForwardButton = document.querySelector("#app-forward-button");
const themeToggle = document.querySelector("#theme-toggle");
const themeToggleIcon = document.querySelector("#theme-toggle-icon");
const navItems = [...document.querySelectorAll(".nav-item")];

const categoryIcons = {
  Hogar: ["fa-house", "⌂"],
  Infantil: ["fa-child", "☺"],
  Libros: ["fa-book-open", "▤"],
  Tecnología: ["fa-laptop", "⌘"],
  Ropa: ["fa-shirt", "◌"],
  Otros: ["fa-recycle", "♻"],
};

const themeOptions = ["system", "light", "dark"];
const themeLabels = {
  system: "sistema",
  light: "claro",
  dark: "oscuro",
};
const themeIcons = {
  system: ["fa-circle-half-stroke", "◐"],
  light: ["fa-sun", "☀"],
  dark: ["fa-moon", "☾"],
};

function setServiceState(element, label, stateName, text) {
  element.dataset.state = stateName;
  label.textContent = text;
}

function createIconElement(iconName, fallback, className = "") {
  const icon = document.createElement("i");
  icon.className = `fa-solid ${iconName} fa-icon${className ? ` ${className}` : ""}`;
  icon.dataset.fallback = fallback;
  icon.setAttribute("aria-hidden", "true");
  return icon;
}

function createCategoryIcon(category, className = "") {
  const [iconName, fallback] = categoryIcons[category] ?? categoryIcons.Otros;
  return createIconElement(iconName, fallback, className);
}

function readThemePreference() {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return themeOptions.includes(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function applyTheme(preference, persist = true) {
  const theme = themeOptions.includes(preference) ? preference : "system";
  const nextTheme = themeOptions[(themeOptions.indexOf(theme) + 1) % themeOptions.length];
  const [iconName, fallback] = themeIcons[theme];

  document.documentElement.dataset.theme = theme;
  if (themeToggle && themeToggleIcon) {
    themeToggleIcon.className = `fa-solid ${iconName} fa-icon`;
    themeToggleIcon.dataset.fallback = fallback;
    themeToggle.title = `Tema ${themeLabels[theme]}. Cambiar a ${themeLabels[nextTheme]}`;
    themeToggle.setAttribute("aria-label", themeToggle.title);
  }

  if (persist) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // El tema sigue aplicado durante esta sesión aunque el almacenamiento esté bloqueado.
    }
  }
}

function getHistoryIndex(historyState = window.history.state) {
  return Number.isInteger(historyState?.svIndex) ? historyState.svIndex : 0;
}

function updateNavigationControls() {
  const currentIndex = getHistoryIndex();
  const canGoBack = Boolean(window.history.state?.svApp && currentIndex > 0);
  const canGoForward = Boolean(window.history.state?.svApp && currentIndex < state.historyMaxIndex);

  appBackButton.disabled = !canGoBack;
  appForwardButton.disabled = !canGoForward;

  const telegramBackButton = window.Telegram?.WebApp?.BackButton;
  if (telegramBackButton) {
    if (canGoBack && typeof telegramBackButton.show === "function") {
      telegramBackButton.show();
    } else if (!canGoBack && typeof telegramBackButton.hide === "function") {
      telegramBackButton.hide();
    }
  }
}

function pushViewHistory(viewName, itemId = "") {
  const currentState = window.history.state ?? {};
  const nextIndex = getHistoryIndex(currentState) + 1;
  const url = new URL(window.location.href);
  url.hash = itemId ? `item=${encodeURIComponent(itemId)}` : "";

  window.history.pushState({
    ...currentState,
    svApp: true,
    svView: viewName,
    svItemId: itemId || null,
    svIndex: nextIndex,
  }, "", url);
  state.historyMaxIndex = nextIndex;
}

function goBack() {
  if (window.history.state?.svApp && getHistoryIndex() > 0) {
    window.history.back();
    return;
  }

  if (state.currentView !== "explore") {
    setView("explore");
  }
}

function goForward() {
  if (window.history.state?.svApp && getHistoryIndex() < state.historyMaxIndex) {
    window.history.forward();
  }
}

function prepareHistoryState() {
  const currentState = window.history.state ?? {};
  let itemId = "";
  if (window.location.hash.startsWith("#item=")) {
    try {
      itemId = decodeURIComponent(window.location.hash.slice("#item=".length));
    } catch {
      itemId = "";
    }
  }
  const view = itemId ? "detail" : "explore";
  const index = getHistoryIndex(currentState);

  if (itemId && !currentState.svApp) {
    const rootUrl = new URL(window.location.href);
    rootUrl.hash = "";
    window.history.replaceState({
      ...currentState,
      svApp: true,
      svView: "explore",
      svItemId: null,
      svIndex: 0,
    }, "", rootUrl);
    state.currentView = "explore";
    state.currentItemId = "";
    state.historyMaxIndex = 0;
    pushViewHistory("detail", itemId);
    state.currentView = "detail";
    state.currentItemId = itemId;
    updateNavigationControls();
    return;
  }

  window.history.replaceState({
    ...currentState,
    svApp: true,
    svView: view,
    svItemId: itemId || null,
    svIndex: index,
  }, "", window.location.href);
  state.currentView = view;
  state.currentItemId = itemId;
  state.historyMaxIndex = index;
  updateNavigationControls();
}

function formatDate(value) {
  if (!value) return "";

  const normalized = value.includes(" ") ? value.replace(" ", "T") : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(date).replace(" de ", " ");
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function configureDeliveryButton(button, status) {
  const completed = status === "completed";
  const actionLabel = completed ? "Volver a publicar" : "Marcar como entregado";
  const actionIcon = completed ? "fa-rotate-left" : "fa-check";
  const fallback = completed ? "↶" : "✓";

  button.classList.toggle("secondary-button--complete", !completed);
  button.classList.toggle("secondary-button--reopen", completed);
  button.setAttribute("aria-label", actionLabel);

  button.replaceChildren(createIconElement(actionIcon, fallback), document.createTextNode(actionLabel));
}

function normalizeTelegramUsername(value) {
  const username = String(value ?? "").trim().replace(/^@/, "");
  return /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(username) ? username : "";
}

function readOwnItems() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(OWN_ITEMS_STORAGE_KEY) ?? "[]");
    return Array.isArray(stored) ? stored.filter((item) => item?.id) : [];
  } catch {
    return [];
  }
}

function saveOwnItems() {
  try {
    window.localStorage.setItem(OWN_ITEMS_STORAGE_KEY, JSON.stringify(state.myItems));
  } catch {
    // La lista sigue disponible durante esta sesión aunque el almacenamiento esté bloqueado.
  }
}

function rememberOwnItem(item) {
  if (!item?.id) return;

  const index = state.myItems.findIndex((candidate) => candidate.id === item.id);
  if (index >= 0) {
    state.myItems[index] = { ...state.myItems[index], ...item };
  } else {
    state.myItems.unshift(item);
  }

  saveOwnItems();
  renderMyItems();
}

function isOwnItem(item) {
  if (!item?.id) return false;

  const authenticatedTelegramId = String(
    state.telegramUser?.telegram_id ?? state.telegramUser?.id ?? "",
  ).trim();
  const isVerified = Boolean(
    authenticatedTelegramId &&
    state.telegramUser?.valid === true &&
    auth?.hasInitData(),
  );
  if (!isVerified) return false;

  const ownerTelegramId = String(item.ownerTelegramId ?? "").trim();
  if (ownerTelegramId) return ownerTelegramId === authenticatedTelegramId;

  const currentUsername = normalizeTelegramUsername(state.telegramUser?.username);
  return Boolean(currentUsername && currentUsername === normalizeTelegramUsername(item.ownerUsername));
}

function getItemStatusLabel(item) {
  if (item?.status === "completed") return "Entregado";
  if (item?.expiresAt) return `Disponible hasta ${formatDate(item.expiresAt)}`;
  return "Disponible ahora";
}

function getItemUrl(item) {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = `item=${encodeURIComponent(item.id)}`;
  return url.toString();
}

function getInterestMessage(item) {
  return `Hola, he visto que has publicado «${item.title}» en SegundaVida y estoy interesado/a en él.\n\n${getItemUrl(item)}`;
}

function createItemCard(item, index) {
  const card = document.createElement("article");
  card.className = "item-card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Ver ${item.title}`);
  card.style.animationDelay = `${Math.min(index * 60, 240)}ms`;
  card.dataset.itemId = item.id;

  if (item.imageUrl) {
    const image = document.createElement("img");
    image.className = "item-card__media";
    image.src = item.imageUrl;
    image.alt = item.title;
    image.loading = "lazy";
    card.append(image);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "item-card__placeholder";
    placeholder.append(createCategoryIcon(item.category));
    placeholder.setAttribute("aria-hidden", "true");
    card.append(placeholder);
  }

  const body = document.createElement("div");
  body.className = "item-card__body";
  body.append(createTextElement("h3", "item-card__title", item.title));

  const meta = document.createElement("div");
  meta.className = "item-card__meta";
  const category = document.createElement("span");
  category.className = "item-card__category";
  category.append(createCategoryIcon(item.category), document.createTextNode(` ${item.category}`));
  meta.append(category);

  if (item.zone) {
    const zone = document.createElement("span");
    zone.className = "item-card__zone";
    zone.append(createIconElement("fa-location-dot", "⌖"), document.createTextNode(` ${item.zone}`));
    meta.append(zone);
  }
  const availability = document.createElement("span");
  availability.className = "availability";
  availability.append(createTextElement("span", "availability__label", item.expiresAt ? "Hasta" : "Disponible"));
  if (item.expiresAt) {
    availability.append(createTextElement("span", "availability__date", formatDate(item.expiresAt)));
  }
  meta.append(availability);
  body.append(meta);

  card.append(body);
  card.addEventListener("click", () => showDetail(item));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      showDetail(item);
    }
  });
  return card;
}

function createOwnedItemCard(item) {
  const card = document.createElement("article");
  card.className = "owned-item-card";

  const heading = document.createElement("div");
  heading.className = "owned-item-card__heading";
  heading.append(createTextElement("h2", "owned-item-card__title", item.title));
  heading.append(createTextElement("span", `owned-item-card__status ${item.status === "completed" ? "is-completed" : ""}`, getItemStatusLabel(item)));
  card.append(heading);

  const meta = document.createElement("p");
  meta.className = "owned-item-card__meta";
  meta.textContent = `${item.category} · ${item.zone}`;
  card.append(meta);

  const actions = document.createElement("div");
  actions.className = "owned-item-card__actions";

  const viewButton = document.createElement("button");
  viewButton.className = "text-button";
  viewButton.type = "button";
  viewButton.textContent = "Ver publicación";
  viewButton.addEventListener("click", () => showDetail(item));
  actions.append(viewButton);

  const deliveredButton = document.createElement("button");
  deliveredButton.className = "secondary-button secondary-button--compact delivery-action-button";
  deliveredButton.type = "button";
  configureDeliveryButton(deliveredButton, item.status);
  const actionState = createTextElement("p", "owned-item-card__state", "");
  deliveredButton.addEventListener("click", () => completeItem(item, deliveredButton, actionState));
  actions.append(deliveredButton);
  card.append(actions);
  card.append(actionState);

  return card;
}

function renderMyItems() {
  const catalogOwnedItems = state.items.filter(isOwnItem);
  let changed = false;
  catalogOwnedItems.forEach((item) => {
    const index = state.myItems.findIndex((candidate) => candidate.id === item.id);
    if (index >= 0) {
      state.myItems[index] = { ...state.myItems[index], ...item };
      changed = true;
    }
  });
  if (changed) saveOwnItems();

  const items = state.myItems.filter(isOwnItem);
  const activeItems = items.filter((item) => item.status !== "completed");
  const completedItems = items.filter((item) => item.status === "completed");
  const visibleItems = state.postsFilter === "completed" ? completedItems : activeItems;

  postsActiveCount.textContent = String(activeItems.length);
  postsCompletedCount.textContent = String(completedItems.length);
  postsTabs.forEach((tab) => {
    const selected = tab.dataset.postsFilter === state.postsFilter;
    tab.classList.toggle("is-active", selected);
    tab.setAttribute("aria-selected", String(selected));
  });

  postsList.replaceChildren(...visibleItems.map(createOwnedItemCard));
  postsEmptyState.hidden = visibleItems.length > 0;
  offerEmptyButton.hidden = state.postsFilter !== "active" || visibleItems.length > 0;
  postsEmptyTitle.textContent = state.postsFilter === "completed"
    ? "Aún no has entregado publicaciones"
    : "Aún no tienes publicaciones activas";
  postsEmptyCopy.textContent = state.postsFilter === "completed"
    ? "Cuando marques una publicación como entregada, aparecerá aquí."
    : "Cuando ofrezcas algo, aparecerá en esta sección.";
}

function renderDetail(item) {
  state.selectedItem = item;
  detailMedia.replaceChildren();

  if (item.imageUrl) {
    const image = document.createElement("img");
    image.className = "detail-media__image";
    image.src = item.imageUrl;
    image.alt = item.title;
    detailMedia.append(image);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "detail-media__placeholder";
    placeholder.append(createCategoryIcon(item.category));
    placeholder.setAttribute("aria-hidden", "true");
    detailMedia.append(placeholder);
  }

  detailAvailability.textContent = item.status === "completed"
    ? "Entregado"
    : item.expiresAt
      ? `Disponible hasta ${formatDate(item.expiresAt)}`
      : "Disponible";
  detailTitle.textContent = item.title;
  detailCategory.replaceChildren(createCategoryIcon(item.category), document.createTextNode(` ${item.category}`));
  detailDescription.textContent = item.description || "";
  detailDescription.hidden = !item.description;
  detailZone.textContent = item.zone || "Valladolid";
  detailOwner.textContent = item.ownerDisplayName || "Vecindad";
  const ownItem = isOwnItem(item);
  const ownerUsername = normalizeTelegramUsername(item.ownerUsername);
  interestButton.hidden = ownItem;
  interestButton.disabled = ownItem || !ownerUsername;
  interestButton.textContent = "Me interesa";
  interestButton.setAttribute(
    "aria-label",
    ownerUsername
      ? `Contactar con ${item.ownerDisplayName || "el vecino o la vecina"} por Telegram`
      : "Mostrar interés por este objeto",
  );
  detailActionState.textContent = ownItem
    ? "Gestiona el estado de tu publicación desde aquí."
    : ownerUsername
    ? "Se abrirá el chat de Telegram de quien lo ofrece."
    : "Este vecino o vecina no tiene un nombre de usuario público para recibir contactos.";
  detailActionState.dataset.state = ownItem || ownerUsername ? "" : "error";

  detailOwnerActions.hidden = !ownItem;
  markDeliveredButton.disabled = false;
  configureDeliveryButton(markDeliveredButton, item.status);
  detailOwnerActionState.textContent = item.status === "completed"
    ? "Si vuelve a estar disponible, puedes reactivar esta publicación."
    : "Cuando se lo entregues a otra persona, márcalo aquí.";
  detailOwnerActionState.dataset.state = "";
}

function showDetail(item, { syncHistory = true } = {}) {
  renderDetail(item);
  setView("detail", { syncHistory, itemId: item.id });
  window.SecondaVidaAnalytics?.trackEvent("catalog", "open-item", item.id);
}

function setView(viewName, { syncHistory = true, itemId = "" } = {}) {
  const shouldPushHistory = syncHistory && (
    state.currentView !== viewName ||
    (viewName === "detail" && state.currentItemId !== itemId)
  );
  if (shouldPushHistory) pushViewHistory(viewName, itemId);

  state.currentView = viewName;
  state.currentItemId = itemId || "";
  const isExplore = viewName === "explore";
  const isOffer = viewName === "offer";
  const isPosts = viewName === "posts";
  const isDetail = viewName === "detail";
  const isSuccess = viewName === "publish-success";

  catalogIntro.hidden = !isExplore;
  catalogTools.hidden = !isExplore;
  catalogSection.hidden = !isExplore;
  offerView.hidden = !isOffer;
  postsView.hidden = !isPosts;
  detailView.hidden = !isDetail;
  publishSuccessView.hidden = !isSuccess;
  detailShare.hidden = !isDetail;

  if (isOffer) configureOfferAuth();
  if (isPosts) renderMyItems();

  if (!isDetail && window.location.hash.startsWith("#item=")) {
    const url = new URL(window.location.href);
    url.hash = "";
    window.history.replaceState({
      ...window.history.state,
      svView: viewName,
      svItemId: null,
    }, "", url);
  }

  navItems.forEach((button) => {
    const selected = button.dataset.view === viewName;
    button.toggleAttribute("aria-current", selected);
    if (!selected) button.removeAttribute("aria-current");
  });

  window.SecondaVidaAnalytics?.trackPageView(`#${viewName}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
  updateNavigationControls();
}

function renderCategories() {
  categoryFilters.replaceChildren();
  const categories = ["Todo", ...new Set(state.items.map((item) => item.category))];

  categories.forEach((category) => {
    const button = document.createElement("button");
    button.className = "filter-chip";
    button.type = "button";
    button.role = "tab";
    button.setAttribute("aria-selected", String(state.category === category));
    button.textContent = category;
    button.addEventListener("click", () => {
      state.category = category;
      renderCategories();
      renderItems();
    });
    categoryFilters.append(button);
  });
}

function renderItems() {
  const query = state.query.trim().toLocaleLowerCase("es");
  const visibleItems = state.items.filter((item) => {
    const matchesCategory = state.category === "Todo" || item.category === state.category;
    const searchableText = `${item.title} ${item.description} ${item.category} ${item.zone}`
      .toLocaleLowerCase("es");
    return matchesCategory && (!query || searchableText.includes(query));
  });

  itemsCount.textContent = `${visibleItems.length} ${visibleItems.length === 1 ? "cosa" : "cosas"}`;
  itemsGrid.replaceChildren(...visibleItems.map(createItemCard));

  if (visibleItems.length > 0) {
    itemsState.textContent = "";
    itemsState.dataset.state = "";
    return;
  }

  itemsState.textContent = state.items.length > 0
    ? "No encontramos objetos con esa búsqueda."
    : "Todavía no hay objetos disponibles. Cuando alguien publique algo, aparecerá aquí.";
}

function isNotExpired(item) {
  if (!item.expiresAt) return true;

  const normalized = item.expiresAt.includes(" ")
    ? item.expiresAt.replace(" ", "T")
    : item.expiresAt;
  const expiresAt = new Date(normalized);
  return Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() >= Date.now();
}

async function loadCatalog() {
  if (!api?.isDataConfigured) {
    setServiceState(n8nStatus, n8nStatusLabel, "error", "No configurado");
    itemsState.textContent = "El catálogo todavía no está configurado.";
    itemsState.dataset.state = "error";
    return;
  }

  n8nStatusLabel.textContent = "Comprobando...";

  try {
    const records = await api.listItems();
    setServiceState(n8nStatus, n8nStatusLabel, "connected", "Conectado ✓");
    state.items = records.filter((item) => item.status === "available" && isNotExpired(item));
    renderCategories();
    renderItems();
    renderMyItems();
    openItemFromHash();
  } catch {
    setServiceState(n8nStatus, n8nStatusLabel, "error", "No disponible");
    itemsState.textContent = "No hemos podido cargar los objetos. Inténtalo de nuevo en unos instantes.";
    itemsState.dataset.state = "error";
    itemsCount.textContent = "Sin datos";
  }
}

async function loadMineItems() {
  if (!auth?.hasInitData() || !api?.isMineConfigured || typeof api.listMineItems !== "function") {
    return null;
  }

  try {
    const records = await api.listMineItems(auth.getInitData());
    const mineById = new Map(records.map((item) => [item.id, item]));

    state.items = [
      ...state.items.filter((item) => !mineById.has(item.id)),
      ...records.filter((item) => item.status === "available" && isNotExpired(item)),
    ];
    state.myItems = records.filter(isOwnItem);
    saveOwnItems();
    renderCategories();
    renderItems();
    renderMyItems();
    openItemFromHash();
    return records;
  } catch {
    // Conservamos la copia local si el endpoint privado aún no está disponible.
    return null;
  }
}

function openItemFromHash() {
  if (!window.location.hash.startsWith("#item=")) return;

  let itemId = "";
  try {
    itemId = decodeURIComponent(window.location.hash.slice("#item=".length));
  } catch {
    return;
  }

  const item = state.items.find((candidate) => candidate.id === itemId)
    ?? state.myItems.find((candidate) => candidate.id === itemId && isOwnItem(candidate));
  if (item) showDetail(item, { syncHistory: false });
}

function handleHistoryChange(event) {
  const nextState = event.state;
  const nextView = nextState?.svApp ? nextState.svView : "explore";
  const nextItemId = nextState?.svApp ? nextState.svItemId : "";

  if (nextView === "detail" && nextItemId) {
    const item = state.items.find((candidate) => candidate.id === nextItemId)
      ?? state.myItems.find((candidate) => candidate.id === nextItemId && isOwnItem(candidate));
    if (item) {
      showDetail(item, { syncHistory: false });
      return;
    }
  }

  setView(nextView, { syncHistory: false, itemId: nextItemId });
}

async function checkIdentity() {
  if (!auth?.hasInitData()) {
    return;
  }

  setServiceState(identityStatus, identityStatusLabel, "checking", "Comprobando...");

  try {
    const result = await auth.whoAmI();

    if (result.valid) {
      state.telegramUser = result;
      configureOfferAuth(result);
      renderMyItems();
      await loadMineItems();
      openItemFromHash();
      const firstName = result.first_name ? `Hola ${result.first_name}` : "Telegram";
      identityStatus.querySelector("span:nth-child(2)").textContent = firstName;
      setServiceState(identityStatus, identityStatusLabel, "connected", "Verificada ✓");
      return;
    }

    state.telegramUser = null;
    configureOfferAuth();
    setServiceState(identityStatus, identityStatusLabel, "error", "No verificada");
  } catch {
    state.telegramUser = null;
    configureOfferAuth();
    setServiceState(identityStatus, identityStatusLabel, "error", "No disponible");
  }
}

function setOfferFormEnabled(enabled) {
  offerForm.hidden = !enabled;
  offerForm.dataset.auth = enabled ? "connected" : "locked";
  offerForm.querySelectorAll("input, select, textarea, button").forEach((control) => {
    control.disabled = !enabled;
  });
}

function configureOfferAuth(user = state.telegramUser) {
  if (!telegramAuthCard || !offerForm) return;

  const miniAppUrl = telegramRuntime.miniAppUrl || "https://t.me/pucelobot?startapp=segundavida";
  telegramOpenLink.href = miniAppUrl;
  const verified = Boolean(auth?.hasInitData() && user?.valid);
  const username = normalizeTelegramUsername(user?.username);

  telegramAuthCard.dataset.state = verified && username ? "connected" : verified ? "warning" : "error";
  telegramAuthTitle.textContent = verified && username
    ? `Publicar como @${username}`
    : verified
      ? "Necesitas un nombre de usuario público"
      : "Publica desde Telegram";
  telegramDownloadLink.hidden = verified;
  telegramOpenLink.hidden = verified;
  telegramAuthPrivacy.hidden = !verified || !username;
  telegramUsernameHelp.hidden = !verified || Boolean(username);

  if (verified) {
    if (username) {
      telegramAuthMessage.textContent = "";
      telegramAuthMessage.hidden = true;
      setOfferFormEnabled(true);
    } else {
      telegramAuthMessage.textContent = "Configúralo en Telegram para publicar y recibir contactos.";
      telegramAuthMessage.hidden = false;
      setOfferFormEnabled(false);
    }
    return;
  }

  telegramAuthMessage.textContent = "Abre esta aplicación dentro de Telegram para continuar.";
  telegramAuthMessage.hidden = false;
  setOfferFormEnabled(false);
}

function openTelegramUsernameDialog() {
  if (typeof telegramUsernameDialog.showModal === "function") {
    telegramUsernameDialog.showModal();
    return;
  }

  telegramUsernameDialog.setAttribute("open", "");
}

function closeTelegramUsernameDialog() {
  if (typeof telegramUsernameDialog.close === "function") {
    telegramUsernameDialog.close();
    return;
  }

  telegramUsernameDialog.removeAttribute("open");
}

function retryTelegramUsername() {
  closeTelegramUsernameDialog();
  window.location.reload();
}

function setFormState(message, stateName = "") {
  offerFormState.textContent = message;
  offerFormState.dataset.state = stateName;
}

function renderPhotoPreview(files) {
  offerPreview.replaceChildren();

  files.forEach((file) => {
    const preview = document.createElement("div");
    preview.className = "photo-preview__item";
    const image = document.createElement("img");
    image.src = URL.createObjectURL(file);
    image.alt = file.name;
    preview.append(image);
    offerPreview.append(preview);
  });
}

function handlePhotoSelection(event) {
  const files = [...event.target.files];
  const validFiles = files.filter((file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024);

  state.offerFiles = validFiles.slice(0, MAX_OFFER_PHOTOS);
  renderPhotoPreview(state.offerFiles);

  if (files.length > MAX_OFFER_PHOTOS) {
    setFormState(`Puedes añadir hasta ${MAX_OFFER_PHOTOS} fotos.`, "error");
    return;
  }

  if (validFiles.length !== files.length) {
    setFormState("Cada foto debe ser JPG, PNG o WebP y pesar menos de 5 MB.", "error");
    return;
  }

  setFormState("");
}

async function handleOfferSubmit(event) {
  event.preventDefault();

  if (!offerForm.reportValidity()) {
    setFormState("Revisa los campos obligatorios.", "error");
    return;
  }

  if (!auth?.hasInitData()) {
    setFormState("Abre la mini app desde Telegram para poder publicar.", "error");
    return;
  }

  if (!offerConsent.checked) {
    setFormState("Debes aceptar las condiciones para publicar.", "error");
    return;
  }

  if (!api?.isPublishConfigured || typeof api.publishItem !== "function") {
    setFormState("El endpoint seguro de publicación todavía no está configurado.", "error");
    return;
  }

  const formData = new FormData(offerForm);
  const draftItem = {
    title: String(formData.get("title") ?? "").trim(),
    category: String(formData.get("category") ?? ""),
    zone: String(formData.get("zone") ?? ""),
    description: String(formData.get("description") ?? "").trim(),
    duration_days: Number(formData.get("duration") ?? 14),
  };
  const payload = {
    initData: auth.getInitData(),
    item: draftItem,
    consent: {
      accepted: offerConsent.checked,
      version: CONSENT_VERSION,
    },
  };

  setFormState("Publicando…", "pending");

  try {
    const result = await api.publishItem(payload);

    if (!result.ok || !result.item_id) {
      setFormState(result.error ?? "No se ha podido publicar.", "error");
      return;
    }

    const expiresAt = new Date(Date.now() + draftItem.duration_days * 24 * 60 * 60 * 1000).toISOString();
    const publishedItem = {
      id: result.item_id,
      title: result.title || draftItem.title,
      description: draftItem.description,
      category: draftItem.category,
      zone: draftItem.zone,
      status: result.status || "available",
      expiresAt,
      ownerDisplayName: state.telegramUser?.first_name || "Tú",
      ownerUsername: state.telegramUser?.username || "",
      ownerTelegramId: String(state.telegramUser?.telegram_id ?? state.telegramUser?.id ?? ""),
      imageUrl: null,
      interestCount: 0,
    };

    rememberOwnItem(publishedItem);
    offerForm.reset();
    state.offerFiles = [];
    offerPreview.replaceChildren();
    await loadCatalog();
    const catalogItem = state.items.find((item) => item.id === publishedItem.id);
    const finalItem = catalogItem ? { ...publishedItem, ...catalogItem } : publishedItem;
    rememberOwnItem(finalItem);
    showPublishSuccess(finalItem);
  } catch (error) {
    setFormState(error.message || "No se ha podido publicar.", "error");
  }
}

function showPublishSuccess(item) {
  successItemTitle.textContent = item.title;
  successItemStatus.textContent = getItemStatusLabel(item);
  setView("publish-success");
}

async function completeItem(item, triggerButton = markDeliveredButton, feedbackElement = detailOwnerActionState) {
  if (!item?.id) return;

  if (!auth?.hasInitData()) {
    feedbackElement.textContent = "Abre la Mini App desde Telegram para gestionar esta publicación.";
    feedbackElement.dataset.state = "error";
    return;
  }

  if (!api?.isCompleteConfigured || typeof api.completeItem !== "function") {
    feedbackElement.textContent = "La opción de marcar entregado todavía no está conectada en n8n.";
    feedbackElement.dataset.state = "error";
    return;
  }

  triggerButton.disabled = true;
  triggerButton.textContent = "Guardando…";

  try {
    const result = await api.completeItem({
      initData: auth.getInitData(),
      item_id: item.id,
      action: item.status === "completed" ? "reopen" : "complete",
    });

    if (!result.ok) {
      throw new Error(result.error || "No se ha podido actualizar la publicación.");
    }

    const mineItems = await loadMineItems();
    const syncedItem = mineItems?.find((candidate) => candidate.id === item.id) ?? null;
    const nextStatus = syncedItem?.status
      || result.status
      || (item.status === "completed" ? "available" : "completed");
    const updatedItem = {
      ...item,
      ...(syncedItem ?? {}),
      status: nextStatus,
      expiresAt: result.expires_at ?? item.expiresAt ?? null,
      completedAt: nextStatus === "completed"
        ? syncedItem?.completedAt || result.completed_at || new Date().toISOString()
        : null,
    };
    rememberOwnItem(updatedItem);
    state.items = nextStatus === "available"
      ? [...state.items.filter((candidate) => candidate.id !== item.id), updatedItem]
      : state.items.filter((candidate) => candidate.id !== item.id);
    renderItems();
    renderMyItems();
    renderDetail(updatedItem);
  } catch (error) {
    triggerButton.disabled = false;
    configureDeliveryButton(triggerButton, item.status);
    feedbackElement.textContent = error.message || "No se ha podido actualizar la publicación.";
    feedbackElement.dataset.state = "error";
  }
}

function showInterestFeedback(url, opened) {
  detailActionState.replaceChildren();
  detailActionState.append(document.createTextNode(
    opened ? "Hemos abierto el chat de Telegram. " : "Abre el chat de Telegram para contactar. ",
  ));

  const link = document.createElement("a");
  link.className = "inline-action-link";
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = opened ? "Abrir chat de nuevo" : "Abrir chat";
  detailActionState.append(link);
  detailActionState.dataset.state = "connected";
}

function handleInterest() {
  const item = state.selectedItem;
  if (!item || isOwnItem(item)) return;

  const username = normalizeTelegramUsername(state.selectedItem?.ownerUsername);
  if (!username) {
    detailActionState.textContent = "Este vecino o vecina no tiene un nombre de usuario público para recibir contactos.";
    detailActionState.dataset.state = "error";
    return;
  }

  const telegramUrl = `https://t.me/${username}?text=${encodeURIComponent(getInterestMessage(item))}`;
  const webApp = window.Telegram?.WebApp;
  let opened = false;

  if (typeof webApp?.openTelegramLink === "function") {
    try {
      webApp.openTelegramLink(telegramUrl);
      opened = true;
    } catch {
      opened = false;
    }
  } else {
    opened = Boolean(window.open(telegramUrl, "_blank", "noopener,noreferrer"));
  }

  showInterestFeedback(telegramUrl, opened);
}

async function shareSelectedItem() {
  if (!state.selectedItem) return;

  const itemUrl = getItemUrl(state.selectedItem);
  const shareData = {
    title: state.selectedItem.title,
    text: `${state.selectedItem.title} · SegundaVida`,
    url: itemUrl,
  };

  try {
    const webApp = window.Telegram?.WebApp;
    if (telegramRuntime.isTelegram && typeof webApp?.openTelegramLink === "function") {
      const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(itemUrl)}&text=${encodeURIComponent(shareData.text)}`;
      webApp.openTelegramLink(telegramShareUrl);
      detailActionState.textContent = "Elige dónde compartir la publicación.";
      detailActionState.dataset.state = "connected";
      return;
    }

    if (typeof navigator.share === "function") {
      await navigator.share(shareData);
      return;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(itemUrl);
      detailActionState.textContent = "Enlace copiado.";
      detailActionState.dataset.state = "connected";
      return;
    }

    throw new Error("share_unavailable");
  } catch {
    detailActionState.textContent = "No se ha podido compartir ahora.";
    detailActionState.dataset.state = "error";
  }
}

if (telegramRuntime.isTelegram) {
  runtimeName.textContent = "Telegram";
  telegramSdkState.textContent = telegramRuntime.sdkAvailable
    ? " · SDK disponible ✓"
    : " · SDK no disponible";
  telegramSdkState.hidden = false;
  setServiceState(telegramStatus, telegramStatusLabel, "connected", "Conectado ✓");
}

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderItems();
});

navItems.forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const currentTheme = readThemePreference();
    const nextTheme = themeOptions[(themeOptions.indexOf(currentTheme) + 1) % themeOptions.length];
    applyTheme(nextTheme);
  });
}

applyTheme(readThemePreference(), false);

offerEmptyButton.addEventListener("click", () => setView("offer"));
detailShare.addEventListener("click", shareSelectedItem);
interestButton.addEventListener("click", handleInterest);
markDeliveredButton.addEventListener("click", () => completeItem(state.selectedItem));
offerImages.addEventListener("change", handlePhotoSelection);
offerForm.addEventListener("submit", handleOfferSubmit);
telegramUsernameHelp.addEventListener("click", openTelegramUsernameDialog);
telegramUsernameDialogClose.addEventListener("click", closeTelegramUsernameDialog);
telegramUsernameRetry.addEventListener("click", retryTelegramUsername);
viewPublishedButton.addEventListener("click", () => {
  const item = state.myItems[0];
  if (item) showDetail(item);
});
goPostsButton.addEventListener("click", () => setView("posts"));
postsTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    state.postsFilter = tab.dataset.postsFilter;
    renderMyItems();
  });
});
appBackButton.addEventListener("click", goBack);
appForwardButton.addEventListener("click", goForward);
brandHomeLink.addEventListener("click", (event) => {
  event.preventDefault();
  setView("explore");
});
window.addEventListener("popstate", handleHistoryChange);

const telegramBackButton = window.Telegram?.WebApp?.BackButton;
if (telegramBackButton && typeof telegramBackButton.onClick === "function") {
  telegramBackButton.onClick(goBack);
}

state.myItems = readOwnItems();
prepareHistoryState();
window.SecondaVidaAnalytics?.trackPageView();
configureOfferAuth();
checkIdentity();
loadCatalog();
