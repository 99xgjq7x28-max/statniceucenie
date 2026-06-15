import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data/topics.json"

topics = json.loads(DATA.read_text(encoding="utf-8"))
fixed = []

for number in (16, 25, 28):
    topic = next(
        item
        for item in topics
        if item["id"] == f"ekonomia-{number}"
    )
    if not topic["title"].endswith("."):
        topic["title"] += "."
        fixed.append(number)

DATA.write_text(
    json.dumps(topics, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
print(json.dumps({"fixedTitlePunctuation": fixed}, ensure_ascii=False))
