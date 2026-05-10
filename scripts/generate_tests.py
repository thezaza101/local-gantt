import sys
import os
import re
import json
import importlib.util

# Add parent directory to path so we can import the registry
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT_DIR)

from tests.registry.function_registry import FUNCTION_REGISTRY

OUTPUT_FILE = os.path.join(ROOT_DIR, "tests", "generated", "TODO_generated_tests.py")

def scan_js_for_functions(js_file_path):
    """Scans a JS file to extract basic class methods/functions (very simplified regex)."""
    functions = []
    if not os.path.exists(js_file_path):
        return functions
    with open(js_file_path, "r", encoding="utf-8") as f:
        content = f.read()
    # Matches simple method definitions like `methodName(args) {`
    # Warning: very naive regex for JS, assumes ES6 class method syntax
    matches = re.finditer(r"^\s*([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{", content, re.MULTILINE)
    for match in matches:
        func_name = match.group(1)
        if func_name not in ["constructor", "if", "for", "while", "switch", "catch"]:
            functions.append(func_name)
    return functions

def update_registry_and_generate_stubs():
    generated_code = [
        "import pytest",
        "from playwright.sync_api import Page",
        "\n# ---------------------------------------------------------",
        "# AUTO-GENERATED TEST STUBS",
        "# ---------------------------------------------------------\n"
    ]

    for js_file, data in FUNCTION_REGISTRY.items():
        js_path = os.path.join(ROOT_DIR, js_file)
        discovered_funcs = scan_js_for_functions(js_path)

        # Add newly discovered functions to the registry data dynamically
        # (For this script we just print them, but in a real tool you'd write back to the .py registry file)
        registry_funcs = data.get("functions", {})
        for func in discovered_funcs:
            if func not in registry_funcs:
                print(f"Discovered un-registered function in {js_file}: {func}")
                registry_funcs[func] = {"tested": False, "test_file": None}

        # Generate test stubs for untested functions
        for func_name, func_data in registry_funcs.items():
            if not func_data.get("tested", False):
                safe_name = func_name.replace("-", "_")
                stub = f"""@pytest.mark.skip(reason="TODO: implement test for {js_file} -> {func_name}")
def test_{safe_name}(page: Page):
    # TODO: Implement test for {func_name} in {js_file}
    pass
"""
                generated_code.append(stub)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(generated_code))

    print(f"Generated test stubs saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    update_registry_and_generate_stubs()
