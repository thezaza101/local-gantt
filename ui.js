/* UI Controller */

class UI {
    constructor() {
        this.planner = window.PlannerState;

        // Setup initial UI components
        this.bindEvents();
    }

    bindEvents() {
        const analyticsContainer = document.getElementById("analyticsContainer");
        const openAnalyticsBtn = document.getElementById("openAnalyticsBtn");
        const closeAnalyticsBtn = document.getElementById("closeAnalyticsBtn");

        // Analytics Open/Close
        if (openAnalyticsBtn && analyticsContainer) {
            openAnalyticsBtn.addEventListener("click", () => {
                document.body.classList.add("analytics-fullscreen");
                analyticsContainer.classList.remove("d-none");

                if (window.AnalyticsEngine) {
                    setTimeout(() => window.AnalyticsEngine.render(this.planner.getCurrentPlan()), 50);
                }
            });
        }

        // Help Modal
        const helpBtn = document.getElementById("helpBtn");
        if (helpBtn) {
            helpBtn.addEventListener("click", () => {
                const helpModalEl = document.getElementById('helpModal');
                const helpModal = bootstrap.Modal.getOrCreateInstance(helpModalEl);
                helpModal.show();
            });
        }

        if (closeAnalyticsBtn && analyticsContainer) {
            closeAnalyticsBtn.addEventListener("click", () => {
                document.body.classList.remove("analytics-fullscreen");
                analyticsContainer.classList.add("d-none");

                // Re-render Gantt when closing analytics
                if (window.GanttEngine) {
                    window.GanttEngine.render(this.planner.getCurrentPlan());
                }
                if (window.AnalyticsEngine) {
                    const container = document.getElementById("analyticsContainer");
                    if (container && !container.classList.contains("d-none")) {
                        window.AnalyticsEngine.render(this.planner.getCurrentPlan());
                    }
                }
            });
        }

        // Dark Mode Toggle
        const darkModeToggleBtn = document.getElementById("darkModeToggleBtn");
        if (darkModeToggleBtn) {
            darkModeToggleBtn.addEventListener("click", () => {
                const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
                const newTheme = isDark ? 'light' : 'dark';
                document.documentElement.setAttribute('data-bs-theme', newTheme);
                localStorage.setItem('theme', newTheme);

                // Update button icon
                darkModeToggleBtn.textContent = isDark ? '🌙' : '☀️';
            });
        }

        // Presenter Mode
        const presenterModeBtn = document.getElementById("presenterModeBtn");
        const exitPresenterModeBtn = document.getElementById("exitPresenterModeBtn");

        if (presenterModeBtn) {
            presenterModeBtn.addEventListener("click", () => {
                document.body.classList.add("presenter-mode");
                // Trigger re-render
                if (window.GanttEngine) window.GanttEngine.render(this.planner.getCurrentPlan());
                if (window.AnalyticsEngine && analyticsContainer && !analyticsContainer.classList.contains("d-none")) {
                    setTimeout(() => window.AnalyticsEngine.render(this.planner.getCurrentPlan()), 50);
                }
            });
        }

        if (exitPresenterModeBtn) {
            exitPresenterModeBtn.addEventListener("click", () => {
                document.body.classList.remove("presenter-mode");
                // Trigger re-render
                if (window.GanttEngine) window.GanttEngine.render(this.planner.getCurrentPlan());
                if (window.AnalyticsEngine && analyticsContainer && !analyticsContainer.classList.contains("d-none")) {
                    setTimeout(() => window.AnalyticsEngine.render(this.planner.getCurrentPlan()), 50);
                }
            });
        }

        // Import JSON
        const importBtn = document.getElementById("importBtn");
        const fileInput = document.getElementById("fileInput");

        if (importBtn && fileInput) {
            importBtn.addEventListener("click", () => {
                fileInput.click();
            });

            fileInput.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (file) {
                    Storage.importPlanFile(file, (error, data) => {
                        if (error) {
                            console.error("Error importing file:", error);
                            alert("Failed to import file. See console for details.");
                        } else {
                            window.checkFileVersionWarning(data);
                            if (this.planner.loadState(data)) {
                                console.log("File imported successfully!");
                                document.title = `Project Plan - ${file.name}`;
                                // Here we would normally trigger a re-render of the Gantt chart
                                // and other components in a later phase.
                                this.updateUI();
                            }
                        }
                    });
                }
                // Clear the input so the same file can be selected again
                fileInput.value = "";
            });
        }

        // Export JSON
        const exportBtn = document.getElementById("exportBtn");
        if (exportBtn) {
            exportBtn.addEventListener("click", () => {
                this.exportType = 'full';
                const commentInput = document.getElementById("exportCommentInput");
                if (commentInput) commentInput.value = '';
                const modal = new bootstrap.Modal(document.getElementById('saveExportModal'));
                modal.show();
            });
        }

        // Handle Export Confirm
        const confirmSaveExportBtn = document.getElementById("confirmSaveExportBtn");
        if (confirmSaveExportBtn) {
            confirmSaveExportBtn.addEventListener("click", () => {
                const commentInput = document.getElementById("exportCommentInput");
                const comment = commentInput ? commentInput.value.trim() : '';

                if (comment) {
                    this.planner.addHistoryLog(comment);
                }

                const state = this.planner.getState();

                if (this.exportType === 'full') {
                    Storage.exportPlanFile(state);
                    console.log("File exported.");
                } else if (this.exportType === 'single') {
                    const currentPlanIndex = this.planner.currentPlanIndex;
                    if (currentPlanIndex !== -1) {
                        Storage.exportSinglePlanFile(state, currentPlanIndex);
                        console.log("Single plan exported.");
                    }
                }

                const modalEl = document.getElementById('saveExportModal');
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) {
                    modalInstance.hide();
                }
            });
        }

        // Handle History View
        const historyBtn = document.getElementById("historyBtn");
        if (historyBtn) {
            historyBtn.addEventListener("click", () => {
                this.renderHistory();
                const modal = new bootstrap.Modal(document.getElementById('historyModal'));
                modal.show();
            });
        }

        // Import Single Plan
        const importPlanBtn = document.getElementById("importPlanBtn");
        const importPlanFileInput = document.getElementById("importPlanFileInput");

        if (importPlanBtn && importPlanFileInput) {
            importPlanBtn.addEventListener("click", () => {
                importPlanFileInput.click();
            });

            importPlanFileInput.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (file) {
                    Storage.importPlanFile(file, (error, data) => {
                        if (error) {
                            console.error("Error importing plan file:", error);
                            alert("Failed to import file. See console for details.");
                        } else {
                            if (data && data.plans && data.plans.length > 0) {
                                window.checkFileVersionWarning(data);
                                this.importedFileData = data;
                                this.openImportPlanOptionsModal(data);
                            } else {
                                alert("No valid plans found in the file.");
                            }
                        }
                    });
                }
                importPlanFileInput.value = "";
            });
        }

        // Handle Continue on Import Plan Options Modal
        const continueImportPlanBtn = document.getElementById("continueImportPlanBtn");
        if (continueImportPlanBtn) {
            continueImportPlanBtn.addEventListener("click", () => {
                this.handleImportPlanOptionsContinue();
            });
        }

        const importPlanActionMerge = document.getElementById("importPlanActionMerge");
        const importPlanActionNew = document.getElementById("importPlanActionNew");
        const mergeIgnoreFieldsContainer = document.getElementById("mergeIgnoreFieldsContainer");
        const toggleMergeIgnoreContainer = () => {
            if (importPlanActionMerge && mergeIgnoreFieldsContainer) {
                mergeIgnoreFieldsContainer.style.display = importPlanActionMerge.checked ? 'block' : 'none';
            }
        };
        if (importPlanActionMerge) importPlanActionMerge.addEventListener("change", toggleMergeIgnoreContainer);
        if (importPlanActionNew) importPlanActionNew.addEventListener("change", toggleMergeIgnoreContainer);

        // Export Single Plan
        const exportPlanBtn = document.getElementById("exportPlanBtn");
        if (exportPlanBtn) {
            exportPlanBtn.addEventListener("click", () => {
                const currentPlanIndex = this.planner.currentPlanIndex;
                if (currentPlanIndex !== -1) {
                    this.exportType = 'single';
                    const commentInput = document.getElementById("exportCommentInput");
                    if (commentInput) commentInput.value = '';
                    const modal = new bootstrap.Modal(document.getElementById('saveExportModal'));
                    modal.show();
                } else {
                    alert("No plan selected to export.");
                }
            });
        }

        // Handle Merge Confirm
        const confirmMergePlanBtn = document.getElementById("confirmMergePlanBtn");
        if (confirmMergePlanBtn) {
            confirmMergePlanBtn.addEventListener("click", () => {
                this.confirmMergePlan();
            });
        }

        // Select All / Deselect All for Merge Modal
        const setupSelectAll = (btnId, deselectBtnId, checkboxClass) => {
            const btn = document.getElementById(btnId);
            const deselectBtn = document.getElementById(deselectBtnId);
            if (btn && deselectBtn) {
                btn.addEventListener("click", () => {
                    const checkboxes = document.querySelectorAll(`.${checkboxClass}`);
                    checkboxes.forEach(cb => cb.checked = true);
                });
                deselectBtn.addEventListener("click", () => {
                    const checkboxes = document.querySelectorAll(`.${checkboxClass}`);
                    checkboxes.forEach(cb => cb.checked = false);
                });
            }
        };

        setupSelectAll("selectAllTasksBtn", "deselectAllTasksBtn", "merge-task-check");
        setupSelectAll("selectAllMarkersBtn", "deselectAllMarkersBtn", "merge-marker-check");

        // Settings Actions
        const settingsBtn = document.getElementById("settingsBtn");
        if (settingsBtn) {
            settingsBtn.addEventListener("click", () => {
                this.openSettingsModal();
            });
        }

        const saveSettingsBtn = document.getElementById("saveSettingsBtn");
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener("click", () => {
                this.saveSettings();
            });
        }

        // Plan Actions
        const newPlanBtn = document.getElementById("newPlanBtn");
        if (newPlanBtn) {
            newPlanBtn.addEventListener("click", () => {
                const name = prompt("Enter new plan name:");
                if (name && name.trim() !== "") {
                    this.planner.addPlan(name.trim());
                    this.updateUI();
                }
            });
        }

        const editPlanBtn = document.getElementById("editPlanBtn");
        if (editPlanBtn) {
            editPlanBtn.addEventListener("click", () => {
                const currentPlan = this.planner.getCurrentPlan();
                if (currentPlan) {
                    this.openEditPlanModal();
                }
            });
        }

        const saveEditPlanBtn = document.getElementById("saveEditPlanBtn");
        if (saveEditPlanBtn) {
            saveEditPlanBtn.addEventListener("click", () => {
                this.saveEditPlan();
            });
        }

        const duplicatePlanBtn = document.getElementById("duplicatePlanBtn");
        if (duplicatePlanBtn) {
            duplicatePlanBtn.addEventListener("click", () => {
                if (this.planner.duplicatePlan()) {
                    this.updateUI();
                }
            });
        }

        const deletePlanBtn = document.getElementById("deletePlanBtn");
        if (deletePlanBtn) {
            deletePlanBtn.addEventListener("click", () => {
                const currentPlan = this.planner.getCurrentPlan();
                if (currentPlan && confirm(`Are you sure you want to delete plan "${currentPlan.name}"?`)) {
                    if (this.planner.deletePlan()) {
                        this.updateUI();
                    }
                }
            });
        }

        // Capacity Button
        const capacityPlanBtn = document.getElementById("capacityPlanBtn");
        if (capacityPlanBtn) {
            capacityPlanBtn.addEventListener("click", () => {
                const currentPlan = this.planner.getCurrentPlan();
                if (!currentPlan) return;
                this.openCapacityModal();
            });
        }

        // Legends Button
        const legendsBtn = document.getElementById("legendsBtn");
        if (legendsBtn) {
            legendsBtn.addEventListener("click", () => {
                this.openLegendsModal();
            });
        }

        // Export CSV Button
        const exportCsvBtn = document.getElementById("exportCsvBtn");
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener("click", () => {
                const currentPlan = this.planner.getCurrentPlan();
                if (currentPlan && currentPlan.tasks && currentPlan.tasks.length > 0) {
                    const modalEl = document.getElementById('exportCsvModal');
                    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                    modal.show();
                } else {
                    alert("No tasks to export.");
                }
            });
        }

        // Confirm Export CSV Button
        const confirmExportCsvBtn = document.getElementById("confirmExportCsvBtn");
        if (confirmExportCsvBtn) {
            confirmExportCsvBtn.addEventListener("click", () => {
                this.exportCsv();
            });
        }

        // Export Legend Button
        const exportLegendBtn = document.getElementById("exportLegendBtn");
        if (exportLegendBtn) {
            exportLegendBtn.addEventListener("click", () => {
                this.exportLegendImage();
            });
        }

        // Export Shareable HTML Button
        const exportHtmlBtn = document.getElementById("exportHtmlBtn");
        if (exportHtmlBtn) {
            exportHtmlBtn.addEventListener("click", () => {
                if (confirm("This will prepare the page for sharing by removing editing features and embedding the current plan. You will then need to save the page (Ctrl+S or Cmd+S). Proceed?")) {
                    const currentPlan = this.planner.getCurrentPlan();
                    if (!currentPlan) {
                        alert("No plan selected.");
                        return;
                    }

                    // Keep only the current plan in the file state to avoid leaking other plans
                    // Filter out tasks excluded from analytics/export
                    const clonedPlan = JSON.parse(JSON.stringify(currentPlan));
                    if (clonedPlan.tasks) {
                        clonedPlan.tasks = clonedPlan.tasks.filter(t => !t.excludeFromAnalytics);
                    }
                    this.planner.file.plans = [clonedPlan];
                    this.planner.currentPlanIndex = 0;

                    // Create or update embedded state tag
                    let embeddedStateEl = document.getElementById("embedded-state");
                    if (!embeddedStateEl) {
                        embeddedStateEl = document.createElement("script");
                        embeddedStateEl.id = "embedded-state";
                        embeddedStateEl.type = "application/json";
                        document.head.appendChild(embeddedStateEl);
                    }
                    embeddedStateEl.textContent = JSON.stringify(this.planner.getState());

                    // Enter shareable mode
                    window.isShareableMode = true;
                    document.body.classList.add("shareable-mode");

                    // Trigger a re-render
                    this.updateUI();

                    alert("Ready to share! Press Ctrl+S or Cmd+S to save this page.");
                }
            });
        }

        // Export Image Button
        const exportImageBtn = document.getElementById("exportImageBtn");
        if (exportImageBtn) {
            exportImageBtn.addEventListener("click", () => {
                const currentPlan = this.planner.getCurrentPlan();
                if (currentPlan) {

                    // Temporarily filter out tasks excluded from analytics/export
                    const originalTasks = currentPlan.tasks;
                    currentPlan.tasks = currentPlan.tasks.filter(t => !t.excludeFromAnalytics);

                    if (window.GanttEngine) {
                        window.GanttEngine.render(currentPlan);
                    }

                    // Get the Gantt container element after re-render
                    const ganttContainer = document.getElementById('gantt-chart-container');

                    if (ganttContainer) {
                        // We temporarily hide the task controls and legend to clean up the image
                        const controls = ganttContainer.querySelectorAll('.gantt-task-controls');
                        controls.forEach(c => c.style.display = 'none');

                        const rowNumbers = ganttContainer.querySelectorAll('.gantt-row-number');
                        rowNumbers.forEach(r => r.style.display = 'none');

                        // We also need to capture the full scrolled content, so we pass the gantt-container
                        // to html2canvas or adjust scroll
                        const ganttContent = ganttContainer.querySelector('.gantt-content');
                        const ganttSidebar = ganttContainer.querySelector('.gantt-sidebar');
                        const ganttWrapper = ganttContainer.querySelector('.gantt-wrapper');

                        const targetElement = ganttContainer;

                        // Temporarily set wrapper to auto width/height to ensure html2canvas captures everything
                        let originalWrapperWidth = '';
                        let originalWrapperHeight = '';
                        let originalWrapperOverflow = '';
                        let originalWrapperMaxWidth = '';
                        let originalTargetMaxWidth = '';
                        let originalTargetWidth = '';
                        let originalTargetHeight = '';

                        const scrollWidth = ganttContent.scrollWidth + (ganttSidebar ? ganttSidebar.offsetWidth : 0);
                        const scrollHeight = ganttContent.scrollHeight;

                        if (ganttWrapper) {
                            originalWrapperWidth = ganttWrapper.style.width;
                            originalWrapperHeight = ganttWrapper.style.height;
                            originalWrapperOverflow = ganttWrapper.style.overflow;
                            originalWrapperMaxWidth = ganttWrapper.style.maxWidth;

                            ganttWrapper.style.width = scrollWidth + 'px';
                            ganttWrapper.style.height = scrollHeight + 'px';
                            ganttWrapper.style.overflow = 'visible';
                            ganttWrapper.style.maxWidth = 'none';

                            originalTargetMaxWidth = targetElement.style.maxWidth;
                            originalTargetWidth = targetElement.style.width;
                            originalTargetHeight = targetElement.style.height;

                            targetElement.style.maxWidth = 'none';
                            targetElement.style.width = scrollWidth + 'px';
                            targetElement.style.height = scrollHeight + 'px';
                        }

                        let originalSidebarHeight = '';
                        let originalSidebarPosition = '';
                        if (ganttSidebar) {
                             originalSidebarHeight = ganttSidebar.style.height;
                             originalSidebarPosition = ganttSidebar.style.position;
                             ganttSidebar.style.height = 'max-content';
                             ganttSidebar.style.position = 'absolute'; // Prevent sticky issues during capture
                        }

                        // Temporarily fix vertical text for html2canvas
                        const verticalLabels = targetElement.querySelectorAll('.gantt-marker-label');
                        const originalLabelStyles = [];
                        verticalLabels.forEach(label => {
                            originalLabelStyles.push({
                                writingMode: label.style.writingMode,
                                transform: label.style.transform,
                                transformOrigin: label.style.transformOrigin,
                                width: label.style.width,
                                height: label.style.height,
                                paddingTop: label.style.paddingTop,
                                paddingLeft: label.style.paddingLeft,
                                boxSizing: label.style.boxSizing
                            });

                            // Store the original bounding rect to maintain dimensions if necessary
                            // Get the current dimensions before applying transforms to prevent jumping
                            const rect = label.getBoundingClientRect();

                            // Add extra padding to prevent html2canvas from clipping font ascenders
                            label.style.width = (rect.height + 4) + 'px';
                            label.style.height = (rect.width + 4) + 'px';
                            label.style.paddingTop = '2px';
                            label.style.paddingLeft = '2px';
                            label.style.boxSizing = 'border-box';

                            label.style.setProperty('writing-mode', 'horizontal-tb', 'important');
                            label.style.transform = 'rotate(90deg) translateY(-100%)';
                            label.style.transformOrigin = 'top left';
                        });

                        // Add timestamp directly to image area
                        const printTimestamp = document.getElementById("printTimestamp");
                        if (printTimestamp) {
                            const now = new Date();
                            const timestampStr = now.toLocaleString();
                            printTimestamp.textContent = `Exported on: ${timestampStr} | Plan: ${currentPlan.name || 'Unnamed Plan'}`;
                            printTimestamp.classList.remove('d-none');
                            printTimestamp.style.position = 'absolute';
                            printTimestamp.style.top = '10px';
                            printTimestamp.style.right = '10px';
                            printTimestamp.style.zIndex = '1000';
                            targetElement.appendChild(printTimestamp);
                        }

                        // We can provide options like scale to increase resolution
                        html2canvas(targetElement, {
                            scale: 2, // 2x resolution
                            useCORS: true,
                            backgroundColor: '#ffffff',
                            width: scrollWidth,
                            height: scrollHeight,
                            windowWidth: scrollWidth,
                            windowHeight: scrollHeight
                        }).then(canvas => {
                            // Restore styles
                            verticalLabels.forEach((label, index) => {
                                const styles = originalLabelStyles[index];
                                label.style.writingMode = styles.writingMode;
                                label.style.transform = styles.transform;
                                label.style.transformOrigin = styles.transformOrigin;
                                label.style.width = styles.width;
                                label.style.height = styles.height;
                                label.style.paddingTop = styles.paddingTop;
                                label.style.paddingLeft = styles.paddingLeft;
                                label.style.boxSizing = styles.boxSizing;
                            });

                            if (ganttWrapper) {
                                ganttWrapper.style.width = originalWrapperWidth;
                                ganttWrapper.style.height = originalWrapperHeight;
                                ganttWrapper.style.overflow = originalWrapperOverflow;
                                ganttWrapper.style.maxWidth = originalWrapperMaxWidth;

                                targetElement.style.maxWidth = originalTargetMaxWidth;
                                targetElement.style.width = originalTargetWidth;
                                targetElement.style.height = originalTargetHeight;
                            }
                            if (ganttSidebar) {
                                ganttSidebar.style.height = originalSidebarHeight;
                                ganttSidebar.style.position = originalSidebarPosition;
                            }

                            // Restore controls
                            controls.forEach(c => c.style.display = '');
                            rowNumbers.forEach(r => r.style.display = '');

                            if (printTimestamp) {
                                printTimestamp.classList.add('d-none');
                                document.body.appendChild(printTimestamp); // move it back to body
                            }

                            // Restore original tasks
                            currentPlan.tasks = originalTasks;
                            if (window.GanttEngine) {
                                window.GanttEngine.render(currentPlan);
                            }

                            // Trigger download
                            const image = canvas.toDataURL("image/png");
                            const link = document.createElement('a');
                            const sanitizedPlanName = (currentPlan.name || 'Gantt').replace(/[^a-z0-9]/gi, '_').toLowerCase();
                            link.download = `${sanitizedPlanName}_export.png`;
                            link.href = image;
                            link.click();
                        }).catch(err => {
                            console.error("Error generating image:", err);
                            // Ensure styles are restored on error
                            verticalLabels.forEach((label, index) => {
                                const styles = originalLabelStyles[index];
                                label.style.writingMode = styles.writingMode;
                                label.style.transform = styles.transform;
                                label.style.transformOrigin = styles.transformOrigin;
                                label.style.width = styles.width;
                                label.style.height = styles.height;
                                label.style.paddingTop = styles.paddingTop;
                                label.style.paddingLeft = styles.paddingLeft;
                                label.style.boxSizing = styles.boxSizing;
                            });

                            if (ganttWrapper) {
                                ganttWrapper.style.width = originalWrapperWidth;
                                ganttWrapper.style.height = originalWrapperHeight;
                                ganttWrapper.style.overflow = originalWrapperOverflow;
                                ganttWrapper.style.maxWidth = originalWrapperMaxWidth;

                                targetElement.style.maxWidth = originalTargetMaxWidth;
                                targetElement.style.width = originalTargetWidth;
                                targetElement.style.height = originalTargetHeight;
                            }
                            if (ganttSidebar) {
                                ganttSidebar.style.height = originalSidebarHeight;
                                ganttSidebar.style.position = originalSidebarPosition;
                            }
                            controls.forEach(c => c.style.display = '');
                            rowNumbers.forEach(r => r.style.display = '');
                            if (printTimestamp) {
                                printTimestamp.classList.add('d-none');
                                document.body.appendChild(printTimestamp);
                            }

                            // Restore original tasks
                            currentPlan.tasks = originalTasks;
                            if (window.GanttEngine) {
                                window.GanttEngine.render(currentPlan);
                            }

                            alert("Failed to export image. See console for details.");
                        });
                    } else {
                        // Restore if container not found
                        currentPlan.tasks = originalTasks;
                    }
                }
            });
        }

        // Tag Groups Modals actions
        const tagGroupsBtn = document.getElementById("tagGroupsBtn");
        if (tagGroupsBtn) {
            tagGroupsBtn.addEventListener("click", () => {
                this.openTagGroupsModal();
            });
        }

        const addTagGroupBtn = document.getElementById("addTagGroupBtn");
        if (addTagGroupBtn) {
            addTagGroupBtn.addEventListener("click", () => {
                this.addTagGroupCard();
            });
        }

        const saveTagGroupsBtn = document.getElementById("saveTagGroupsBtn");
        if (saveTagGroupsBtn) {
            saveTagGroupsBtn.addEventListener("click", () => {
                this.saveTagGroups();
            });
        }

        // Legends Modals actions
        const addFillLegendRowBtn = document.getElementById("addFillLegendRowBtn");
        if (addFillLegendRowBtn) {
            addFillLegendRowBtn.addEventListener("click", () => {
                this.addLegendRow('fill');
            });
        }

        const addBorderLegendRowBtn = document.getElementById("addBorderLegendRowBtn");
        if (addBorderLegendRowBtn) {
            addBorderLegendRowBtn.addEventListener("click", () => {
                this.addLegendRow('border');
            });
        }

        const saveLegendsBtn = document.getElementById("saveLegendsBtn");
        if (saveLegendsBtn) {
            saveLegendsBtn.addEventListener("click", () => {
                this.saveLegends();
            });
        }

        // Add Marker Button (For testing phase 3)
        const addMarkerBtn = document.getElementById("addMarkerBtn");
        if (addMarkerBtn) {
            addMarkerBtn.addEventListener("click", () => {
                this.openMarkerManagementModal();
            });
        }

        const addNewMarkerBtn = document.getElementById("addNewMarkerBtn");
        if (addNewMarkerBtn) {
            addNewMarkerBtn.addEventListener("click", () => {
                this.openMarkerEditModal();
            });
        }

        const saveMarkerBtn = document.getElementById("saveMarkerBtn");
        if (saveMarkerBtn) {
            saveMarkerBtn.addEventListener("click", () => {
                this.saveMarker();
            });
        }

        // Marker type radio buttons toggle fields
        const markerTypeRadios = document.querySelectorAll('.marker-type-radio');
        markerTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const dateContainer = document.getElementById('markerDateContainer');
                const rowContainer = document.getElementById('markerRowContainer');

                if (e.target.value === 'vertical') {
                    dateContainer.style.display = 'block';
                    rowContainer.style.display = 'none';
                } else {
                    dateContainer.style.display = 'none';
                    rowContainer.style.display = 'block';
                }
            });
        });

        // Task List Button
        const taskListBtn = document.getElementById("taskListBtn");
        if (taskListBtn) {
            taskListBtn.addEventListener("click", () => {
                const currentPlan = this.planner.getCurrentPlan();
                if (!currentPlan) return;
                this.openTaskListModal();
            });
        }

        // Add Task Button
        const addTaskBtn = document.getElementById("addTaskBtn");
        if (addTaskBtn) {
            addTaskBtn.addEventListener("click", () => {
                const currentPlan = this.planner.getCurrentPlan();
                if (!currentPlan) return;
                this.openTaskModal();
            });
        }

        // Save Task Button
        const saveTaskBtn = document.getElementById("saveTaskBtn");
        if (saveTaskBtn) {
            saveTaskBtn.addEventListener("click", () => {
                this.saveTask();
            });
        }

        // Capacity Add Row Button
        const addCapacityRowBtn = document.getElementById("addCapacityRowBtn");
        if (addCapacityRowBtn) {
            addCapacityRowBtn.addEventListener("click", () => {
                this.addCapacityRow();
            });
        }

        // Sync Plan Button
        const confirmSyncPlanBtn = document.getElementById("confirmSyncPlanBtn");
        if (confirmSyncPlanBtn) {
            confirmSyncPlanBtn.addEventListener("click", () => {
                this.confirmSyncPlan();
            });
        }

        // Listen for Gantt custom events
        const ganttContainer = document.getElementById('gantt-chart-container');
        if (ganttContainer) {
            ganttContainer.addEventListener('sync-plan-request', (e) => {
                const taskId = e.detail.taskId;
                this.openSyncPlanModal(taskId);
            });

            ganttContainer.addEventListener('sync-all-request', (e) => {
                const taskId = e.detail.taskId;
                if (confirm(`Are you sure you want to sync task "${taskId}" to all other plans?`)) {
                    if (this.planner.syncTaskToAllPlans(taskId)) {
                        alert(`Task "${taskId}" synced to all other plans.`);
                        this.updateUI();
                    } else {
                        alert(`Failed to sync task "${taskId}" or there are no other plans to sync to.`);
                    }
                }
            });
        }

        // Save Capacity Button
        const saveCapacityBtn = document.getElementById("saveCapacityBtn");
        if (saveCapacityBtn) {
            saveCapacityBtn.addEventListener("click", () => {
                this.saveCapacity();
            });
        }

        // Zoom Controls Events
        const zoomRadios = document.querySelectorAll('input[name="zoomLevel"]');
        zoomRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.planner.setZoomLevel(e.target.value);
                    if (window.GanttEngine) {
                        window.GanttEngine.render(this.planner.getCurrentPlan());
                    }
                }
            });
        });

        // Effort/Day Toggle Event
        const showEffortPerDayBtn = document.getElementById('showEffortPerDayBtn');
        if (showEffortPerDayBtn) {
            showEffortPerDayBtn.addEventListener('change', (e) => {
                this.planner.setShowEffortPerDay(e.target.checked);
                if (window.GanttEngine) {
                    window.GanttEngine.render(this.planner.getCurrentPlan());
                }
            });
        }

        // Marker Visibility Toggle Events
        const showMarkerMajorBtn = document.getElementById('showMarkerMajorBtn');
        if (showMarkerMajorBtn) {
            showMarkerMajorBtn.addEventListener('change', (e) => {
                this.planner.setShowMarkerMajor(e.target.checked);
                if (window.GanttEngine) {
                    window.GanttEngine.render(this.planner.getCurrentPlan());
                }
            });
        }
        const showMarkerMinorBtn = document.getElementById('showMarkerMinorBtn');
        if (showMarkerMinorBtn) {
            showMarkerMinorBtn.addEventListener('change', (e) => {
                this.planner.setShowMarkerMinor(e.target.checked);
                if (window.GanttEngine) {
                    window.GanttEngine.render(this.planner.getCurrentPlan());
                }
            });
        }
        const showMarkerNoteBtn = document.getElementById('showMarkerNoteBtn');
        if (showMarkerNoteBtn) {
            showMarkerNoteBtn.addEventListener('change', (e) => {
                this.planner.setShowMarkerNote(e.target.checked);
                if (window.GanttEngine) {
                    window.GanttEngine.render(this.planner.getCurrentPlan());
                }
            });
        }

        // Bulk Operations Modal
        const bulkOperationsBtn = document.getElementById('bulkOperationsBtn');
        if (bulkOperationsBtn) {
            bulkOperationsBtn.addEventListener('click', () => {
                // Populate the group tags dropdown
                const bulkGroupedTagsSelect = document.getElementById('bulkGroupedTagsSelect');
                if (bulkGroupedTagsSelect) {
                    bulkGroupedTagsSelect.innerHTML = '<option value="">Select Group Tag...</option>';
                    const tagGroups = this.planner.getTagGroups();
                    tagGroups.forEach(group => {
                        if (group.tags && group.tags.length > 0) {
                            const optgroup = document.createElement('optgroup');
                            optgroup.label = group.name;
                            group.tags.forEach(t => {
                                const option = document.createElement('option');
                                option.value = t.tag;
                                option.textContent = t.label;
                                optgroup.appendChild(option);
                            });
                            bulkGroupedTagsSelect.appendChild(optgroup);
                        }
                    });
                }

                const modal = new bootstrap.Modal(document.getElementById('bulkOperationsModal'));
                modal.show();
            });
        }

        const markAllActiveBtn = document.getElementById('markAllActiveBtn');
        if (markAllActiveBtn) {
            markAllActiveBtn.addEventListener('click', () => {
                if (window.GanttEngine && window.GanttEngine.renderedTasks) {
                    const activeIds = window.GanttEngine.renderedTasks
                        .filter(item => item.isMatch !== false && !item.task.excludeFromAnalytics)
                        .map(item => item.id);

                    if (this.planner.markAllActiveTasks(activeIds)) {
                        this.updateUI();
                    }
                }
            });
        }

        const unmarkAllBtn = document.getElementById('unmarkAllBtn');
        if (unmarkAllBtn) {
            unmarkAllBtn.addEventListener('click', () => {
                if (this.planner.unmarkAllTasks()) {
                    this.updateUI();
                }
            });
        }

        const bulkConvertToSelectionBtn = document.getElementById('bulkConvertToSelectionBtn');
        if (bulkConvertToSelectionBtn) {
            bulkConvertToSelectionBtn.addEventListener('click', () => {
                if (this.planner.convertMarksToSelection()) {
                    const modalEl = document.getElementById('bulkOperationsModal');
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                    this.updateUI();
                }
            });
        }

        const bulkAddTagsBtn = document.getElementById('bulkAddTagsBtn');
        const bulkRemoveTagsBtn = document.getElementById('bulkRemoveTagsBtn');
        const bulkTagsInput = document.getElementById('bulkTagsInput');

        if (bulkAddTagsBtn && bulkTagsInput) {
            bulkAddTagsBtn.addEventListener('click', () => {
                const tagsStr = bulkTagsInput.value;
                if (!tagsStr) return;
                const tagsArr = tagsStr.split(',').map(t => t.trim()).filter(t => t.length > 0);
                if (tagsArr.length > 0 && this.planner.addTagsToMarkedTasks(tagsArr)) {
                    bulkTagsInput.value = '';
                    this.updateUI();
                }
            });
        }

        if (bulkRemoveTagsBtn && bulkTagsInput) {
            bulkRemoveTagsBtn.addEventListener('click', () => {
                const tagsStr = bulkTagsInput.value;
                if (!tagsStr) return;
                const tagsArr = tagsStr.split(',').map(t => t.trim()).filter(t => t.length > 0);
                if (tagsArr.length > 0 && this.planner.removeTagsFromMarkedTasks(tagsArr)) {
                    bulkTagsInput.value = '';
                    this.updateUI();
                }
            });
        }

        const bulkAddGroupedTagBtn = document.getElementById('bulkAddGroupedTagBtn');
        const bulkRemoveGroupedTagBtn = document.getElementById('bulkRemoveGroupedTagBtn');
        const bulkGroupedTagsSelect = document.getElementById('bulkGroupedTagsSelect');

        if (bulkAddGroupedTagBtn && bulkGroupedTagsSelect) {
            bulkAddGroupedTagBtn.addEventListener('click', () => {
                const tag = bulkGroupedTagsSelect.value;
                if (!tag) return;
                if (this.planner.addTagsToMarkedTasks([tag])) {
                    this.updateUI();
                }
            });
        }

        if (bulkRemoveGroupedTagBtn && bulkGroupedTagsSelect) {
            bulkRemoveGroupedTagBtn.addEventListener('click', () => {
                const tag = bulkGroupedTagsSelect.value;
                if (!tag) return;
                if (this.planner.removeTagsFromMarkedTasks([tag])) {
                    this.updateUI();
                }
            });
        }

        const bulkSetStatusBtn = document.getElementById('bulkSetStatusBtn');
        const bulkStatusSelect = document.getElementById('bulkStatusSelect');
        if (bulkSetStatusBtn && bulkStatusSelect) {
            bulkSetStatusBtn.addEventListener('click', () => {
                const status = bulkStatusSelect.value;
                if (status && this.planner.setStatusOfMarkedTasks(status)) {
                    bulkStatusSelect.value = '';
                    this.updateUI();
                }
            });
        }

        const bulkSetExcludeBtn = document.getElementById('bulkSetExcludeBtn');
        const bulkExcludeSelect = document.getElementById('bulkExcludeSelect');
        if (bulkSetExcludeBtn && bulkExcludeSelect) {
            bulkSetExcludeBtn.addEventListener('click', () => {
                const exclude = bulkExcludeSelect.value === 'true';
                if (this.planner.setExcludeFromAnalyticsOfMarkedTasks(exclude)) {
                    this.updateUI();
                }
            });
        }

        // Tag Filter Events
        const tagFiltersContainer = document.getElementById('tagFiltersContainer');
        if (tagFiltersContainer) {
            tagFiltersContainer.addEventListener('change', (e) => {
                if (e.target.matches('.tag-checkbox')) {
                    this.updateTagFiltersState();
                }
            });

            tagFiltersContainer.addEventListener('click', (e) => {
                if (e.target.id === 'selectAllTagsBtn') {
                    const checkboxes = tagFiltersContainer.querySelectorAll('.tag-checkbox');
                    checkboxes.forEach(cb => cb.checked = true);
                    this.updateTagFiltersState();
                } else if (e.target.id === 'unselectAllTagsBtn') {
                    const checkboxes = tagFiltersContainer.querySelectorAll('.tag-checkbox');
                    checkboxes.forEach(cb => cb.checked = false);
                    this.updateTagFiltersState();
                }
            });
        }

        const tagFiltersIconsContainer = document.getElementById('tagFiltersIconsContainer');
        if (tagFiltersIconsContainer) {
            tagFiltersIconsContainer.addEventListener('change', (e) => {
                if (e.target.matches('.tag-match-mode-radio') || e.target.matches('.tag-visual-mode-radio')) {
                    this.updateTagFiltersState();
                } else if (e.target.id === 'showDependenciesCheckbox') {
                    this.planner.setShowDependencies(e.target.checked);
                    if (window.GanttEngine) {
                        window.GanttEngine.render(this.planner.getCurrentPlan());
                    }
                }
            });
        }

        const taskTextSearch = document.getElementById('taskTextSearch');
        if (taskTextSearch) {
            taskTextSearch.addEventListener('input', () => {
                this.updateTagFiltersState();
            });
        }
    }

    openImportPlanOptionsModal(data) {
        if (!data || !data.plans || data.plans.length === 0) return;

        const modalEl = document.getElementById('importPlanOptionsModal');
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

        const selectContainer = document.getElementById('importPlanSelectContainer');
        const planSelect = document.getElementById('importPlanSelect');
        planSelect.innerHTML = '';

        if (data.plans.length === 1) {
            selectContainer.style.display = 'none';
            const option = document.createElement('option');
            option.value = 0;
            option.textContent = data.plans[0].name || "Unnamed Plan";
            option.selected = true;
            planSelect.appendChild(option);
        } else {
            selectContainer.style.display = 'block';
            data.plans.forEach((plan, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = plan.name || `Plan ${index + 1}`;
                planSelect.appendChild(option);
            });
        }

        const currentPlan = this.planner.getCurrentPlan();
        if (!currentPlan) {
            document.getElementById('importPlanActionMerge').disabled = true;
            document.getElementById('importPlanActionNew').checked = true;
        } else {
            document.getElementById('importPlanActionMerge').disabled = false;
        }

        modal.show();
    }

    handleImportPlanOptionsContinue() {
        const action = document.querySelector('input[name="importPlanAction"]:checked').value;
        const planIndex = parseInt(document.getElementById('importPlanSelect').value, 10);

        if (!this.importedFileData || !this.importedFileData.plans || isNaN(planIndex)) {
            alert("Invalid plan selection.");
            return;
        }

        const selectedPlan = this.importedFileData.plans[planIndex];

        const optionsModalEl = document.getElementById('importPlanOptionsModal');
        const optionsModal = bootstrap.Modal.getInstance(optionsModalEl);
        if (optionsModal) optionsModal.hide();

        if (action === 'new') {
            if (this.planner.appendPlan(selectedPlan)) {
                this.updateUI();
                console.log("Plan imported as new.");
            } else {
                alert("Failed to import plan.");
            }
        } else if (action === 'merge') {
            const ignoredFields = Array.from(document.querySelectorAll('.merge-ignore-check:checked')).map(cb => cb.value);
            const diff = this.planner.calculatePlanDiff(selectedPlan, ignoredFields);
            if (diff) {
                this.pendingImportedPlan = selectedPlan;
                this.pendingImportedPlanIgnoredFields = ignoredFields;
                this.openMergeDiffModal(diff, ignoredFields);
            } else {
                alert("Error calculating plan differences.");
            }
        }
    }

    openMergeDiffModal(diff, ignoredFields = []) {
        if (!diff) return;

        const modalEl = document.getElementById('mergePlanDiffModal');
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

        // Render Capacity diff
        const capacityCheck = document.getElementById('mergeCapacityCheck');
        if (diff.capacity.different) {
            capacityCheck.checked = false;
            capacityCheck.disabled = false;
            capacityCheck.parentElement.style.display = 'block';
        } else {
            capacityCheck.checked = false;
            capacityCheck.disabled = true;
            capacityCheck.parentElement.style.display = 'none';
        }

        // Render Tasks diff
        const tasksTbody = document.getElementById('mergeTasksTableBody');
        tasksTbody.innerHTML = '';

        const renderTaskRow = (type, task, extraInfo = '') => {
            let statusBadge = '';
            if (type === 'new') statusBadge = '<span class="badge bg-success">New</span>';
            else if (type === 'modified') statusBadge = '<span class="badge bg-warning text-dark">Modified</span>';
            else if (type === 'deleted') statusBadge = '<span class="badge bg-danger">Deleted</span>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="text-center align-middle">
                    <input class="form-check-input merge-task-check" type="checkbox" data-type="${type}" data-id="${this.escapeHtml(task.id)}">
                </td>
                <td class="align-middle">${statusBadge}</td>
                <td class="align-middle fw-bold">${this.escapeHtml(task.id)}</td>
                <td class="align-middle">${this.escapeHtml(task.title)}</td>
                <td class="align-middle small text-muted">${extraInfo}</td>
            `;
            tasksTbody.appendChild(tr);
        };

        const getChangedFieldsHtml = (current, imported) => {
            const changedKeys = [];
            let tooltipContent = '';

            const allKeys = new Set([...Object.keys(current || {}), ...Object.keys(imported || {})]);
            allKeys.forEach(key => {
                if (ignoredFields.includes(key)) return;
                const currVal = JSON.stringify(current[key]);
                const impVal = JSON.stringify(imported[key]);
                if (currVal !== impVal) {
                    changedKeys.push(key);
                    // Format strings for tooltip
                    const fromStr = current[key] !== undefined ? current[key] : 'none';
                    const toStr = imported[key] !== undefined ? imported[key] : 'none';

                    // formatting arrays like tags or dependencies to read nicer
                    const formatVal = (v) => {
                        if (Array.isArray(v)) return v.length ? v.join(', ') : 'none';
                        if (typeof v === 'object' && v !== null) return JSON.stringify(v);
                        return v;
                    };

                    tooltipContent += `${key}:\n  Before: ${formatVal(fromStr)}\n  After: ${formatVal(toStr)}\n`;
                }
            });

            if (changedKeys.length === 0) return 'No visible changes';

            let html = 'Changed fields: ' + changedKeys.join(', ');

            if (tooltipContent) {
                const safeTooltip = this.escapeHtml(tooltipContent.trim());
                html += ` <span class="badge rounded-pill bg-info text-dark ms-1" style="cursor: help; vertical-align: middle;" title="${safeTooltip}">i</span>`;
            }

            return html;
        };

        if (diff.tasks.new.length === 0 && diff.tasks.modified.length === 0 && diff.tasks.deleted.length === 0) {
            tasksTbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No task changes detected.</td></tr>';
        } else {
            diff.tasks.new.forEach(task => renderTaskRow('new', task, `Start: ${task.startDate}, End: ${task.endDate}`));
            diff.tasks.modified.forEach(mod => {
                const diffHtml = getChangedFieldsHtml(mod.current, mod.imported);
                renderTaskRow('modified', mod.imported, diffHtml);
            });
            diff.tasks.deleted.forEach(task => renderTaskRow('deleted', task, 'Task exists in current plan but not in imported plan'));
        }

        // Render Markers diff
        const markersTbody = document.getElementById('mergeMarkersTableBody');
        markersTbody.innerHTML = '';

        const renderMarkerRow = (type, marker, extraInfo = '') => {
            let statusBadge = '';
            if (type === 'new') statusBadge = '<span class="badge bg-success">New</span>';
            else if (type === 'modified') statusBadge = '<span class="badge bg-warning text-dark">Modified</span>';
            else if (type === 'deleted') statusBadge = '<span class="badge bg-danger">Deleted</span>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="text-center align-middle">
                    <input class="form-check-input merge-marker-check" type="checkbox" data-type="${type}" data-id="${this.escapeHtml(marker.id)}">
                </td>
                <td class="align-middle">${statusBadge}</td>
                <td class="align-middle fw-bold">${this.escapeHtml(marker.label)}</td>
                <td class="align-middle small text-muted">${extraInfo}</td>
            `;
            markersTbody.appendChild(tr);
        };

        if (diff.markers.new.length === 0 && diff.markers.modified.length === 0 && diff.markers.deleted.length === 0) {
            markersTbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No marker changes detected.</td></tr>';
        } else {
            diff.markers.new.forEach(marker => renderMarkerRow('new', marker, `Type: ${marker.type}`));
            diff.markers.modified.forEach(mod => {
                const diffHtml = getChangedFieldsHtml(mod.current, mod.imported);
                renderMarkerRow('modified', mod.imported, diffHtml);
            });
            diff.markers.deleted.forEach(marker => renderMarkerRow('deleted', marker, 'Marker exists in current plan but not in imported plan'));
        }

        modal.show();
    }

    confirmMergePlan() {
        if (!this.pendingImportedPlan) return;

        const diffSelection = {
            capacity: document.getElementById('mergeCapacityCheck').checked,
            tasks: { new: [], modified: [], deleted: [] },
            markers: { new: [], modified: [], deleted: [] }
        };

        document.querySelectorAll('.merge-task-check:checked').forEach(cb => {
            const type = cb.getAttribute('data-type');
            const id = cb.getAttribute('data-id');
            if (diffSelection.tasks[type]) diffSelection.tasks[type].push(id);
        });

        document.querySelectorAll('.merge-marker-check:checked').forEach(cb => {
            const type = cb.getAttribute('data-type');
            const id = cb.getAttribute('data-id');
            if (diffSelection.markers[type]) diffSelection.markers[type].push(id);
        });

        if (this.planner.applyPlanMerge(diffSelection, this.pendingImportedPlan, this.pendingImportedPlanIgnoredFields || [])) {
            const modalEl = document.getElementById('mergePlanDiffModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();

            this.pendingImportedPlan = null;
            this.updateUI();
            alert("Changes applied successfully.");
        } else {
            alert("Failed to apply merge changes.");
        }
    }

    openTaskListModal() {
        const currentPlan = this.planner.getCurrentPlan();
        if (!currentPlan) return;

        const modalEl = document.getElementById('taskListModal');
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

        const searchInput = document.getElementById('taskListSearch');
        searchInput.value = ''; // Reset search

        this.renderTaskListTable('');

        // Bind search event just once (if not already bound)
        if (!searchInput.dataset.bound) {
            searchInput.addEventListener('input', (e) => {
                this.renderTaskListTable(e.target.value.toLowerCase());
            });
            searchInput.dataset.bound = 'true';
        }

        modal.show();
    }

    renderTaskListTable(searchTerm) {
        const currentPlan = this.planner.getCurrentPlan();
        if (!currentPlan) return;

        const tbody = document.getElementById('taskListTableBody');
        tbody.innerHTML = '';

        const tasks = currentPlan.tasks || [];

        const filteredTasks = tasks.filter(task => {
            const idMatch = (task.id || '').toLowerCase().includes(searchTerm);
            const descMatch = (task.title || '').toLowerCase().includes(searchTerm);
            return idMatch || descMatch;
        });

        if (filteredTasks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No tasks found.</td></tr>';
            return;
        }

        filteredTasks.forEach(task => {
            const effortDesign = task.effort && task.effort.design ? parseFloat(task.effort.design) : 0;
            const effortDev = task.effort && task.effort.dev ? parseFloat(task.effort.dev) : 0;
            const effortTest = task.effort && task.effort.test ? parseFloat(task.effort.test) : 0;
            const totalEffort = effortDesign + effortDev + effortTest;

            const tr = document.createElement('tr');
            const removedStyle = (task.status === 'Removed') ? 'text-decoration: line-through; opacity: 0.5;' : '';
            tr.style.cssText = removedStyle;
            tr.innerHTML = `
                <td>${this.escapeHtml(task.id)}</td>
                <td>${this.escapeHtml(task.title)}</td>
                <td>${totalEffort}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    openSyncPlanModal(taskId) {
        if (!taskId) return;

        const currentPlanIndex = this.planner.currentPlanIndex;
        const allPlans = this.planner.file.plans;
        const targetPlanSelect = document.getElementById('syncTargetPlan');
        targetPlanSelect.innerHTML = '';

        let hasOtherPlans = false;
        allPlans.forEach((plan, index) => {
            if (index !== currentPlanIndex) {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = plan.name || "Unnamed Plan";
                targetPlanSelect.appendChild(option);
                hasOtherPlans = true;
            }
        });

        if (!hasOtherPlans) {
            alert("There are no other plans to sync this task to.");
            return;
        }

        document.getElementById('syncTaskId').value = taskId;

        const syncModalEl = document.getElementById('syncPlanModal');
        const syncModal = bootstrap.Modal.getOrCreateInstance(syncModalEl);
        syncModal.show();
    }

    confirmSyncPlan() {
        const taskId = document.getElementById('syncTaskId').value;
        const targetPlanIndexStr = document.getElementById('syncTargetPlan').value;

        if (!taskId || targetPlanIndexStr === '') {
            alert("Please select a valid task and target plan.");
            return;
        }

        const targetPlanIndex = parseInt(targetPlanIndexStr, 10);

        if (this.planner.syncTaskToPlan(taskId, targetPlanIndex)) {
            const syncModalEl = document.getElementById('syncPlanModal');
            const syncModal = bootstrap.Modal.getInstance(syncModalEl);
            if (syncModal) {
                syncModal.hide();
            }
            alert(`Task "${taskId}" successfully synced to the selected plan.`);
        } else {
            alert("Failed to sync task.");
        }
    }

    openEditPlanModal() {
        const currentPlan = this.planner.getCurrentPlan();
        if (!currentPlan) return;

        const editPlanModalEl = document.getElementById('editPlanModal');
        const editPlanModal = bootstrap.Modal.getOrCreateInstance(editPlanModalEl);

        document.getElementById('editPlanName').value = currentPlan.name || '';
        document.getElementById('editPlanStartDate').value = currentPlan.timeline.startDate || '';
        document.getElementById('editPlanEndDate').value = currentPlan.timeline.endDate || '';

        editPlanModal.show();
    }

    saveEditPlan() {
        const currentPlan = this.planner.getCurrentPlan();
        if (!currentPlan) return;

        const newName = document.getElementById('editPlanName').value.trim();
        const newStartDate = document.getElementById('editPlanStartDate').value;
        const newEndDate = document.getElementById('editPlanEndDate').value;

        if (!newName || !newStartDate || !newEndDate) {
            alert("Please fill in all fields.");
            return;
        }

        const startObj = new Date(newStartDate);
        const endObj = new Date(newEndDate);

        if (startObj > endObj) {
            alert("Start date cannot be after end date.");
            return;
        }

        // Check for out of bounds tasks
        let outOfBoundsCount = 0;
        if (currentPlan.tasks && currentPlan.tasks.length > 0) {
            currentPlan.tasks.forEach(task => {
                const taskStart = new Date(task.startDate);
                const taskEnd = new Date(task.endDate);

                // Note: taskEnd < startObj means task finishes before new timeline starts
                // taskStart > endObj means task starts after new timeline ends
                if (taskEnd < startObj || taskStart > endObj) {
                    outOfBoundsCount++;
                }
            });
        }

        if (outOfBoundsCount > 0) {
            const proceed = confirm(`Warning: ${outOfBoundsCount} task(s) fall completely outside the new timeline dates. They will still exist but will not be visible on the chart. Do you wish to proceed?`);
            if (!proceed) return;
        }

        // Update plan via planner state
        if (this.planner.updatePlanDetails(newName, newStartDate, newEndDate)) {
            const editPlanModalEl = document.getElementById('editPlanModal');
            const editPlanModal = bootstrap.Modal.getInstance(editPlanModalEl);
            if (editPlanModal) {
                editPlanModal.hide();
            }
            this.updateUI();
        }
    }

    openSettingsModal() {
        const settingsModalEl = document.getElementById('settingsModal');
        const settingsModal = bootstrap.Modal.getOrCreateInstance(settingsModalEl);
        const baseLinkInput = document.getElementById('settingsBaseLink');

        const settings = this.planner.getState().settings || {};
        baseLinkInput.value = settings.baseLink || '';

        settingsModal.show();
    }

    saveSettings() {
        const baseLink = document.getElementById('settingsBaseLink').value.trim();

        this.planner.updateSettings({ baseLink });

        const settingsModalEl = document.getElementById('settingsModal');
        const settingsModal = bootstrap.Modal.getInstance(settingsModalEl);
        if (settingsModal) {
            settingsModal.hide();
        }

        this.updateUI();
    }

    updateTagFiltersState() {
        const container = document.getElementById('tagFiltersContainer');
        if (!container) return;

        const selectedTags = Array.from(container.querySelectorAll('.tag-checkbox:checked')).map(cb => cb.value);

        const iconsContainer = document.getElementById('tagFiltersIconsContainer');

        let matchMode = 'any';
        let visualMode = 'show';

        if (iconsContainer) {
            const matchModeEl = iconsContainer.querySelector('.tag-match-mode-radio:checked');
            if (matchModeEl) matchMode = matchModeEl.value;

            const visualModeEl = iconsContainer.querySelector('.tag-visual-mode-radio:checked');
            if (visualModeEl) visualMode = visualModeEl.value;
        }

        const taskTextSearch = document.getElementById('taskTextSearch');
        const searchText = taskTextSearch ? taskTextSearch.value : '';

        this.planner.setFilterState({
            selectedTags,
            matchMode,
            visualMode,
            searchText
        });

        if (window.GanttEngine) {
            window.GanttEngine.render(this.planner.getCurrentPlan());
        }

        // Trigger Analytics re-render if visible
        if (window.AnalyticsEngine) {
            const container = document.getElementById("analyticsContainer");
            if (container && !container.classList.contains("d-none")) {
                window.AnalyticsEngine.render(this.planner.getCurrentPlan());
            }
        }
    }

    saveTask() {
        const id = document.getElementById('taskId').value.trim();
        const title = document.getElementById('taskTitle').value.trim();
        const startDate = document.getElementById('taskStartDate').value;
        const endDate = document.getElementById('taskEndDate').value;

        if (!id || !title || !startDate || !endDate) {
            alert("Please fill in all required fields (ID, Title, Start Date, End Date).");
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            alert("Start date cannot be after end date.");
            return;
        }

        const fillLegendId = document.getElementById('taskFillLegend').value;
        const borderLegendId = document.getElementById('taskBorderLegend').value;

        const fillLegends = this.planner.getFillLegends();
        const borderLegends = this.planner.getBorderLegends();

        const selectedFillLegend = fillLegends.find(l => l.id === fillLegendId) || fillLegends.find(l => l.id === 'default_fill');
        const selectedBorderLegend = borderLegends.find(l => l.id === borderLegendId) || borderLegends.find(l => l.id === 'default_border');

        const originalTaskId = document.getElementById('originalTaskId').value;
        const taskStatus = document.getElementById('taskStatus').value;

        let existingTags = document.getElementById('taskTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
        let dependencies = document.getElementById('taskDependencies').value.split(',').map(dep => dep.trim()).filter(dep => dep);

        // Remove old tags belonging to the groups so we can add the newly checked ones
        const tagGroups = this.planner.getTagGroups();
        tagGroups.forEach(group => {
            if (group.tags) {
                group.tags.forEach(t => {
                    existingTags = existingTags.filter(existingTag => existingTag !== t.tag);
                });
            }
        });

        // Add newly checked tags from the group dropdown
        const groupedCheckboxes = document.querySelectorAll('.task-grouped-tag-checkbox:checked');
        groupedCheckboxes.forEach(cb => {
            if (!existingTags.includes(cb.value)) {
                existingTags.push(cb.value);
            }
        });

        if (originalTaskId) {
            const originalTask = this.planner.getTaskById(originalTaskId);
            if (originalTask) {
                // Remove old fill legend tag
                if (originalTask.fillLegendId) {
                    const oldFillLegend = fillLegends.find(l => l.id === originalTask.fillLegendId);
                    if (oldFillLegend && oldFillLegend.tag) {
                        existingTags = existingTags.filter(t => t !== oldFillLegend.tag);
                    }
                }
                // Remove old border legend tag
                if (originalTask.borderLegendId) {
                    const oldBorderLegend = borderLegends.find(l => l.id === originalTask.borderLegendId);
                    if (oldBorderLegend && oldBorderLegend.tag) {
                        existingTags = existingTags.filter(t => t !== oldBorderLegend.tag);
                    }
                }
                // Remove old status tag
                if (originalTask.status) {
                    existingTags = existingTags.filter(t => t.toLowerCase() !== originalTask.status.toLowerCase());
                }
            }
        }

        // Add new status tag if selected
        if (taskStatus) {
            existingTags.push(taskStatus);
        }

        // Add the new fill legend's tag if not already present
        if (selectedFillLegend && selectedFillLegend.tag && !existingTags.includes(selectedFillLegend.tag)) {
            existingTags.push(selectedFillLegend.tag);
        }

        // Add the new border legend's tag if not already present
        if (selectedBorderLegend && selectedBorderLegend.tag && !existingTags.includes(selectedBorderLegend.tag)) {
            existingTags.push(selectedBorderLegend.tag);
        }

        // Ensure tags are unique
        const uniqueTags = [...new Set(existingTags)];

        const taskData = {
            id: id,
            title: title,
            description: document.getElementById('taskDescription').value,
            startDate: startDate,
            endDate: endDate,
            row: parseInt(document.getElementById('taskRow').value, 10) || 1,
            fillLegendId: selectedFillLegend ? selectedFillLegend.id : 'default_fill',
            borderLegendId: selectedBorderLegend ? selectedBorderLegend.id : 'default_border',
            fillColor: selectedFillLegend ? selectedFillLegend.color : '#4da3ff',
            borderColor: selectedBorderLegend ? selectedBorderLegend.color : '#1c6ed5',
            status: taskStatus || null,
            tags: uniqueTags,
            dependencies: dependencies,
            effort: {
                design: parseFloat(document.getElementById('taskEffortDesign').value) || 0,
                dev: parseFloat(document.getElementById('taskEffortDev').value) || 0,
                test: parseFloat(document.getElementById('taskEffortTest').value) || 0
            },
            excludeFromAnalytics: document.getElementById('taskExcludeFromAnalytics').checked
        };

        // Handle logic for updating dependent tasks if ID changed
        let dependentTasks = [];
        if (originalTaskId && originalTaskId !== id) {
            const currentPlan = this.planner.getCurrentPlan();
            if (currentPlan && currentPlan.tasks) {
                dependentTasks = currentPlan.tasks.filter(t => t.dependencies && t.dependencies.includes(originalTaskId));
            }
        }

        const performSave = (updateDeps) => {
            let success = false;

            if (originalTaskId) {
                success = this.planner.updateTask(originalTaskId, taskData);
                if (!success) {
                    alert("Failed to update task. Task ID might be a duplicate.");
                    return;
                }

                // If ID changed and we need to update deps
                if (updateDeps && originalTaskId !== id && dependentTasks.length > 0) {
                    dependentTasks.forEach(depTask => {
                        // Replace the old ID with the new ID in the dependencies array
                        const newDeps = depTask.dependencies.map(d => d === originalTaskId ? id : d);
                        // Make sure we only have unique values just in case
                        depTask.dependencies = [...new Set(newDeps)];
                        this.planner.updateTask(depTask.id, depTask);
                    });
                }
            } else {
                success = this.planner.addTask(taskData);
                if (!success) {
                    alert("Failed to add task. Task ID must be unique within the plan.");
                    return;
                }
            }

            if (success) {
                const taskModalEl = document.getElementById('taskModal');
                const taskModal = bootstrap.Modal.getInstance(taskModalEl);
                if (taskModal) {
                    taskModal.hide();
                }
                this.updateUI();
            }
        };

        if (dependentTasks.length > 0) {
            const depModalEl = document.getElementById('updateDependenciesModal');
            const depModal = bootstrap.Modal.getOrCreateInstance(depModalEl);

            const modalBody = document.getElementById('updateDependenciesModalBody');
            const depTaskIds = dependentTasks.map(t => t.id).join(', ');
            modalBody.innerHTML = `
                <p>The task ID has changed from <strong>${this.escapeHtml(originalTaskId)}</strong> to <strong>${this.escapeHtml(id)}</strong>.</p>
                <p>The following tasks depend on <strong>${this.escapeHtml(originalTaskId)}</strong>:</p>
                <ul>
                    <li>${this.escapeHtml(depTaskIds)}</li>
                </ul>
                <p>Would you like to update these tasks to depend on the new ID?</p>
            `;

            // Temporary bound functions so we can remove them later to avoid duplicate triggers
            const btnUpdate = document.getElementById('updateDependenciesAndSaveBtn');
            const btnSaveOnly = document.getElementById('saveWithoutUpdatingBtn');
            const btnCancel = document.getElementById('cancelUpdateDependenciesBtn');

            // Clone to remove existing event listeners
            const newBtnUpdate = btnUpdate.cloneNode(true);
            const newBtnSaveOnly = btnSaveOnly.cloneNode(true);
            const newBtnCancel = btnCancel.cloneNode(true);

            btnUpdate.parentNode.replaceChild(newBtnUpdate, btnUpdate);
            btnSaveOnly.parentNode.replaceChild(newBtnSaveOnly, btnSaveOnly);
            btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);

            newBtnUpdate.addEventListener('click', () => {
                depModal.hide();
                performSave(true);
            });

            newBtnSaveOnly.addEventListener('click', () => {
                depModal.hide();
                performSave(false);
            });

            // Cancel just closes this modal, leaves task modal open
            newBtnCancel.addEventListener('click', () => {
                depModal.hide();
            });

            depModal.show();
        } else {
            // Normal save
            performSave(false);
        }
    }

    openTaskModal(taskId = null) {
        // We will implement modal logic in the next step
        const taskModalEl = document.getElementById('taskModal');
        const taskModal = bootstrap.Modal.getOrCreateInstance(taskModalEl);

        const form = document.getElementById('taskForm');
        form.reset();

        // Populate the fill legend dropdown
        const taskFillLegendSelect = document.getElementById('taskFillLegend');
        taskFillLegendSelect.innerHTML = '';
        const fillLegends = this.planner.getFillLegends();
        fillLegends.forEach(legend => {
            const option = document.createElement('option');
            option.value = legend.id;
            option.textContent = legend.label;
            taskFillLegendSelect.appendChild(option);
        });

        // Populate the border legend dropdown
        const taskBorderLegendSelect = document.getElementById('taskBorderLegend');
        taskBorderLegendSelect.innerHTML = '';
        const borderLegends = this.planner.getBorderLegends();
        borderLegends.forEach(legend => {
            const option = document.createElement('option');
            option.value = legend.id;
            option.textContent = legend.label;
            taskBorderLegendSelect.appendChild(option);
        });

        // Populate Grouped Tags dropdown
        const taskGroupedTagsDropdown = document.getElementById('taskGroupedTagsDropdown');
        taskGroupedTagsDropdown.innerHTML = '';
        const tagGroups = this.planner.getTagGroups();

        let hasGroupTags = false;
        tagGroups.forEach(group => {
            if (group.tags && group.tags.length > 0) {
                hasGroupTags = true;
                const headerLi = document.createElement('li');
                headerLi.innerHTML = `<h6 class="dropdown-header border-bottom mb-1 pb-1 text-uppercase fw-bold">${this.escapeHtml(group.name)}</h6>`;
                taskGroupedTagsDropdown.appendChild(headerLi);

                group.tags.forEach(t => {
                    const li = document.createElement('li');
                    const safeTagAttr = t.tag.replace(/"/g, '&quot;');
                    const safeTagLabel = this.escapeHtml(t.label);
                    li.innerHTML = `
                        <div class="dropdown-item d-flex align-items-center py-1">
                            <div class="form-check m-0 w-100">
                                <input class="form-check-input task-grouped-tag-checkbox" type="checkbox" id="modalGroupTag_${safeTagAttr}" value="${safeTagAttr}">
                                <label class="form-check-label small w-100" for="modalGroupTag_${safeTagAttr}" style="cursor: pointer;">
                                    ${safeTagLabel}
                                </label>
                            </div>
                        </div>
                    `;
                    taskGroupedTagsDropdown.appendChild(li);
                });
            }
        });

        if (!hasGroupTags) {
            taskGroupedTagsDropdown.innerHTML = '<li><span class="dropdown-item-text text-muted small">No tag groups configured</span></li>';
        }

        // Populate Marker dropdowns
        const currentPlan = this.planner.getCurrentPlan();
        const startMarkerBtn = document.getElementById('startMarkerBtn');
        const endMarkerBtn = document.getElementById('endMarkerBtn');
        const startMarkerDropdown = document.getElementById('startMarkerDropdown');
        const endMarkerDropdown = document.getElementById('endMarkerDropdown');

        startMarkerDropdown.innerHTML = '';
        endMarkerDropdown.innerHTML = '';

        if (currentPlan && currentPlan.markers) {
            const verticalMarkers = currentPlan.markers.filter(m => m.type === 'vertical');
            if (verticalMarkers.length > 0) {
                startMarkerBtn.disabled = false;
                endMarkerBtn.disabled = false;

                verticalMarkers.forEach(marker => {
                    const startLi = document.createElement('li');
                    const startA = document.createElement('a');
                    startA.className = 'dropdown-item';
                    startA.href = '#';
                    startA.textContent = `${marker.label} (${marker.date})`;
                    startA.addEventListener('click', (e) => {
                        e.preventDefault();
                        document.getElementById('taskStartDate').value = marker.date;
                    });
                    startLi.appendChild(startA);
                    startMarkerDropdown.appendChild(startLi);

                    const endLi = document.createElement('li');
                    const endA = document.createElement('a');
                    endA.className = 'dropdown-item';
                    endA.href = '#';

                    // Calculate date - 1 day for end date
                    const parts = marker.date.split('-');
                    const markerDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                    markerDate.setDate(markerDate.getDate() - 1);
                    const yyyy = markerDate.getFullYear();
                    const mm = String(markerDate.getMonth() + 1).padStart(2, '0');
                    const dd = String(markerDate.getDate()).padStart(2, '0');
                    const formattedDate = `${yyyy}-${mm}-${dd}`;

                    endA.textContent = `${marker.label} (${formattedDate})`;
                    endA.addEventListener('click', (e) => {
                        e.preventDefault();
                        document.getElementById('taskEndDate').value = formattedDate;
                    });
                    endLi.appendChild(endA);
                    endMarkerDropdown.appendChild(endLi);
                });
            } else {
                startMarkerBtn.disabled = true;
                endMarkerBtn.disabled = true;
                startMarkerDropdown.innerHTML = '<li><span class="dropdown-item-text text-muted">No vertical markers</span></li>';
                endMarkerDropdown.innerHTML = '<li><span class="dropdown-item-text text-muted">No vertical markers</span></li>';
            }
        } else {
            startMarkerBtn.disabled = true;
            endMarkerBtn.disabled = true;
            startMarkerDropdown.innerHTML = '<li><span class="dropdown-item-text text-muted">No vertical markers</span></li>';
            endMarkerDropdown.innerHTML = '<li><span class="dropdown-item-text text-muted">No vertical markers</span></li>';
        }

        if (taskId) {
            const task = this.planner.getTaskById(taskId);
            if (task) {
                document.getElementById('taskId').value = task.id;
                document.getElementById('taskId').readOnly = false; // allow editing ID
                document.getElementById('originalTaskId').value = task.id;

                document.getElementById('taskTitle').value = task.title || '';
                document.getElementById('taskDescription').value = task.description || '';
                document.getElementById('taskStartDate').value = task.startDate || '';
                document.getElementById('taskEndDate').value = task.endDate || '';
                document.getElementById('taskRow').value = task.row !== undefined ? task.row : 1;
                document.getElementById('taskStatus').value = task.status || '';

                // Collect all possible grouped tags to filter them out of the input text box
                const allGroupedTags = [];
                tagGroups.forEach(g => {
                    if (g.tags) {
                        g.tags.forEach(t => allGroupedTags.push(t.tag));
                    }
                });

                // Check the grouped checkboxes if the task has them
                const groupedCheckboxes = document.querySelectorAll('.task-grouped-tag-checkbox');
                groupedCheckboxes.forEach(cb => {
                    cb.checked = (task.tags || []).includes(cb.value);
                });

                // Don't show the status tag in the "Tags" input field to avoid duplication
                const tagsToDisplay = (task.tags || []).filter(t => !task.status || t.toLowerCase() !== task.status.toLowerCase());
                document.getElementById('taskTags').value = tagsToDisplay.join(', ');
                document.getElementById('taskDependencies').value = (task.dependencies || []).join(', ');

                if (task.fillLegendId && fillLegends.some(l => l.id === task.fillLegendId)) {
                    taskFillLegendSelect.value = task.fillLegendId;
                } else {
                    taskFillLegendSelect.value = 'default_fill';
                }

                if (task.borderLegendId && borderLegends.some(l => l.id === task.borderLegendId)) {
                    taskBorderLegendSelect.value = task.borderLegendId;
                } else {
                    taskBorderLegendSelect.value = 'default_border';
                }

                document.getElementById('taskEffortDesign').value = task.effort ? task.effort.design || 0 : 0;
                document.getElementById('taskEffortDev').value = task.effort ? task.effort.dev || 0 : 0;
                document.getElementById('taskEffortTest').value = task.effort ? task.effort.test || 0 : 0;

                document.getElementById('taskExcludeFromAnalytics').checked = task.excludeFromAnalytics === true;
            }
        } else {
            document.getElementById('taskId').value = '';
            document.getElementById('taskId').readOnly = false;
            document.getElementById('originalTaskId').value = '';
            document.getElementById('taskStatus').value = '';
            document.getElementById('taskDependencies').value = '';
            document.getElementById('taskExcludeFromAnalytics').checked = false;

            taskFillLegendSelect.value = 'default_fill';
            taskBorderLegendSelect.value = 'default_border';
        }

        taskModal.show();
    }

    openMarkerManagementModal() {
        const currentPlan = this.planner.getCurrentPlan();
        if (!currentPlan) return;

        const modalEl = document.getElementById('markerManagementModal');
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        this.renderMarkerTable();
        modal.show();
    }

    renderMarkerTable() {
        const currentPlan = this.planner.getCurrentPlan();
        if (!currentPlan) return;

        const tbody = document.getElementById('markerTableBody');
        tbody.innerHTML = '';

        const markers = currentPlan.markers || [];
        if (markers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No markers added yet.</td></tr>';
            return;
        }

        markers.forEach(marker => {
            const tr = document.createElement('tr');

            let positionHtml = '';
            if (marker.type === 'vertical') {
                positionHtml = `Date: ${marker.date}`;
            } else {
                positionHtml = `Before Row: ${marker.row}`;
            }

            const isVisible = marker.visible !== false;

            tr.innerHTML = `
                <td class="align-middle">${this.escapeHtml(marker.label)}</td>
                <td class="align-middle"><span class="badge bg-secondary">${marker.type || 'vertical'}</span></td>
                <td class="align-middle">${positionHtml}</td>
                <td class="align-middle">
                    <div style="width: 20px; height: 20px; background-color: ${marker.color}; border-radius: 4px; border: 1px solid #ccc;"></div>
                </td>
                <td class="align-middle">${marker.importance || 'minor'}</td>
                <td class="align-middle text-center">
                    <input class="form-check-input toggle-marker-visible" type="checkbox" data-id="${marker.id}" ${isVisible ? 'checked' : ''} title="Toggle visibility">
                </td>
                <td class="align-middle">
                    <button class="btn btn-sm btn-outline-primary py-0 px-2 edit-marker-btn" data-id="${marker.id}">Edit</button>
                    <button class="btn btn-sm btn-outline-danger py-0 px-2 delete-marker-btn" data-id="${marker.id}">&times;</button>
                </td>
            `;

            const visibleCheckbox = tr.querySelector('.toggle-marker-visible');
            visibleCheckbox.addEventListener('change', (e) => {
                if (this.planner.updateMarker(marker.id, { visible: e.target.checked })) {
                    this.updateUI();
                } else {
                    e.target.checked = !e.target.checked; // revert on failure
                    alert("Failed to update marker visibility.");
                }
            });

            const editBtn = tr.querySelector('.edit-marker-btn');
            editBtn.addEventListener('click', () => {
                this.openMarkerEditModal(marker.id);
            });

            const deleteBtn = tr.querySelector('.delete-marker-btn');
            if (marker.id === 'marker_today') {
                deleteBtn.disabled = true;
                deleteBtn.title = 'Cannot delete Today marker';
            } else {
                deleteBtn.addEventListener('click', () => {
                    if (confirm('Are you sure you want to delete this marker?')) {
                        if (this.planner.deleteMarker(marker.id)) {
                            this.renderMarkerTable();
                            this.updateUI();
                        }
                    }
                });
            }

            tbody.appendChild(tr);
        });
    }

    openMarkerEditModal(markerId = null) {
        const currentPlan = this.planner.getCurrentPlan();
        if (!currentPlan) return;

        const mngModalEl = document.getElementById('markerManagementModal');
        const mngModal = bootstrap.Modal.getInstance(mngModalEl);
        if (mngModal) {
            mngModal.hide(); // Hide the management modal so they don't stack weirdly
        }

        const editModalEl = document.getElementById('markerEditModal');
        const editModal = bootstrap.Modal.getOrCreateInstance(editModalEl);
        const form = document.getElementById('markerForm');
        form.reset();

        const dateInput = document.getElementById('markerDate');
        dateInput.readOnly = false;
        document.getElementById('markerTypeVertical').disabled = false;
        document.getElementById('markerTypeHorizontal').disabled = false;

        document.getElementById('markerId').value = '';
        document.getElementById('markerTypeVertical').checked = true;

        // Trigger change event to set correct field visibility
        document.getElementById('markerTypeVertical').dispatchEvent(new Event('change'));

        document.getElementById('markerDate').value = currentPlan.timeline.startDate;
        document.getElementById('markerColor').value = '#ff4d4d';

        if (markerId) {
            const marker = (currentPlan.markers || []).find(m => m.id === markerId);
            if (marker) {
                document.getElementById('markerId').value = marker.id;
                document.getElementById('markerLabel').value = marker.label || '';
                document.getElementById('markerColor').value = marker.color || '#ff4d4d';
                document.getElementById('markerImportance').value = marker.importance || 'minor';

                if (marker.type === 'horizontal') {
                    document.getElementById('markerTypeHorizontal').checked = true;
                    document.getElementById('markerRow').value = marker.row || 1;
                } else {
                    document.getElementById('markerTypeVertical').checked = true;
                    dateInput.value = marker.date || currentPlan.timeline.startDate;
                }

                if (marker.id === 'marker_today') {
                    dateInput.readOnly = true;
                    document.getElementById('markerTypeVertical').disabled = true;
                    document.getElementById('markerTypeHorizontal').disabled = true;
                } else {
                    dateInput.readOnly = false;
                    document.getElementById('markerTypeVertical').disabled = false;
                    document.getElementById('markerTypeHorizontal').disabled = false;
                }

                document.getElementById('markerRepeats').checked = marker.repeats !== false;
                document.getElementById('markerVisible').checked = marker.visible !== false;

                // Trigger change to update visibility
                const checkedType = document.querySelector('.marker-type-radio:checked');
                if (checkedType) checkedType.dispatchEvent(new Event('change'));
            }
        }

        // Handle cleanup when Edit modal closes to re-open Management modal if needed
        const handleEditModalHidden = () => {
            editModalEl.removeEventListener('hidden.bs.modal', handleEditModalHidden);
            this.openMarkerManagementModal();
        };
        editModalEl.addEventListener('hidden.bs.modal', handleEditModalHidden);

        editModal.show();
    }

    saveMarker() {
        const label = document.getElementById('markerLabel').value.trim();
        if (!label) {
            alert("Marker label is required.");
            return;
        }

        const type = document.querySelector('.marker-type-radio:checked').value;
        const color = document.getElementById('markerColor').value;
        const importance = document.getElementById('markerImportance').value;

        const markerData = {
            type: type,
            label: label,
            color: color,
            importance: importance
        };

        if (type === 'vertical') {
            const date = document.getElementById('markerDate').value;
            if (!date) {
                alert("Date is required for vertical markers.");
                return;
            }
            markerData.date = date;
        } else {
            const row = parseInt(document.getElementById('markerRow').value, 10);
            if (isNaN(row) || row < 1) {
                alert("Valid row number (>= 1) is required for horizontal markers.");
                return;
            }
            markerData.row = row;
        }

        markerData.repeats = document.getElementById('markerRepeats').checked;
        markerData.visible = document.getElementById('markerVisible').checked;

        const markerId = document.getElementById('markerId').value;
        let success = false;

        if (markerId) {
            success = this.planner.updateMarker(markerId, markerData);
        } else {
            success = this.planner.addMarker(markerData);
        }

        if (success) {
            const editModalEl = document.getElementById('markerEditModal');
            const editModal = bootstrap.Modal.getInstance(editModalEl);
            if (editModal) {
                editModal.hide(); // This will trigger the 'hidden' event which re-opens management modal
            }
            this.updateUI();
        } else {
            alert("Failed to save marker.");
        }
    }

    openLegendsModal() {
        const legendsModalEl = document.getElementById('legendsModal');
        const legendsModal = bootstrap.Modal.getOrCreateInstance(legendsModalEl);

        const fillTbody = document.getElementById('fillLegendsTableBody');
        fillTbody.innerHTML = '';
        const fillLegends = this.planner.getFillLegends();
        fillLegends.forEach(legend => {
            this.addLegendRow('fill', legend);
        });

        const borderTbody = document.getElementById('borderLegendsTableBody');
        borderTbody.innerHTML = '';
        const borderLegends = this.planner.getBorderLegends();
        borderLegends.forEach(legend => {
            this.addLegendRow('border', legend);
        });

        legendsModal.show();
    }

    addLegendRow(type, legend = null) {
        const tbody = document.getElementById(type === 'fill' ? 'fillLegendsTableBody' : 'borderLegendsTableBody');
        const tr = document.createElement('tr');

        const isDefault = legend && (legend.id === 'default_fill' || legend.id === 'default_border');
        const defaultColor = type === 'fill' ? '#4da3ff' : '#1c6ed5';

        tr.innerHTML = `
            <td>
                <input type="hidden" class="leg-id" value="${legend ? legend.id : ''}">
                <input type="text" class="form-control form-control-sm leg-label" value="${legend ? this.escapeHtml(legend.label) : ''}" required ${isDefault ? 'readonly' : ''}>
            </td>
            <td><input type="color" class="form-control form-control-color form-control-sm leg-color" value="${legend ? legend.color : defaultColor}" title="Color"></td>
            <td><input type="text" class="form-control form-control-sm leg-tag" value="${legend ? this.escapeHtml(legend.tag) : ''}" required ${isDefault ? 'readonly' : ''}></td>
            <td class="align-middle text-center">
                ${!isDefault ? '<button type="button" class="btn btn-sm btn-outline-danger py-0 px-2 delete-leg-row-btn" title="Delete Row">&times;</button>' : ''}
            </td>
        `;

        if (!isDefault) {
            const deleteBtn = tr.querySelector('.delete-leg-row-btn');
            deleteBtn.addEventListener('click', () => {
                tr.remove();
            });
        }

        tbody.appendChild(tr);
    }

    openTagGroupsModal() {
        const tagGroupsModalEl = document.getElementById('tagGroupsModal');
        const tagGroupsModal = bootstrap.Modal.getOrCreateInstance(tagGroupsModalEl);

        const container = document.getElementById('tagGroupsContainer');
        container.innerHTML = '';
        const tagGroups = this.planner.getTagGroups();
        tagGroups.forEach(group => {
            this.addTagGroupCard(group);
        });

        tagGroupsModal.show();
    }

    addTagGroupCard(group = null) {
        const container = document.getElementById('tagGroupsContainer');
        const card = document.createElement('div');
        card.className = 'card mb-3 tag-group-card';
        card.innerHTML = `
            <div class="card-header d-flex justify-content-between align-items-center">
                <input type="text" class="form-control form-control-sm group-name-input me-2" value="${group ? this.escapeHtml(group.name) : ''}" placeholder="Group Name" required>
                <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2 delete-group-btn" title="Delete Group">&times;</button>
            </div>
            <div class="card-body py-2">
                <table class="table table-sm tag-group-table mb-2">
                    <thead>
                        <tr>
                            <th>Label</th>
                            <th>Associated Tag</th>
                            <th style="width: 50px;"></th>
                        </tr>
                    </thead>
                    <tbody class="tag-group-tbody">
                        <!-- Tags injected here -->
                    </tbody>
                </table>
                <button type="button" class="btn btn-sm btn-outline-secondary py-0 px-2 add-group-tag-btn">+ Add Tag</button>
            </div>
        `;

        const deleteGroupBtn = card.querySelector('.delete-group-btn');
        deleteGroupBtn.addEventListener('click', () => {
            card.remove();
        });

        const addGroupTagBtn = card.querySelector('.add-group-tag-btn');
        const tbody = card.querySelector('.tag-group-tbody');

        const addTagRow = (tagObj = null) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="text" class="form-control form-control-sm group-tag-label" value="${tagObj ? this.escapeHtml(tagObj.label) : ''}" required></td>
                <td><input type="text" class="form-control form-control-sm group-tag-value" value="${tagObj ? this.escapeHtml(tagObj.tag) : ''}" required></td>
                <td class="align-middle text-center">
                    <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2 delete-tag-row-btn" title="Delete Row">&times;</button>
                </td>
            `;
            const deleteTagRowBtn = tr.querySelector('.delete-tag-row-btn');
            deleteTagRowBtn.addEventListener('click', () => {
                tr.remove();
            });
            tbody.appendChild(tr);
        };

        addGroupTagBtn.addEventListener('click', () => {
            addTagRow();
        });

        if (group && group.tags) {
            group.tags.forEach(tagObj => {
                addTagRow(tagObj);
            });
        }

        container.appendChild(card);
    }

    saveTagGroups() {
        const container = document.getElementById('tagGroupsContainer');
        const cards = container.querySelectorAll('.tag-group-card');
        const newTagGroups = [];

        cards.forEach(card => {
            const nameInput = card.querySelector('.group-name-input');
            const name = nameInput.value.trim();

            if (name) {
                const tags = [];
                const rows = card.querySelectorAll('.tag-group-tbody tr');
                rows.forEach(row => {
                    const labelInput = row.querySelector('.group-tag-label');
                    const tagInput = row.querySelector('.group-tag-value');
                    const label = labelInput.value.trim();
                    const tag = tagInput.value.trim();
                    if (label && tag) {
                        tags.push({ label, tag });
                    }
                });

                // Allow groups without tags? Yes, could be empty for now and filled later
                newTagGroups.push({
                    id: 'group_' + Math.random().toString(36).substring(2, 9),
                    name: name,
                    tags: tags
                });
            }
        });

        if (!this.planner.file.settings) this.planner.file.settings = {};
        this.planner.file.settings.tagGroups = newTagGroups;

        const tagGroupsModalEl = document.getElementById('tagGroupsModal');
        const tagGroupsModal = bootstrap.Modal.getInstance(tagGroupsModalEl);
        if (tagGroupsModal) {
            tagGroupsModal.hide();
        }

        // Refresh UI so dropdowns correctly pick up changes
        this.updateUI();
    }

    saveLegends() {
        const parseRows = (tbodyId, defaultObj) => {
            const tbody = document.getElementById(tbodyId);
            const rows = tbody.querySelectorAll('tr');
            const newLegends = [];

            rows.forEach(row => {
                const idInput = row.querySelector('.leg-id');
                const labelInput = row.querySelector('.leg-label');
                const colorInput = row.querySelector('.leg-color');
                const tagInput = row.querySelector('.leg-tag');

                const id = idInput.value;
                const label = labelInput.value.trim();
                const color = colorInput.value;
                const tag = tagInput.value.trim();

                if (label && tag) {
                    newLegends.push({
                        id: id || ('legend_' + Math.random().toString(36).substring(2, 9)),
                        label: label,
                        color: color,
                        tag: tag
                    });
                }
            });

            if (!newLegends.some(l => l.id === defaultObj.id)) {
                newLegends.unshift(defaultObj);
            }
            return newLegends;
        };

        const newFillLegends = parseRows('fillLegendsTableBody', {
            id: 'default_fill',
            label: 'Default Fill',
            color: '#4da3ff',
            tag: 'fill-default'
        });

        const newBorderLegends = parseRows('borderLegendsTableBody', {
            id: 'default_border',
            label: 'Default Border',
            color: '#1c6ed5',
            tag: 'border-default'
        });

        if (!this.planner.file.settings) this.planner.file.settings = {};
        this.planner.file.settings.fillLegends = newFillLegends;
        this.planner.file.settings.borderLegends = newBorderLegends;

        const legendsModalEl = document.getElementById('legendsModal');
        const legendsModal = bootstrap.Modal.getInstance(legendsModalEl);
        if (legendsModal) {
            legendsModal.hide();
        }
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    openCapacityModal() {
        const currentPlan = this.planner.getCurrentPlan();
        if (!currentPlan) return;

        const capacityModalEl = document.getElementById('capacityModal');
        const capacityModal = bootstrap.Modal.getOrCreateInstance(capacityModalEl);

        // Initialize fields
        const granularitySelect = document.getElementById('capacityGranularity');
        const demandAdjustmentInput = document.getElementById('demandAdjustmentPercent');
        const capacityAdjustmentInput = document.getElementById('capacityAdjustmentPercent');
        const capacityTableBody = document.getElementById('capacityTableBody');

        // Set values from current plan or defaults
        granularitySelect.value = (currentPlan.capacity && currentPlan.capacity.granularity) ? currentPlan.capacity.granularity : 'month';
        demandAdjustmentInput.value = (currentPlan.demandAdjustmentPercent !== undefined) ? currentPlan.demandAdjustmentPercent : 20;
        capacityAdjustmentInput.value = (currentPlan.capacityAdjustmentPercent !== undefined) ? currentPlan.capacityAdjustmentPercent : 100;

        // Clear existing rows
        capacityTableBody.innerHTML = '';

        // Add rows for existing capacity entries
        const entries = (currentPlan.capacity && currentPlan.capacity.entries) ? currentPlan.capacity.entries : [];
        entries.forEach(entry => {
            this.addCapacityRow(entry.startDate, entry.endDate, entry.capacity);
        });

        // Add one empty row if no entries exist
        if (entries.length === 0) {
            this.addCapacityRow();
        }

        capacityModal.show();
    }

    addCapacityRow(startDate = '', endDate = '', capacity = 0) {
        const tbody = document.getElementById('capacityTableBody');
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td><input type="date" class="form-control form-control-sm cap-start" value="${startDate}" required></td>
            <td><input type="date" class="form-control form-control-sm cap-end" value="${endDate}" required></td>
            <td><input type="number" class="form-control form-control-sm cap-val" value="${capacity}" min="0" required></td>
            <td class="align-middle text-center">
                <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2 delete-cap-row-btn" title="Delete Row">&times;</button>
            </td>
        `;

        // Bind delete event
        const deleteBtn = tr.querySelector('.delete-cap-row-btn');
        deleteBtn.addEventListener('click', () => {
            tr.remove();
        });

        tbody.appendChild(tr);
    }

    saveCapacity() {
        const currentPlan = this.planner.getCurrentPlan();
        if (!currentPlan) return;

        const granularitySelect = document.getElementById('capacityGranularity');
        const demandAdjustmentInput = document.getElementById('demandAdjustmentPercent');
        const capacityAdjustmentInput = document.getElementById('capacityAdjustmentPercent');
        const tbody = document.getElementById('capacityTableBody');

        const entries = [];
        let hasErrors = false;

        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const startInput = row.querySelector('.cap-start');
            const endInput = row.querySelector('.cap-end');
            const valInput = row.querySelector('.cap-val');

            const startDate = startInput.value;
            const endDate = endInput.value;
            const capacity = parseFloat(valInput.value);

            if (startDate && endDate) {
                if (new Date(startDate) > new Date(endDate)) {
                    hasErrors = true;
                    alert("Start date cannot be after end date in capacity ranges.");
                } else {
                    entries.push({ startDate, endDate, capacity: isNaN(capacity) ? 0 : capacity });
                }
            }
        });

        if (hasErrors) return;

        // Update planner state
        if (!currentPlan.capacity) currentPlan.capacity = {};
        currentPlan.capacity.granularity = granularitySelect.value;
        currentPlan.capacity.entries = entries;
        currentPlan.demandAdjustmentPercent = parseFloat(demandAdjustmentInput.value) || 0;

        let capacityAdj = parseFloat(capacityAdjustmentInput.value);
        if (isNaN(capacityAdj)) capacityAdj = 100;
        currentPlan.capacityAdjustmentPercent = capacityAdj;

        // Save back to Planner State to update
        this.planner.updatePlanSettings(currentPlan);

        // Calculate and log expanded capacity
        if (window.CapacityEngine) {
            const expanded = window.CapacityEngine.calculateExpandedCapacity(currentPlan);
            console.log("Calculated Expanded Capacity:", expanded);
        }

        // Close modal
        const capacityModalEl = document.getElementById('capacityModal');
        const capacityModal = bootstrap.Modal.getInstance(capacityModalEl);
        if (capacityModal) {
            capacityModal.hide();
        }

        this.updateUI();
    }

    exportCsv() {
        const currentPlan = this.planner.getCurrentPlan();
        if (!currentPlan || !currentPlan.tasks || currentPlan.tasks.length === 0) {
            alert("No tasks to export.");
            return;
        }

        const tasks = currentPlan.tasks;
        const selectedFields = [];
        const checkboxes = document.querySelectorAll('.csv-field-checkbox:checked');

        checkboxes.forEach(cb => {
            selectedFields.push({
                value: cb.value,
                label: cb.nextElementSibling.textContent.trim()
            });
        });

        if (selectedFields.length === 0) {
            alert("Please select at least one field to export.");
            return;
        }

        const headers = selectedFields.map(field => field.label);
        let csvContent = headers.join(",") + "\n";

        const formatDate = (dateStr) => {
            if (!dateStr) return "";
            const parts = dateStr.split("-");
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
            }
            return dateStr;
        };

        const escapeCsv = (str) => {
            if (str === null || str === undefined) return "";
            const strVal = String(str);
            if (strVal.includes(",") || strVal.includes('"') || strVal.includes('\n')) {
                return `"${strVal.replace(/"/g, '""')}"`;
            }
            return strVal;
        };

        const getNestedValue = (obj, path) => {
            return path.split('.').reduce((acc, part) => acc && acc[part], obj);
        };

        tasks.forEach(task => {
            const row = selectedFields.map(field => {
                let value = '';

                if (field.value === 'startDate' || field.value === 'endDate') {
                    value = formatDate(task[field.value]);
                } else if (field.value === 'tags' || field.value === 'dependencies') {
                    const arr = task[field.value];
                    value = arr && arr.length > 0 ? arr.join(", ") : "";
                } else if (field.value === 'excludeFromAnalytics') {
                    value = task.excludeFromAnalytics ? 'Yes' : 'No';
                } else if (field.value.startsWith('effort.')) {
                    if (field.value === 'effort.total') {
                        const design = task.effort?.design ? parseFloat(task.effort.design) : 0;
                        const dev = task.effort?.dev ? parseFloat(task.effort.dev) : 0;
                        const test = task.effort?.test ? parseFloat(task.effort.test) : 0;
                        value = design + dev + test;
                    } else {
                        value = getNestedValue(task, field.value) || 0;
                    }
                } else {
                    value = task[field.value] || '';
                }

                return escapeCsv(value);
            });
            csvContent += row.join(",") + "\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        const today = new Date();
        const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const sanitizedPlanName = (currentPlan.name || 'Gantt').replace(/[^a-z0-9]/gi, '_').toLowerCase();

        link.setAttribute("href", url);
        link.setAttribute("download", `${sanitizedPlanName}_tasks_${dateString}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        const modalEl = document.getElementById('exportCsvModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) {
            modal.hide();
        }
    }

    exportLegendImage() {
        const currentPlan = this.planner.getCurrentPlan();
        if (!currentPlan) return;

        // Collect tags only from tasks that are currently rendered on the Gantt chart
        let activeTags = new Set();
        let activeStatuses = new Set();

        if (window.GanttEngine && window.GanttEngine.renderedTasks) {
            window.GanttEngine.renderedTasks.forEach(renderedItem => {
                // Exclude tasks that don't match the current filter visually (e.g. highlight mode out)
                if (renderedItem.task && renderedItem.isMatch !== false && !renderedItem.task.excludeFromAnalytics) {
                    const t = renderedItem.task;
                    if (t.tags && Array.isArray(t.tags)) {
                        t.tags.forEach(tag => activeTags.add(tag.trim()));
                    }
                    if (t.status) {
                        activeStatuses.add(t.status.trim());
                        activeTags.add(t.status.trim());
                    }
                }
            });
        }

        const uniqueTags = Array.from(activeTags).filter(t => t);

        const fillLegends = this.planner.getFillLegends();
        const borderLegends = this.planner.getBorderLegends();
        const statusColors = this.planner.getStatusColors ? this.planner.getStatusColors() : {};

        const tagGroups = this.planner.getTagGroups();

        const groupedTags = {
            fill: [],
            border: [],
            status: [],
            custom: []
        };

        // We will exclude grouped tags from the legend entirely
        uniqueTags.forEach(tag => {
            let isGroupTag = false;
            tagGroups.forEach(g => {
                if (g.tags && g.tags.some(t => t.tag === tag)) {
                    isGroupTag = true;
                }
            });

            if (isGroupTag) return; // Do not render these in the legend export

            const fillLegend = fillLegends.find(l => l.tag === tag);
            const borderLegend = borderLegends.find(l => l.tag === tag);
            let isStatus = false;

            // Check if this tag is a status color tag AND it's actively used as a status
            for (const status in statusColors) {
                if (status.toLowerCase() === tag.toLowerCase()) {
                    isStatus = true;
                    break;
                }
            }

            if (fillLegend) {
                groupedTags.fill.push({ tag, label: fillLegend.label });
            } else if (borderLegend) {
                groupedTags.border.push({ tag, label: borderLegend.label });
            } else if (isStatus) {
                groupedTags.status.push({ tag, label: tag });
            } else {
                groupedTags.custom.push({ tag, label: tag });
            }
        });

        const getTagColorHtml = (tag) => {
            const fillLegend = fillLegends.find(l => l.tag === tag);
            const borderLegend = borderLegends.find(l => l.tag === tag);

            let statusColor = null;
            if (tag.toLowerCase() === 'completed') statusColor = '#28a745';
            else if (tag.toLowerCase() === 'in progress') statusColor = '#007bff';
            else if (tag.toLowerCase() === 'blocked') statusColor = '#dc3545';
            else if (tag.toLowerCase() === 'on hold') statusColor = '#ffc107';
            else if (tag.toLowerCase() === 'committed') statusColor = '#17a2b8';
            else if (tag.toLowerCase() === 'refined') statusColor = '#e2e3e5';
            else if (tag.toLowerCase() === 'removed') statusColor = '#000000';
            else if (tag.toLowerCase() === 'stretch') statusColor = '#FFA500';

            if (fillLegend) {
                return `<span style="display:inline-block; width: 14px; height: 14px; background-color: ${fillLegend.color}; border: 1px solid #ccc; margin-right: 8px; border-radius: 2px; vertical-align: middle;"></span>`;
            } else if (borderLegend) {
                return `<span style="display:inline-block; width: 14px; height: 14px; border: 2px solid ${borderLegend.color}; background-color: transparent; margin-right: 8px; border-radius: 2px; vertical-align: middle;"></span>`;
            } else if (statusColor) {
                return `<span style="display:inline-block; width: 14px; height: 14px; background-color: ${statusColor}; border: 1px solid #ccc; margin-right: 8px; border-radius: 2px; vertical-align: middle;"></span>`;
            }
            return '';
        };

        const renderTagGroup = (groupTitle, items) => {
            if (items.length === 0) return '';
            let groupHtml = `<div style="margin-bottom: 15px;">
                                <h6 style="margin: 0 0 8px 0; font-size: 14px; color: #555; text-transform: uppercase; border-bottom: 1px solid #eee; padding-bottom: 4px;">${groupTitle}</h6>
                                <div style="display: flex; flex-direction: column; gap: 6px;">`;
            items.forEach(item => {
                const safeTagText = this.escapeHtml(item.label || item.tag);
                const colorHtml = getTagColorHtml(item.tag);
                groupHtml += `
                    <div style="display: flex; align-items: center; font-size: 13px; color: #333;">
                        ${colorHtml}<span>${safeTagText}</span>
                    </div>`;
            });
            groupHtml += `</div></div>`;
            return groupHtml;
        };

        let containerHtml = `
            <div id="temp-legend-export" style="
                position: absolute;
                top: -9999px;
                left: -9999px;
                width: 300px;
                background-color: #fff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            ">
                <h4 style="margin: 0 0 15px 0; font-size: 16px; color: #333;">Legend - ${this.escapeHtml(currentPlan.name || 'Plan')}</h4>
                ${renderTagGroup('Fill Colors', groupedTags.fill)}
                ${renderTagGroup('Border Colors', groupedTags.border)}
                ${renderTagGroup('Status Indicators', groupedTags.status)}
                ${renderTagGroup('Custom Tags', groupedTags.custom)}
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', containerHtml);
        const tempElement = document.getElementById('temp-legend-export');

        html2canvas(tempElement, {
            scale: 2,
            backgroundColor: '#ffffff'
        }).then(canvas => {
            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            const sanitizedPlanName = (currentPlan.name || 'Gantt').replace(/[^a-z0-9]/gi, '_').toLowerCase();
            link.download = `${sanitizedPlanName}_legend.png`;
            link.href = image;
            link.click();

            tempElement.remove();
        }).catch(err => {
            console.error("Error generating legend image:", err);
            tempElement.remove();
            alert("Failed to export legend image.");
        });
    }

    updateUI() {
        const planSelectorBtn = document.getElementById("planSelectorBtn");
        const planSelectorMenu = document.getElementById("planSelectorMenu");
        const plans = this.planner.getState().plans || [];

        if (planSelectorMenu) {
            planSelectorMenu.innerHTML = "";

            if (plans.length === 0) {
                const li = document.createElement("li");
                li.innerHTML = '<span class="dropdown-item text-muted">No plans available</span>';
                planSelectorMenu.appendChild(li);
                if (planSelectorBtn) planSelectorBtn.title = "No Plans";
            } else {
                plans.forEach((plan, index) => {
                    const li = document.createElement("li");
                    const a = document.createElement("button");
                    a.className = "dropdown-item";
                    a.type = "button";
                    a.textContent = plan.name || "Unnamed Plan";

                    if (index === this.planner.currentPlanIndex) {
                        a.classList.add("active");
                        if (planSelectorBtn) planSelectorBtn.title = `Current Plan: ${a.textContent}`;
                    }

                    a.addEventListener("click", () => {
                        this.planner.setCurrentPlanIndex(index);
                        this.updateUI();
                    });

                    li.appendChild(a);
                    planSelectorMenu.appendChild(li);
                });
            }
        }

        const hasPlans = plans.length > 0;
        const tagGroupsBtn = document.getElementById("tagGroupsBtn");
        const addTaskBtn = document.getElementById("addTaskBtn");
        const editPlanBtn = document.getElementById("editPlanBtn");
        const duplicatePlanBtn = document.getElementById("duplicatePlanBtn");
        const deletePlanBtn = document.getElementById("deletePlanBtn");
        const addMarkerBtn = document.getElementById("addMarkerBtn");
        const taskListBtn = document.getElementById("taskListBtn");
        const capacityPlanBtn = document.getElementById("capacityPlanBtn");
        const exportImageBtn = document.getElementById("exportImageBtn");
        const exportPlanBtn = document.getElementById("exportPlanBtn");
        const exportDropdownBtn = document.getElementById("exportDropdownBtn");

        if (addTaskBtn) addTaskBtn.disabled = !hasPlans;
        if (editPlanBtn) editPlanBtn.disabled = !hasPlans;
        if (duplicatePlanBtn) duplicatePlanBtn.disabled = !hasPlans;
        if (deletePlanBtn) deletePlanBtn.disabled = !hasPlans;
        if (addMarkerBtn) addMarkerBtn.disabled = !hasPlans;
        if (taskListBtn) taskListBtn.disabled = !hasPlans;
        if (capacityPlanBtn) capacityPlanBtn.disabled = !hasPlans;
        if (exportImageBtn) exportImageBtn.disabled = !hasPlans;
        if (exportPlanBtn) exportPlanBtn.disabled = !hasPlans;
        if (exportDropdownBtn) exportDropdownBtn.disabled = !hasPlans;
        // Keep tagGroupsBtn always enabled or enabled with plans
        // We'll keep it enabled so user can edit tag groups globally

        this.renderTagFilters();

        // Trigger Gantt re-render if it exists
        if (window.GanttEngine) {
            window.GanttEngine.render(this.planner.getCurrentPlan());
        }

        // Trigger Analytics re-render if visible
        if (window.AnalyticsEngine) {
            const container = document.getElementById("analyticsContainer");
            if (container && !container.classList.contains("d-none")) {
                window.AnalyticsEngine.render(this.planner.getCurrentPlan());
            }
        }
    }

    renderHistory() {
        const historyContainer = document.getElementById('historyListContainer');
        if (!historyContainer) return;

        const historyLog = this.planner.getHistory() || [];

        if (historyLog.length === 0) {
            historyContainer.innerHTML = '<div class="text-center text-muted p-3">No version history available.</div>';
            return;
        }

        historyContainer.innerHTML = historyLog.slice().reverse().map((entry, index) => {
            const date = new Date(entry.timestamp);
            const dateStr = date.toLocaleString();
            const commentStr = entry.comment ? this.escapeHtml(entry.comment) : '<em>No comment provided</em>';

            return `
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">Export #${historyLog.length - index}</h6>
                        <small class="text-muted">${dateStr}</small>
                    </div>
                    <p class="mb-1">${commentStr}</p>
                </div>
            `;
        }).join('');
    }

    renderTagFilters() {
        const container = document.getElementById('tagFiltersContainer');
        if (!container || !window.AnalyticsEngine) return;

        const uniqueTags = window.AnalyticsEngine.getUniqueTags();
        const filterState = this.planner.getFilterState();

        const taskTextSearch = document.getElementById('taskTextSearch');
        if (taskTextSearch && filterState.searchText !== undefined) {
            taskTextSearch.value = filterState.searchText;
        }

        if (uniqueTags.length === 0) {
            container.innerHTML = '<span class="text-muted small">No tags</span>';
            return;
        }

        let html = `
            <div class="btn-group" role="group">
                <button type="button" class="btn btn-sm btn-outline-secondary px-2" id="selectAllTagsBtn" title="Select All Tags">✓</button>
                <button type="button" class="btn btn-sm btn-outline-secondary px-2" id="unselectAllTagsBtn" title="Deselect All Tags">✗</button>
            </div>

            <div class="dropdown">
                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id="tagFilterDropdown" data-bs-toggle="dropdown" aria-expanded="false" data-bs-auto-close="outside" data-bs-popper-config='{"strategy":"fixed"}' title="Filter Tags">
                    🏷️ (${filterState.selectedTags.length}/${uniqueTags.length})
                </button>
                <ul class="dropdown-menu shadow-sm" aria-labelledby="tagFilterDropdown" style="max-height: 300px; overflow-y: auto;">
        `;

        // Prune phantom tags from filterState if they don't exist in the current plan
        const validSelectedTags = filterState.selectedTags.filter(t => uniqueTags.includes(t));
        if (validSelectedTags.length !== filterState.selectedTags.length) {
            this.planner.setFilterState({ selectedTags: validSelectedTags });
            // Re-fetch state after update
            filterState.selectedTags = validSelectedTags;
        }

        const escapeHtml = (str) => {
            return String(str)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        };

        const fillLegends = this.planner.getFillLegends();
        const borderLegends = this.planner.getBorderLegends();

        // Check if a tag corresponds to a legend color or status color
        const getTagColorHtml = (tag) => {
            const fillLegend = fillLegends.find(l => l.tag === tag);
            const borderLegend = borderLegends.find(l => l.tag === tag);

            // Typical status colors used in gantt.js
            let statusColor = null;
            if (tag.toLowerCase() === 'completed') statusColor = '#28a745';
            else if (tag.toLowerCase() === 'in progress') statusColor = '#007bff';
            else if (tag.toLowerCase() === 'blocked') statusColor = '#dc3545';
            else if (tag.toLowerCase() === 'on hold') statusColor = '#ffc107';
            else if (tag.toLowerCase() === 'committed') statusColor = '#17a2b8';
            else if (tag.toLowerCase() === 'refined') statusColor = '#e2e3e5';
            else if (tag.toLowerCase() === 'removed') statusColor = '#000000';
            else if (tag.toLowerCase() === 'stretch') statusColor = '#FFA500';

            if (fillLegend) {
                return `<span class="d-inline-block me-2" style="width: 12px; height: 12px; background-color: ${fillLegend.color}; border: 1px solid #ccc;"></span>`;
            } else if (borderLegend) {
                return `<span class="d-inline-block me-2" style="width: 12px; height: 12px; border: 2px solid ${borderLegend.color};"></span>`;
            } else if (statusColor) {
                return `<span class="d-inline-block me-2" style="width: 12px; height: 12px; background-color: ${statusColor}; border: 1px solid #ccc;"></span>`;
            }
            return '';
        };

        const tagGroups = this.planner.getTagGroups();

        const groupedTags = {
            fill: [],
            border: [],
            status: [],
            groups: {},
            custom: []
        };

        // Initialize groups
        tagGroups.forEach(g => {
            groupedTags.groups[g.name] = [];
        });

        const plannerState = this.planner;
        const statusColors = plannerState.getStatusColors ? plannerState.getStatusColors() : {};

        uniqueTags.forEach(tag => {
            const fillLegend = fillLegends.find(l => l.tag === tag);
            const borderLegend = borderLegends.find(l => l.tag === tag);
            let isStatus = false;
            let groupLabelMatch = null;
            let matchedGroupName = null;

            tagGroups.forEach(g => {
                if (g.tags) {
                    const match = g.tags.find(t => t.tag === tag);
                    if (match) {
                        groupLabelMatch = match.label;
                        matchedGroupName = g.name;
                    }
                }
            });

            for (const status in statusColors) {
                if (status.toLowerCase() === tag.toLowerCase()) {
                    isStatus = true;
                    break;
                }
            }

            if (matchedGroupName) {
                groupedTags.groups[matchedGroupName].push({ tag, label: groupLabelMatch });
            } else if (fillLegend) {
                groupedTags.fill.push({ tag, label: fillLegend.label });
            } else if (borderLegend) {
                groupedTags.border.push({ tag, label: borderLegend.label });
            } else if (isStatus) {
                groupedTags.status.push({ tag, label: tag });
            } else {
                groupedTags.custom.push({ tag, label: tag });
            }
        });

        const renderTagGroup = (groupTitle, items) => {
            if (items.length === 0) return '';
            let groupHtml = `<li><h6 class="dropdown-header border-bottom mb-1 pb-1 text-uppercase fw-bold">${groupTitle}</h6></li>`;
            items.forEach(item => {
                const tag = item.tag;
                const isChecked = filterState.selectedTags.includes(tag) ? 'checked' : '';
                const safeTagAttr = tag.replace(/"/g, '&quot;');
                const safeTagText = escapeHtml(item.label || tag);
                const colorHtml = getTagColorHtml(tag);

                groupHtml += `
                    <li>
                        <div class="dropdown-item d-flex align-items-center py-1">
                            <div class="form-check m-0 d-flex align-items-center w-100">
                                <input class="form-check-input tag-checkbox me-2" type="checkbox" id="tagFilter_${safeTagAttr}" value="${safeTagAttr}" ${isChecked}>
                                <label class="form-check-label small w-100 d-flex align-items-center" for="tagFilter_${safeTagAttr}" style="cursor: pointer;">
                                    ${colorHtml}${safeTagText}
                                </label>
                            </div>
                        </div>
                    </li>
                `;
            });
            return groupHtml;
        };

        html += renderTagGroup('Fill Colors', groupedTags.fill);
        html += renderTagGroup('Border Colors', groupedTags.border);
        html += renderTagGroup('Status Indicators', groupedTags.status);

        for (const [groupName, items] of Object.entries(groupedTags.groups)) {
            html += renderTagGroup(groupName, items);
        }

        html += renderTagGroup('Custom Tags', groupedTags.custom);

        html += `
                </ul>
            </div>
        `;

        container.innerHTML = html;

        // Render the icons separately into their own container to fix layout
        const iconsContainer = document.getElementById('tagFiltersIconsContainer');
        if (iconsContainer) {
            let iconsHtml = `
                <div class="vr me-1 ms-1"></div>

                <div class="btn-group" role="group" aria-label="Tag Match Mode">
                    <input type="radio" class="btn-check tag-match-mode-radio" name="tagMatchMode" id="matchModeAny" value="any" autocomplete="off" ${filterState.matchMode === 'any' ? 'checked' : ''}>
                    <label class="btn btn-outline-secondary btn-sm py-0" for="matchModeAny" title="Match Any (OR)">∪</label>

                    <input type="radio" class="btn-check tag-match-mode-radio" name="tagMatchMode" id="matchModeAll" value="all" autocomplete="off" ${filterState.matchMode === 'all' ? 'checked' : ''}>
                    <label class="btn btn-outline-secondary btn-sm py-0" for="matchModeAll" title="Match All (AND)">∩</label>
                </div>

                <div class="btn-group ms-2" role="group" aria-label="Tag Visual Mode">
                    <input type="radio" class="btn-check tag-visual-mode-radio" name="tagVisualMode" id="visualModeShow" value="show" autocomplete="off" ${filterState.visualMode === 'show' ? 'checked' : ''}>
                    <label class="btn btn-outline-secondary btn-sm py-0" for="visualModeShow" title="Show Only">👁️</label>

                    <input type="radio" class="btn-check tag-visual-mode-radio" name="tagVisualMode" id="visualModeHighlight" value="highlight" autocomplete="off" ${filterState.visualMode === 'highlight' ? 'checked' : ''}>
                    <label class="btn btn-outline-secondary btn-sm py-0" for="visualModeHighlight" title="Highlight">🔦</label>
                </div>

                <div class="btn-group ms-2" role="group" aria-label="Dependencies Toggle">
                    <input type="checkbox" class="btn-check" id="showDependenciesCheckbox" autocomplete="off" ${this.planner.getShowDependencies() ? 'checked' : ''}>
                    <label class="btn btn-outline-secondary btn-sm py-0" for="showDependenciesCheckbox" title="Show Dependencies">🔗</label>
                </div>
            `;
            iconsContainer.innerHTML = iconsHtml;
        }
    }
}