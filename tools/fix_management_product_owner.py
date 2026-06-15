from pathlib import Path

from docx import Document


SOURCE = Path("/Users/michaljeck/Downloads/VYPRACOVANE_MANAZMENT.docx")
OUTPUT = Path(
    "/Users/michaljeck/Documents/Codex/2026-05-20/"
    "files-mentioned-by-the-user-ekono/VYPRACOVANE_MANAZMENT_OPRAVENE.docx"
)

OLD_TEXT = (
    "V IT projektoch sa každé dva týždne schádza celý tím. "
    "Product Owner prinesie zoznam požiadaviek, ale"
)
NEW_TEXT = (
    "V Scrum tíme sa na začiatku sprintu uskutočňuje Sprint Planning. "
    "Product Owner predstaví cieľ sprintu a prioritizovaný produktový backlog "
    "a Scrum Master pomáha, aby stretnutie a Scrum proces prebiehali správne. "
    "Product Owner pritom nie je automaticky projektovým manažérom."
)

TEXT_FIXES = {
    "Sprint Planning v Scrupe": "Sprint Planning v Scrume",
    "netvorí projektový plán izolovanie od stola": (
        "netvorí projektový plán izolovane od stola"
    ),
    "koľko úloh si na základe svojich reálnych kapacít vezme": (
        "koľko úloh si na základe svojich reálnych kapacít vezmú"
    ),
}


def replace_in_run(paragraph, old: str, new: str) -> bool:
    for run in paragraph.runs:
        if old in run.text:
            run.text = run.text.replace(old, new)
            return True
    return False


document = Document(SOURCE)
matches = 0

for paragraph in document.paragraphs:
    if replace_in_run(paragraph, OLD_TEXT, NEW_TEXT):
        for run in paragraph.runs:
            if run.text == "tím programátorov sám participatívne rozhoduje":
                run.text = " Vývojári participatívne rozhodujú"
        matches += 1
    for old, new in TEXT_FIXES.items():
        replace_in_run(paragraph, old, new)

if matches != 1:
    raise RuntimeError(f"Expected exactly one replacement, found {matches}.")

# Preserve package-level metadata and relationships by saving the edited source.
document.save(OUTPUT)
print(OUTPUT)
