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
    },
    "analytics_dashboard": {
        "description": "Analytics dashboard workflows and visualization",
        "tests": [
            {
                "name": "analytics_dashboard_rendering",
                "tested": True,
                "test_file": "tests/workflows/analytics_test.py"
            }
        ]
    },
    "tracker": {
        "description": "Tracker workflows for RIDAD management",
        "tests": [
            {
                "name": "tracker_crud",
                "tested": True,
                "test_file": "tests/workflows/tracker_test.py"
            }
        ]
    }
}
