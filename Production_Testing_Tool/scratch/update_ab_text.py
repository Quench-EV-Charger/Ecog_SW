import re

filepath = r"c:\Users\VCHAUHAN\Desktop\Production_Testing_Tool\frontend\src\App.jsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update title for AB
old_ab_alert = "setCustomAlert({ title: data.success ? 'AB Configured' : 'Configuration Failed'"
new_ab_alert = "setCustomAlert({ title: data.success ? 'OCPP Successfully Configured' : 'Configuration Failed'"
content = content.replace(old_ab_alert, new_ab_alert)

# 2. Update reboot button text in modal
old_reboot_btn = """                  <button className="glass-btn-primary" onClick={() => handleRebootStack(customAlert.rebootTarget)}>
                     Reboot Stack
                  </button>"""
new_reboot_btn = """                  <button className="glass-btn-primary" onClick={() => handleRebootStack(customAlert.rebootTarget)}>
                     {customAlert.rebootTarget === 'ab' ? 'Reboot OCPP' : 'Reboot Stack'}
                  </button>"""
content = content.replace(old_reboot_btn, new_reboot_btn)

# 3. Update handleRebootStack toast
old_toast = "showToast(`Rebooting ${target.toUpperCase()} stack...`);"
new_toast = "showToast(target === 'ab' ? 'Rebooting OCPP...' : `Rebooting ${target.toUpperCase()} stack...`);"
content = content.replace(old_toast, new_toast)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated App.jsx texts for AB!")
