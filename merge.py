from bs4 import BeautifulSoup
import re

def minify_css(css):
    css = re.sub(r'/\*[\s\S]*?\*/', '', css)
    css = re.sub(r'\s+', ' ', css)
    css = re.sub(r'\s*([{};:,>])\s*', r'\1', css)
    return css.strip()

def minify_js(js):
    js = re.sub(r'/\*[\s\S]*?\*/', '', js)
    lines = []
    for line in js.split('\n'):
        l = line.strip()
        if l:
            lines.append(l)
    return '\n'.join(lines)

def minify_html(html):
    html = re.sub(r'<!--[\s\S]*?-->', '', html)
    html = re.sub(r'\n\s+', '\n', html)
    return html.strip()

with open("index.html", encoding="utf-8") as f:
    soup = BeautifulSoup(f, "html.parser")

for link in soup.find_all("link", rel="stylesheet"):
    with open(link["href"], encoding="utf-8") as css:
        style = soup.new_tag("style")
        style.string = minify_css(css.read())
        link.replace_with(style)

for script in soup.find_all("script", src=True):
    with open(script["src"], encoding="utf-8") as js:
        new_script = soup.new_tag("script")
        new_script.string = minify_js(js.read())
        script.replace_with(new_script)

with open("single.html", "w", encoding="utf-8") as f:
    f.write(minify_html(str(soup)))