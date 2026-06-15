import json
import re
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data/topics.json"
OUTPUT = ROOT / "mindmapy-ekonomia-md"

GROUPS = [
    (
        "01_ekonomicke_zaklady_a_hospodarska_politika.md",
        "Ekonomické základy a hospodárska politika",
        range(1, 9),
    ),
    (
        "02_eu_a_medzinarodna_ekonomika.md",
        "EÚ a medzinárodná ekonomika",
        range(9, 14),
    ),
    (
        "03_penaze_a_bankovnictvo.md",
        "Peniaze a bankovníctvo",
        range(14, 18),
    ),
    (
        "04_trh_prace_a_ekonomicky_rast.md",
        "Trh práce a ekonomický rast",
        range(18, 20),
    ),
    (
        "05_financny_manazment_uvod.md",
        "Finančný manažment – úvod",
        range(20, 21),
    ),
    (
        "06_naklady_majetok_a_uctovnictvo.md",
        "Náklady, majetok a účtovníctvo",
        range(21, 26),
    ),
    (
        "07_financna_analyza_a_investicie.md",
        "Finančná analýza, úroky, investície a riziko",
        range(26, 31),
    ),
]

IMPORTANT_WORDS = (
    "podstata",
    "defin",
    "charakter",
    "členenie",
    "druhy",
    "typy",
    "funkcie",
    "nástroje",
    "metódy",
    "výpočet",
    "vzťah",
    "význam",
    "výhody",
    "nevýhody",
    "slovensk",
    "príklad",
    "účty",
    "rizik",
    "ukazovatele",
    "obmedzenia",
    "vývoj",
    "dostatočný",
    "dopĺňa",
)

GENERIC_HEADINGS = {
    "znaky:",
    "zisk:",
    "príklady:",
    "na slovensku:",
    "výhody:",
    "nevýhody:",
}


def clean(text):
    return re.sub(r"\s+", " ", str(text or "").replace("\xa0", " ")).strip()


def short(text, max_words=24):
    words = clean(text).split()
    if len(words) <= max_words:
        return " ".join(words)
    return " ".join(words[:max_words]).rstrip(",;:") + "…"


def compact_title(title, max_words=16):
    value = clean(title)
    first_sentence = re.split(r"(?<=[.!?])\s+", value)[0]
    return short(first_sentence, max_words)


def section_score(section, index):
    heading = section["heading"].lower()
    score = max(0, 20 - index)
    if re.match(r"^\d+\.", heading):
        score += 45
    if re.match(r"^[a-f]\)", heading):
        score += 30
    score += sum(10 for word in IMPORTANT_WORDS if word in heading)
    if heading in GENERIC_HEADINGS:
        score -= 30
    if len(heading.split()) > 15:
        score -= 12
    if section["items"]:
        score += 4
    return score


def build_sections(topic):
    raw_sections = []
    introduction = []
    current = None

    for block in topic["blocks"]:
        if block["type"] in {"table", "image"}:
            continue
        text = clean(block.get("text"))
        if not text:
            continue
        numbered_text = re.match(r"^(\d+\.\s+[^=]{2,90}?)(?:=\s*|\s+je\s+)(.+)$", text)
        is_numbered_branch = bool(
            re.match(r"^\d+\.\s+", text)
            and len(text.split()) <= 48
        )
        if numbered_text:
            current = {
                "heading": numbered_text.group(1).rstrip(" :"),
                "items": [numbered_text.group(2)],
                "numbered": True,
            }
            raw_sections.append(current)
        elif block["type"] == "heading" or is_numbered_branch:
            current = {"heading": text, "items": []}
            current["numbered"] = is_numbered_branch
            raw_sections.append(current)
        elif current is None:
            introduction.append(text)
        else:
            current["items"].append(text)

    # A numbered branch owns subordinate labels such as "Znaky" and "Príklady"
    # until the next numbered branch. This produces a useful MindNode hierarchy.
    sections = []
    index = 0
    while index < len(raw_sections):
        section = raw_sections[index]
        if section.get("numbered"):
            merged = {
                "heading": section["heading"],
                "items": list(section["items"]),
                "numbered": True,
            }
            lookahead = index + 1
            while (
                lookahead < len(raw_sections)
                and not raw_sections[lookahead].get("numbered")
            ):
                child = raw_sections[lookahead]
                child_heading = child["heading"].lower()
                if (
                    child_heading not in GENERIC_HEADINGS
                    and any(word in child_heading for word in IMPORTANT_WORDS)
                ):
                    break
                if child["heading"].lower() not in GENERIC_HEADINGS:
                    merged["items"].append(child["heading"])
                merged["items"].extend(child["items"])
                lookahead += 1
            sections.append(merged)
            index = lookahead
        else:
            sections.append(section)
            index += 1

    candidates = []
    for index, section in enumerate(sections):
        if not section["items"] and len(section["heading"].split()) > 15:
            continue
        candidates.append((section_score(section, index), index, section))

    selected = sorted(candidates, reverse=True)[:16]
    selected = [section for _, _, section in sorted(selected, key=lambda item: item[1])]
    return introduction, selected


