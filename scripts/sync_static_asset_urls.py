#!/usr/bin/env python3
"""Update shared asset URLs in previously generated public item pages."""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


QUOTED_URL = re.compile(r'''(?P<quote>["'])(?P<url>/(?:assets|css|js)/[^"']+)(?P=quote)''')


def add_asset_version(url: str, version: str | None) -> str:
    if not version:
        return url

    parsed = urlsplit(url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    query["v"] = version
    return urlunsplit(parsed._replace(query=urlencode(query)))


def asset_urls_from_template(template_path: Path, version: str | None = None) -> dict[str, str]:
    template = template_path.read_text(encoding="utf-8")
    urls: dict[str, str] = {}
    for match in QUOTED_URL.finditer(template):
        url = match.group("url")
        urls[urlsplit(url).path] = add_asset_version(url, version)
    if not urls:
        raise ValueError(f"No shared asset URLs found in {template_path}")
    return urls


def sync_asset_urls(site_path: Path, template_path: Path, version: str | None = None) -> int:
    current_urls = asset_urls_from_template(template_path, version)
    changed_files = 0

    for html_path in site_path.rglob("*.html"):
        original = html_path.read_text(encoding="utf-8")

        def replace(match: re.Match[str]) -> str:
            url = match.group("url")
            current_url = current_urls.get(urlsplit(url).path)
            if not current_url:
                return match.group(0)
            return f'{match.group("quote")}{current_url}{match.group("quote")}'

        updated = QUOTED_URL.sub(replace, original)
        if updated == original:
            continue
        html_path.write_text(updated, encoding="utf-8")
        changed_files += 1

    return changed_files


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--site", type=Path, required=True)
    parser.add_argument("--template", type=Path, default=Path("index.html"))
    parser.add_argument("--version")
    args = parser.parse_args()

    changed_files = sync_asset_urls(args.site, args.template, args.version)
    print(f"Updated shared asset URLs in {changed_files} HTML files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
