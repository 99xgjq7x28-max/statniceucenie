import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1] / "statniceucenie-publish"


def build_offline(source_name: str, script_name: str, output_name: str, topics: list[dict]) -> None:
    html = (ROOT / source_name).read_text(encoding="utf-8")
    script = (ROOT / "src" / script_name).read_text(encoding="utf-8")
    embedded = json.dumps(topics, ensure_ascii=False, indent=2)
    html = re.sub(
        rf'<script src="src/{re.escape(script_name)}\?v=\d+" defer></script>',
        lambda _match: f"<script>window.__TOPICS__ = {embedded};\n{script}\n</script>",
        html,
        count=1,
    )
    (ROOT / output_name).write_text(html, encoding="utf-8")


def main() -> None:
    topics = json.loads((ROOT / "data" / "topics.json").read_text(encoding="utf-8"))
    build_offline("index.html", "app.js", "offline.html", topics)
    build_offline("plan.html", "plan.js", "plan-offline.html", topics)
    build_offline("hra.html", "game.js", "hra-offline.html", topics)


if __name__ == "__main__":
    main()
