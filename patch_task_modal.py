import re

with open('index.html', 'r') as f:
    content = f.read()

task_modal_regex = re.compile(r'(<h6 class="border-bottom pb-2">Options</h6>\s*<div class="row mb-3">\s*<div class="col-md-12">\s*<div class="form-check">\s*<input class="form-check-input" type="checkbox" id="taskExcludeFromAnalytics">\s*<label class="form-check-label" for="taskExcludeFromAnalytics">\s*Exclude from Analytics & Export\s*</label>\s*</div>\s*</div>\s*</div>)', re.DOTALL)

match = task_modal_regex.search(content)
if match:
    tracker_section = """
                        <h6 class="border-bottom pb-2 mt-4">Tracker Associations</h6>
                        <div class="row mb-3">
                            <div class="col-md-12">
                                <ul class="nav nav-pills nav-sm mb-2" id="taskTrackerTabs" role="tablist">
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link active px-2 py-1" id="task-risks-tab" data-bs-toggle="tab" data-bs-target="#task-risks-pane" type="button" role="tab">Risks</button>
                                    </li>
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link px-2 py-1" id="task-issues-tab" data-bs-toggle="tab" data-bs-target="#task-issues-pane" type="button" role="tab">Issues</button>
                                    </li>
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link px-2 py-1" id="task-deps-tab" data-bs-toggle="tab" data-bs-target="#task-deps-pane" type="button" role="tab">Dependencies</button>
                                    </li>
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link px-2 py-1" id="task-assumps-tab" data-bs-toggle="tab" data-bs-target="#task-assumps-pane" type="button" role="tab">Assumptions</button>
                                    </li>
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link px-2 py-1" id="task-decs-tab" data-bs-toggle="tab" data-bs-target="#task-decs-pane" type="button" role="tab">Decisions</button>
                                    </li>
                                </ul>
                                <div class="tab-content border rounded p-2" id="taskTrackerTabsContent" style="min-height: 100px; max-height: 200px; overflow-y: auto;">
                                    <div class="tab-pane fade show active" id="task-risks-pane" role="tabpanel">
                                        <input type="text" class="form-control form-control-sm mb-2 task-tracker-search" placeholder="Search risks..." data-target="taskRisksList">
                                        <div id="taskRisksList" class="tracker-checkbox-list"></div>
                                    </div>
                                    <div class="tab-pane fade" id="task-issues-pane" role="tabpanel">
                                        <input type="text" class="form-control form-control-sm mb-2 task-tracker-search" placeholder="Search issues..." data-target="taskIssuesList">
                                        <div id="taskIssuesList" class="tracker-checkbox-list"></div>
                                    </div>
                                    <div class="tab-pane fade" id="task-deps-pane" role="tabpanel">
                                        <input type="text" class="form-control form-control-sm mb-2 task-tracker-search" placeholder="Search dependencies..." data-target="taskDepsList">
                                        <div id="taskDepsList" class="tracker-checkbox-list"></div>
                                    </div>
                                    <div class="tab-pane fade" id="task-assumps-pane" role="tabpanel">
                                        <input type="text" class="form-control form-control-sm mb-2 task-tracker-search" placeholder="Search assumptions..." data-target="taskAssumpsList">
                                        <div id="taskAssumpsList" class="tracker-checkbox-list"></div>
                                    </div>
                                    <div class="tab-pane fade" id="task-decs-pane" role="tabpanel">
                                        <input type="text" class="form-control form-control-sm mb-2 task-tracker-search" placeholder="Search decisions..." data-target="taskDecsList">
                                        <div id="taskDecsList" class="tracker-checkbox-list"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
"""
    content = content[:match.start()] + tracker_section + match.group(1) + content[match.end():]

with open('index.html', 'w') as f:
    f.write(content)
