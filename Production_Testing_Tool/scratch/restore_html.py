import json
import re

transcript_path = r"C:\Users\VCHAUHAN\.gemini\antigravity-ide\brain\75f07f28-5f15-43d4-bf84-52aa4631d97d\.system_generated\logs\transcript.jsonl"
html_path = r"C:\Users\VCHAUHAN\Desktop\Production_Testing_Tool\ADLB_Commissioning_WebApp.html"

original_checks_json = None

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if 'content' in data:
                content = data['content']
                if 'const CHECKS' in content:
                    match = re.search(r'const CHECKS\s*=\s*(\[.*?\]);', content, re.DOTALL)
                    if match:
                        checks_str = match.group(1)
                        try:
                            checks_arr = json.loads(checks_str)
                            if len(checks_arr) == 109:
                                original_checks_json = checks_str
                                break
                        except:
                            pass
        except:
            pass

if original_checks_json:
    print("Found original checks in content field!")
    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    match = re.search(r"const CHECKS\s*=\s*(\[.*?\]);", html_content, re.DOTALL)
    if match:
        new_html = html_content[:match.start(1)] + original_checks_json + html_content[match.end(1):]
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(new_html)
        print("Restored ADLB_Commissioning_WebApp.html")
    else:
        print("Could not find CHECKS in current HTML")
else:
    print("Could not find original CHECKS in transcript content.")

