1. **Update `index.html`:**
   - In the `#taskListModal`, add a group of toggle buttons (checkboxes styled as buttons) above the search input to allow filtering by item types: Tasks, Risks, Issues, Dependencies, Assumptions, and Decisions.
   - Configure these toggles so that only the "Tasks" toggle is selected by default.
   - Add a "Type" column header as the right-most column in the `#taskListTable`'s `<thead>`.

2. **Update `ui.js`:**
   - In `openTaskListModal()`, explicitly reset the toggle buttons to ensure only "Tasks" is checked every time the modal is opened.
   - Add event listeners to all type toggles to re-render the list when their states change.
   - Modify `renderTaskListTable(searchTerm)` to aggregate items dynamically based on which toggles are currently active. For each item, attach a `_type` marker (e.g., "Task", "Risk", etc.).
   - When rendering rows, look up `this.planner.file.settings.baseLink`. If it is present, append a link symbol (`🔗`) to the `ID` field. Clicking this symbol will open a new tab targeting `${baseLink}${item.id}`.
   - For non-task tracker items, display a placeholder (like `-`) in the "Total Effort" column.
   - Output the `_type` in the newly added "Type" column at the end of each row.

3. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**

4. **Submit the change.**
   - Once all tests pass, I will submit the change with a descriptive commit message.
