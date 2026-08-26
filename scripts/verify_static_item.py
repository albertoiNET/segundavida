#!/usr/bin/env python3
"""Verify that one generated Segunda Vida item page is complete and public."""

from __future__ import annotations

import argparse
import re
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from urllib.request import Request, urlopen


PUBLIC_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{6,80}$")


def validate_item_id(item_id: str) -> str:
    value = item_id.strip()
    if not PUBLIC_ID_PATTERN.fullmatch(value):
        raise ValueError("item_id must be an opaque 6-80 character token")
    return value


def page_is_ready(item_id: str, body: str, status_code: int) -> bool:
    compact_id = '"id":"' + item_id + '"'
    spaced_id = '"id": "' + item_id + '"'
    return (
        200 <= status_code < 300
        and 'id="static-item-data"' in body
        and (compact_id in body or spaced_id in body)
        and 'property="og:image"' in body
    )


def local_page(site_dir: Path, item_id: str) -> tuple[int, str]:
    page = site_dir / "i" / item_id / "index.html"
    if not page.is_file():
        return 404, ""
    return 200, page.read_text(encoding="utf-8")


def add_cache_bust(url: str, value: str) -> str:
    parts = urlsplit(url)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    query["sv_verify"] = value
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


def remote_page(url: str, attempt: int) -> tuple[int, str]:
    request = Request(
        add_cache_bust(url, str(attempt)),
        headers={"Accept": "text/html", "Cache-Control": "no-cache", "Pragma": "no-cache"},
    )
    try:
        with urlopen(request, timeout=15) as response:  # noqa: S310 - URL is an explicit operator input.
            return int(response.status), response.read().decode("utf-8", errors="replace")
    except HTTPError as error:
        return int(error.code), error.read().decode("utf-8", errors="replace")
    except URLError:
        return 0, ""


def verify_local(site_dir: Path, item_id: str) -> int:
    status_code, body = local_page(site_dir, item_id)
    if page_is_ready(item_id, body, status_code):
        return 0
    print(f"Generated page is missing or incomplete for {item_id}", file=sys.stderr)
    return 1


def verify_remote(url: str, item_id: str, attempts: int, interval: float) -> int:
    for attempt in range(1, attempts + 1):
        status_code, body = remote_page(url, attempt)
        if page_is_ready(item_id, body, status_code):
            print(f"Public page is ready for {item_id} on attempt {attempt}")
            return 0
        if attempt < attempts:
            time.sleep(interval)
    print(f"Public page was not ready for {item_id} after {attempts} attempts", file=sys.stderr)
    return 1


def main() -> int:
    parser = argparse.ArgumentParser()
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--site-dir", type=Path)
    source.add_argument("--url")
    parser.add_argument("--item-id", required=True)
    parser.add_argument("--attempts", type=int, default=1)
    parser.add_argument("--interval", type=float, default=10)
    args = parser.parse_args()

    try:
        item_id = validate_item_id(args.item_id)
    except ValueError as error:
        print(str(error), file=sys.stderr)
        return 2

    if args.site_dir:
        return verify_local(args.site_dir, item_id)
    if args.attempts < 1 or args.interval < 0:
        print("attempts must be positive and interval cannot be negative", file=sys.stderr)
        return 2
    return verify_remote(args.url, item_id, args.attempts, args.interval)


if __name__ == "__main__":
    raise SystemExit(main())
