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
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_OPTIMIZE_THRESHOLD = 1.5 * 1024 * 1024;
const PHOTO_MAX_EDGE = 1280;
const PHOTO_JPEG_QUALITY = 0.74;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const OWN_ITEMS_STORAGE_KEY = "segundavida:my-items:v1";
const THEME_STORAGE_KEY = "segundavida:theme:v1";
const state = {
  items: [],
  category: "Todo",
  query: "",
  selectedItem: null,
  offerFiles: [],
  photoPreviewUrls: [],
  telegramUser: null,
  myItems: [],
  postsFilter: "active",
  currentView: "explore",
  currentItemId: "",
  historyMaxIndex: 0,
  staticItem: null,
  selectedItemLive: false,
};

let photoLightboxUrls = [];
let photoLightboxIndex = 0;
let photoLightboxReturnFocus = null;

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
const photoLightbox = document.querySelector("#photo-lightbox");
const photoLightboxTitle = document.querySelector("#photo-lightbox-title");
const photoLightboxCounter = document.querySelector("#photo-lightbox-counter");
const photoLightboxImage = document.querySelector("#photo-lightbox-image");
const photoLightboxThumbs = document.querySelector("#photo-lightbox-thumbs");
const photoLightboxClose = document.querySelector("#photo-lightbox-close");
const photoLightboxPrevious = document.querySelector("#photo-lightbox-previous");
const photoLightboxNext = document.querySelector("#photo-lightbox-next");
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
const offerSubmitButton = offerForm?.querySelector('button[type="submit"]');
const offerSubmitLabel = offerSubmitButton?.textContent?.trim() || "Publicar";
const offerImages = document.querySelector("#offer-images");
const offerPreview = document.querySelector("#offer-preview");
const offerFormState = document.querySelector("#offer-form-state");
const offerConsent = document.querySelector("#offer-consent");
const postsContent = document.querySelector("#posts-content");
const postsAuthGate = document.querySelector("#posts-auth-gate");
const postsOpenTelegramLink = document.querySelector("#posts-open-telegram-link");
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
  Muebles: ["fa-couch", "▰"],
  Electrodomésticos: ["fa-blender", "▣"],
  Infantil: ["fa-child", "☺"],
  Ropa: ["fa-shirt", "◌"],
  Libros: ["fa-book-open", "▤"],
  "Música y cine": ["fa-music", "♫"],
  Tecnología: ["fa-laptop", "⌘"],
  "Móviles y telefonía": ["fa-mobile-screen-button", "▯"],
  Informática: ["fa-computer", "▣"],
  "Deportes y ocio": ["fa-futbol", "⚽"],
  Bicicletas: ["fa-bicycle", "♢"],
  "Juegos y videojuegos": ["fa-gamepad", "◉"],
  "Manualidades y coleccionismo": ["fa-palette", "✦"],
  "Jardín y bricolaje": ["fa-seedling", "❧"],
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
  url.search = "";
  url.hash = "";
  url.pathname = itemId
    ? `/i/${encodeURIComponent(itemId)}/`
    : "/";

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

function getRouteItemId() {
  const path = window.location.pathname.replace(/\/+$/, "");
  const modernMatch = path.match(/\/i\/([^/]+)$/);
  if (modernMatch) return decodeRoutePart(modernMatch[1]);

  const legacyPathMatch = path.match(/\/objetos\/([^/]+)$/);
  if (legacyPathMatch) return decodeRoutePart(legacyPathMatch[1]);

  if (window.location.hash.startsWith("#item=")) {
    return decodeRoutePart(window.location.hash.slice("#item=".length));
  }

  return "";
}

function decodeRoutePart(value) {
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return "";
  }
}

