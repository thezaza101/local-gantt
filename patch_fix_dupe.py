with open('index.html', 'r') as f:
    content = f.read()

# We need to remove the duplicate block of analyticsContent
# The duplicate is around line 303. Let's find it.

dup_str = """             <div class="analytics-content p-4 d-flex flex-column flex-grow-1 overflow-auto bg-white" id="analyticsContent">
                 <div class="text-center text-muted my-auto" id="analyticsPlaceholder">
                     <h5>Analytics Panel</h5>
                     <p class="small">Effort summaries and tag metrics will render here</p>
                 </div>
             </div>
        </div>"""

if dup_str in content:
    print("Found dup, removing it")

    # We only want to remove the SECOND occurrence.
    first_idx = content.find(dup_str)
    second_idx = content.find(dup_str, first_idx + 1)

    if second_idx != -1:
        content = content[:second_idx] + content[second_idx + len(dup_str):]

with open('index.html', 'w') as f:
    f.write(content)
