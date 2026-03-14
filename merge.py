from bs4 import BeautifulSoup

with open("index.html") as f:
    soup = BeautifulSoup(f, "html.parser")

for link in soup.find_all("link", rel="stylesheet"):
    with open(link["href"]) as css:
        style = soup.new_tag("style")
        style.string = css.read()
        link.replace_with(style)

for script in soup.find_all("script", src=True):
    with open(script["src"]) as js:
        new_script = soup.new_tag("script")
        new_script.string = js.read()
        script.replace_with(new_script)

with open("single.html", "w") as f:
    f.write(str(soup))