def useful_items(items, heading=""):
    selected = []
    for item in items:
        value = short(item)
        if (
            not value
            or value in selected
            or clean(value).rstrip(":").lower() == clean(heading).rstrip(":").lower()
        ):
            continue
        selected.append(value)
        if len(selected) == 3:
            break
    return selected


def render_topic(topic):
    introduction, sections = build_sections(topic)
    lines = [
        f"## {topic['number']}. {compact_title(topic['title'])}",
        "",
        "### Zadanie",
        f"- {clean(topic['title'])}",
        "",
        "### Jadro",
    ]

    core = useful_items(introduction)
    if not core:
        core = [short(topic.get("cue", topic["title"]))]
    lines.extend(f"- {item}" for item in core[:3])

    for section in sections:
        heading = clean(section["heading"]).rstrip(":")
        lines.extend(["", f"### {heading}"])
        items = useful_items(section["items"], heading)
        if items:
            lines.extend(f"- {item}" for item in items)

    lines.extend(
        [
            "",
            "### Skúšková kostra",
            f"- Začni: {short(topic.get('emergencyStart', [topic['cue']])[0], 28)}",
            "- Potom prejdi hlavné vetvy mapy v poradí.",
            "- Na konci pridaj praktický význam alebo príklad.",
            "",
        ]
    )
    return "\n".join(lines)


topics = json.loads(DATA.read_text(encoding="utf-8"))
economics = {
    topic["number"]: topic
    for topic in topics
    if topic["subject"] == "Ekonómia a financie"
}

if sorted(economics) != list(range(1, 31)):
    raise RuntimeError("Expected economics questions 1–30.")

if OUTPUT.exists():
    shutil.rmtree(OUTPUT)
OUTPUT.mkdir(parents=True)

index_lines = [
    "# Mind mapy – Ekonómia a financie",
    "",
    "Mapy sú určené na pochopenie štruktúry a hovorenie vlastnými slovami.",
    "Úplné odpovede zostávajú v aplikácii.",
    "",
    "## Ako používať",
    "",
    "1. Importuj jeden Markdown súbor do MindNode.",
    "2. Prejdi hlavné vetvy otázky.",
    "3. Mapu zavri a skús vetvy vymenovať bez pozerania.",
    "4. Odpovedz nahlas podľa obnovenej kostry.",
    "",
    "## Tematické bloky",
    "",
]

covered = []
for filename, title, numbers in GROUPS:
    numbers = list(numbers)
    covered.extend(numbers)
    content = [
        f"# {title}",
        "",
        f"Otázky {numbers[0]}–{numbers[-1]}",
        "",
    ]
    for number in numbers:
        content.append(render_topic(economics[number]))
    (OUTPUT / filename).write_text("\n".join(content).rstrip() + "\n", encoding="utf-8")
    index_lines.append(
        f"- [{title}]({filename}) – otázky {numbers[0]}–{numbers[-1]}"
    )

if covered != list(range(1, 31)):
    raise RuntimeError(f"Mind-map groups do not cover all questions: {covered}")

(OUTPUT / "00_PREHLAD_A_NAVOD.md").write_text(
    "\n".join(index_lines) + "\n",
    encoding="utf-8",
)

print(
    json.dumps(
        {
            "files": len(GROUPS) + 1,
            "questions": len(covered),
            "output": str(OUTPUT),
        },
        ensure_ascii=False,
    )
)
