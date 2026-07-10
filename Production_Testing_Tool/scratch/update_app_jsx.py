import os

filepath = "c:\\Users\\VCHAUHAN\\Desktop\\Production_Testing_Tool\\frontend\\src\\App.jsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Map old to new
mapping = {
    "SW-012": "SW-010",
    "SW-011": "SW-009",
    "SW-010": "SW-008",
    "SW-009": "SW-007",
    "SW-008": "SW-006",
    "SW-007": "SW-005",
    "SW-006": "SW-004",
    "SW-005": "SW-003",
    "SW-004": "SW-002",
}

for old, new in mapping.items():
    content = content.replace(f"'{old}'", f"'{new}'")
    content = content.replace(f"\"{old}\"", f"\"{new}\"")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated App.jsx successfully.")
