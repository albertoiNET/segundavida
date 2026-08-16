// Punto de entrada del frontend de SegundaVida.
document.documentElement.classList.add("app-ready");

const telegramRuntime = window.SecondaVidaTelegram ?? {
  isTelegram: false,
  sdkAvailable: false,
};

const auth = window.SecondaVidaAuth;
const api = window.SecondaVidaApi;
const CONSENT_VERSION = "sv-publish-2026-08-16-v1";
const state = {
  items: [],
  category: "Todo",
  query: "",
  selectedItem: null,
  offerFiles: [],
  telegramUser: null,
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
const detailBack = document.querySelector("#detail-back");
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
const telegramAuthCard = document.querySelector("#telegram-auth-card");
const telegramAuthBadge = document.querySelector("#telegram-auth-badge");
const telegramAuthMessage = document.querySelector("#telegram-auth-message");
const telegramOpenLink = document.querySelector("#telegram-open-link");
const offerTelegramUsername = document.querySelector("#offer-telegram-username");
const offerForm = document.querySelector("#offer-form");
const offerImages = document.querySelector("#offer-images");
const offerPreview = document.querySelector("#offer-preview");
const offerFormState = document.querySelector("#offer-form-state");
const offerConsent = document.querySelector("#offer-consent");
const navItems = [...document.querySelectorAll(".nav-item")];

const categorySymbols = {
  Hogar: "⌂",
  Infantil: "☺",
  Libros: "▤",
  Tecnología: "⌘",
  Ropa: "◌",
  Otros: "♻",
};

function setServiceState(element, label, stateName, text) {
  element.dataset.state = stateName;
  label.textContent = text;
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

function normalizeTelegramUsername(value) {
  const username = String(value ?? "").trim().replace(/^@/, "");
  return /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(username) ? username : "";
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
    const placeholder = createTextElement(
      "div",
      "item-card__placeholder",
      categorySymbols[item.category] ?? categorySymbols.Otros,
    );
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
  category.textContent = `${categorySymbols[item.category] ?? "♻"} ${item.category}`;
  meta.append(category);

  if (item.zone) {
    meta.append(createTextElement("span", "", `⌖ ${item.zone}`));
  }
  body.append(meta);

  const footer = document.createElement("div");
  footer.className = "item-card__footer";
  const availability = item.expiresAt
    ? `Disponible hasta ${formatDate(item.expiresAt)}`
    : "Disponible";
  footer.append(createTextElement("span", "availability", availability));
  footer.append(createTextElement("span", "item-card__arrow", "→"));
  body.append(footer);

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
    const placeholder = createTextElement(
      "div",
      "detail-media__placeholder",
      categorySymbols[item.category] ?? categorySymbols.Otros,
    );
    placeholder.setAttribute("aria-hidden", "true");
    detailMedia.append(placeholder);
  }

  detailAvailability.textContent = item.expiresAt
    ? `Disponible hasta ${formatDate(item.expiresAt)}`
    : "Disponible";
  detailTitle.textContent = item.title;
  detailCategory.textContent = `${categorySymbols[item.category] ?? "♻"} ${item.category}`;
  detailDescription.textContent = item.description || "La persona que lo ofrece todavía no ha añadido una descripción.";
  detailZone.textContent = item.zone || "Valladolid";
  detailOwner.textContent = item.ownerDisplayName || "Vecindad";
  const ownerUsername = normalizeTelegramUsername(item.ownerUsername);
  interestButton.disabled = !ownerUsername;
  interestButton.textContent = "Me interesa";
  interestButton.setAttribute(
    "aria-label",
    ownerUsername ? `Contactar con ${item.ownerDisplayName || "la persona anunciante"} por Telegram` : "Contacto no disponible",
  );
  detailActionState.textContent = ownerUsername
    ? "Se abrirá el chat de Telegram de quien lo ofrece."
    : "El anunciante todavía no ha añadido un usuario público de Telegram.";
  detailActionState.dataset.state = ownerUsername ? "" : "error";
}

function showDetail(item) {
  renderDetail(item);
  setView("detail");
  window.history.pushState({}, "", `#item=${encodeURIComponent(item.id)}`);
  window.SecondaVidaAnalytics?.trackEvent("catalog", "open-item", item.id);
}

function setView(viewName) {
  const isExplore = viewName === "explore";
  const isOffer = viewName === "offer";
  const isPosts = viewName === "posts";
  const isDetail = viewName === "detail";

  catalogIntro.hidden = !isExplore;
  catalogTools.hidden = !isExplore;
  catalogSection.hidden = !isExplore;
  offerView.hidden = !isOffer;
  postsView.hidden = !isPosts;
  detailView.hidden = !isDetail;

  if (isOffer) configureOfferAuth();

  if (!isDetail && window.location.hash.startsWith("#item=")) {
    window.history.replaceState({}, "", window.location.pathname + window.location.search);
  }

  navItems.forEach((button) => {
    const selected = button.dataset.view === viewName;
    button.toggleAttribute("aria-current", selected);
    if (!selected) button.removeAttribute("aria-current");
  });

  window.SecondaVidaAnalytics?.trackPageView(`#${viewName}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
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
    itemsState.textContent = "El catálogo todavía no está configurado.";
    itemsState.dataset.state = "error";
    return;
  }

  try {
    const records = await api.listItems();
    state.items = records.filter((item) => item.status === "available" && isNotExpired(item));
    renderCategories();
    renderItems();
    openItemFromHash();
  } catch {
    itemsState.textContent = "No hemos podido cargar los objetos. Inténtalo de nuevo en unos instantes.";
    itemsState.dataset.state = "error";
    itemsCount.textContent = "Sin datos";
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

  const item = state.items.find((candidate) => candidate.id === itemId);
  if (item) showDetail(item);
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

  telegramAuthCard.dataset.state = verified ? "connected" : "error";
  telegramAuthBadge.textContent = verified ? "Verificada" : "Solo Telegram";
  telegramOpenLink.hidden = verified;

  if (verified) {
    const username = normalizeTelegramUsername(user.username);
    offerTelegramUsername.value = username ? `@${username}` : "Sin usuario público";
    offerTelegramUsername.readOnly = true;
    telegramAuthMessage.textContent = "Identidad verificada. Este usuario se asociará a la publicación.";
    setOfferFormEnabled(true);
    return;
  }

  offerTelegramUsername.value = "";
  offerTelegramUsername.readOnly = true;
  telegramAuthMessage.textContent = auth?.hasInitData()
    ? "No hemos podido verificar tu identidad. Vuelve a abrir la Mini App desde Telegram."
    : "Este formulario solo está disponible dentro de la Mini App de Telegram.";
  setOfferFormEnabled(false);
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

  state.offerFiles = validFiles.slice(0, 5);
  renderPhotoPreview(state.offerFiles);

  if (files.length > 5) {
    setFormState("Puedes añadir hasta 5 fotos.", "error");
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
  const payload = {
    initData: auth.getInitData(),
    item: {
      title: String(formData.get("title") ?? "").trim(),
      category: String(formData.get("category") ?? ""),
      zone: String(formData.get("zone") ?? ""),
      description: String(formData.get("description") ?? "").trim(),
      duration_days: Number(formData.get("duration") ?? 14),
    },
    consent: {
      accepted: offerConsent.checked,
      version: CONSENT_VERSION,
    },
  };

  setFormState("Publicando…", "pending");

  try {
    const result = await api.publishItem(payload);

    if (!result.ok) {
      setFormState(result.error ?? "No se ha podido publicar.", "error");
      return;
    }

    offerForm.reset();
    state.offerFiles = [];
    offerPreview.replaceChildren();
    setFormState("Publicado. Ya aparece en el catálogo.", "connected");
    await loadCatalog();
  } catch (error) {
    setFormState(error.message || "No se ha podido publicar.", "error");
  }
}

function handleInterest() {
  const username = normalizeTelegramUsername(state.selectedItem?.ownerUsername);
  if (!username) {
    detailActionState.textContent = "El anunciante todavía no tiene un contacto público disponible.";
    detailActionState.dataset.state = "error";
    return;
  }

  const telegramUrl = `https://t.me/${username}`;
  const webApp = window.Telegram?.WebApp;

  if (typeof webApp?.openTelegramLink === "function") {
    webApp.openTelegramLink(telegramUrl);
    return;
  }

  window.open(telegramUrl, "_blank", "noopener,noreferrer");
}

async function shareSelectedItem() {
  if (!state.selectedItem) return;

  const shareData = {
    title: state.selectedItem.title,
    text: `${state.selectedItem.title} · SegundaVida`,
    url: window.location.href,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    await navigator.clipboard.writeText(window.location.href);
    detailActionState.textContent = "Enlace copiado.";
    detailActionState.dataset.state = "connected";
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

if (api?.isConfigured) {
  n8nStatusLabel.textContent = "Comprobando...";

  api.ping().then((result) => {
    if (result.ok && result.service === "SegundaVida") {
      setServiceState(n8nStatus, n8nStatusLabel, "connected", "Conectado ✓");
      return;
    }

    setServiceState(n8nStatus, n8nStatusLabel, "error", "Respuesta no válida");
  }).catch(() => {
    setServiceState(n8nStatus, n8nStatusLabel, "error", "No disponible");
  });
}

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderItems();
});

navItems.forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

detailBack.addEventListener("click", () => setView("explore"));
detailShare.addEventListener("click", shareSelectedItem);
interestButton.addEventListener("click", handleInterest);
offerImages.addEventListener("change", handlePhotoSelection);
offerForm.addEventListener("submit", handleOfferSubmit);

window.SecondaVidaAnalytics?.trackPageView();
configureOfferAuth();
checkIdentity();
loadCatalog();
