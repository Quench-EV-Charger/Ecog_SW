import re

filepath = r"c:\Users\VCHAUHAN\Desktop\Production_Testing_Tool\frontend\src\App.jsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update SECC success alert
secc_alert_old = "setCustomAlert({ title: data.success ? 'SECC Configured' : 'Configuration Failed', message: data.message, type: data.success ? 'success' : 'error' });"
secc_alert_new = "setCustomAlert({ title: data.success ? 'SECC Configured' : 'Configuration Failed', message: data.message, type: data.success ? 'success' : 'error', rebootTarget: data.success ? 'secc' : null });"
content = content.replace(secc_alert_old, secc_alert_new)

# 2. Update SECCLE success alert
seccle_alert_old = "setCustomAlert({ title: data.success ? 'SECCLE Configured' : 'Configuration Failed', message: data.message, type: data.success ? 'success' : 'error' });"
seccle_alert_new = "setCustomAlert({ title: data.success ? 'SECCLE Configured' : 'Configuration Failed', message: data.message, type: data.success ? 'success' : 'error', rebootTarget: data.success ? 'seccle' : null });"
content = content.replace(seccle_alert_old, seccle_alert_new)

# 3. Add handleRebootStack function
func_insertion = """  const handleRebootStack = (target) => {
    setCustomAlert(null); // close modal
    showToast(`Rebooting ${target.toUpperCase()} stack...`);
    fetch(`${API_BASE}/api/automate/reboot-stack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target })
    })
    .then(r => r.json())
    .then(data => {
      setCustomAlert({
        title: data.success ? 'Reboot Triggered' : 'Reboot Failed',
        message: data.message,
        type: data.success ? 'success' : 'error'
      });
    })
    .catch(err => {
      setCustomAlert({
        title: 'Connection Error',
        message: 'Could not reach backend to reboot stack.',
        type: 'error'
      });
    });
  };"""

content = content.replace("  const confirmDeletePhoto = () => {", func_insertion + "\n\n  const confirmDeletePhoto = () => {")

# 4. Update the modal JSX
modal_old = """              <div className="glass-modal-actions">
                <button className="glass-btn-primary" onClick={() => setCustomAlert(null)}>OK</button>
              </div>"""

modal_new = """              <div className="glass-modal-actions">
                <button className="glass-btn-secondary" onClick={() => setCustomAlert(null)}>Close</button>
                {customAlert.rebootTarget && (
                  <button className="glass-btn-primary" onClick={() => handleRebootStack(customAlert.rebootTarget)}>
                     Reboot Stack
                  </button>
                )}
                {!customAlert.rebootTarget && (
                  <button className="glass-btn-primary" onClick={() => setCustomAlert(null)}>OK</button>
                )}
              </div>"""

content = content.replace(modal_old, modal_new)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated App.jsx with reboot stack UI!")
