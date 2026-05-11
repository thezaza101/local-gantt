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
            "renderGantt": {
                "tested": False,
                "test_file": None
            }
        }
    },
    "analytics.js": {
        "tested": False,
        "functions": {
            "calculateTagAggregates": {
                "tested": False,
                "test_file": None
            }
        }
    }
}
