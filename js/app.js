// Punto de entrada del frontend de Segunda Vida.
document.documentElement.classList.add("app-ready");

const telegramRuntime = window.SecondaVidaTelegram ?? {
  isTelegram: false,
  sdkAvailable: false,
};

const auth = window.SecondaVidaAuth;
const api = window.SecondaVidaApi;
const CONSENT_VERSION = "sv-publish-2026-08-17-v3";
const MAX_OFFER_PHOTOS = 2;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_OPTIMIZE_THRESHOLD = 1.5 * 1024 * 1024;
const PHOTO_MAX_EDGE = 1280;
const PHOTO_JPEG_QUALITY = 0.74;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const OWN_ITEMS_STORAGE_KEY = "segundavida:my-items:v1";
const THEME_STORAGE_KEY = "segundavida:theme:v1";
const PUBLISH_DRAFT_STORAGE_KEY = "segundavida:publish-draft:v1";
const PUBLISH_DRAFT_VALUES_KEY = "segundavida:publish-draft-values:v1";
const AUTH_REFRESH_STORAGE_KEY = "segundavida:auth-refresh:v1";
const AUTH_REFRESH_WINDOW_MS = 2 * 60 * 1000;
const PUBLISH_DRAFT_DB_NAME = "segundavida-drafts-v1";
const PUBLISH_DRAFT_STORE_NAME = "drafts";
const LOCAL_AUTHOR_DEMO_MODE =
  ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
  new URLSearchParams(window.location.search).get("demo") === "author";
const state = {
  items: [],
  category: "Todo",
  statusFilter: "all",
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
  catalogNeedsRefresh: false,
  catalogRequestVersion: 0,
  publishRetryAfterRefresh: false,
};

let photoLightboxUrls = [];
let photoLightboxIndex = 0;
let photoLightboxReturnFocus = null;
let routeOpenInFlight = null;
let routeOpenItemId = "";
let deleteDialogItem = null;
let deleteDialogTriggerButton = null;
let contactDialogItem = null;
let contactDialogTriggerButton = null;

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
const statusFilters = document.querySelector("#status-filters");
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
const shareFeedback = document.querySelector("#share-feedback");
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
const detailAvailabilityLabel = document.querySelector("#detail-availability-label");
const detailTitle = document.querySelector("#detail-title");
const detailCategory = document.querySelector("#detail-category");
const detailDescription = document.querySelector("#detail-description");
const detailZone = document.querySelector("#detail-zone");
const detailOwner = document.querySelector("#detail-owner");
const detailCreatedAt = document.querySelector("#detail-created-at");
const interestButton = document.querySelector("#interest-button");
const detailActionState = document.querySelector("#detail-action-state");
const detailOwnerActions = document.querySelector("#detail-owner-actions");
const manageStatusButton = document.querySelector("#manage-status-button");
const markDeliveredButton = document.querySelector("#mark-delivered-button");
const deleteItemButton = document.querySelector("#delete-item-button");
const deleteItemDialog = document.querySelector("#delete-item-dialog");
const deleteItemDialogTitle = document.querySelector("#delete-item-dialog-title");
const deleteItemDialogCopy = document.querySelector("#delete-item-dialog-copy");
const deleteItemDialogState = document.querySelector("#delete-item-dialog-state");
const deleteItemDialogClose = document.querySelector("#delete-item-dialog-close");
const deleteItemDialogCancel = document.querySelector("#delete-item-dialog-cancel");
const deleteItemDialogConfirm = document.querySelector("#delete-item-dialog-confirm");
const contactDialog = document.querySelector("#contact-dialog");
const contactDialogOwner = document.querySelector("#contact-dialog-owner");
const contactDialogClose = document.querySelector("#contact-dialog-close");
const contactDialogCancel = document.querySelector("#contact-dialog-cancel");
const contactDialogConfirm = document.querySelector("#contact-dialog-confirm");
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
const offerCamera = document.querySelector("#offer-camera");
const offerCameraButton = document.querySelector("#offer-camera-button");
const offerPhotoPicker = document.querySelector("#offer-photo-picker");
const cameraDialog = document.querySelector("#camera-dialog");
const cameraPreview = document.querySelector("#camera-preview");
const cameraCanvas = document.querySelector("#camera-canvas");
const cameraDialogState = document.querySelector("#camera-dialog-state");
const cameraDialogClose = document.querySelector("#camera-dialog-close");
const cameraDialogCancel = document.querySelector("#camera-dialog-cancel");
const cameraCaptureButton = document.querySelector("#camera-capture-button");
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
const postsActionState = document.querySelector("#posts-action-state");
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
  if (!element || !label) return;
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

function formatShortDateTime(value) {
  if (!value) return "";

  const rawValue = String(value);
  const normalized = rawValue.includes(" ") ? rawValue.replace(" ", "T") : rawValue;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date).replace(",", "");
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function configureDeliveryButton(button, status) {
  const completed = status === "completed";
  const actionLabel = completed ? "Volver a publicar" : "Está entregado";
  const actionIcon = completed ? "fa-rotate-left" : "fa-check";
  const fallback = completed ? "↶" : "✓";

  button.classList.toggle("secondary-button--complete", !completed);
  button.classList.toggle("secondary-button--reopen", completed);
  button.setAttribute("aria-label", actionLabel);

  button.replaceChildren(createIconElement(actionIcon, fallback), document.createTextNode(actionLabel));
}

function configureStatusButton(button, status) {
  if (!button) return;

  const reserved = status === "reserved";
  const actionLabel = reserved ? "Liberar reserva" : "Está reservado";
  const actionIcon = reserved ? "fa-rotate-left" : "fa-clock";
  const fallback = reserved ? "↶" : "◷";

  button.hidden = !["available", "reserved"].includes(status);
  button.disabled = button.hidden;
  button.setAttribute("aria-label", actionLabel);
  button.replaceChildren(createIconElement(actionIcon, fallback), document.createTextNode(actionLabel));
}

