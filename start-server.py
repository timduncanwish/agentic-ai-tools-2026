#!/usr/bin/env python3
import argparse
import functools
import http.server
import mimetypes
import os
import shutil
import socketserver
import subprocess
from pathlib import Path

mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("font/woff", ".woff")
mimetypes.add_type("font/ttf", ".ttf")
mimetypes.add_type("font/eot", ".eot")
mimetypes.add_type("font/otf", ".otf")

ROOT_DIR = Path(__file__).resolve().parent
DIST_DIR = ROOT_DIR / "dist"
DEFAULT_PORT = int(os.environ.get("PORT", "8080"))


class StaticRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, directory=None, **kwargs):
        super().__init__(*args, directory=directory or str(DIST_DIR), **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()


class ThreadingTCPServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


def parse_args():
    parser = argparse.ArgumentParser(
        description="Start the Agentic AI Tools preview server."
    )
    parser.add_argument(
        "--port",
        type=int,
        default=DEFAULT_PORT,
        help=f"Port to bind. Defaults to PORT or {DEFAULT_PORT}.",
    )
    parser.add_argument(
        "--static-only",
        action="store_true",
        help="Serve dist/ without the Node API server.",
    )
    return parser.parse_args()


def run_static_server(port):
    if not DIST_DIR.exists():
        raise SystemExit(f"Static directory not found: {DIST_DIR}")

    handler = functools.partial(StaticRequestHandler, directory=str(DIST_DIR))
    with ThreadingTCPServer(("", port), handler) as httpd:
        print(f"Serving static preview from {DIST_DIR} at http://localhost:{port}")
        httpd.serve_forever()


def run_node_server(port):
    node_binary = shutil.which("node") or shutil.which("node.exe")

    if not node_binary:
        raise SystemExit(
            "Node.js was not found in PATH. Install Node.js or run with --static-only."
        )

    server_file = ROOT_DIR / "server.js"
    if not server_file.exists():
        raise SystemExit(f"App server not found: {server_file}")

    env = os.environ.copy()
    env["PORT"] = str(port)

    print(f"Starting full app server at http://localhost:{port}")
    completed = subprocess.run([node_binary, str(server_file)], cwd=str(ROOT_DIR), env=env)
    raise SystemExit(completed.returncode)


def main():
    args = parse_args()

    if args.static_only:
        run_static_server(args.port)
        return

    run_node_server(args.port)


if __name__ == "__main__":
    main()
