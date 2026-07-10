import re

filepath = r"c:\Users\VCHAUHAN\Desktop\Production_Testing_Tool\frontend\src\App.jsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Replace all occurrences of:
# handleStatusChange(c.id, 'fail');
# where it's immediately preceded by:
# setAutoMessages(prev => ({ ...prev, [c.id]: data.message }));
# or similar, but the easiest is to just use a regex for the fail block.

def replace_fail_notes(match):
    return match.group(0).replace("handleStatusChange(c.id, 'fail');", "handleStatusChange(c.id, 'fail', { notes: data.message });")

# We want to find the blocks that have data.message
content = re.sub(
    r"setAutoMessages\(prev => \(\{ \.\.\.prev, \[c\.id\]: data\.message \}\)\);\s*handleStatusChange\(c\.id, 'fail'\);",
    r"setAutoMessages(prev => ({ ...prev, [c.id]: data.message }));\n                                  handleStatusChange(c.id, 'fail', { notes: data.message });",
    content
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated App.jsx to save failure messages to notes field!")