function configureDeleteButton(button) {
  if (!button) return;
  button.setAttribute("aria-label", "Borrar objeto");
  button.replaceChildren(
    createIconElement("fa-trash-can", "⌫"),
    document.createTextNode("Borrar objeto"),
  );
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

function isAdminUser() {
  return Boolean(
    state.telegramUser?.valid === true &&
    state.telegramUser?.is_admin === true &&
    auth?.hasInitData(),
  );
}

function refreshSelectedDetailForIdentity() {
  if (state.currentView !== "detail" || !state.selectedItem) return;
  renderDetail(state.selectedItem, { live: state.selectedItemLive });
}

function getItemStatusLabel(item, { privateView = false } = {}) {
  if (item?.status === "completed") return "Entregado";
  if (item?.status === "reserved") {
    return privateView && item.reservationExpiresAt
      ? `Reservado hasta ${formatShortDateTime(item.reservationExpiresAt)}`
      : "Reservado";
  }
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

function getHomeUrl() {
  const url = new URL(window.location.href);
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url.toString();
}

function getInterestMessage(item) {
  return `Hola, he visto que has publicado «${item.title}» en Segunda Vida y estoy interesado/a.\n\n${getItemUrl(item)}`;
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
  availability.textContent = item.status === "reserved"
    ? "Reservado"
    : item.expiresAt
      ? `Hasta ${formatDate(item.expiresAt)}`
      : "Disponible";
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

  const itemLink = document.createElement("button");
  itemLink.className = "owned-item-card__link";
  itemLink.type = "button";
  itemLink.setAttribute("aria-label", `Ver publicación: ${item.title}`);
  itemLink.addEventListener("click", () => showDetail(item));

  const thumbnail = document.createElement("span");
  thumbnail.className = "owned-item-card__thumb";
  const imageUrls = getItemImageUrls(item);
  if (imageUrls.length) {
    const image = document.createElement("img");
    image.src = imageUrls[0];
    image.alt = "";
    image.loading = "lazy";
    thumbnail.append(image);
  } else {
    thumbnail.classList.add("owned-item-card__thumb--placeholder");
    thumbnail.append(createCategoryIcon(item.category));
  }
  itemLink.append(thumbnail);

  const content = document.createElement("span");
  content.className = "owned-item-card__content";
  const heading = document.createElement("span");
  heading.className = "owned-item-card__heading";
  const title = createTextElement("span", "owned-item-card__title", item.title);
  title.setAttribute("role", "heading");
  title.setAttribute("aria-level", "2");
  heading.append(title);
  heading.append(createTextElement(
    "span",
    `owned-item-card__status ${item.status === "completed" ? "is-completed" : item.status === "reserved" ? "is-reserved" : ""}`,
    getItemStatusLabel(item, { privateView: true }),
  ));
  content.append(heading);
  content.append(createTextElement("span", "owned-item-card__meta", `${item.category} · ${item.zone}`));
  itemLink.append(content);
  card.append(itemLink);

  const actions = document.createElement("div");
  actions.className = "owned-item-card__actions";

  const deliveredButton = document.createElement("button");
  deliveredButton.className = "secondary-button secondary-button--compact delivery-action-button";
  deliveredButton.type = "button";
  configureDeliveryButton(deliveredButton, item.status);
  const statusButton = document.createElement("button");
  statusButton.className = "secondary-button secondary-button--compact status-action-button";
  statusButton.type = "button";
  configureStatusButton(statusButton, item.status);
  const deleteButton = document.createElement("button");
  deleteButton.className = "quiet-action quiet-action--delete owned-item-card__delete";
  deleteButton.type = "button";
  configureDeleteButton(deleteButton);
  const actionState = createTextElement("p", "owned-item-card__state", "");
  deliveredButton.addEventListener("click", () => completeItem(item, deliveredButton, actionState));
  statusButton.addEventListener("click", () => {
    const action = item.status === "reserved" ? "release" : "reserve";
    void manageItemAction(item, action, statusButton, actionState);
  });
  deleteButton.addEventListener("click", () => openDeleteItemDialog(item, deleteButton));
  actions.append(statusButton);
  actions.append(deliveredButton);
  actions.append(deleteButton);
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
      const currentItem = state.myItems[index];
      const currentImageUrls = getItemImageUrls(currentItem);
      const catalogImageUrls = getItemImageUrls(item);
      const imageUrls = catalogImageUrls.length ? catalogImageUrls : currentImageUrls;
      state.myItems[index] = {
        ...currentItem,
        ...item,
        imageUrl: item.imageUrl || imageUrls[0] || null,
        imageUrls,
      };
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
    ? "Aún no tienes publicaciones finalizadas"
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

  const availabilityLabel = item.status === "completed"
    ? "Entregado"
    : item.status === "reserved"
      ? "Reservado"
    : item.status === "expired"
      ? "Ya no disponible"
      : item.status === "not_found"
        ? "No encontrada"
        : item.expiresAt
      ? `Disponible hasta ${formatDate(item.expiresAt)}`
      : "Disponible";
  if (detailAvailabilityLabel) {
    detailAvailabilityLabel.textContent = availabilityLabel;
  } else {
    detailAvailability.textContent = availabilityLabel;
  }
  detailTitle.textContent = item.title;
  detailCategory.replaceChildren(createCategoryIcon(item.category), document.createTextNode(` ${item.category}`));
  detailDescription.textContent = item.description || "";
  detailDescription.hidden = !item.description;
  detailZone.textContent = item.zone || "Valladolid";
  detailOwner.textContent = item.ownerDisplayName || "Vecindad";
  if (detailCreatedAt) detailCreatedAt.textContent = formatShortDateTime(item.createdAt) || "—";
  const ownItem = LOCAL_AUTHOR_DEMO_MODE || isOwnItem(item);
  const adminUser = isAdminUser();
  const canManageItem = ownItem || adminUser;
  const ownerUsername = normalizeTelegramUsername(item.ownerUsername);
  const isAvailable = item.status === "available" && isNotExpired(item);
  detailView.classList.toggle("detail-view--owner", canManageItem && live);
  interestButton.hidden = ownItem || !live || !isAvailable;
  interestButton.disabled = ownItem || !live || !isAvailable || !ownerUsername;
  interestButton.replaceChildren(
    createIconElement("fa-message", "✉"),
    document.createTextNode("Me interesa"),
  );
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
    : ownItem
      ? ""
      : item.status === "completed"
      ? "Esta publicación ya se ha entregado."
      : item.status === "reserved"
        ? "La recogida está en proceso. No se aceptan nuevos contactos para esta publicación."
      : item.status === "expired"
        ? "Esta publicación ha caducado."
        : ownerUsername
          ? ""
          : "Este vecino o vecina no tiene un nombre de usuario público para recibir contactos.";
  detailActionState.dataset.state = !live || (!ownItem && !ownerUsername && isAvailable) ? "error" : "";

  detailOwnerActions.hidden = !canManageItem || !live;
  markDeliveredButton.disabled = false;
  configureDeliveryButton(markDeliveredButton, item.status);
  configureStatusButton(manageStatusButton, item.status);
  deleteItemButton.hidden = !canManageItem || !live;
  deleteItemButton.disabled = false;
  configureDeleteButton(deleteItemButton);
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
  detailShare.hidden = !(isExplore || isDetail);
  detailShare.setAttribute("aria-label", isDetail ? "Compartir publicación" : "Compartir Segunda Vida");
  detailShare.setAttribute("title", isDetail ? "Compartir publicación" : "Compartir Segunda Vida");

  if (isOffer) configureOfferAuth();
  if (isPosts) configurePostsView();
  if (isExplore && state.catalogNeedsRefresh && !getRouteItemId()) {
    void loadCatalog();
  }

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

function renderStatusFilters() {
  if (!statusFilters) return;
  const statuses = [
    ["all", "Todas"],
    ["available", "Disponibles"],
    ["reserved", "Reservados"],
  ];
  statusFilters.replaceChildren(...statuses.map(([status, label]) => {
    const button = document.createElement("button");
    button.className = "filter-chip filter-chip--status";
    button.type = "button";
    button.role = "tab";
    button.setAttribute("aria-selected", String(state.statusFilter === status));
    button.textContent = label;
    button.addEventListener("click", () => {
      state.statusFilter = status;
      renderStatusFilters();
      renderItems();
    });
    return button;
  }));
}

function sortNewestFirst(items) {
  return [...items].sort((left, right) => {
    const leftDate = Date.parse(String(left.createdAt ?? "").replace(" ", "T"));
    const rightDate = Date.parse(String(right.createdAt ?? "").replace(" ", "T"));
    const leftTimestamp = Number.isFinite(leftDate) ? leftDate : 0;
    const rightTimestamp = Number.isFinite(rightDate) ? rightDate : 0;

    if (leftTimestamp !== rightTimestamp) return rightTimestamp - leftTimestamp;
    return String(right.id ?? "").localeCompare(String(left.id ?? ""));
  });
}

function renderItems() {
  const query = state.query.trim().toLocaleLowerCase("es");
  const visibleItems = sortNewestFirst(state.items.filter((item) => {
    const matchesCategory = state.category === "Todo" || item.category === state.category;
    const matchesStatus = state.statusFilter === "all" || item.status === state.statusFilter;
    const searchableText = `${item.title} ${item.description} ${item.category} ${item.zone}`
      .toLocaleLowerCase("es");
    return matchesCategory && matchesStatus && (!query || searchableText.includes(query));
  }));

  itemsCount.textContent = `${visibleItems.length} ${visibleItems.length === 1 ? "cosa" : "cosas"}`;
  itemsGrid.replaceChildren(...visibleItems.map(createItemCard));

  if (visibleItems.length > 0) {
    itemsState.textContent = "";
    itemsState.dataset.state = "";
    return;
  }

  itemsState.textContent = state.items.length > 0
    ? "No encontramos publicaciones con esos filtros."
    : "Todavía no hay publicaciones activas. Cuando alguien publique algo, aparecerá aquí.";
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
  if (getRouteItemId()) {
    void openItemFromRoute();
    return;
  }

  if (!api?.isDataConfigured) {
    setServiceState(n8nStatus, n8nStatusLabel, "error", "No configurado");
    itemsState.textContent = "El catálogo todavía no está configurado.";
    itemsState.dataset.state = "error";
    void openItemFromRoute();
    return;
  }

  if (n8nStatusLabel) n8nStatusLabel.textContent = "Comprobando...";
  const requestVersion = state.catalogRequestVersion;

  try {
    const records = await api.listItems();
    if (requestVersion !== state.catalogRequestVersion) return;
    setServiceState(n8nStatus, n8nStatusLabel, "connected", "Conectado ✓");
    state.catalogNeedsRefresh = false;
    state.items = records.filter((item) => ["available", "reserved"].includes(item.status) && isNotExpired(item));
    renderCategories();
    renderStatusFilters();
    renderItems();
    renderMyItems();
    void openItemFromRoute();
  } catch {
    if (requestVersion !== state.catalogRequestVersion) return;
    state.catalogNeedsRefresh = true;
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
      const localItem = state.myItems.find((candidate) => candidate.id === item.id);
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
      const localImageUrls = getItemImageUrls(localItem);
      const imageUrls = itemImageUrls.length
        ? itemImageUrls
        : catalogImageUrls.length
          ? catalogImageUrls
          : localImageUrls;

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
      ...mergedRecords.filter((item) => ["available", "reserved"].includes(item.status) && isNotExpired(item)),
    ];
    state.myItems = mergedRecords.filter(isOwnItem);
    saveOwnItems();
    renderCategories();
    renderStatusFilters();
    renderItems();
    renderMyItems();
    return records;
  } catch {
    // Conservamos la copia local si el endpoint privado aún no está disponible.
    return null;
  }
}

async function openItemFromRoute() {
  const itemId = getRouteItemId();
  if (!itemId) return;

  if (routeOpenInFlight && routeOpenItemId === itemId) {
    return routeOpenInFlight;
  }

  const request = (async () => {
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
      reservedAt: null,
      reservationExpiresAt: null,
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
  })();

  routeOpenInFlight = request;
  routeOpenItemId = itemId;
  try {
    return await request;
  } finally {
    if (routeOpenInFlight === request) {
      routeOpenInFlight = null;
      routeOpenItemId = "";
    }
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
      refreshSelectedDetailForIdentity();
      schedulePublishRetryIfReady();
      const firstName = result.first_name ? `Hola ${result.first_name}` : "Telegram";
      const identityName = identityStatus?.querySelector("span:nth-child(2)");
      if (identityName) identityName.textContent = firstName;
      setServiceState(identityStatus, identityStatusLabel, "connected", "Verificada ✓");
      return;
    }

    state.telegramUser = null;
    configureOfferAuth();
    configurePostsView();
    refreshSelectedDetailForIdentity();
    setServiceState(identityStatus, identityStatusLabel, "error", "No verificada");
  } catch {
    state.telegramUser = null;
    configureOfferAuth();
    configurePostsView();
    refreshSelectedDetailForIdentity();
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

function setOfferSubmitLoading(label) {
  if (!offerSubmitButton) return;

  const spinner = document.createElement("span");
  spinner.className = "button-loading";
  spinner.setAttribute("aria-hidden", "true");
  const text = document.createElement("span");
  text.textContent = label;
  offerSubmitButton.replaceChildren(spinner, text);
  offerSubmitButton.classList.add("is-loading");
}

function resetOfferSubmitButton() {
  if (!offerSubmitButton) return;
  offerSubmitButton.classList.remove("is-loading");
  offerSubmitButton.textContent = offerSubmitLabel;
}

function setPhotoFieldError(hasError) {
  if (!offerPhotoPicker || !offerImages) return;
  offerPhotoPicker.dataset.state = hasError ? "error" : "";
  if (hasError) {
    offerImages.setAttribute("aria-invalid", "true");
  } else {
    offerImages.removeAttribute("aria-invalid");
  }
}

function readSessionStorage(key) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSessionStorage(key, value) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // El borrador sigue funcionando mientras la página permanezca abierta.
  }
}

function removeSessionStorage(key) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // El almacenamiento puede estar bloqueado en algunos WebViews.
  }
}

