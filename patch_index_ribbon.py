import re

with open('index.html', 'r') as f:
    content = f.read()

analytics_btn = '<button type="button" id="openAnalyticsBtn" class="btn btn-sm btn-outline-secondary flex-shrink-0" title="Open Analytics">📊</button>'
tracker_btn = '<button type="button" id="openTrackerBtn" class="btn btn-sm btn-outline-secondary flex-shrink-0" title="Open Tracker (Risks, Issues, Dependencies, Assumptions, Decisions)">📋</button>\n            '

content = content.replace(analytics_btn, tracker_btn + analytics_btn)

analytics_panel_regex = re.compile(r'(<div class="analytics-panel p-0 d-flex flex-column bg-white d-none" id="analyticsContainer".*?</div>\s*</div>)', re.DOTALL)

match = analytics_panel_regex.search(content)

if match:
    tracker_panel = """
        <!-- Tracker Panel -->
        <div class="tracker-panel p-0 d-flex flex-column bg-white d-none" id="trackerContainer" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 1040;">
             <div class="tracker-header d-flex justify-content-between align-items-center p-2 border-bottom bg-light">
                 <h6 class="m-0 text-dark fw-bold" id="trackerTitle">Tracker (Risks, Issues, Dependencies, Assumptions, Decisions)</h6>
                 <div class="d-flex align-items-center gap-2">
                     <button type="button" id="closeTrackerBtn" class="btn-close" aria-label="Close" title="Close Tracker"></button>
                 </div>
             </div>
             <div class="tracker-content p-4 d-flex flex-column flex-grow-1 overflow-auto bg-white" id="trackerContent">
                 <!-- Tabs -->
                 <ul class="nav nav-tabs mb-3" id="trackerTabs" role="tablist">
                     <li class="nav-item" role="presentation">
                         <button class="nav-link active" id="risks-tab" data-bs-toggle="tab" data-bs-target="#tracker-risks" type="button" role="tab" aria-controls="tracker-risks" aria-selected="true">Risks</button>
                     </li>
                     <li class="nav-item" role="presentation">
                         <button class="nav-link" id="issues-tab" data-bs-toggle="tab" data-bs-target="#tracker-issues" type="button" role="tab" aria-controls="tracker-issues" aria-selected="false">Issues</button>
                     </li>
                     <li class="nav-item" role="presentation">
                         <button class="nav-link" id="dependencies-tab" data-bs-toggle="tab" data-bs-target="#tracker-dependencies" type="button" role="tab" aria-controls="tracker-dependencies" aria-selected="false">Dependencies</button>
                     </li>
                     <li class="nav-item" role="presentation">
                         <button class="nav-link" id="assumptions-tab" data-bs-toggle="tab" data-bs-target="#tracker-assumptions" type="button" role="tab" aria-controls="tracker-assumptions" aria-selected="false">Assumptions</button>
                     </li>
                     <li class="nav-item" role="presentation">
                         <button class="nav-link" id="decisions-tab" data-bs-toggle="tab" data-bs-target="#tracker-decisions" type="button" role="tab" aria-controls="tracker-decisions" aria-selected="false">Decisions</button>
                     </li>
                 </ul>
                 <div class="tab-content flex-grow-1" id="trackerTabsContent">
                     <div class="tab-pane fade show active" id="tracker-risks" role="tabpanel" aria-labelledby="risks-tab">
                         <div class="d-flex justify-content-between mb-2">
                             <h6>Risks</h6>
                             <button class="btn btn-sm btn-primary" id="addRiskBtn">+ Add Risk</button>
                         </div>
                         <div class="table-responsive">
                            <table class="table table-sm table-hover" id="risksTable">
                                <thead><tr><th>ID</th><th>Title</th><th>Probability</th><th>Severity</th><th>Status</th><th>Owner</th><th>Actions</th></tr></thead>
                                <tbody></tbody>
                            </table>
                         </div>
                     </div>
                     <div class="tab-pane fade" id="tracker-issues" role="tabpanel" aria-labelledby="issues-tab">
                         <div class="d-flex justify-content-between mb-2">
                             <h6>Issues</h6>
                             <button class="btn btn-sm btn-primary" id="addIssueBtn">+ Add Issue</button>
                         </div>
                         <div class="table-responsive">
                            <table class="table table-sm table-hover" id="issuesTable">
                                <thead><tr><th>ID</th><th>Title</th><th>Severity</th><th>Status</th><th>Owner</th><th>Actions</th></tr></thead>
                                <tbody></tbody>
                            </table>
                         </div>
                     </div>
                     <div class="tab-pane fade" id="tracker-dependencies" role="tabpanel" aria-labelledby="dependencies-tab">
                         <div class="d-flex justify-content-between mb-2">
                             <h6>Dependencies</h6>
                             <div>
                                 <button class="btn btn-sm btn-outline-secondary me-2" id="createProperDepsBtn" title="Create proper dependencies from tasks">Auto-Create from Tasks</button>
                                 <button class="btn btn-sm btn-primary" id="addDependencyBtn">+ Add Dependency</button>
                             </div>
                         </div>
                         <div class="table-responsive">
                            <table class="table table-sm table-hover" id="dependenciesTable">
                                <thead><tr><th>ID</th><th>Title</th><th>Status</th><th>From Task(s)</th><th>To Task</th><th>Actions</th></tr></thead>
                                <tbody></tbody>
                            </table>
                         </div>
                     </div>
                     <div class="tab-pane fade" id="tracker-assumptions" role="tabpanel" aria-labelledby="assumptions-tab">
                         <div class="d-flex justify-content-between mb-2">
                             <h6>Assumptions</h6>
                             <button class="btn btn-sm btn-primary" id="addAssumptionBtn">+ Add Assumption</button>
                         </div>
                         <div class="table-responsive">
                            <table class="table table-sm table-hover" id="assumptionsTable">
                                <thead><tr><th>ID</th><th>Title</th><th>Status</th><th>Impact</th><th>Expiry Date</th><th>Actions</th></tr></thead>
                                <tbody></tbody>
                            </table>
                         </div>
                     </div>
                     <div class="tab-pane fade" id="tracker-decisions" role="tabpanel" aria-labelledby="decisions-tab">
                         <div class="d-flex justify-content-between mb-2">
                             <h6>Decisions</h6>
                             <button class="btn btn-sm btn-primary" id="addDecisionBtn">+ Add Decision</button>
                         </div>
                         <div class="table-responsive">
                            <table class="table table-sm table-hover" id="decisionsTable">
                                <thead><tr><th>ID</th><th>Title</th><th>Status</th><th>Owner</th><th>Deadline</th><th>Actions</th></tr></thead>
                                <tbody></tbody>
                            </table>
                         </div>
                     </div>
                 </div>
             </div>
        </div>
"""
    content = content[:match.end()] + "\n" + tracker_panel + content[match.end():]

with open('index.html', 'w') as f:
    f.write(content)
