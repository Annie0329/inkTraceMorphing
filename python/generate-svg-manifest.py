import json
from pathlib import Path
from urllib.parse import quote

PROJECT_ROOT = Path(__file__).resolve().parents[1]
SVG_ROOT = PROJECT_ROOT / "svg"
SOURCE_FOLDER = "工整"
TARGET_FOLDER = "潦草"


def list_svg_files(folder):
    return sorted(
        path.name
        for path in (SVG_ROOT / folder).iterdir()
        if path.is_file() and path.suffix.lower() == ".svg"
    )


source_files = list_svg_files(SOURCE_FOLDER)
target_files = list_svg_files(TARGET_FOLDER)
source_names = set(source_files)
target_names = set(target_files)
matching_names = [name for name in source_files if name in target_names]
unmatched_source_files = [name for name in source_files if name not in target_names]
unmatched_target_files = [name for name in target_files if name not in source_names]

if not matching_names:
    raise SystemExit(
        f"在 svg/{SOURCE_FOLDER} 與 svg/{TARGET_FOLDER} 找不到同名 SVG 配對"
    )

if unmatched_source_files or unmatched_target_files:
    print("以下 SVG 缺少同名配對，未加入動畫清單：")
    for folder, names in (
        (SOURCE_FOLDER, unmatched_source_files),
        (TARGET_FOLDER, unmatched_target_files),
    ):
        for name in names:
            print(f"  svg/{folder}/{name}")

manifest = [
    {
        "label": Path(name).stem,
        "source": f"./svg/{quote(SOURCE_FOLDER, safe='')}/{quote(name, safe='')}",
        "target": f"./svg/{quote(TARGET_FOLDER, safe='')}/{quote(name, safe='')}",
    }
    for name in matching_names
]

manifest_path = PROJECT_ROOT / "svg-manifest.json"
manifest_path.write_text(
    f"{json.dumps(manifest, ensure_ascii=False, indent=2)}\n",
    encoding="utf-8",
)
print(f"已產生 {len(manifest)} 組 SVG 動畫配對：{manifest_path}")
