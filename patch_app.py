with open('app.js', 'r') as f:
    content = f.read()

analytics_init = "    window.AnalyticsEngine = new Analytics(window.PlannerState);"
tracker_init = """    window.AnalyticsEngine = new Analytics(window.PlannerState);

    // Initialize Tracker
    console.log('Initializing TrackerEngine');
    window.TrackerEngine = new Tracker(window.PlannerState);"""

content = content.replace(analytics_init, tracker_init)

with open('app.js', 'w') as f:
    f.write(content)
