import os

filepath = "c:\\Users\\VCHAUHAN\\Desktop\\Production_Testing_Tool\\frontend\\src\\App.jsx"
with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

def replace_line(line_num, old_str, new_str):
    idx = line_num - 1
    if old_str in lines[idx]:
        lines[idx] = lines[idx].replace(old_str, new_str)
    else:
        print(f"Warning: {old_str} not found on line {line_num}")

replace_line(1213, "'SW-004'", "'SW-008'")
replace_line(1214, "'SW-005'", "'SW-009'")
replace_line(1215, "'SW-004'", "'SW-010'")
replace_line(1216, "'SW-005'", "'SW-011'")

replace_line(1250, "['SW-004', 'SW-004', 'SW-005', 'SW-004', 'SW-005', 'SW-004', 'SW-005', 'SW-004']", "['SW-004', 'SW-006', 'SW-007', 'SW-008', 'SW-009', 'SW-010', 'SW-011', 'SW-012']")

# 1289 is already 'SW-004'

replace_line(1318, "'SW-004'", "'SW-006'")
replace_line(1365, "'SW-005'", "'SW-007'")
replace_line(1412, "'SW-004'", "'SW-012'")

replace_line(1459, "['SW-004', 'SW-005', 'SW-004', 'SW-005']", "['SW-008', 'SW-009', 'SW-010', 'SW-011']")

replace_line(1492, "['SW-004', 'SW-004', 'SW-005', 'SW-004', 'SW-005', 'SW-004', 'SW-005', 'SW-004']", "['SW-004', 'SW-006', 'SW-007', 'SW-008', 'SW-009', 'SW-010', 'SW-011', 'SW-012']")

replace_line(1498, "['SW-004', 'SW-004', 'SW-005', 'SW-004', 'SW-005', 'SW-004', 'SW-005', 'SW-004']", "['SW-004', 'SW-006', 'SW-007', 'SW-008', 'SW-009', 'SW-010', 'SW-011', 'SW-012']")

with open(filepath, "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Manual line fixes applied to App.jsx successfully.")
