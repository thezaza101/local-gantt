1. **Update `index.html`**:
   - Add a "Collapse/Expand All" button in the RAIDA header next to the "Copy Selected" button.
   - Example id: `toggleRaidaCollapseBtn`

2. **Update `ui.js`**:
   - Add event listener for `toggleRaidaCollapseBtn`.
   - The logic should keep track of whether the current state is collapsed or expanded.
   - Use Bootstrap's `Collapse` API or query `[data-bs-toggle="collapse"]` and manipulate the DOM directly.
   - Specifically:
     ```javascript
     const toggleRaidaCollapseBtn = document.getElementById("toggleRaidaCollapseBtn");
     if (toggleRaidaCollapseBtn) {
         let isExpanded = true; // RAIDA shows expanded by default for count > 0
         toggleRaidaCollapseBtn.addEventListener("click", () => {
             isExpanded = !isExpanded;
             const collapses = document.querySelectorAll('#raidaContent .collapse');
             const toggles = document.querySelectorAll('#raidaContent [data-bs-toggle="collapse"]');

             collapses.forEach(c => {
                 if (isExpanded) {
                     c.classList.add('show');
                 } else {
                     c.classList.remove('show');
                 }
             });

             toggles.forEach(t => {
                 t.setAttribute('aria-expanded', isExpanded);
             });

             toggleRaidaCollapseBtn.textContent = isExpanded ? '↕ Collapse All' : '↕ Expand All';
         });
     }
     ```

3. **Update `raida.js`**:
   - Reset the button text to `Collapse All` or `Expand All` (whichever default makes sense) upon `render()` so that when re-rendered, the button state matches the content. Alternatively, the render can check `isExpanded`. Wait, currently RAIDA items expand automatically if count > 0. So setting text to '↕ Collapse All' on render is appropriate. We can do this in `RaidaEngine.render()` or `raida.js`. Or just reset the button text in `raida.js`.

4. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