function getPublishDraftValues() {
  const formData = new FormData(offerForm);
  return {
    title: String(formData.get("title") ?? ""),
    category: String(formData.get("category") ?? ""),
    zone: String(formData.get("zone") ?? ""),
    description: String(formData.get("description") ?? ""),
    duration: String(formData.get("duration") ?? "14"),
    consent: offerConsent.checked,
  };
}

function openPublishDraftDatabase() {
  if (!window.indexedDB) {
    return Promise.reject(new Error("indexeddb_unavailable"));
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(PUBLISH_DRAFT_DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(PUBLISH_DRAFT_STORE_NAME)) {
        request.result.createObjectStore(PUBLISH_DRAFT_STORE_NAME);
      }
    };
    request.onerror = () => reject(request.error || new Error("indexeddb_open_failed"));
    request.onsuccess = () => resolve(request.result);
  });
}

async function savePublishDraft() {
  const values = getPublishDraftValues();
  writeSessionStorage(PUBLISH_DRAFT_STORAGE_KEY, "pending");
  writeSessionStorage(PUBLISH_DRAFT_VALUES_KEY, JSON.stringify(values));

  try {
    const db = await openPublishDraftDatabase();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(PUBLISH_DRAFT_STORE_NAME, "readwrite");
      const draft = {
        values,
        files: state.offerFiles.map((file) => ({
          blob: file,
          name: file.name,
          type: file.type,
          lastModified: file.lastModified,
        })),
      };
      transaction.objectStore(PUBLISH_DRAFT_STORE_NAME).put(draft, "publish");
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("indexeddb_write_failed"));
      transaction.onabort = () => reject(transaction.error || new Error("indexeddb_write_aborted"));
    });
    db.close();
  } catch {
    // Los campos de texto quedan en sessionStorage como respaldo. Si el
    // navegador no permite IndexedDB, se pedirá volver a elegir las fotos.
  }
}

