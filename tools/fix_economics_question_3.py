import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data/topics.json"

MISSING_BLOCKS = [
    {
        "type": "heading",
        "text": "4. Monopolistická konkurencia",
    },
    {
        "type": "p",
        "text": (
            "je trhová štruktúra, v ktorej "
            "pôsobí veľa firiem, ale každá predáva mierne odlišný produkt. "
            "Výrobky sú teda diferencované, hoci sú navzájom blízkymi substitútmi."
        ),
    },
    {"type": "heading", "text": "Znaky:"},
    {"type": "li", "text": "veľký počet firiem,"},
    {"type": "li", "text": "voľný vstup a výstup,"},
    {"type": "li", "text": "diferencovaný produkt,"},
    {"type": "li", "text": "každá firma má určitý vplyv na cenu,"},
    {"type": "li", "text": "silná úloha reklamy, značky a marketingu."},
    {"type": "heading", "text": "Diferenciácia produktu môže byť:"},
    {
        "type": "li",
        "text": "skutočná – kvalita, zloženie, lokalita, služby,",
    },
    {"type": "li", "text": "zdanlivá – značka, obal, reklama."},
    {"type": "heading", "text": "Zisk:"},
    {
        "type": "p",
        "text": (
            "V krátkom období môže firma dosahovať zisk, pretože má určitú "
            "jedinečnosť produktu. V dlhom období však vstupujú ďalšie firmy, "
            "takže zisk sa znižuje a podobne ako pri dokonalej konkurencii sa "
            "približuje k nulovému ekonomickému zisku."
        ),
    },
    {"type": "heading", "text": "Príklady:"},
    {
        "type": "li",
        "text": (
            "reštaurácie, kaviarne, kaderníctva, pekárne, butiky, "
            "čerpacie stanice."
        ),
    },
    {
        "type": "heading",
        "text": "Na Slovensku:= Táto štruktúra je veľmi častá najmä v:",
    },
    {
        "type": "li",
        "text": "gastronómii, službách, maloobchode, ubytovaní, osobných službách.",
    },
    {"type": "heading", "text": "Porovnanie trhových štruktúr"},
    {"type": "heading", "text": "Dokonalá konkurencia"},
    {"type": "li", "text": "veľa malých firiem,"},
    {"type": "li", "text": "rovnaký produkt,"},
    {"type": "li", "text": "cena je daná trhom,"},
    {"type": "li", "text": "dlhodobo nulový ekonomický zisk."},
    {"type": "heading", "text": "Monopol"},
    {"type": "li", "text": "jedna firma,"},
    {"type": "li", "text": "bez substitútov,"},
    {"type": "li", "text": "silná kontrola ceny,"},
    {"type": "li", "text": "možnosť dlhodobého nadnormálneho zisku."},
    {"type": "heading", "text": "Oligopol"},
    {"type": "li", "text": "niekoľko veľkých firiem,"},
    {"type": "li", "text": "vzájomná závislosť,"},
    {"type": "li", "text": "strategické správanie,"},
    {"type": "li", "text": "možnosť vysokých ziskov."},
    {"type": "heading", "text": "Monopolistická konkurencia"},
    {"type": "li", "text": "veľa firiem,"},
    {"type": "li", "text": "odlišné produkty,"},
    {"type": "li", "text": "určitý vplyv na cenu,"},
    {
        "type": "li",
        "text": "krátkodobo zisk, dlhodobo skôr nulový ekonomický zisk.",
    },
    {
        "type": "heading",
        "text": "Pôsobenie trhových štruktúr v slovenskej ekonomike",
    },
    {
        "type": "p",
        "text": (
            "V slovenskej ekonomike sa najčastejšie stretávame "
            "s nedokonalou konkurenciou."
        ),
    },
    {
        "type": "p",
        "text": (
            "Monopolné prvky sú najmä v sieťových odvetviach, ako je "
            "distribúcia energií, vody alebo železničná infraštruktúra."
        ),
    },
    {
        "type": "p",
        "text": (
            "Oligopol sa vyskytuje napríklad v telekomunikáciách, "
            "bankovníctve a na trhu pohonných hmôt."
        ),
    },
    {
        "type": "p",
        "text": (
            "Monopolistická konkurencia prevláda v službách, gastronómii, "
            "maloobchode a remeslách."
        ),
    },
    {
        "type": "p",
        "text": (
            "Dokonalá konkurencia je skôr modelový ideál, najbližšie k nemu "
            "sú niektoré poľnohospodárske a komoditné trhy."
        ),
    },
]


topics = json.loads(DATA.read_text(encoding="utf-8"))
topic = next(item for item in topics if item["id"] == "ekonomia-3")

section_index = next(
    (
        index
        for index, block in enumerate(topic["blocks"])
        if block.get("text", "").startswith("4. Monopolistická konkurencia")
    ),
    None,
)
if section_index is None:
    topic["blocks"].extend(MISSING_BLOCKS)
else:
    topic["blocks"][section_index:] = MISSING_BLOCKS

for block in topic["blocks"]:
    if block.get("text", "").startswith(
        "Trhová štruktúra vyjadruje, aký typ trhu"
    ):
        block["type"] = "p"
    if block.get("text", "").startswith(
        "Aj oligopolné firmy môžu dosahovať vysoké zisky"
    ):
        block["type"] = "p"
topic["wordCount"] = sum(
    len(block["text"].split())
    for block in topic["blocks"]
    if "text" in block
)
topic["tableCount"] = sum(
    block["type"] == "table" for block in topic["blocks"]
)
topic["imageCount"] = sum(
    block["type"] == "image" for block in topic["blocks"]
)

DATA.write_text(
    json.dumps(topics, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
print(
    json.dumps(
        {
            "question": 3,
            "blocks": len(topic["blocks"]),
            "words": topic["wordCount"],
        },
        ensure_ascii=False,
    )
)
