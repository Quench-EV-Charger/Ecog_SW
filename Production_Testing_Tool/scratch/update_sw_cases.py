import json
import re

html_path = "ADLB_Commissioning_WebApp.html"

with open(html_path, "r", encoding="utf-8") as f:
    content = f.read()

match = re.search(r"const CHECKS\s*=\s*(\[.*?\]);", content, re.DOTALL)
if not match:
    print("Could not find CHECKS array")
    exit(1)

checks = json.loads(match.group(1))

# Step 1: Automate SW-001 and SW-005
for check in checks:
    if check["id"] == "SW-001":
        check["cls"] = "automated"
    elif check["id"] == "SW-005":
        check["cls"] = "automated"

# Step 2: Remove SW-002 and SW-003
checks = [c for c in checks if c["id"] not in ("SW-002", "SW-003")]

# Step 3: Renumber all SW-* cases
sw_counter = 1
for check in checks:
    if check["id"].startswith("SW-"):
        check["id"] = f"SW-{sw_counter:03d}"
        sw_counter += 1

# Serialize back
new_checks_json = json.dumps(checks)
new_content = content[:match.start(1)] + new_checks_json + content[match.end(1):]

with open(html_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print(f"Successfully updated {len(checks)} checks.")
