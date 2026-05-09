import re

with open('index.html', 'r') as f:
    content = f.read()

# Insert the universal tracker edit modal just before the closing body tag
tracker_modal = """
    <!-- Tracker Edit Modal -->
    <div class="modal fade" id="trackerEditModal" tabindex="-1" aria-labelledby="trackerEditModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="trackerEditModalLabel">Edit Item</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="trackerEditForm">
                        <input type="hidden" id="trackerItemType">
                        <input type="hidden" id="trackerOriginalId">

                        <div class="row mb-3">
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
                        </div>

                        <div class="row mb-3">
                            <div class="col-md-12">
                                <label for="trackerItemDescription" class="form-label">Description</label>
                                <textarea class="form-control" id="trackerItemDescription" rows="3"></textarea>
                            </div>
                        </div>

                        <!-- Dynamic fields injected here based on type -->
                        <div id="trackerDynamicFields" class="row mb-3"></div>

                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label for="trackerItemTags" class="form-label">Tags (comma-separated)</label>
                                <input type="text" class="form-control" id="trackerItemTags">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Grouped Tags</label>
                                <div class="dropdown">
                                    <button class="btn btn-outline-secondary dropdown-toggle w-100 text-start d-flex justify-content-between align-items-center" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                                        <span class="text-truncate">Select Grouped Tags...</span>
                                    </button>
                                    <ul class="dropdown-menu w-100 p-2" id="trackerItemGroupedTagsDropdown" style="max-height: 200px; overflow-y: auto;">
                                        <!-- Checkboxes injected dynamically -->
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <h6 class="border-bottom pb-2 mt-4">Associations</h6>
                        <div class="row mb-3">
                            <div class="col-md-4">
                                <label class="form-label">Associated Teams</label>
                                <div class="dropdown">
                                    <button class="btn btn-outline-secondary dropdown-toggle w-100 text-start d-flex justify-content-between align-items-center" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                                        <span class="text-truncate">Select Teams...</span>
                                    </button>
                                    <ul class="dropdown-menu w-100 p-2" id="trackerItemTeamsDropdown" style="max-height: 200px; overflow-y: auto;">
                                    </ul>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Associated Personnel</label>
                                <div class="dropdown">
                                    <button class="btn btn-outline-secondary dropdown-toggle w-100 text-start d-flex justify-content-between align-items-center" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                                        <span class="text-truncate">Select Personnel...</span>
                                    </button>
                                    <ul class="dropdown-menu w-100 p-2" id="trackerItemPersonnelDropdown" style="max-height: 200px; overflow-y: auto;">
                                    </ul>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Associated Tasks</label>
                                <div class="dropdown">
                                    <button class="btn btn-outline-secondary dropdown-toggle w-100 text-start d-flex justify-content-between align-items-center" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                                        <span class="text-truncate">Select Tasks...</span>
                                    </button>
                                    <ul class="dropdown-menu w-100 p-2" id="trackerItemTasksDropdown" style="max-height: 200px; overflow-y: auto;">
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer d-flex justify-content-between">
                    <div>
                        <span class="text-muted small d-block" id="trackerLastUpdatedDisplay">Last Updated: -</span>
                        <span class="text-muted small d-block" id="trackerLastCheckedDisplay">Last Checked: -</span>
                    </div>
                    <div>
                        <button type="button" class="btn btn-outline-secondary me-2" id="trackerUpdateLastCheckedBtn">Check</button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="saveTrackerItemBtn">Save</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
"""

content = content.replace("</body>", tracker_modal + "\n</body>")
with open('index.html', 'w') as f:
    f.write(content)
