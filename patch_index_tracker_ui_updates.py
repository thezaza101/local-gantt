import re

with open('index.html', 'r') as f:
    content = f.read()

# Add Scope to Tracker Edit Modal
id_row = """                        <div class="row mb-3">
                            <div class="col-md-4">
                                <label for="trackerItemId" class="form-label">ID</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" id="trackerItemId" required>
                                    <button class="btn btn-outline-secondary" type="button" id="trackerBaseLinkBtn" title="Open Base Link">🔗</button>
                                </div>
                            </div>
                            <div class="col-md-8">
                                <label for="trackerItemTitle" class="form-label">Title</label>
                                <input type="text" class="form-control" id="trackerItemTitle" required>
                            </div>
                        </div>"""

id_row_repl = """                        <div class="row mb-3">
                            <div class="col-md-3">
                                <label for="trackerItemId" class="form-label">ID</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" id="trackerItemId" required>
                                    <button class="btn btn-outline-secondary" type="button" id="trackerBaseLinkBtn" title="Open Base Link">🔗</button>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <label for="trackerItemTitle" class="form-label">Title</label>
                                <input type="text" class="form-control" id="trackerItemTitle" required>
                            </div>
                            <div class="col-md-3">
                                <label for="trackerItemScope" class="form-label">Scope</label>
                                <select class="form-select" id="trackerItemScope">
                                    <option value="global">Global (All Plans)</option>
                                </select>
                            </div>
                        </div>"""

content = content.replace(id_row, id_row_repl)

# Add bulk actions toolbar to tracker content
tabs = """                 <ul class="nav nav-tabs mb-3" id="trackerTabs" role="tablist">"""

tabs_repl = """                 <div class="d-flex justify-content-between align-items-center mb-3 p-2 bg-light border rounded">
                     <div class="d-flex align-items-center gap-2">
                         <div class="form-check m-0">
                             <input class="form-check-input" type="checkbox" id="trackerSelectAllCheckbox" title="Select All in current view">
                             <label class="form-check-label small" for="trackerSelectAllCheckbox">All</label>
                         </div>
                         <div class="vr mx-1"></div>
                         <button class="btn btn-sm btn-outline-secondary" id="trackerBulkDeleteBtn" title="Delete Selected">🗑️</button>
                         <div class="dropdown">
                             <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="Update Status">
                                 Status
                             </button>
                             <ul class="dropdown-menu" id="trackerBulkStatusDropdown">
                                 <li><h6 class="dropdown-header">Update Status</h6></li>
                                 <li><hr class="dropdown-divider"></li>
                                 <!-- Options injected via JS based on tab -->
                             </ul>
                         </div>
                     </div>
                     <span class="text-muted small" id="trackerSelectionCount">0 selected</span>
                 </div>
                 <!-- Tabs -->
                 <ul class="nav nav-tabs mb-3" id="trackerTabs" role="tablist">"""

content = content.replace(tabs, tabs_repl)

# Add checkboxes to tables
for table in ['risksTable', 'issuesTable', 'dependenciesTable', 'assumptionsTable', 'decisionsTable']:
    th_repl = f"""<table class="table table-sm table-hover" id="{table}">
                                <thead><tr><th style="width: 30px;"></th><th>ID</th>"""
    content = re.sub(fr'<table class="table table-sm table-hover" id="{table}">\s*<thead><tr><th>ID</th>', th_repl, content)


with open('index.html', 'w') as f:
    f.write(content)
