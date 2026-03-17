#!/usr/bin/env python3
import functools
import http.server
import mimetypes
import os
import socketserver
from pathlib import Path

mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("font/woff", ".woff")
mimetypes.add_type("font/ttf", ".ttf")
mimetypes.add_type("font/eot", ".eot")
mimetypes.add_type("font/otf", ".otf")

PORT = int(os.environ.get("PORT", "8080"))
DIRECTORY = Path(__file__).resolve().parent / "dist"


class StaticRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, directory=None, **kwargs):
        super().__init__(*args, directory=directory or str(DIRECTORY), **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()


class ThreadingTCPServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


def main():
    if not DIRECTORY.exists():
        raise SystemExit(f"Static directory not found: {DIRECTORY}")

    handler = functools.partial(StaticRequestHandler, directory=str(DIRECTORY))
    with ThreadingTCPServer(("", PORT), handler) as httpd:
        print(f"Serving {DIRECTORY} at http://localhost:{PORT}")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