function getStaticItem() {
  const dataElement = document.querySelector("#static-item-data");
  if (!dataElement) return null;

  try {
    const parsed = JSON.parse(dataElement.textContent || "{}");
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function prepareHistoryState() {
  const currentState = window.history.state ?? {};
  const itemId = getRouteItemId();
  const view = itemId ? "detail" : "explore";
  const index = getHistoryIndex(currentState);

  const canonicalUrl = new URL(window.location.href);
  if (itemId) {
    canonicalUrl.pathname = `/i/${encodeURIComponent(itemId)}/`;
    canonicalUrl.search = "";
    canonicalUrl.hash = "";
  }

  window.history.replaceState({
    ...currentState,
    svApp: true,
    svView: view,
    svItemId: itemId || null,
    svIndex: index,
  }, "", canonicalUrl);
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
  if (item?.status === "expired") return "Ya no disponible";
  if (item?.expiresAt) return `Disponible hasta ${formatDate(item.expiresAt)}`;
  return "Disponible ahora";
}

function getItemUrl(item) {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.pathname = `/i/${encodeURIComponent(item.id)}/`;
  return url.toString();
}

function getInterestMessage(item) {
  return `Hola, he visto que has publicado «${item.title}» en SegundaVida y estoy interesado/a.\n\n${getItemUrl(item)}`;
}

function createItemCard(item, index) {
  const card = document.createElement("article");
  card.className = "item-card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Ver ${item.title}`);
  card.style.animationDelay = `${Math.min(index * 60, 240)}ms`;
  card.dataset.itemId = item.id;

  if (getItemImageUrls(item).length) {
    card.append(createPhotoCarousel(item, {
      className: "photo-carousel--card",
      openLightbox: false,
    }));
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
  availability.textContent = item.expiresAt ? `Hasta ${formatDate(item.expiresAt)}` : "Disponible";
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

function createPhotoCarousel(item, { className = "", openLightbox = true } = {}) {
  const urls = getItemImageUrls(item);
  const carousel = document.createElement("div");
  carousel.className = `photo-carousel${className ? ` ${className}` : ""}`;
  carousel.setAttribute("role", "group");
  carousel.setAttribute("aria-label", urls.length > 1 ? `${urls.length} fotos` : "Foto");

  const viewport = document.createElement("div");
  viewport.className = "photo-carousel__viewport";
  const track = document.createElement("div");
  track.className = "photo-carousel__track";

  let currentIndex = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let swipeHappened = false;
  let swipeResetTimer = null;

  const counter = document.createElement("span");
  counter.className = "photo-carousel__counter";
  counter.setAttribute("aria-live", "polite");

  const indicators = document.createElement("div");
  indicators.className = "photo-carousel__indicators";
  indicators.setAttribute("aria-label", "Seleccionar foto");

  const indicatorButtons = urls.map((url, index) => {
    const indicator = document.createElement("button");
    indicator.className = "photo-carousel__indicator";
    indicator.type = "button";
    indicator.setAttribute("aria-label", `Ver foto ${index + 1}`);
    indicator.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setIndex(index);
    });
    indicators.append(indicator);
    return indicator;
  });

  const setIndex = (nextIndex) => {
    currentIndex = (nextIndex + urls.length) % urls.length;
    track.style.transform = `translate3d(-${currentIndex * 100}%, 0, 0)`;
    counter.textContent = urls.length > 1 ? `${currentIndex + 1} / ${urls.length}` : "";
    indicatorButtons.forEach((indicator, index) => {
      const active = index === currentIndex;
      indicator.classList.toggle("is-active", active);
      indicator.setAttribute("aria-current", active ? "true" : "false");
    });
  };

  urls.forEach((url, index) => {
    const slide = document.createElement("button");
    slide.className = "photo-carousel__slide";
    slide.type = "button";
    slide.setAttribute(
      "aria-label",
      openLightbox ? `Abrir foto ${index + 1} en grande` : `Ver ficha, foto ${index + 1}`,
    );
    slide.addEventListener("click", (event) => {
      if (!openLightbox) return;
      event.preventDefault();
      event.stopPropagation();
      if (swipeHappened) return;
      openPhotoLightbox(item, index, slide);
    });

    const image = document.createElement("img");
    image.className = "photo-carousel__image";
    image.src = url;
    image.alt = item.title;
    image.loading = index === 0 ? "eager" : "lazy";
    image.draggable = false;
    slide.append(image);
    track.append(slide);
  });

  viewport.append(track);
  carousel.append(viewport);

  if (urls.length > 1) {
    const makeArrow = (direction, label, icon, step) => {
      const button = document.createElement("button");
      button.className = `photo-carousel__nav photo-carousel__nav--${direction}`;
      button.type = "button";
      button.setAttribute("aria-label", label);
      button.title = label;
      button.innerHTML = `<i class="fa-solid ${icon} fa-icon" data-fallback="${direction === "previous" ? "‹" : "›"}" aria-hidden="true"></i>`;
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        setIndex(currentIndex + step);
      });
      return button;
    };

    carousel.append(
      makeArrow("previous", "Foto anterior", "fa-chevron-left", -1),
      makeArrow("next", "Foto siguiente", "fa-chevron-right", 1),
      counter,
      indicators,
    );

    viewport.addEventListener("touchstart", (event) => {
      const touch = event.changedTouches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      swipeHappened = false;
    }, { passive: true });

    viewport.addEventListener("touchend", (event) => {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      if (Math.abs(deltaX) < 36 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

      swipeHappened = true;
      setIndex(currentIndex + (deltaX < 0 ? 1 : -1));
      window.clearTimeout(swipeResetTimer);
      swipeResetTimer = window.setTimeout(() => {
        swipeHappened = false;
      }, 350);
    }, { passive: true });
  }

  setIndex(0);
  return carousel;
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

function getItemImageUrls(item) {
  const imageUrls = Array.isArray(item?.imageUrls)
    ? item.imageUrls.filter((url) => typeof url === "string" && url.trim())
    : [];

  if (item?.imageUrl && !imageUrls.includes(item.imageUrl)) {
    imageUrls.unshift(item.imageUrl);
  }

  return [...new Set(imageUrls)];
}

function updatePhotoLightbox() {
  if (!photoLightbox || !photoLightboxImage || !photoLightboxUrls.length) return;

  const total = photoLightboxUrls.length;
  const url = photoLightboxUrls[photoLightboxIndex];
  photoLightboxImage.src = url;
  photoLightboxImage.alt = `${photoLightboxTitle.textContent} · foto ${photoLightboxIndex + 1}`;
  photoLightboxCounter.textContent = total > 1
    ? `${photoLightboxIndex + 1} / ${total}`
    : "";
  photoLightboxPrevious.hidden = total < 2;
  photoLightboxNext.hidden = total < 2;

  photoLightboxThumbs.replaceChildren(...photoLightboxUrls.map((thumbUrl, index) => {
    const button = document.createElement("button");
    button.className = "photo-lightbox__thumb";
    button.type = "button";
    button.setAttribute("aria-label", `Ver foto ${index + 1}`);
    button.setAttribute("aria-pressed", String(index === photoLightboxIndex));
    button.classList.toggle("is-active", index === photoLightboxIndex);
    button.addEventListener("click", () => {
      photoLightboxIndex = index;
      updatePhotoLightbox();
    });

    const image = document.createElement("img");
    image.src = thumbUrl;
    image.alt = "";
    image.loading = "lazy";
    button.append(image);
    return button;
  }));
}

function openPhotoLightbox(item, index = 0, trigger = null) {
  if (!photoLightbox) return;

  photoLightboxUrls = getItemImageUrls(item);
  if (!photoLightboxUrls.length) return;

  photoLightboxIndex = Math.min(Math.max(index, 0), photoLightboxUrls.length - 1);
  photoLightboxTitle.textContent = item.title || "Foto";
  photoLightboxReturnFocus = trigger || document.activeElement;
  updatePhotoLightbox();

  if (typeof photoLightbox.showModal === "function") {
    photoLightbox.showModal();
  } else {
    photoLightbox.setAttribute("open", "");
  }
  document.body.classList.add("photo-lightbox-open");
}

function closePhotoLightbox() {
  if (!photoLightbox) return;

  if (photoLightbox.open && typeof photoLightbox.close === "function") {
    photoLightbox.close();
  } else {
    photoLightbox.removeAttribute("open");
  }

  document.body.classList.remove("photo-lightbox-open");
  if (photoLightboxReturnFocus?.isConnected) photoLightboxReturnFocus.focus();
  photoLightboxReturnFocus = null;
}

function movePhotoLightbox(step) {
  if (photoLightboxUrls.length < 2) return;
  photoLightboxIndex = (photoLightboxIndex + step + photoLightboxUrls.length) % photoLightboxUrls.length;
  updatePhotoLightbox();
}

function renderDetail(item, { live = true, error = "" } = {}) {
  state.selectedItem = item;
  state.selectedItemLive = live;
  detailMedia.replaceChildren();

  const imageUrls = getItemImageUrls(item);

  if (imageUrls.length) {
    detailMedia.append(createPhotoCarousel(item, {
      className: "photo-carousel--detail",
      openLightbox: true,
    }));
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "detail-media__placeholder";
    placeholder.append(createCategoryIcon(item.category));
    placeholder.setAttribute("aria-hidden", "true");
    detailMedia.append(placeholder);
  }

  detailAvailability.textContent = item.status === "completed"
    ? "Entregado"
    : item.status === "expired"
      ? "Ya no disponible"
      : item.status === "not_found"
        ? "No encontrada"
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
  const isAvailable = item.status === "available" && isNotExpired(item);
  interestButton.hidden = ownItem || !live || !isAvailable;
  interestButton.disabled = ownItem || !live || !isAvailable || !ownerUsername;
  interestButton.textContent = "Me interesa";
  interestButton.setAttribute(
    "aria-label",
    ownerUsername
      ? `Contactar con ${item.ownerDisplayName || "el vecino o la vecina"} por Telegram`
      : "Mostrar interés por este objeto",
  );
  detailActionState.textContent = !live
    ? error === "not_found"
      ? "Esta publicación ya no está disponible."
      : "No se puede verificar ahora la disponibilidad ni las acciones."
    : item.status === "completed"
      ? "Esta publicación ya se ha entregado."
      : item.status === "expired"
        ? "Esta publicación ha caducado."
        : ownItem
          ? "Gestiona el estado de tu publicación desde aquí."
          : ownerUsername
            ? "Se abrirá el chat de Telegram de quien lo ofrece."
            : "Este vecino o vecina no tiene un nombre de usuario público para recibir contactos.";
  detailActionState.dataset.state = !live || (!ownItem && !ownerUsername && isAvailable) ? "error" : "";

  detailOwnerActions.hidden = !ownItem || !live;
  markDeliveredButton.disabled = false;
  configureDeliveryButton(markDeliveredButton, item.status);
  detailOwnerActionState.textContent = item.status === "completed"
    ? "Si vuelve a estar disponible, puedes reactivar esta publicación."
    : "Cuando se lo entregues a otra persona, márcalo aquí.";
  detailOwnerActionState.dataset.state = "";
}

function showDetail(item, { syncHistory = true, live = true, error = "" } = {}) {
  renderDetail(item, { live, error });
  setView("detail", { syncHistory, itemId: item.id });
  window.SecondaVidaAnalytics?.trackEvent("catalog", "open-item", item.id);
  if (syncHistory && api?.isItemConfigured && typeof api.getItem === "function") {
    void openItemFromRoute();
  }
}

function configurePostsView() {
  if (!postsContent || !postsAuthGate || !postsOpenTelegramLink) return;

  const miniAppUrl = telegramRuntime.miniAppUrl || "https://t.me/pucelobot/segundavida";
  const verified = Boolean(auth?.hasInitData() && state.telegramUser?.valid);
  postsOpenTelegramLink.href = miniAppUrl;
  postsContent.hidden = !verified;
  postsAuthGate.hidden = verified;

  if (verified) renderMyItems();
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

  if (!isDetail) closePhotoLightbox();

  catalogIntro.hidden = !isExplore;
  catalogTools.hidden = !isExplore;
  catalogSection.hidden = !isExplore;
  offerView.hidden = !isOffer;
  postsView.hidden = !isPosts;
  detailView.hidden = !isDetail;
  publishSuccessView.hidden = !isSuccess;
  detailShare.hidden = !isDetail;

  if (isOffer) configureOfferAuth();
  if (isPosts) configurePostsView();

  if (!isDetail && getRouteItemId()) {
    const url = new URL(window.location.href);
    url.pathname = "/";
    url.search = "";
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
    void openItemFromRoute();
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
    void openItemFromRoute();
  } catch {
    setServiceState(n8nStatus, n8nStatusLabel, "error", "No disponible");
    itemsState.textContent = "No hemos podido cargar los objetos. Inténtalo de nuevo en unos instantes.";
    itemsState.dataset.state = "error";
    itemsCount.textContent = "Sin datos";
    void openItemFromRoute();
  }
}

async function loadMineItems() {
  if (!auth?.hasInitData() || !api?.isMineConfigured || typeof api.listMineItems !== "function") {
    return null;
  }

  try {
    const records = await api.listMineItems(auth.getInitData());
    const catalogById = new Map(state.items.map((item) => [item.id, item]));
    const mergedRecords = records.map((item) => {
      const catalogItem = catalogById.get(item.id);
      const itemImageUrls = Array.isArray(item.imageUrls) && item.imageUrls.length
        ? item.imageUrls
        : item.imageUrl
          ? [item.imageUrl]
          : [];
      const catalogImageUrls = Array.isArray(catalogItem?.imageUrls)
        ? catalogItem.imageUrls
        : catalogItem?.imageUrl
          ? [catalogItem.imageUrl]
          : [];
      const imageUrls = itemImageUrls.length ? itemImageUrls : catalogImageUrls;

      return {
        ...catalogItem,
        ...item,
        imageUrl: item.imageUrl || imageUrls[0] || null,
        imageUrls,
      };
    });
    const mineById = new Map(mergedRecords.map((item) => [item.id, item]));

    state.items = [
      ...state.items.filter((item) => !mineById.has(item.id)),
      ...mergedRecords.filter((item) => item.status === "available" && isNotExpired(item)),
    ];
    state.myItems = mergedRecords.filter(isOwnItem);
    saveOwnItems();
    renderCategories();
    renderItems();
    renderMyItems();
    void openItemFromRoute();
    return records;
  } catch {
    // Conservamos la copia local si el endpoint privado aún no está disponible.
    return null;
  }
}

async function openItemFromRoute() {
  const itemId = getRouteItemId();
  if (!itemId) return;

  const staticItem = state.staticItem?.id === itemId ? state.staticItem : null;
  const catalogItem = state.items.find((candidate) => candidate.id === itemId)
    ?? state.myItems.find((candidate) => candidate.id === itemId && isOwnItem(candidate));
  const initialItem = staticItem ?? catalogItem ?? {
    id: itemId,
    title: "Cargando publicación…",
    description: "",
    category: "Otros",
    zone: "Valladolid",
    ownerDisplayName: "Vecindad",
    ownerUsername: "",
    status: "available",
    expiresAt: null,
    imageUrl: null,
    interestCount: 0,
  };

  showDetail(initialItem, { syncHistory: false, live: Boolean(catalogItem && !staticItem) });

  if (!api?.isItemConfigured || typeof api.getItem !== "function") {
    showDetail(initialItem, { syncHistory: false, live: false, error: "api_unavailable" });
    return;
  }

  try {
    const liveItem = await api.getItem(itemId);
    showDetail(liveItem, { syncHistory: false, live: true });
  } catch (error) {
    if (error?.code === "not_found") {
      showDetail({
        ...initialItem,
        title: "Publicación no encontrada",
        description: "",
        status: "not_found",
        ownerDisplayName: "Vecindad",
        ownerUsername: "",
        imageUrl: null,
      }, { syncHistory: false, live: false, error: "not_found" });
      return;
    }

    showDetail(initialItem, { syncHistory: false, live: false, error: "api_unavailable" });
  }
}

function handleHistoryChange(event) {
  const nextState = event.state;
  const nextView = nextState?.svApp ? nextState.svView : "explore";
  const nextItemId = nextState?.svApp ? nextState.svItemId : "";

  if (nextView === "detail" && nextItemId) {
    const item = state.items.find((candidate) => candidate.id === nextItemId)
      ?? state.myItems.find((candidate) => candidate.id === nextItemId && isOwnItem(candidate));
    if (item) {
      showDetail(item, { syncHistory: false, live: true });
      return;
    }
    void openItemFromRoute();
    return;
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
      configurePostsView();
      await loadMineItems();
      void openItemFromRoute();
      const firstName = result.first_name ? `Hola ${result.first_name}` : "Telegram";
      identityStatus.querySelector("span:nth-child(2)").textContent = firstName;
      setServiceState(identityStatus, identityStatusLabel, "connected", "Verificada ✓");
      return;
    }

    state.telegramUser = null;
    configureOfferAuth();
    configurePostsView();
    setServiceState(identityStatus, identityStatusLabel, "error", "No verificada");
  } catch {
    state.telegramUser = null;
    configureOfferAuth();
    configurePostsView();
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

  const miniAppUrl = telegramRuntime.miniAppUrl || "https://t.me/pucelobot/segundavida";
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

function revokePhotoPreviewUrls() {
  state.photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
  state.photoPreviewUrls = [];
}

function renderPhotoPreview(files) {
  offerPreview.replaceChildren();
  revokePhotoPreviewUrls();

  files.forEach((file, index) => {
    const preview = document.createElement("div");
    preview.className = "photo-preview__item";
    const image = document.createElement("img");
    const previewUrl = URL.createObjectURL(file);
    state.photoPreviewUrls.push(previewUrl);
    image.src = previewUrl;
    image.alt = file.name;
    preview.append(image);

    const removeButton = document.createElement("button");
    removeButton.className = "photo-preview__remove";
    removeButton.type = "button";
    removeButton.setAttribute("aria-label", `Quitar foto ${index + 1}`);
    removeButton.title = "Quitar foto";
    removeButton.innerHTML = '<i class="fa-solid fa-xmark fa-icon" data-fallback="×" aria-hidden="true"></i>';
    removeButton.addEventListener("click", () => removePhoto(index));
    preview.append(removeButton);
    offerPreview.append(preview);
  });
}

function photoKey(file) {
  return [file.name, file.size, file.lastModified, file.type].join(":");
}

function removePhoto(index) {
  state.offerFiles.splice(index, 1);
  renderPhotoPreview(state.offerFiles);
  setFormState("");
}

function resetOfferPhotos() {
  state.offerFiles = [];
  offerImages.value = "";
  offerPreview.replaceChildren();
  revokePhotoPreviewUrls();
}

function handlePhotoSelection(event) {
  const files = [...event.target.files];
  // Permite volver a seleccionar el mismo archivo en una selección posterior.
  event.target.value = "";

  // El límite de 5 MB se comprueba después de optimizar la imagen al enviar.
  // En la selección solo rechazamos formatos que el navegador no puede tratar.
  const invalidFiles = files.filter((file) => !ALLOWED_PHOTO_TYPES.has(file.type));
  const existingKeys = new Set(state.offerFiles.map(photoKey));
  const newFiles = files.filter((file) => (
    ALLOWED_PHOTO_TYPES.has(file.type) &&
    !existingKeys.has(photoKey(file))
  ));
  const availableSlots = Math.max(0, MAX_OFFER_PHOTOS - state.offerFiles.length);
  const filesToAdd = newFiles.slice(0, availableSlots);

  state.offerFiles = [...state.offerFiles, ...filesToAdd];
  renderPhotoPreview(state.offerFiles);

  if (filesToAdd.length < newFiles.length) {
    setFormState(`Puedes añadir hasta ${MAX_OFFER_PHOTOS} fotos.`, "error");
    return;
  }

  if (invalidFiles.length > 0) {
    setFormState("Cada foto debe ser JPG, PNG o WebP.", "error");
    return;
  }

  setFormState("");
}

async function loadPhoto(file) {
  if (typeof window.createImageBitmap === "function") {
    try {
      return await window.createImageBitmap(file);
    } catch {
      // Algunos WebViews no aceptan todos los formatos con createImageBitmap.
    }
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`No se ha podido leer ${file.name}.`));
    };
    image.src = objectUrl;
  });
}

