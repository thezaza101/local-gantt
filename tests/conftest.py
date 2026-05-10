import pytest
import os
import threading
from http.server import SimpleHTTPRequestHandler, HTTPServer

# Setup local server for testing
PORT = 8000
BASE_URL = f"http://localhost:{PORT}"
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

class NoCacheHTTPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

def start_server():
    os.chdir(ROOT_DIR)
    server = HTTPServer(("localhost", PORT), NoCacheHTTPRequestHandler)
    server.serve_forever()

@pytest.fixture(scope="session", autouse=True)
def local_server():
    """Starts a local HTTP server for testing."""
    thread = threading.Thread(target=start_server, daemon=True)
    thread.start()
    yield BASE_URL

@pytest.fixture(scope="session")
def base_url():
    """Provides the base URL for tests to navigate to."""
    return BASE_URL

@pytest.fixture(scope="function", autouse=True)
def clean_local_storage(page):
    """Automatically cleans up local storage after every test to ensure state isolation."""
    yield
    try:
        page.evaluate("window.localStorage.clear(); window.sessionStorage.clear();")
    except Exception:
        pass