async function consumePublishDraft() {
  if (readSessionStorage(PUBLISH_DRAFT_STORAGE_KEY) !== "pending") return null;

  removeSessionStorage(PUBLISH_DRAFT_STORAGE_KEY);
  let fallbackValues = null;
  try {
    fallbackValues = JSON.parse(readSessionStorage(PUBLISH_DRAFT_VALUES_KEY) || "null");
  } catch {
    fallbackValues = null;
  }
  removeSessionStorage(PUBLISH_DRAFT_VALUES_KEY);

  try {
    const db = await openPublishDraftDatabase();
    const draft = await new Promise((resolve, reject) => {
      const transaction = db.transaction(PUBLISH_DRAFT_STORE_NAME, "readonly");
      const request = transaction.objectStore(PUBLISH_DRAFT_STORE_NAME).get("publish");
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error || new Error("indexeddb_read_failed"));
    });
    db.close();

    const clearDb = await openPublishDraftDatabase();
    await new Promise((resolve, reject) => {
      const transaction = clearDb.transaction(PUBLISH_DRAFT_STORE_NAME, "readwrite");
      transaction.objectStore(PUBLISH_DRAFT_STORE_NAME).delete("publish");
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("indexeddb_delete_failed"));
    });
    clearDb.close();
    return draft ?? { values: fallbackValues, files: [] };
  } catch {
    return fallbackValues ? { values: fallbackValues, files: [] } : null;
  }
}

function restoreDraftFile(entry) {
  const blob = entry?.blob;
  if (!(blob instanceof Blob)) return null;

  return new File([blob], entry.name || "foto.jpg", {
    type: entry.type || blob.type || "image/jpeg",
    lastModified: Number(entry.lastModified) || Date.now(),
  });
}

function schedulePublishRetryIfReady() {
  if (!state.publishRetryAfterRefresh || !state.telegramUser?.valid) return;
  if (!normalizeTelegramUsername(state.telegramUser?.username)) return;

  state.publishRetryAfterRefresh = false;
  window.setTimeout(() => {
    void handleOfferSubmit({ preventDefault() {} });
  }, 350);
}

