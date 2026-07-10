import json
import re

with open(r'c:\Users\VCHAUHAN\Desktop\Production_Testing_Tool\ADLB_Commissioning_WebApp.html', 'r', encoding='utf-8') as f:
    match = re.search(r'const CHECKS\s*=\s*(\[.*?\]);', f.read(), re.DOTALL)
    if match:
        checks = json.loads(match.group(1))
        for c in checks:
            if c['id'].startswith('SW-0'):
                exp = c.get('exp', '')
                print(f"{c['id']} : {c['title']} | Expected: {exp}")
