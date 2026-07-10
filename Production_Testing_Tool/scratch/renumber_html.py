import json
import re

html_path = r"C:\Users\VCHAUHAN\Desktop\Production_Testing_Tool\ADLB_Commissioning_WebApp.html"

with open(html_path, "r", encoding="utf-8") as f:
    content = f.read()

match = re.search(r"const CHECKS\s*=\s*(\[.*?\]);", content, re.DOTALL)
if match:
    checks = json.loads(match.group(1))
    
    for check in checks:
        if check["id"].startswith("SW-"):
            num = int(check["id"].split("-")[1])
            if num >= 4:
                check["id"] = f"SW-{num-2:03d}"
    
    new_checks_json = json.dumps(checks)
    new_content = content[:match.start(1)] + new_checks_json + content[match.end(1):]
    
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    
    print("Successfully renumbered ADLB_Commissioning_WebApp.html sequentially!")
else:
    print("Failed to find CHECKS")
