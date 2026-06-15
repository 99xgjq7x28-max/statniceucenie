import json
import re
from pathlib import Path

from docx import Document


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path("/Users/michaljeck/Downloads/23.docx")
PUBLISH = ROOT / "statniceucenie-publish"
TARGET = PUBLISH / "data/topics.json"


def clean(text):
    return re.sub(r"\s+", " ", text).strip()


def normalize_formula(text):
    replacements = {
        "a) Celková zadlženosť cudzie zdroje / celkové aktíva=":
            "a) Celková zadlženosť = cudzie zdroje / celkové aktíva. ",
        "b) Samofinancovanie vlastné imanie / celkové aktíva=":
            "b) Samofinancovanie = vlastné imanie / celkové aktíva. ",
        "c) Finančná páka cudzie zdroje / vlastné imanie=":
            "c) Finančná páka = cudzie zdroje / vlastné imanie. ",
        "d) Úrokové krytie EBIT / úrokové náklady=":
            "d) Úrokové krytie = EBIT / úrokové náklady. ",
        "e) Krytie dlhodobého majetku dlhodobé zdroje / dlhodobý majetok=":
            "e) Krytie dlhodobého majetku = dlhodobé zdroje / dlhodobý majetok. ",
    }
    for old, new in replacements.items():
        if text.startswith(old):
            return clean(new + text[len(old):])
    return text


document = Document(SOURCE)
paragraphs = [paragraph for paragraph in document.paragraphs if clean(paragraph.text)]

if clean(paragraphs[0].text) != "23.":
    raise RuntimeError("Dokument sa nezačína označením otázky 23.")

title = clean(paragraphs[1].text)
blocks = []

for paragraph in paragraphs[2:]:
    text = normalize_formula(clean(paragraph.text))
    style = paragraph.style.name.lower()
    properties = paragraph._p.pPr
    is_list = properties is not None and properties.numPr is not None

    if style.startswith("heading"):
        block_type = "heading"
    elif is_list:
        block_type = "li"
    else:
        block_type = "p"

    blocks.append({"type": block_type, "text": text})

with TARGET.open(encoding="utf-8") as file:
    topics = json.load(file)

topic = next((item for item in topics if item.get("id") == "ekonomia-23"), None)
if topic is None:
    raise RuntimeError("V topics.json sa nenašla otázka ekonomia-23.")

topic["title"] = title
topic["blocks"] = blocks
topic["wordCount"] = sum(len(block["text"].split()) for block in blocks)
topic["tableCount"] = 0
topic["imageCount"] = 0
topic["cue"] = (
    "Zdroje krytia majetku sa delia na vlastné a cudzie. Vlastníci majú "
    "reziduálny nárok a nesú vyššie riziko, veritelia majú prioritný nárok "
    "a zmluvne dohodnutú návratnosť. Kapitálová štruktúra vyjadruje pomer "
    "vlastného a cudzieho kapitálu."
)
topic["emergencyStart"] = [
    (
        "Majetok podniku musí byť krytý vlastnými alebo cudzími zdrojmi. "
        "Vlastné zdroje poskytujú vlastníci alebo ich podnik vytvára zo zisku, "
        "zatiaľ čo cudzie zdroje poskytujú veritelia iba na určitý čas."
    ),
    (
        "Vlastníci majú reziduálny nárok na majetok až po uspokojení veriteľov "
        "a ich výnos nie je garantovaný. Veritelia majú prioritný nárok a "
        "dohodnuté splatenie istiny a úrokov."
    ),
    (
        "Kapitálová štruktúra je pomer vlastného a cudzieho kapitálu. Podnik ju "
        "hodnotí ukazovateľmi zadlženosti, samofinancovania, finančnej páky a "
        "úrokového krytia; cieľom je minimalizovať WACC a maximalizovať hodnotu podniku."
    ),
]

with TARGET.open("w", encoding="utf-8") as file:
    json.dump(topics, file, ensure_ascii=False, indent=2)
    file.write("\n")


def build_offline(source_name, script_name, output_name):
    html = (PUBLISH / source_name).read_text(encoding="utf-8")
    css_match = re.search(
        r'<link rel="stylesheet" href="src/styles\.css\?v=(\d+)">',
        html,
    )
    script_match = re.search(
        rf'<script src="src/{re.escape(script_name)}\?v=(\d+)" defer></script>',
        html,
    )
    if css_match is None or script_match is None:
        raise RuntimeError(f"V {source_name} sa nenašli verziované CSS/JS odkazy.")

    css = (PUBLISH / "src/styles.css").read_text(encoding="utf-8")
    script = (PUBLISH / "src" / script_name).read_text(encoding="utf-8")
    embedded = json.dumps(topics, ensure_ascii=False, indent=2)
    html = html.replace(css_match.group(0), f"<style>\n{css}\n</style>")
    html = html.replace(
        script_match.group(0),
        f"<script>window.__TOPICS__ = {embedded};\n{script}\n</script>",
    )
    (PUBLISH / output_name).write_text(html, encoding="utf-8")


build_offline("index.html", "app.js", "offline.html")
build_offline("plan.html", "plan.js", "plan-offline.html")

print(
    json.dumps(
        {
            "id": topic["id"],
            "title": topic["title"],
            "blocks": len(topic["blocks"]),
            "words": topic["wordCount"],
        },
        ensure_ascii=False,
    )
)
