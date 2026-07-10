import re
import os

filepath = r"c:\Users\VCHAUHAN\Desktop\Production_Testing_Tool\frontend\src\App.jsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

def shift_sw_id(match):
    num_str = match.group(1)
    num = int(num_str)
    if num >= 4:
        return f"SW-{num-2:03d}"
    return match.group(0)

# Replace all SW-XXX
new_content = re.sub(r"SW-(\d{3})", shift_sw_id, content)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Safely updated App.jsx without recursive overwrite!")
