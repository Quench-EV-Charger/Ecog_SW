import os

filepath = "c:\\Users\\VCHAUHAN\\Desktop\\Production_Testing_Tool\\frontend\\src\\App.jsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Map new to old
mapping = {
    "SW-010": "SW-012",
    "SW-009": "SW-011",
    "SW-008": "SW-010",
    "SW-007": "SW-009",
    "SW-006": "SW-008",
    "SW-005": "SW-007",
    "SW-004": "SW-006",
    "SW-003": "SW-005",
    "SW-002": "SW-004",
}

for new, old in mapping.items():
    content = content.replace(f"'{new}'", f"'{old}'")
    content = content.replace(f"\"{new}\"", f"\"{old}\"")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated App.jsx successfully.")
