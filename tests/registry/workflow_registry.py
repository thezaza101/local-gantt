# Registry mapping high-level user workflows to test coverage
WORKFLOW_REGISTRY = {
    "dashboard": {
        "description": "Main UI workflows for viewing and interacting with the plan",
        "tests": [
            {
                "name": "import_plan",
                "tested": False,
                "test_file": "tests/workflows/dashboard_test.py"
            },
            {
                "name": "add_task",
                "tested": False,
                "test_file": None
            }
        ]
    },
    "settings": {
        "description": "Application settings and configuration",
        "tests": [
            {
                "name": "modify_team",
                "tested": False,
                "test_file": "tests/workflows/settings_test.py"
            }
        ]
    }
}
