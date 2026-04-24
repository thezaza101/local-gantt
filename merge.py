from bs4 import BeautifulSoup
from rcssmin import cssmin
from rjsmin import jsmin
import htmlmin

with open("index.html", encoding="utf-8") as f:
    soup = BeautifulSoup(f, "html.parser")

for link in soup.find_all("link", rel="stylesheet"):
    with open(link["href"], encoding="utf-8") as css:
        style = soup.new_tag("style")
        style.string = cssmin(css.read())
        link.replace_with(style)

for script in soup.find_all("script", src=True):
    with open(script["src"], encoding="utf-8") as js:
        new_script = soup.new_tag("script")
        new_script.string = jsmin(js.read())
        script.replace_with(new_script)

with open("single.html", "w", encoding="utf-8") as f:
    f.write(htmlmin.minify(str(soup), remove_comments=True, remove_empty_space=True))