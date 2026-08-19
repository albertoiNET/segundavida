"""Serve the static app locally with history fallbacks for deep links."""

from __future__ import annotations

import argparse
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
PROFILE_ROUTE = re.compile(r"^/u/[^/]+/?$", re.IGNORECASE)
DETAIL_ROUTE = re.compile(r"^/i/[^/]+/?$", re.IGNORECASE)


def resolve_request_path(request_path: str, root: Path = ROOT) -> str:
    """Map client-side routes to files while preserving generated item pages."""

    pathname = urlsplit(request_path).path or "/"
    if PROFILE_ROUTE.fullmatch(pathname):
        return "/u/index.html"

    if DETAIL_ROUTE.fullmatch(pathname):
        candidate = (root / pathname.lstrip("/")).resolve()
        try:
            candidate.relative_to(root.resolve())
        except ValueError:
            return "/index.html"
        if candidate.is_dir() and (candidate / "index.html").is_file():
            return pathname
        return "/index.html"

    return pathname


class StaticRouteHandler(SimpleHTTPRequestHandler):
    """Simple server with the same route fallback used by the static host."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def translate_path(self, path: str) -> str:
        return super().translate_path(resolve_request_path(path))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("port", nargs="?", type=int, default=8000)
    parser.add_argument("--bind", default="127.0.0.1")
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.bind, args.port), StaticRouteHandler)
    print(f"Sirviendo Segunda Vida en http://{args.bind}:{args.port}/")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
