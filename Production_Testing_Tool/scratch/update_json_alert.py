import re

filepath = r"c:\Users\VCHAUHAN\Desktop\Production_Testing_Tool\frontend\src\App.jsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

old_json_catch = "try { cfg = JSON.parse(cfg); } catch (err) { showToast('Invalid JSON: ' + err.message, 'error'); return; }"
new_json_catch = "try { cfg = JSON.parse(cfg); } catch (err) { setCustomAlert({ title: 'Invalid JSON', message: 'The configuration format is incorrect: ' + err.message, type: 'error' }); return; }"

content = content.replace(old_json_catch, new_json_catch)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated saveConfig to use customAlert for invalid JSON")
