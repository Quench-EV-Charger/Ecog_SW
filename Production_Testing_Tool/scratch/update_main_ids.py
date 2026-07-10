import os

filepath = "c:\\Users\\VCHAUHAN\\Desktop\\Production_Testing_Tool\\backend\\main.py"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

mapping = {
    "SW-008": "SW-006",
    "SW-009": "SW-007",
    "SW-010": "SW-008",
    "SW-011": "SW-009",
}

# we must replace them sequentially or with regex
# since we are replacing 010 with 008, and then 008 with 006, we will hit the same issue if we do it wrongly.
# Let's just use re.sub with a callback!
import re
def replacer(match):
    return mapping.get(match.group(0), match.group(0))

new_content = re.sub(r"SW-008|SW-009|SW-010|SW-011", replacer, content)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_content)
print("Updated main.py safely.")