async function optimizePhoto(file) {
  // Las fotos que ya son ligeras no necesitan pasar por canvas. Esto evita
  // trabajo innecesario con las fotos pequeñas de la cámara o de WhatsApp.
  if (file.size <= PHOTO_OPTIMIZE_THRESHOLD) return file;

  const image = await loadPhoto(file);
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    if (typeof image.close === "function") image.close();
    if (file.size <= MAX_PHOTO_BYTES) return file;
    throw new Error(`No se ha podido optimizar ${file.name}.`);
  }

  async function render(maxEdge, quality) {
    const scale = Math.min(1, maxEdge / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    canvas.width = width;
    canvas.height = height;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return new Promise((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", quality);
    });
  }

  // Una pasada normal y solo dos planes de emergencia. En la mayoría de los
  // móviles la primera pasada ya deja la imagen por debajo de 5 MB.
  let blob = await render(PHOTO_MAX_EDGE, PHOTO_JPEG_QUALITY);
  if (blob && blob.size > MAX_PHOTO_BYTES) {
    blob = await render(960, 0.58);
  }
  if (blob && blob.size > MAX_PHOTO_BYTES) {
    blob = await render(720, 0.45);
  }

  if (typeof image.close === "function") image.close();
  if (!blob) return file;
  if (blob.size > MAX_PHOTO_BYTES) {
    throw new Error(`La foto ${file.name} no se puede reducir por debajo de 5 MB.`);
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "foto";
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

async function handleOfferSubmit(event) {
  event.preventDefault();

  if (offerSubmitButton?.disabled) return;

  if (!offerForm.reportValidity()) {
    setFormState("Revisa los campos obligatorios.", "error");
    return;
  }

  if (state.offerFiles.length < 1) {
    setFormState("Añade al menos una foto para publicar.", "error");
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

  if (offerSubmitButton) {
    offerSubmitButton.disabled = true;
    offerSubmitButton.textContent = state.offerFiles.length ? "Optimizando…" : "Publicando…";
  }
  offerForm.setAttribute("aria-busy", "true");

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

  setFormState(
    state.offerFiles.length
      ? `Optimizando ${state.offerFiles.length === 1 ? "foto" : "fotos"}…`
      : "Publicando…",
    "pending",
  );

  try {
    const optimizedFiles = await Promise.all(state.offerFiles.map(optimizePhoto));
    if (offerSubmitButton) offerSubmitButton.textContent = "Publicando…";
    setFormState("Publicando…", "pending");
    const result = await api.publishItem(payload, optimizedFiles);

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
      imageUrl: result.image_url ?? null,
      imageUrls: Array.isArray(result.image_urls) ? result.image_urls : [],
      interestCount: 0,
    };

    rememberOwnItem(publishedItem);
    offerForm.reset();
    resetOfferPhotos();
    await loadCatalog();
    const catalogItem = state.items.find((item) => item.id === publishedItem.id);
    const finalItem = catalogItem ? { ...publishedItem, ...catalogItem } : publishedItem;
    rememberOwnItem(finalItem);
    showPublishSuccess(finalItem);
  } catch (error) {
    setFormState(error.message || "No se ha podido publicar.", "error");
  } finally {
    if (offerSubmitButton) {
      offerSubmitButton.disabled = false;
      offerSubmitButton.textContent = offerSubmitLabel;
    }
    offerForm.removeAttribute("aria-busy");
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

if (photoLightbox) {
  photoLightboxClose.addEventListener("click", closePhotoLightbox);
  photoLightboxPrevious.addEventListener("click", () => movePhotoLightbox(-1));
  photoLightboxNext.addEventListener("click", () => movePhotoLightbox(1));
  photoLightbox.addEventListener("click", (event) => {
    if (event.target === photoLightbox) closePhotoLightbox();
  });
  photoLightbox.addEventListener("cancel", (event) => {
    event.preventDefault();
    closePhotoLightbox();
  });
}

document.addEventListener("keydown", (event) => {
  if (!photoLightbox?.open) return;
  if (event.key === "ArrowLeft") movePhotoLightbox(-1);
  if (event.key === "ArrowRight") movePhotoLightbox(1);
});

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
state.staticItem = getStaticItem();
prepareHistoryState();
window.SecondaVidaAnalytics?.trackPageView();
configureOfferAuth();
checkIdentity();
loadCatalog();