async function restorePublishDraft() {
  const draft = await consumePublishDraft();
  if (!draft?.values) return;

  const values = draft.values;
  const title = offerForm.elements.namedItem("title");
  const category = offerForm.elements.namedItem("category");
  const zone = offerForm.elements.namedItem("zone");
  const description = offerForm.elements.namedItem("description");
  const duration = offerForm.elements.namedItem("duration");

  if (title) title.value = values.title ?? "";
  if (category) category.value = values.category ?? "";
  if (zone) zone.value = values.zone ?? "";
  if (description) description.value = values.description ?? "";
  if (duration) {
    [...offerForm.querySelectorAll('input[name="duration"]')].forEach((input) => {
      input.checked = input.value === String(values.duration ?? "14");
    });
  }
  offerConsent.checked = values.consent === true;

  const restoredFiles = (Array.isArray(draft.files) ? draft.files : [])
    .map(restoreDraftFile)
    .filter(Boolean)
    .slice(0, MAX_OFFER_PHOTOS);
  state.offerFiles = restoredFiles;
  renderPhotoPreview(state.offerFiles);

  let refreshState = null;
  try {
    refreshState = JSON.parse(readSessionStorage(AUTH_REFRESH_STORAGE_KEY) || "null");
  } catch {
    refreshState = null;
  }
  state.publishRetryAfterRefresh = refreshState?.retry === true;

  if (state.publishRetryAfterRefresh) {
    setFormState("Actualizando la sesión…", "pending");
    schedulePublishRetryIfReady();
  } else if (restoredFiles.length > 0) {
    setFormState("Hemos recuperado el borrador de tu publicación.", "connected");
  }
}

function isTelegramInitDataExpired(value) {
  const candidates = [
    typeof value === "string" ? value : "",
    value?.error_code,
    value?.error,
    value?.code,
  ];
  return candidates.includes("telegram_init_data_expired");
}

function isPhotoRequiredError(value) {
  const candidates = [
    typeof value === "string" ? value : "",
    value?.error_code,
    value?.error,
    value?.code,
  ];
  return candidates.some((candidate) => String(candidate).trim().toLowerCase().replace(/[\s-]+/g, "_") === "photo_required");
}

async function refreshTelegramSession() {
  if (!telegramRuntime.isTelegram || typeof window.location?.reload !== "function") {
    return false;
  }

  let previous = null;
  try {
    previous = JSON.parse(readSessionStorage(AUTH_REFRESH_STORAGE_KEY) || "null");
  } catch {
    previous = null;
  }
  if (previous?.requestedAt && Date.now() - previous.requestedAt < AUTH_REFRESH_WINDOW_MS) {
    return false;
  }

  writeSessionStorage(AUTH_REFRESH_STORAGE_KEY, JSON.stringify({
    requestedAt: Date.now(),
    retry: true,
  }));
  await savePublishDraft();
  setFormState("Actualizando la sesión…", "pending");
  window.setTimeout(() => window.location.reload(), 150);
  return true;
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
  setPhotoFieldError(false);
  setFormState("");
}

function resetOfferPhotos() {
  state.offerFiles = [];
  offerImages.value = "";
  if (offerCamera) offerCamera.value = "";
  offerPreview.replaceChildren();
  revokePhotoPreviewUrls();
  setPhotoFieldError(false);
}

let cameraStream = null;

function stopCameraStream() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }
  if (cameraPreview) cameraPreview.srcObject = null;
}

function setCameraDialogState(message = "", stateName = "") {
  if (!cameraDialogState) return;
  cameraDialogState.textContent = message;
  cameraDialogState.dataset.state = stateName;
}

function closeCameraDialog() {
  stopCameraStream();
  if (cameraCaptureButton) cameraCaptureButton.disabled = true;
  setCameraDialogState();

  if (cameraDialog?.open && typeof cameraDialog.close === "function") {
    cameraDialog.close();
  } else {
    cameraDialog?.removeAttribute("open");
  }
}

function addCapturedPhoto(blob) {
  if (state.offerFiles.length >= MAX_OFFER_PHOTOS) {
    setPhotoFieldError(true);
    setFormState(`Puedes añadir hasta ${MAX_OFFER_PHOTOS} fotos.`, "error");
    return false;
  }

  const capturedAt = Date.now();
  const capturedFile = new File([blob], `camara-${capturedAt}.jpg`, {
    type: "image/jpeg",
    lastModified: capturedAt,
  });
  state.offerFiles = [...state.offerFiles, capturedFile];
  renderPhotoPreview(state.offerFiles);
  setPhotoFieldError(false);
  setFormState("");
  return true;
}

async function captureCameraPhoto() {
  if (!cameraPreview?.videoWidth || !cameraPreview.videoHeight || !cameraCanvas) {
    setCameraDialogState("La cámara todavía no está lista.", "error");
    return;
  }

  const sourceWidth = cameraPreview.videoWidth;
  const sourceHeight = cameraPreview.videoHeight;
  const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(sourceWidth, sourceHeight));
  cameraCanvas.width = Math.max(1, Math.round(sourceWidth * scale));
  cameraCanvas.height = Math.max(1, Math.round(sourceHeight * scale));

  const context = cameraCanvas.getContext("2d", { alpha: false });
  if (!context) {
    setCameraDialogState("No se ha podido capturar la foto.", "error");
    return;
  }

  context.drawImage(cameraPreview, 0, 0, cameraCanvas.width, cameraCanvas.height);
  const blob = await new Promise((resolve) => {
    cameraCanvas.toBlob(resolve, "image/jpeg", PHOTO_JPEG_QUALITY);
  });
  if (!blob || !addCapturedPhoto(blob)) return;
  closeCameraDialog();
}

async function handleCameraRequest() {
  if (state.offerFiles.length >= MAX_OFFER_PHOTOS) {
    setPhotoFieldError(true);
    setFormState(`Puedes añadir hasta ${MAX_OFFER_PHOTOS} fotos.`, "error");
    return;
  }

  if (!cameraDialog || !cameraPreview || !navigator.mediaDevices?.getUserMedia) {
    setFormState("La cámara no está disponible en este dispositivo. Elige una foto existente.", "error");
    return;
  }

  setFormState("");
  setCameraDialogState("Preparando cámara…", "pending");
  if (typeof cameraDialog.showModal === "function") {
    cameraDialog.showModal();
  } else {
    cameraDialog.setAttribute("open", "");
  }

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: "environment" } },
    });
    cameraPreview.srcObject = cameraStream;
    await cameraPreview.play();
    if (cameraCaptureButton) cameraCaptureButton.disabled = false;
    setCameraDialogState();
  } catch (error) {
    closeCameraDialog();
    const permissionDenied = ["NotAllowedError", "PermissionDeniedError", "SecurityError"].includes(error?.name);
    setFormState(
      permissionDenied
        ? "No se ha concedido permiso para usar la cámara. Puedes elegir una foto existente."
        : "No se ha podido abrir la cámara. Puedes elegir una foto existente.",
      "error",
    );
  }
}

