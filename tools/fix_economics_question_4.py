import json
import re
from pathlib import Path

from docx import Document


ROOT = Path(__file__).resolve().parents[1]
SOURCE = (
    ROOT
    / "samostatne-temy-docx"
    / "Ekonomia_a_financie"
    / (
        "04_HDP_HNP_a_sposoby_jeho_vypoctu_Zadefinujte_platobnu_bilanciu_"
        "a_pomenujte_jej_ucty_Priblizte_vyv.docx"
    )
)
DATA = ROOT / "data/topics.json"

TITLE = (
    "HDP, HNP a spôsoby jeho výpočtu. Zadefinujte platobnú bilanciu "
    "a pomenujte jej účty. Priblížte vývoj HDP na príklade hodnotenia "
    "vývoja slovenskej ekonomiky za posledných 10 rokov. Je HDP "
    "dostatočným ukazovateľom na meranie výkonnosti ekonomiky?"
)
START = "4.HDP, HNP a spôsoby jeho výpočtu."


def clean(text):
    return re.sub(r"\s+", " ", text.replace("\xa0", " ")).strip()


document = Document(SOURCE)
paragraphs = document.paragraphs
start_index = next(
    index for index, paragraph in enumerate(paragraphs)
    if clean(paragraph.text).startswith(START)
)

blocks = []
for paragraph in paragraphs[start_index + 1:]:
    text = clean(paragraph.text)
    if not text:
        continue

    style = paragraph.style.name or ""
    if style == "List Bullet" or re.match(r"^-\s*", text):
        blocks.append({"type": "li", "text": re.sub(r"^-\s*", "", text)})
    elif style.startswith("Heading") and not text.startswith("HDP sa "):
        blocks.append({"type": "heading", "text": text})
    else:
        blocks.append({"type": "p", "text": text})

if not any("Platobná bilancia" in block["text"] for block in blocks):
    raise RuntimeError("The payment-balance section was not extracted.")
if any("Monopolistická konkurencia" in block["text"] for block in blocks):
    raise RuntimeError("Incorrect market-structure content remains in question 4.")

topics = json.loads(DATA.read_text(encoding="utf-8"))
topic = next(item for item in topics if item["id"] == "ekonomia-4")
topic["title"] = TITLE
topic["blocks"] = blocks
topic["wordCount"] = sum(len(block["text"].split()) for block in blocks)
topic["tableCount"] = 0
topic["imageCount"] = 0
topic["cue"] = blocks[0]["text"]
topic["emergencyStart"] = [
    (
        "HDP vyjadruje hodnotu finálnych tovarov a služieb vytvorených "
        "na území krajiny za určité obdobie, zatiaľ čo HNP alebo HND "
        "sleduje produkciu a dôchodky domácich rezidentov."
    ),
    (
        "HDP možno vypočítať produkčnou, dôchodkovou a výdavkovou metódou. "
        "Pri výdavkovej metóde platí HDP = C + I + G + NX."
    ),
    (
        "Platobná bilancia zaznamenáva transakcie ekonomiky so zahraničím "
        "a zahŕňa najmä bežný, kapitálový a finančný účet."
    ),
]

DATA.write_text(
    json.dumps(topics, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
print(
    json.dumps(
        {"question": 4, "blocks": len(blocks), "words": topic["wordCount"]},
        ensure_ascii=False,
    )
)
