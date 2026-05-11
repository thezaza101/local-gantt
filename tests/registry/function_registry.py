# Registry mapping JavaScript files and their functions to test coverage
FUNCTION_REGISTRY = {
    "planner.js": {
        "tested": False,
        "functions": {
            "loadState": {
                "tested": False,
                "test_file": None
            },
            "saveState": {
                "tested": False,
                "test_file": None
            },
            "getNowTimestamp": {
                "tested": False,
                "test_file": None
            },
            "generateEntityId": {
                "tested": True,
                "test_file": "tests/functions/planner_test.py"
            },
            "addTask": {
                "tested": True,
                "test_file": "tests/functions/planner_test.py"
            },
            "deleteTask": {
                "tested": True,
                "test_file": "tests/functions/planner_test.py"
            },
            "applyPlanMerge": {
                "tested": True,
                "test_file": "tests/functions/planner_test.py"
            }
        }
    },
    "ui.js": {
        "tested": False,
        "functions": {
            "bindEvents": {
                "tested": False,
                "test_file": None
            },
            "renderTaskListTable": {
                "tested": True,
                "test_file": "tests/functions/ui_rendering_test.py"
            },
            "renderMarkerTable": {
                "tested": True,
                "test_file": "tests/functions/ui_rendering_test.py"
            },
            "renderHistory": {
                "tested": True,
                "test_file": "tests/functions/ui_rendering_test.py"
            },
            "renderTagFilters": {
                "tested": True,
                "test_file": "tests/functions/ui_rendering_test.py"
            }
        }
    },
    "analytics.js": {
        "tested": False,
        "functions": {
            "calculateTagAggregates": {
                "tested": False,
                "test_file": None
            },
            "calculateEffortByTag": {
                "tested": True,
                "test_file": "tests/functions/analytics_functions_test.py"
            },
            "calculateTaskCountByStatus": {
                "tested": True,
                "test_file": "tests/functions/analytics_functions_test.py"
            }
        }
    }
}
