#!/usr/bin/env python3
"""Generate deterministic, public-only HTML pages for SegundaVida."""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from pathlib import Path
from urllib.parse import quote, urlparse
from urllib.request import Request, urlopen


SENSITIVE_KEYS = {
    "telegram_id",
    "owner_telegram_id",
    "chat_id",
    "telegram_chat_id",
    "thread_id",
    "telegram_thread_id",
    "telegram_message_id",
    "initdata",
    "init_data",
    "secret",
    "token",
}
PUBLIC_ID_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{5,79}$")
TELEGRAM_DERIVED_ID_PATTERN = re.compile(r"^(?:\d{6,80}|\d+(?:[-_]\d+)+)$")


class ContractError(ValueError):
    """Raised when input cannot safely become public HTML."""


def fail(message: str) -> ContractError:
    return ContractError(message)


def has_sensitive_key(value: object) -> str | None:
    if isinstance(value, dict):
        for key, nested in value.items():
            normalized = str(key).lower().replace("-", "_")
            if normalized in SENSITIVE_KEYS:
                return str(key)
            found = has_sensitive_key(nested)
            if found:
                return found
    elif isinstance(value, list):
        for nested in value:
            found = has_sensitive_key(nested)
            if found:
                return found
    return None


def safe_public_id(value: object) -> str:
    public_id = str(value or "").strip()
    if not PUBLIC_ID_PATTERN.fullmatch(public_id):
        raise fail("public_id must be an opaque 6-80 character token")
    if TELEGRAM_DERIVED_ID_PATTERN.fullmatch(public_id):
        raise fail("public_id looks derived from a numeric Telegram identifier")
    return public_id


def safe_image_url(value: object, fallback: str) -> str:
    candidate = str(value or "").strip()
    parsed = urlparse(candidate)
    if parsed.scheme in {"http", "https"} and parsed.netloc:
        return candidate
    return fallback


def first_safe_image_url(*values: object) -> str | None:
    for value in values:
        candidates = value if isinstance(value, list) else [value]
        for candidate in candidates:
            if isinstance(candidate, dict):
                candidate = (
                    candidate.get("url")
                    or candidate.get("signedUrl")
                    or candidate.get("signed_url")
                )
            image_url = safe_image_url(candidate, "")
            if image_url:
                return image_url
    return None


def normalize_item(raw: dict[str, object]) -> dict[str, object]:
    if not isinstance(raw, dict):
        raise fail("each item must be an object")
    sensitive_key = has_sensitive_key(raw)
    if sensitive_key:
        raise fail(f"sensitive field is not allowed in public input: {sensitive_key}")

    public_id = raw.get("public_id") or raw.get("item-id") or raw.get("item_id") or raw.get("id")
    public_id = safe_public_id(public_id)
    status = str(raw.get("status") or "available").strip().lower()
    if status not in {"available", "completed", "expired"}:
        raise fail(f"unsupported public status for {public_id}: {status}")

    return {
        "id": public_id,
        "title": str(raw.get("title") or "Objeto de SegundaVida").strip()[:160],
        "description": str(raw.get("description") or "").strip()[:1000],
        "category": str(raw.get("category") or "Otros").strip()[:80],
        "zone": str(raw.get("zone") or "Valladolid").strip()[:120],
        "status": status,
        "created_at": raw.get("created_at") or raw.get("CreatedAt") or None,
        "expires_at": raw.get("expires_at") or None,
        "image_url": first_safe_image_url(raw.get("image_url"), raw.get("image_urls")),
        "owner_display_name": str(raw.get("owner_display_name") or "Vecindad").strip()[:120],
        "owner_username": str(raw.get("owner_username") or "").strip()[:40],
        "interest_count": int(raw.get("interest_count") or 0),
    }


def load_items(input_path: str | None, source_url: str | None) -> list[dict[str, object]]:
    if bool(input_path) == bool(source_url):
        raise fail("provide exactly one of --input or --source-url")

    if source_url:
        request = Request(source_url, headers={"Accept": "application/json"})
        with urlopen(request, timeout=30) as response:  # noqa: S310 - URL is an explicit operator input.
            payload = json.load(response)
    elif input_path == "-":
        payload = json.load(sys.stdin)
    else:
        payload = json.loads(Path(input_path).read_text(encoding="utf-8"))

    raw_items = payload if isinstance(payload, list) else payload.get("items", []) if isinstance(payload, dict) else []
    if not isinstance(raw_items, list):
        raise fail("input must be an array or an object with items")

    normalized = [normalize_item(item) for item in raw_items]
    return sorted(normalized, key=lambda item: str(item["id"]))