function handleGalleryRequest() {
  offerImages.click();
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
  setPhotoFieldError(state.offerFiles.length < 1);

  if (filesToAdd.length < newFiles.length) {
    setPhotoFieldError(true);
    setFormState(`Puedes añadir hasta ${MAX_OFFER_PHOTOS} fotos.`, "error");
    return;
  }

  if (invalidFiles.length > 0) {
    setPhotoFieldError(true);
    setFormState("Cada foto debe ser JPG, PNG o WebP.", "error");
    return;
  }

  setPhotoFieldError(false);
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

async function preparePhotoForUpload(file) {
  try {
    return await optimizePhoto(file);
  } catch {
    // Si el WebView no puede decodificar la foto, dejamos que n8n la
    // normalice en servidor antes de guardarla. No se almacena el original.
    return file;
  }
}

async function handleOfferSubmit(event) {
  event.preventDefault();

  if (offerSubmitButton?.disabled) return;

  if (!offerForm.reportValidity()) {
    setFormState("Revisa los campos obligatorios.", "error");
    return;
  }

  if (state.offerFiles.length < 1) {
    setPhotoFieldError(true);
    setFormState("Añade al menos una foto para publicar.", "error");
    offerPhotoPicker?.focus({ preventScroll: false });
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

  if (auth?.isInitDataExpired?.()) {
    const refreshed = await refreshTelegramSession();
    if (!refreshed) {
      setFormState("La sesión de Telegram ha caducado. Cierra y vuelve a abrir esta mini app para continuar.", "error");
    }
    return;
  }

  if (offerSubmitButton) {
    offerSubmitButton.disabled = true;
    setOfferSubmitLoading(state.offerFiles.length ? "Optimizando…" : "Publicando…");
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

  setFormState("");

  try {
    const optimizedFiles = await Promise.all(state.offerFiles.map(preparePhotoForUpload));
    setOfferSubmitLoading("Publicando…");
    setFormState("");
    const result = await api.publishItem(payload, optimizedFiles);

    if (isPhotoRequiredError(result)) {
      setPhotoFieldError(true);
      setFormState("Añade al menos una foto para publicar.", "error");
      offerPhotoPicker?.focus({ preventScroll: false });
      return;
    }

    if (isTelegramInitDataExpired(result)) {
      const refreshed = await refreshTelegramSession();
      if (!refreshed) {
        setFormState("La sesión de Telegram ha caducado. Cierra y vuelve a abrir esta mini app para continuar.", "error");
      }
      return;
    }

    if (!result.ok || !result.item_id) {
      setFormState(result.error ?? "No se ha podido publicar.", "error");
      return;
    }

    const expiresAt = new Date(Date.now() + draftItem.duration_days * 24 * 60 * 60 * 1000).toISOString();
    const returnedImageUrls = Array.isArray(result.image_urls)
      ? result.image_urls.filter((url) => typeof url === "string" && url.trim())
      : [];
    const localImageUrls = result.image_url || returnedImageUrls.length
      ? []
      : optimizedFiles.map((file) => URL.createObjectURL(file));
    const publishedImageUrls = returnedImageUrls.length ? returnedImageUrls : localImageUrls;
    const publishedItem = {
      id: result.item_id,
      title: result.title || draftItem.title,
      description: draftItem.description,
      category: draftItem.category,
      zone: draftItem.zone,
      status: result.status || "available",
      createdAt: result.created_at ?? new Date().toISOString(),
      expiresAt,
      reservedAt: result.reserved_at ?? null,
      reservationExpiresAt: result.reservation_expires_at ?? null,
      ownerDisplayName: state.telegramUser?.first_name || "Tú",
      ownerUsername: state.telegramUser?.username || "",
      ownerTelegramId: String(state.telegramUser?.telegram_id ?? state.telegramUser?.id ?? ""),
      imageUrl: result.image_url ?? publishedImageUrls[0] ?? null,
      imageUrls: publishedImageUrls,
      interestCount: 0,
    };

    rememberOwnItem(publishedItem);
    removeSessionStorage(AUTH_REFRESH_STORAGE_KEY);
    offerForm.reset();
    resetOfferPhotos();
    api.invalidateCatalog?.();
    state.catalogRequestVersion += 1;
    state.catalogNeedsRefresh = true;
    state.items = [
      ...state.items.filter((item) => item.id !== publishedItem.id),
      publishedItem,
    ];
    renderCategories();
    renderItems();
    renderMyItems();
    showPublishSuccess(publishedItem);
  } catch (error) {
    if (isPhotoRequiredError(error)) {
      setPhotoFieldError(true);
      setFormState("Añade al menos una foto para publicar.", "error");
      offerPhotoPicker?.focus({ preventScroll: false });
      return;
    }
    if (isTelegramInitDataExpired(error)) {
      const refreshed = await refreshTelegramSession();
      if (!refreshed) {
        setFormState("La sesión de Telegram ha caducado. Cierra y vuelve a abrir esta mini app para continuar.", "error");
      }
      return;
    }
    setFormState(error.message || "No se ha podido publicar.", "error");
  } finally {
    if (offerSubmitButton) {
      offerSubmitButton.disabled = false;
      resetOfferSubmitButton();
    }
    offerForm.removeAttribute("aria-busy");
  }
}

function showPublishSuccess(item) {
  successItemTitle.textContent = item.title;
  successItemStatus.textContent = getItemStatusLabel(item);
  setView("publish-success");
}

function openDeleteItemDialog(item, triggerButton = deleteItemButton) {
  if (!item?.id || !deleteItemDialog) return;

  deleteDialogItem = item;
  deleteDialogTriggerButton = triggerButton;
  deleteItemDialogTitle.textContent = item.title || "esta publicación";
  deleteItemDialogCopy.textContent = item.status === "reserved"
    ? `«${item.title || "Esta publicación"}» dejará de aparecer en Segunda Vida y se cancelará su reserva. No se marcará como entregada.`
    : `«${item.title || "Esta publicación"}» dejará de aparecer en Segunda Vida. No se marcará como entregada.`;
  deleteItemDialogState.textContent = "";
  deleteItemDialogState.dataset.state = "";
  deleteItemDialogConfirm.disabled = false;
  deleteItemDialogConfirm.textContent = "Borrar publicación";

  if (typeof deleteItemDialog.showModal === "function") {
    deleteItemDialog.showModal();
  } else {
    deleteItemDialog.setAttribute("open", "");
  }
  deleteItemDialogCancel?.focus();
}

function closeDeleteItemDialog({ restoreFocus = true } = {}) {
  if (!deleteItemDialog) return;

  if (typeof deleteItemDialog.close === "function" && deleteItemDialog.open) {
    deleteItemDialog.close();
  } else {
    deleteItemDialog.removeAttribute("open");
  }

  const triggerButton = deleteDialogTriggerButton;
  deleteDialogItem = null;
  deleteDialogTriggerButton = null;
  if (restoreFocus && triggerButton?.isConnected) triggerButton.focus();
}

async function hideItem() {
  const item = deleteDialogItem;
  if (!item?.id || !deleteItemDialogConfirm) return;

  if (!auth?.hasInitData()) {
    deleteItemDialogState.textContent = "Abre la Mini App desde Telegram para gestionar esta publicación.";
    deleteItemDialogState.dataset.state = "error";
    return;
  }

  if (!api?.isCompleteConfigured || typeof api.completeItem !== "function") {
    deleteItemDialogState.textContent = "La opción de borrar todavía no está conectada en n8n.";
    deleteItemDialogState.dataset.state = "error";
    return;
  }

  deleteItemDialogConfirm.disabled = true;
  deleteItemDialogCancel.disabled = true;
  deleteItemDialogConfirm.textContent = "Borrando…";
  deleteItemDialogState.textContent = "";
  deleteItemDialogState.dataset.state = "pending";

  try {
    const result = await api.completeItem({
      initData: auth.getInitData(),
      item_id: item.id,
      action: "hide",
    });

    if (!result.ok) {
      throw new Error(result.error || "No se ha podido borrar la publicación.");
    }

    api.invalidateMine?.();
    api.invalidateCatalog?.();
    state.catalogRequestVersion += 1;
    state.catalogNeedsRefresh = true;
    state.items = state.items.filter((candidate) => candidate.id !== item.id);
    state.myItems = state.myItems.filter((candidate) => candidate.id !== item.id);
    saveOwnItems();
    renderItems();
    renderMyItems();
    closeDeleteItemDialog({ restoreFocus: false });
    setView("posts");
    if (postsActionState) {
      postsActionState.textContent = "Publicación borrada. Ya no aparece en Segunda Vida.";
      postsActionState.dataset.state = "success";
    }
  } catch (error) {
    deleteItemDialogConfirm.disabled = false;
    deleteItemDialogCancel.disabled = false;
    deleteItemDialogConfirm.textContent = "Borrar publicación";
    deleteItemDialogState.textContent = error.message || "No se ha podido borrar la publicación.";
    deleteItemDialogState.dataset.state = "error";
  }
}

async function manageItemAction(item, action, triggerButton, feedbackElement = detailActionState) {
  if (!item?.id) return;

  if (!auth?.hasInitData()) {
    feedbackElement.textContent = "Abre la Mini App desde Telegram para gestionar esta publicación.";
    feedbackElement.dataset.state = "error";
    return;
  }

  if (!api?.isCompleteConfigured || typeof api.completeItem !== "function") {
    feedbackElement.textContent = "La gestión de estados todavía no está conectada en n8n.";
    feedbackElement.dataset.state = "error";
    return;
  }

  triggerButton.disabled = true;
  triggerButton.textContent = "Guardando…";

  try {
    const result = await api.completeItem({
      initData: auth.getInitData(),
      item_id: item.id,
      action,
    });

    if (!result.ok) {
      throw new Error(result.error || "No se ha podido actualizar la publicación.");
    }

    api.invalidateMine?.();
    api.invalidateCatalog?.();
    state.catalogRequestVersion += 1;
    state.catalogNeedsRefresh = true;
    const fallbackStatus = action === "reserve"
      ? "reserved"
      : action === "release" || action === "reopen"
        ? "available"
        : "completed";
    const nextStatus = result.status || fallbackStatus;
    const updatedItem = {
      ...item,
      status: nextStatus,
      expiresAt: result.expires_at ?? item.expiresAt ?? null,
      reservedAt: nextStatus === "reserved"
        ? result.reserved_at ?? item.reservedAt ?? new Date().toISOString()
        : null,
      reservationExpiresAt: nextStatus === "reserved"
        ? result.reservation_expires_at ?? item.reservationExpiresAt ?? null
        : null,
      completedAt: nextStatus === "completed"
        ? result.completed_at || new Date().toISOString()
        : null,
    };
    state.items = ["available", "reserved"].includes(nextStatus)
      ? [...state.items.filter((candidate) => candidate.id !== item.id), updatedItem]
      : state.items.filter((candidate) => candidate.id !== item.id);
    rememberOwnItem(updatedItem);
    renderItems();
    renderMyItems();
    renderDetail(updatedItem);
  } catch (error) {
    triggerButton.disabled = false;
    if (action === "reserve" || action === "release") {
      configureStatusButton(triggerButton, item.status);
    } else {
      configureDeliveryButton(triggerButton, item.status);
    }
    feedbackElement.textContent = error.message || "No se ha podido actualizar la publicación.";
    feedbackElement.dataset.state = "error";
  }
}

async function completeItem(item, triggerButton = markDeliveredButton, feedbackElement = detailActionState) {
  const action = item?.status === "completed" ? "reopen" : "complete";
  return manageItemAction(item, action, triggerButton, feedbackElement);
}

function openTelegramChat(url) {
  const webApp = window.Telegram?.WebApp;

  if (typeof webApp?.openTelegramLink === "function") {
    try {
      webApp.openTelegramLink(url);
      return true;
    } catch {
      // Continuamos con el enlace normal como fallback.
    }
  }

  try {
    return Boolean(window.open(url, "_blank", "noopener,noreferrer"));
  } catch {
    return false;
  }
}

function showInterestFeedback(url) {
  detailActionState.replaceChildren();
  detailActionState.append(document.createTextNode("Si no aparece el chat, "));

  const link = document.createElement("a");
  link.className = "inline-action-link";
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "pulsa aquí para abrirlo";
  link.addEventListener("click", (event) => {
    const webApp = window.Telegram?.WebApp;
    if (typeof webApp?.openTelegramLink !== "function") return;

    event.preventDefault();
    openTelegramChat(url);
  });
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
  openTelegramChat(telegramUrl);
  showInterestFeedback(telegramUrl);
}

function openContactDialog(item = state.selectedItem, triggerButton = interestButton) {
  if (!item || isOwnItem(item) || !contactDialog) return;

  const username = normalizeTelegramUsername(item.ownerUsername);
  if (!username) {
    handleInterest();
    return;
  }

  contactDialogItem = item;
  contactDialogTriggerButton = triggerButton;
  contactDialogOwner.textContent = item.ownerDisplayName || "este vecino o vecina";

  if (typeof contactDialog.showModal === "function") {
    contactDialog.showModal();
  } else {
    contactDialog.setAttribute("open", "");
  }
  contactDialogCancel?.focus();
}

function closeContactDialog({ restoreFocus = true } = {}) {
  if (!contactDialog) return;

  if (typeof contactDialog.close === "function" && contactDialog.open) {
    contactDialog.close();
  } else {
    contactDialog.removeAttribute("open");
  }

  const triggerButton = contactDialogTriggerButton;
  contactDialogItem = null;
  contactDialogTriggerButton = null;
  if (restoreFocus && triggerButton?.isConnected) triggerButton.focus();
}

function confirmContactDialog() {
  const item = contactDialogItem;
  if (!item) return;

  const username = normalizeTelegramUsername(item.ownerUsername);
  if (!username) {
    closeContactDialog();
    handleInterest();
    return;
  }

  const telegramUrl = `https://t.me/${username}?text=${encodeURIComponent(getInterestMessage(item))}`;
  closeContactDialog({ restoreFocus: false });
  openTelegramChat(telegramUrl);
  showInterestFeedback(telegramUrl);
}

function setShareFeedback(message, stateName = "") {
  const feedbackElement = state.currentView === "detail" ? detailActionState : shareFeedback;
  if (!feedbackElement) return;
  feedbackElement.textContent = message;
  feedbackElement.dataset.state = stateName;
}

async function shareCurrentView() {
  const sharingItem = state.currentView === "detail" && state.selectedItem;
  const shareUrl = sharingItem ? getItemUrl(state.selectedItem) : getHomeUrl();
  const shareData = sharingItem
    ? {
      title: state.selectedItem.title,
      text: `${state.selectedItem.title} · Segunda Vida`,
      url: shareUrl,
    }
    : {
      title: "Segunda Vida · Aldea Pucela",
      text: "¿Tienes cosas por casa que ya no usas? Dales una segunda vida en Segunda Vida.",
      url: shareUrl,
    };

  try {
    const webApp = window.Telegram?.WebApp;
    if (typeof navigator.share === "function") {
      await navigator.share(shareData);
      return;
    }

    if (telegramRuntime.isTelegram && typeof webApp?.openTelegramLink === "function") {
      const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareData.text)}`;
      webApp.openTelegramLink(telegramShareUrl);
      setShareFeedback(sharingItem ? "Elige dónde compartir la publicación." : "Elige dónde compartir Segunda Vida.", "connected");
      return;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      setShareFeedback("Enlace copiado.", "connected");
      return;
    }

    throw new Error("share_unavailable");
  } catch (error) {
    if (error?.name === "AbortError") return;
    setShareFeedback("No se ha podido compartir ahora.", "error");
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
detailShare.addEventListener("click", shareCurrentView);
interestButton.addEventListener("click", () => openContactDialog(state.selectedItem));
contactDialogClose?.addEventListener("click", () => closeContactDialog());
contactDialogCancel?.addEventListener("click", () => closeContactDialog());
contactDialogConfirm?.addEventListener("click", confirmContactDialog);
contactDialog?.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeContactDialog();
});
contactDialog?.addEventListener("click", (event) => {
  if (event.target === contactDialog) closeContactDialog();
});
manageStatusButton.addEventListener("click", () => {
  const item = state.selectedItem;
  if (!item) return;
  const action = item.status === "reserved" ? "release" : "reserve";
  void manageItemAction(item, action, manageStatusButton);
});
markDeliveredButton.addEventListener("click", () => completeItem(state.selectedItem));
deleteItemButton.addEventListener("click", () => openDeleteItemDialog(state.selectedItem));
deleteItemDialogClose?.addEventListener("click", () => closeDeleteItemDialog());
deleteItemDialogCancel?.addEventListener("click", () => closeDeleteItemDialog());
deleteItemDialogConfirm?.addEventListener("click", () => void hideItem());
deleteItemDialog?.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeDeleteItemDialog();
});
deleteItemDialog?.addEventListener("click", (event) => {
  if (event.target === deleteItemDialog) closeDeleteItemDialog();
});
offerImages.addEventListener("change", handlePhotoSelection);
offerPhotoPicker?.addEventListener("click", handleGalleryRequest);
offerCamera?.addEventListener("change", handlePhotoSelection);
offerCameraButton?.addEventListener("click", handleCameraRequest);
cameraDialogClose?.addEventListener("click", closeCameraDialog);
cameraDialogCancel?.addEventListener("click", closeCameraDialog);
cameraCaptureButton?.addEventListener("click", () => {
  void captureCameraPhoto();
});
cameraDialog?.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeCameraDialog();
});
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
void restorePublishDraft();
checkIdentity();
loadCatalog();
