import json
import sys
import tempfile
import unittest
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
            self.assertNotIn("segundavida-social-preview.png", page)
            self.assertIn("&lt;script&gt;alert(1)&lt;/script&gt;", page)
            self.assertNotIn("javascript:alert", page)
            self.assertNotIn("owner_telegram_id", page)
            self.assertNotIn("telegram_chat_id", page)
            self.assertNotIn("STATIC_HOME_METADATA", page)
            self.assertNotIn('property="og:title" content="SegundaVida · Aldea Pucela"', page)
            self.assertTrue((output / "sitemap.xml").exists())
            self.assertTrue((output / "robots.txt").exists())
            self.assertTrue((output / "404.html").exists())

            embedded = page.split('id="static-item-data">', 1)[1].split("</script>", 1)[0]
            self.assertEqual(json.loads(embedded)["id"], "safe-001")

    def test_homepage_has_social_metadata_and_image_urls_feed_item_preview(self):
        homepage = self.template.read_text(encoding="utf-8")
        self.assertIn('property="og:title"', homepage)
        self.assertIn('property="og:image"', homepage)
        self.assertIn("https://segundavida.aldeapucela.org/assets/segundavida-social-preview.png", homepage)
        fallback = (ROOT / "404.html").read_text(encoding="utf-8")
        self.assertIn("https://segundavida.aldeapucela.org/assets/segundavida-social-preview.png", fallback)

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
                     for index, status in enumerate(("available", "completed", "expired"), 1)]
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
        self.assertIn("function sortNewestFirst", app_source)
        self.assertIn("function formatShortDateTime", app_source)
        self.assertIn("createdAt: result.created_at ?? new Date().toISOString()", app_source)
        self.assertIn("const localImageUrls", app_source)
        self.assertIn("const catalogImageUrls = getItemImageUrls(item)", app_source)
        self.assertIn("function openTelegramChat", app_source)
        self.assertIn('pulsa aquí para abrirlo', app_source)
        self.assertIn('action: "hide"', app_source)
        self.assertIn("function openDeleteItemDialog", app_source)
        self.assertIn("function hideItem", app_source)
        self.assertIn("createdAt", app_source)
        self.assertIn('"Optimizando…"', app_source)
        self.assertIn("state.offerFiles = [...state.offerFiles, ...filesToAdd]", app_source)
        index_source = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn('id="offer-camera-button"', index_source)
        self.assertIn('id="camera-dialog"', index_source)
        self.assertIn('id="camera-preview"', index_source)
        self.assertIn('id="delete-item-button"', index_source)
        self.assertIn('id="delete-item-dialog"', index_source)
        self.assertIn('quiet-action--delete', index_source)
        self.assertIn('id="detail-created-at"', index_source)
        self.assertIn('capture="environment"', index_source)
        self.assertIn("community-promo", index_source)
        self.assertIn("https://aldeapucela.org/", index_source)
        self.assertTrue((ROOT / "assets" / "aldea-pucela-mark.jpg").exists())
        fallback_source = (ROOT / "404.html").read_text(encoding="utf-8")
        self.assertIn('id="delete-item-button"', fallback_source)
        self.assertIn('id="delete-item-dialog"', fallback_source)

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
        self.assertIn("status: nextStatus", code)
        self.assertIn("item_already_hidden", code)
        self.assertIn("owner_telegram_id", code)
        self.assertIn("Publicación borrada", code)
        self.assertIn("Dispatch static page regeneration", node_names)
        self.assertIn('"type": "n8n-nodes-base.github"', workflow_text)
        self.assertNotIn('"operation": "delete"', workflow_text)


if __name__ == "__main__":
    unittest.main()
