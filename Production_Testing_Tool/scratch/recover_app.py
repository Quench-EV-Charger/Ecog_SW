import json
import re

transcript_path = r"C:\Users\VCHAUHAN\.gemini\antigravity-ide\brain\75f07f28-5f15-43d4-bf84-52aa4631d97d\.system_generated\logs\transcript.jsonl"

best_app_jsx = ""
max_lines = 0

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if 'content' in data:
                content = data['content']
                if "File Path: `file:///c:/Users/VCHAUHAN/Desktop/Production_Testing_Tool/frontend/src/App.jsx`" in content:
                    # check if it shows lines. "Showing lines 1 to 1640" or similar
                    match = re.search(r'Showing lines 1 to (\d+)', content)
                    if match:
                        lines = int(match.group(1))
                        if lines > max_lines:
                            max_lines = lines
                            best_app_jsx = content
        except Exception as e:
            pass

print(f"Max lines found: {max_lines}")
if max_lines > 1000:
    print("Found a full or mostly full App.jsx!")
    # Save it to a file to inspect
    with open(r"c:\Users\VCHAUHAN\Desktop\Production_Testing_Tool\scratch\recovered_app.jsx.txt", "w", encoding="utf-8") as f:
        f.write(best_app_jsx)
