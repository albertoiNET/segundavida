import json
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from generate_static_pages import ContractError, generate, normalize_item  # noqa: E402


class StaticContractTests(unittest.TestCase):
    def setUp(self):
        self.template = ROOT / "index.html"
        self.site_url = "https://segundavida.aldeapucela.org"

    def item(self, status="available"):
        return {
            "public_id": "safe-001",
            "title": '<Silla> "azul"',
            "description": "Descripción con <script>alert(1)</script> & comillas.",
            "category": "Hogar",
            "zone": "Delicias",
            "status": status,
            "image_url": "javascript:alert(1)",
            "owner_display_name": "Vecindad",
            "owner_username": "vecino",
            "interest_count": 0,
        }

    def test_public_id_is_stable_and_legacy_alias_is_accepted(self):
        self.assertEqual(normalize_item({**self.item(), "item-id": "legacy-002"})["id"], "safe-001")
        legacy = {key: value for key, value in self.item().items() if key != "public_id"}
        legacy["item-id"] = "legacy-001"
        self.assertEqual(normalize_item(legacy)["id"], "legacy-001")

    def test_numeric_telegram_style_id_and_sensitive_data_are_rejected(self):
        with self.assertRaises(ContractError):
            normalize_item({**self.item(), "public_id": "2191395-1786900112374"})
        with self.assertRaises(ContractError):
            normalize_item({**self.item(), "public_id": "1786900112374"})
        with self.assertRaises(ContractError):
            normalize_item({**self.item(), "owner_telegram_id": "123456789"})

    def test_generates_pages_metadata_fallback_sitemap_and_safe_html(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            count = generate([normalize_item(self.item())], output, self.template, self.site_url)
            self.assertEqual(count, 1)
            page = (output / "i" / "safe-001" / "index.html").read_text(encoding="utf-8")
            self.assertIn('rel="canonical" href="https://segundavida.aldeapucela.org/i/safe-001/"', page)
            self.assertIn('property="og:image"', page)
            self.assertIn('property="og:image:alt"', page)
            self.assertIn('name="twitter:image:alt"', page)
            self.assertIn("summary_large_image", page)
            self.assertNotIn("segundavida-social-preview.jpg", page)
            self.assertIn("&lt;script&gt;alert(1)&lt;/script&gt;", page)
            self.assertNotIn("javascript:alert", page)
            self.assertNotIn("owner_telegram_id", page)
            self.assertNotIn("telegram_chat_id", page)
            self.assertNotIn("STATIC_HOME_METADATA", page)
            self.assertNotIn('property="og:title" content="Segunda Vida · Aldea Pucela"', page)
            self.assertTrue((output / "sitemap.xml").exists())
            self.assertTrue((output / "feed.xml").exists())
            self.assertTrue((output / "robots.txt").exists())
            self.assertTrue((output / "404.html").exists())
            fallback = (output / "404.html").read_text(encoding="utf-8")
            self.assertIn('data-page="not-found"', fallback)
            self.assertIn("Lo sentimos, no se ha encontrado lo que estabas buscando", fallback)

            embedded = page.split('id="static-item-data">', 1)[1].split("</script>", 1)[0]
            self.assertEqual(json.loads(embedded)["id"], "safe-001")

    def test_rss_feed_is_public_escaped_and_newest_first(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            items = [
                normalize_item({
                    **self.item(),
                    "public_id": "safe-old",
                    "title": "Antiguo & útil",
                    "created_at": "2026-08-15T10:00:00+02:00",
                    "image_url": None,
                }),
                normalize_item({
                    **self.item(),
                    "public_id": "safe-new",
                    "title": "Nuevo <objeto>",
                    "created_at": "2026-08-16T10:00:00+02:00",
                    "image_url": "https://images.example.test/new.jpg?a=1&b=2",
                }),
            ]
            generate(items, output, self.template, self.site_url)

            feed_source = (output / "feed.xml").read_text(encoding="utf-8")
            root = ET.fromstring(feed_source)
            feed_items = root.findall("./channel/item")
            self.assertEqual([item.findtext("title") for item in feed_items], ["Nuevo <objeto>", "Antiguo & útil"])
            self.assertEqual(
                feed_items[0].findtext("link"),
                "https://segundavida.aldeapucela.org/i/safe-new/",
            )
            self.assertEqual(feed_items[0].findtext("pubDate"), "Sun, 16 Aug 2026 08:00:00 GMT")
            self.assertIn("media:content", feed_source)
            self.assertIn("&lt;script&gt;alert(1)&lt;/script&gt;", feed_source)
            self.assertNotIn("owner_telegram_id", feed_source)

            self.assertIn('type="application/rss+xml"', (output / "i" / "safe-new" / "index.html").read_text(encoding="utf-8"))

    def test_homepage_has_social_metadata_and_image_urls_feed_item_preview(self):
        homepage = self.template.read_text(encoding="utf-8")
        self.assertIn('property="og:title"', homepage)
        self.assertIn('property="og:image"', homepage)
        self.assertIn("https://segundavida.aldeapucela.org/assets/segundavida-social-preview.jpg", homepage)
        self.assertIn('type="application/rss+xml"', homepage)
        fallback = (ROOT / "404.html").read_text(encoding="utf-8")
        self.assertIn("https://segundavida.aldeapucela.org/assets/segundavida-social-preview.jpg", fallback)
        self.assertIn('type="application/rss+xml"', fallback)

        item = normalize_item({
            **self.item(),
            "image_url": None,
            "image_urls": ["https://images.example.test/first.jpg"],
        })
        self.assertEqual(item["image_url"], "https://images.example.test/first.jpg")

    def test_supported_operational_statuses_are_renderable_but_hidden_is_not_public(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            items = [normalize_item({**self.item(), "public_id": f"safe-{index:03d}", "status": status})
                     for index, status in enumerate(("available", "reserved", "completed", "expired"), 1)]
            generate(items, output, self.template, self.site_url)
            for item in items:
                self.assertTrue((output / "i" / item["id"] / "index.html").exists())
            with self.assertRaises(ContractError):
                normalize_item({**self.item(), "status": "hidden"})

    def test_client_contract_keeps_old_endpoints_and_uses_clean_routes(self):
        api_source = (ROOT / "js" / "api.js").read_text(encoding="utf-8")
        app_source = (ROOT / "js" / "app.js").read_text(encoding="utf-8")
        for endpoint in ("/data", "/publish", "/complete", "/mine"):
            self.assertIn(endpoint, api_source)
        self.assertIn("N8N_ITEM_URL", api_source)
        self.assertIn("NOCODB_BASE_URL", api_source)
        self.assertIn("function asAttachmentList", api_source)
        self.assertIn("signedPath", api_source)
        self.assertIn("dltemp/", api_source)
        self.assertIn('error.code = "not_found"', api_source)
        self.assertIn('live: false, error: "api_unavailable"', app_source)
        self.assertIn("/i/${encodeURIComponent(item.id)}/", app_source)
        self.assertNotIn('url.hash = `item=', app_source)
        self.assertIn('body.append("payload"', api_source)
        self.assertIn('body.append(`photo_${index}`', api_source)
        self.assertIn("function handleCameraRequest", app_source)
        self.assertIn("navigator.mediaDevices.getUserMedia", app_source)
        self.assertIn("function captureCameraPhoto", app_source)
        self.assertIn("PHOTO_MAX_EDGE = 1280", app_source)
        self.assertIn("function createPhotoCarousel", app_source)
        self.assertIn("function renderReservedActionState", app_source)
        self.assertIn("Este objeto ya está reservado.", app_source)
        self.assertIn("Si no se entregara, el autor podría volver a publicarlo.", app_source)
        self.assertIn("function getRelatedItems", app_source)
        self.assertIn("function getReservationDurationDays", app_source)
        self.assertIn("reservation_days: normalizedReservationDays", app_source)
        self.assertIn("function getExplorationItems", app_source)
        self.assertIn("function createRelatedItemCard", app_source)
        self.assertIn("function renderRelatedItems", app_source)
        self.assertIn("function showRelatedCategory", app_source)
        self.assertIn('relatedItemsTitle.textContent = isFallback ? "Sigue explorando" : "Relacionados"', app_source)
        self.assertIn('state.statusFilter = "available"', app_source)
        self.assertIn('candidate.status === "available"', app_source)
        self.assertIn("renderRelatedItems(item)", app_source)
        self.assertIn("function sortNewestFirst", app_source)
        self.assertIn("function formatShortDateTime", app_source)
        self.assertIn("function isAdminUser", app_source)
        self.assertIn("function refreshSelectedDetailForIdentity", app_source)
        self.assertIn("const canManageItem = ownItem || adminUser", app_source)
        self.assertIn('const actionLabel = reserved ? "Liberar reserva" : "Está reservado";', app_source)
        self.assertIn('const actionLabel = completed ? "Volver a publicar" : "Está entregado";', app_source)
        self.assertIn('createIconElement("fa-trash-can", "⌫")', app_source)
        self.assertNotIn('document.createTextNode("Borrar objeto")', app_source)
        self.assertIn("createdAt: result.created_at ?? new Date().toISOString()", app_source)
        self.assertIn("const localImageUrls", app_source)
        self.assertIn("const catalogImageUrls = getItemImageUrls(item)", app_source)
        self.assertIn("function openTelegramChat", app_source)
        self.assertIn("function getTelegramMiniAppUrl", app_source)
        self.assertIn("function getTelegramStartView", app_source)
        self.assertIn(': getTelegramStartView() || getViewFromPath() || (isNotFoundPage ? "not-found" : "explore");', app_source)
        self.assertIn('getTelegramMiniAppUrl("offer")', app_source)
        self.assertIn('getTelegramMiniAppUrl("profile")', app_source)
        self.assertIn("function getHomeUrl", app_source)
        self.assertIn('offer: "/ofrecer/"', app_source)
        self.assertIn('posts: "/perfil/"', app_source)
        self.assertIn('favorites: "/favoritos/"', app_source)
        self.assertIn("function updateRouteMetadata", app_source)
        self.assertIn('trackPageView(pagePath)', app_source)
        self.assertIn("function shareCurrentView", app_source)
        self.assertIn("function copyTextToClipboard", app_source)
        self.assertIn('`${shareData.text}\\n\\n${shareUrl}`', app_source)
        self.assertIn('URL copiada al portapapeles', app_source)
        self.assertIn("Dales una segunda vida en Segunda Vida.", app_source)
        self.assertIn("https://t.me/share/url?url=", app_source)
        self.assertIn('pulsa aquí para abrirlo', app_source)
        self.assertIn('action: "hide"', app_source)
        self.assertIn('action = item.status === "reserved" ? "release" : "reserve"', app_source)
        self.assertIn('item.status === "reserved"', app_source)
        self.assertIn("function openDeleteItemDialog", app_source)
        self.assertIn("function hideItem", app_source)
        self.assertIn("createdAt", app_source)
        self.assertIn('"Optimizando…"', app_source)
        self.assertIn("state.offerFiles = [...state.offerFiles, ...filesToAdd]", app_source)
        index_source = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn('class="brand-subtitle">Aldea Pucela</span>', index_source)
        self.assertIn('aria-label="Ir a la portada de Segunda Vida Aldea Pucela"', index_source)
        self.assertIn('class="share-feedback" id="share-feedback"', index_source)
        self.assertIn('id="detail-share"', index_source)
        self.assertIn('id="favorites-view"', index_source)
        self.assertIn('id="favorites-explore-button"', index_source)
        self.assertIn('id="detail-favorite"', index_source)
        self.assertIn('data-view="favorites"', index_source)
        self.assertIn('id="related-items"', index_source)
        self.assertIn('href="/ofrecer/" data-view="offer"', index_source)
        self.assertIn('href="/perfil/" data-view="posts"', index_source)
        self.assertIn('href="/favoritos/" data-view="favorites"', index_source)
        self.assertIn('id="related-items-track"', index_source)
        self.assertIn("Ábreme desde Telegram", index_source)
        self.assertIn('class="filter-controls"', index_source)
        self.assertIn('id="status-filter"', index_source)
        self.assertIn('id="category-filter"', index_source)
        self.assertIn('id="status-filter-label"', index_source)
        self.assertIn('id="category-filter-label"', index_source)
        self.assertIn('id="status-filters"', index_source)
        self.assertIn('id="manage-status-button"', index_source)
        self.assertIn('id="offer-camera-button"', index_source)
        self.assertIn('id="camera-dialog"', index_source)
        self.assertIn('id="camera-preview"', index_source)
        self.assertIn('id="delete-item-button"', index_source)
        self.assertIn('id="delete-item-dialog"', index_source)
        self.assertIn('id="reserve-item-dialog"', index_source)
        self.assertIn('id="reserve-item-dialog-title"', index_source)
        self.assertIn('name="reserve-duration"', index_source)
        self.assertIn('value="custom"', index_source)
        self.assertIn('id="reserve-item-dialog-days"', index_source)
        self.assertIn('id="reserve-item-dialog-duration-copy"', index_source)
        self.assertIn('id="reserve-item-dialog-cancel"', index_source)
        self.assertIn('id="reserve-item-dialog-confirm"', index_source)
        self.assertIn('>Confirmar reserva</h2>', index_source)
        self.assertIn('Al hacer clic en Aceptar, este objeto quedará reservado durante las próximas 24 horas.', index_source)
        self.assertIn('Los usuarios no podrán contactarte mientras tanto.', index_source)
        self.assertIn('Al pasar 24 horas, volverá a estar disponible.', index_source)
        self.assertIn('quiet-action--delete', index_source)
        self.assertIn('id="detail-created-at"', index_source)
        self.assertIn('class="detail-meta"', index_source)
        self.assertNotIn('class="detail-facts"', index_source)
        self.assertLess(index_source.index('class="detail-subline"'), index_source.index('class="detail-meta"'))
        self.assertLess(index_source.index('id="detail-description"'), index_source.index('class="detail-meta"'))
        self.assertLess(index_source.index('class="detail-meta"'), index_source.index('id="interest-button"'))
        self.assertIn('fa-regular fa-message fa-icon', index_source)
        self.assertIn('fa-regular fa-user detail-meta__icon fa-icon', index_source)
        self.assertIn('fa-solid fa-location-dot detail-meta__icon fa-icon', index_source)
        self.assertNotIn('community-promo__link" href="https://aldeapucela.org/" target="_blank" rel="noopener noreferrer"><i', index_source)
        self.assertIn('id="contact-dialog"', index_source)
        self.assertIn('id="contact-dialog-confirm"', index_source)
        self.assertIn("nadie debe pedirte dinero", index_source)
        self.assertIn("function openContactDialog", app_source)
        self.assertIn("function confirmContactDialog", app_source)
        self.assertIn("function openReserveItemDialog", app_source)
        self.assertIn("function confirmReserveItemDialog", app_source)
        self.assertIn('openReserveItemDialog(item, manageStatusButton, detailActionState)', app_source)
        self.assertIn('interestButton.addEventListener("click", () => {', app_source)
        self.assertIn('trackEvent("share", "success", analyticsShareName)', app_source)
        self.assertIn('trackEvent("interest", "click", item.id)', app_source)
        self.assertIn('trackEvent("interest", "telegram-open", item.id)', app_source)
        self.assertIn('trackEvent("favorite", action, item.id)', app_source)
        self.assertIn('trackEvent("telegram", "open-mini-app", "offer")', app_source)
        self.assertIn('trackEvent("telegram", "open-mini-app", "posts")', app_source)
        self.assertNotIn('trackEvent("catalog", "open-item"', app_source)
        self.assertIn('capture="environment"', index_source)
        self.assertIn('class="catalog-intro catalog-hero"', index_source)
        self.assertIn("Si ya no lo usas", index_source)
        self.assertIn("¡Dale una segunda vida!", index_source)
        self.assertNotIn("Enlazando la web.", index_source)
        self.assertIn("segundavida-hero-bg.jpg", (ROOT / "css" / "app.css").read_text(encoding="utf-8"))
        app_css = (ROOT / "css" / "app.css").read_text(encoding="utf-8")
        self.assertIn(".detail-meta", app_css)
        self.assertIn("margin-top: 1.4rem", app_css)
        self.assertIn("padding-top: 1.15rem", app_css)
        self.assertIn(".detail-content > #interest-button", app_css)
        self.assertIn(".related-items__track", app_css)
        self.assertIn(".related-item-card", app_css)
        self.assertIn(".reserve-item-dialog", app_css)
        self.assertIn(".reserve-item-dialog__panel ul", app_css)
        self.assertIn(".reserve-item-dialog__options", app_css)
        self.assertIn(".action-state--reserved", app_css)
        self.assertIn(".detail-description:not([hidden]) + .detail-meta", app_css)
        self.assertIn("background: var(--bg-card-hover)", app_css)
        self.assertIn("justify-content: center", app_css)
        self.assertIn(".filter-control select option", app_css)
        self.assertIn("community-promo", index_source)
        self.assertIn("https://aldeapucela.org/", index_source)
        self.assertIn('href="https://t.me/pucelobot/segundavida?startapp=offer"', index_source)
        self.assertIn('href="https://t.me/pucelobot/segundavida?startapp=profile"', index_source)
        self.assertTrue((ROOT / "assets" / "aldea-pucela-mark.jpg").exists())
        fallback_source = (ROOT / "404.html").read_text(encoding="utf-8")
        self.assertIn('content="noindex, nofollow"', fallback_source)
        self.assertIn('href="/ofrecer/" data-view="offer"', fallback_source)
        self.assertIn('href="/perfil/" data-view="posts"', fallback_source)
        self.assertIn('id="favorites-view"', fallback_source)
        self.assertIn('id="detail-favorite"', fallback_source)
        self.assertIn('href="/favoritos/" data-view="favorites"', fallback_source)
        self.assertIn("Ábreme desde Telegram", fallback_source)
        self.assertIn('id="delete-item-button"', fallback_source)
        self.assertIn('id="delete-item-dialog"', fallback_source)
        self.assertIn('id="reserve-item-dialog"', fallback_source)
        self.assertIn('id="related-items"', fallback_source)
        self.assertIn('id="contact-dialog"', fallback_source)
        self.assertTrue((ROOT / "favoritos" / "index.html").exists())
        self.assertTrue((ROOT / "ofrecer" / "index.html").exists())
        self.assertTrue((ROOT / "perfil" / "index.html").exists())
        workflow_source = (ROOT / ".github" / "workflows" / "generate-static-pages.yml").read_text(encoding="utf-8")
        self.assertIn("favoritos ofrecer perfil generated-site/", workflow_source)
        for source in (
            index_source,
            fallback_source,
            app_source,
            (ROOT / "scripts" / "generate_static_pages.py").read_text(encoding="utf-8"),
        ):
            self.assertNotIn("SegundaVida", source)

    def test_publish_workflow_writes_opaque_public_id_and_keeps_legacy_alias(self):
        workflow = json.loads((ROOT / "docs" / "sv_publish_item.workflow.json").read_text(encoding="utf-8"))
        code = "\n".join(
            node.get("parameters", {}).get("jsCode", "") for node in workflow["nodes"]
        )
        self.assertIn("public_id: publicItemId", code)
        self.assertIn('"fieldName": "public_id"', json.dumps(workflow))
        self.assertIn("crypto.randomBytes(6)", code)

    def test_photo_publish_workflow_is_importable_and_has_binary_branch(self):
        workflow_path = ROOT / "docs" / "sv_publish_item_photos.workflow.json"
        workflow = json.loads(workflow_path.read_text(encoding="utf-8"))
        node_names = {node["name"] for node in workflow["nodes"]}
        self.assertIn("Webhook", node_names)
        self.assertIn("Has photos?", node_names)
        self.assertIn("Upload photo to NocoDB", node_names)
        workflow_text = json.dumps(workflow)
        self.assertIn("photo_[01]", workflow_text)
        self.assertNotIn("NOCODB_API_TOKEN", workflow_text)
        self.assertNotIn('"type": "n8n-nodes-base.httpRequest"', workflow_text)
        upload = next(node for node in workflow["nodes"] if node["name"] == "Upload photo to NocoDB")
        self.assertEqual(upload["type"], "n8n-nodes-base.nocoDb")
        self.assertEqual(upload["parameters"]["operation"], "upload")
        self.assertEqual(upload["parameters"]["uploadMode"], "base64")
        self.assertEqual(upload["parameters"]["uploadFieldName"]["value"], "photos")
        self.assertEqual(upload["credentials"]["nocoDbApiToken"]["name"], "NocoDB Token account")

    def test_complete_workflow_supports_owner_only_hide_without_deleting_rows(self):
        workflow_path = ROOT / "docs" / "sv_complete_item.workflow.json"
        workflow = json.loads(workflow_path.read_text(encoding="utf-8"))
        node_names = {node["name"] for node in workflow["nodes"]}
        workflow_text = json.dumps(workflow)
        code = "\n".join(
            node.get("parameters", {}).get("jsCode", "") for node in workflow["nodes"]
        )
        self.assertIn("'hide'", code)
        self.assertIn("'reserve'", code)
        self.assertIn("'release'", code)
        self.assertIn("reservation_expires_at", code)
        self.assertIn("reservation_days", code)
        self.assertIn("reservationDays", code)
        self.assertIn("status:nextStatus", code)
        self.assertIn("item_already_hidden", code)
        self.assertIn("owner_telegram_id", code)
        self.assertIn("Publicación borrada", code)
        self.assertIn("Dispatch static page regeneration", node_names)
        self.assertIn('"type": "n8n-nodes-base.github"', workflow_text)
        self.assertNotIn('"operation": "delete"', workflow_text)

    def test_reservation_expiry_workflow_is_hourly_and_clears_dates(self):
        workflow_path = ROOT / "docs" / "sv_expire_reservations.workflow.json"
        workflow = json.loads(workflow_path.read_text(encoding="utf-8"))
        self.assertIn("n8n-nodes-base.scheduleTrigger", {node["type"] for node in workflow["nodes"]})
        code = "\n".join(node.get("parameters", {}).get("jsCode", "") for node in workflow["nodes"])
        self.assertIn("reservation_expires_at", code)
        self.assertIn("status:'available'", code)
        self.assertIn("reserved_at:null", code)

    def test_private_contract_includes_reservation_dates(self):
        api_source = (ROOT / "js" / "api.js").read_text(encoding="utf-8")
        mine_workflow = json.loads((ROOT / "docs" / "sv_mine_items.workflow.json").read_text(encoding="utf-8"))
        mine_code = "\n".join(node.get("parameters", {}).get("jsCode", "") for node in mine_workflow["nodes"])
        self.assertIn("reservedAt", api_source)
        self.assertIn("reservationExpiresAt", api_source)
        self.assertIn("signed_path", mine_code)
        self.assertIn("dltemp/", mine_code)
        self.assertIn("reserved_at", mine_code)
        self.assertIn("reservation_expires_at", mine_code)

    def test_admin_permissions_contract_uses_n8n_data_table(self):
        docs = (ROOT / "docs" / "admin-permissions.md").read_text(encoding="utf-8")
        self.assertIn("Segunda Vida - Permisos", docs)
        self.assertIn("Data Table de n8n", docs)
        self.assertIn("2191395", docs)
        self.assertNotIn("tabla de NocoDB", docs)


if __name__ == "__main__":
    unittest.main()