def json_for_script(item: dict[str, object], site_url: str) -> str:
    safe_item = dict(item)
    safe_item["image_url"] = safe_image_url(
        item.get("image_url"),
        f"{site_url.rstrip('/')}/assets/segundavida-mark.png",
    )
    value = json.dumps(safe_item, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return value.replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")


def canonical_url(site_url: str, public_id: str) -> str:
    return f"{site_url.rstrip('/')}/i/{quote(public_id, safe='')}/"


def render_metadata(item: dict[str, object], site_url: str) -> str:
    title = f"{item['title']} · SegundaVida"
    description = (item["description"] or f"{item['title']} disponible en SegundaVida, Aldea Pucela.")[:200]
    canonical = canonical_url(site_url, str(item["id"]))
    fallback_image = f"{site_url.rstrip('/')}/assets/segundavida-mark.png"
    image = safe_image_url(item.get("image_url"), fallback_image)
    fields = [
        f'<meta name="description" content="{html.escape(description, quote=True)}" />',
        f'<link rel="canonical" href="{html.escape(canonical, quote=True)}" />',
        f'<meta property="og:type" content="website" />',
        f'<meta property="og:locale" content="es_ES" />',
        f'<meta property="og:site_name" content="SegundaVida · Aldea Pucela" />',
        f'<meta property="og:title" content="{html.escape(title, quote=True)}" />',
        f'<meta property="og:description" content="{html.escape(description, quote=True)}" />',
        f'<meta property="og:url" content="{html.escape(canonical, quote=True)}" />',
        f'<meta property="og:image" content="{html.escape(image, quote=True)}" />',
        f'<meta property="og:image:alt" content="{html.escape(str(item["title"]), quote=True)}" />',
        f'<meta name="twitter:card" content="summary_large_image" />',
        f'<meta name="twitter:title" content="{html.escape(title, quote=True)}" />',
        f'<meta name="twitter:description" content="{html.escape(description, quote=True)}" />',
        f'<meta name="twitter:image" content="{html.escape(image, quote=True)}" />',
        f'<meta name="twitter:image:alt" content="{html.escape(str(item["title"]), quote=True)}" />',
    ]
    return "\n    ".join(fields)


def render_fallback(item: dict[str, object], site_url: str) -> str:
    image = safe_image_url(item.get("image_url"), f"{site_url.rstrip('/')}/assets/segundavida-mark.png")
    description = item["description"] or "Consulta la disponibilidad actual en SegundaVida."
    return (
        "<noscript>\n"
        '  <article class="static-item-fallback" itemscope itemtype="https://schema.org/Product">\n'
        f'    <img src="{html.escape(image, quote=True)}" alt="" itemprop="image" />\n'
        f'    <h1 itemprop="name">{html.escape(str(item["title"]))}</h1>\n'
        f'    <p itemprop="description">{html.escape(description)}</p>\n'
        f'    <p>{html.escape(str(item["category"]))} · {html.escape(str(item["zone"]))}</p>\n'
        '    <p>La disponibilidad se comprueba al abrir la publicación.</p>\n'
        "  </article>\n"
        "</noscript>"
    )


def render_page(template: str, item: dict[str, object], site_url: str) -> str:
    title = html.escape(f"{item['title']} · SegundaVida")
    page = re.sub(r"<title>.*?</title>", f"<title>{title}</title>", template, count=1, flags=re.DOTALL)
    page = re.sub(r"\s*<meta\s+name=\"description\"[^>]*?/>", "", page, count=1)
    page = re.sub(
        r"\s*<!-- STATIC_HOME_METADATA -->.*?<!-- END_STATIC_HOME_METADATA -->",
        "",
        page,
        count=1,
        flags=re.DOTALL,
    )
    page = page.replace("<!-- STATIC_ITEM_METADATA -->", render_metadata(item, site_url))
    page = page.replace(
        "<!-- STATIC_ITEM_DATA -->",
        f'<script type="application/json" id="static-item-data">{json_for_script(item, site_url)}</script>',
    )
    page = page.replace("<!-- STATIC_ITEM_FALLBACK -->", render_fallback(item, site_url))
    return page


def write_text(path: Path, value: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(value.replace("\r\n", "\n"), encoding="utf-8")


def generate(items: list[dict[str, object]], output_dir: Path, template_path: Path, site_url: str) -> int:
    template = template_path.read_text(encoding="utf-8")
    output_dir.mkdir(parents=True, exist_ok=True)
    for item in items:
        page_path = output_dir / "i" / str(item["id"]) / "index.html"
        write_text(page_path, render_page(template, item, site_url))

    urls = [f"{site_url.rstrip('/')}/"] + [canonical_url(site_url, str(item["id"])) for item in items]
    sitemap = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n"
    sitemap += "".join(f"  <url><loc>{html.escape(url)}</loc></url>\n" for url in urls)
    sitemap += "</urlset>\n"
    write_text(output_dir / "sitemap.xml", sitemap)
    write_text(output_dir / "robots.txt", "User-agent: *\nAllow: /\nSitemap: " + site_url.rstrip("/") + "/sitemap.xml\n")
    write_text(output_dir / "404.html", template)
    return len(items)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--input", help="JSON file, or - for stdin")
    source.add_argument("--source-url", help="Public JSON endpoint returning items")
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--template", type=Path, default=Path("index.html"))
    parser.add_argument("--site-url", default="https://segundavida.aldeapucela.org")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        items = load_items(args.input, args.source_url)
        count = generate(items, args.output_dir, args.template, args.site_url)
    except (ContractError, OSError, ValueError, json.JSONDecodeError) as error:
        print(f"generate_static_pages: {error}", file=sys.stderr)
        return 2
    print(f"Generated {count} public item page(s) in {args.output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
