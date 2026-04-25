from bs4 import BeautifulSoup
from rcssmin import cssmin
from rjsmin import jsmin
#import htmlmin
import argparse

parser = argparse.ArgumentParser(description="Merge local HTML, CSS, and JS into a single file.")
parser.add_argument("--minify", action="store_true", help="Minify the output HTML, CSS, and JS.")
args = parser.parse_args()

with open("index.html", encoding="utf-8") as f:
    soup = BeautifulSoup(f, "html.parser")

for link in soup.find_all("link", rel="stylesheet"):
    with open(link["href"], encoding="utf-8") as css:
        style = soup.new_tag("style")
        css_content = css.read()
        style.string = cssmin(css_content) if args.minify else css_content
        link.replace_with(style)

for script in soup.find_all("script", src=True):
    with open(script["src"], encoding="utf-8") as js:
        new_script = soup.new_tag("script")
        js_content = js.read()
        new_script.string = jsmin(js_content) if args.minify else js_content
        script.replace_with(new_script)

with open("single.html", "w", encoding="utf-8") as f:
    html_output = str(soup)
    #if args.minify:
        #html_output = htmlmin.minify(html_output, remove_comments=True, remove_empty_space=True)
    f.write(html_output)