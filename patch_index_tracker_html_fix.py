import re

with open('index.html', 'r') as f:
    content = f.read()

analytics_panel = """        <!-- Analytics Panel -->
        <div class="analytics-panel p-0 d-flex flex-column bg-white d-none" id="analyticsContainer" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 1040;">
             <div class="analytics-header d-flex justify-content-between align-items-center p-2 border-bottom bg-light">
                 <h6 class="m-0 text-dark fw-bold" id="analyticsTitle">Analytics</h6>
                 <div class="d-flex align-items-center gap-2">
                     <button type="button" id="closeAnalyticsBtn" class="btn-close" aria-label="Close" title="Close Analytics"></button>
                 </div>
             </div>"""

analytics_panel_repl = """        <!-- Analytics Panel -->
        <div class="analytics-panel p-0 d-flex flex-column bg-white d-none" id="analyticsContainer" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 1040;">
             <div class="analytics-header d-flex justify-content-between align-items-center p-2 border-bottom bg-light">
                 <h6 class="m-0 text-dark fw-bold" id="analyticsTitle">Analytics</h6>
                 <div class="d-flex align-items-center gap-2">
                     <button type="button" id="closeAnalyticsBtn" class="btn-close" aria-label="Close" title="Close Analytics"></button>
                 </div>
             </div>
             <div class="analytics-content p-4 d-flex flex-column flex-grow-1 overflow-auto bg-white" id="analyticsContent">
                 <div class="text-center text-muted my-auto" id="analyticsPlaceholder">
                     <h5>Analytics Panel</h5>
                     <p class="small">Effort summaries and tag metrics will render here</p>
                 </div>
             </div>
        </div>"""

content = content.replace(analytics_panel, analytics_panel_repl)

with open('index.html', 'w') as f:
    f.write(content)
