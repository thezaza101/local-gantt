import json

SAMPLE_PLAN = {
    "meta": {
        "fileVersion": 1,
        "history": []
    },
    "settings": {
        "baseLink": "https://jira.company.com/browse/",
        "raidaOverdueDays": 14,
        "raidaStaleDays": 7,
        "fillLegends": [],
        "borderLegends": [],
        "teams": [],
        "personnel": [],
        "tagGroups": [],
        "trackerColumns": {},
        "trackerTruncateLength": 50
    },
    "risks": [],
    "issues": [],
    "dependencies": [],
    "assumptions": [],
    "decisions": [],
    "plans": [
        {
            "id": "Plan-1",
            "name": "Default Plan",
            "isActive": True,
            "startDate": "2024-01-01",
            "endDate": "2024-01-31",
            "tasks": [
                {
                    "id": "T1",
                    "title": "Sample Task",
                    "startDate": "2024-01-01",
                    "endDate": "2024-01-10",
                    "status": "not-started",
                    "effort": 5,
                    "row": 1,
                    "tags": ["frontend"],
                    "dependencies": [],
                    "lastUpdated": "2024-01-01 10:00:00",
                    "lastChecked": "2024-01-01 10:00:00"
                }
            ],
            "markers": []
        }
    ]
}

def get_sample_plan_json():
    """Returns the sample plan as a JSON string."""
    return json.dumps(SAMPLE_PLAN)
