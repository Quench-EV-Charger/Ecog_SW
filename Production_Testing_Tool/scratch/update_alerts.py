import re

filepath = r"c:\Users\VCHAUHAN\Desktop\Production_Testing_Tool\frontend\src\App.jsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Add state
state_insertion = """  const [seccleConfiguring, setSeccleConfiguring] = useState(false);
  const [customAlert, setCustomAlert] = useState(null);"""
content = content.replace("  const [seccleConfiguring, setSeccleConfiguring] = useState(false);", state_insertion)

# Replace alerts in SECC
secc_success_replace = """                  .then(data => {
                    setSeccConfiguring(false);
                    setCustomAlert({ title: data.success ? 'SECC Configured' : 'Configuration Failed', message: data.message, type: data.success ? 'success' : 'error' });
                  })"""
content = re.sub(r"\.then\(data => \{\s*setSeccConfiguring\(false\);\s*alert\(data\.message\);\s*\}\)", secc_success_replace, content)

secc_error_replace = """                  .catch(err => {
                    setSeccConfiguring(false);
                    setCustomAlert({ title: 'Connection Error', message: 'Could not reach the backend to configure SECC.', type: 'error' });
                  });"""
content = re.sub(r"\.catch\(err => \{\s*setSeccConfiguring\(false\);\s*alert\('Connection error configuring SECC'\);\s*\}\);", secc_error_replace, content)


# Replace alerts in SECCLE
seccle_success_replace = """                  .then(data => {
                    setSeccleConfiguring(false);
                    setCustomAlert({ title: data.success ? 'SECCLE Configured' : 'Configuration Failed', message: data.message, type: data.success ? 'success' : 'error' });
                  })"""
content = re.sub(r"\.then\(data => \{\s*setSeccleConfiguring\(false\);\s*alert\(data\.message\);\s*\}\)", seccle_success_replace, content)

seccle_error_replace = """                  .catch(err => {
                    setSeccleConfiguring(false);
                    setCustomAlert({ title: 'Connection Error', message: 'Could not reach the backend to configure SECCLE.', type: 'error' });
                  });"""
content = re.sub(r"\.catch\(err => \{\s*setSeccleConfiguring\(false\);\s*alert\('Connection error configuring SECCLE'\);\s*\}\);", seccle_error_replace, content)

# Add Modal at bottom
modal_insertion = """        {customAlert && (
          <div className="glass-overlay" onClick={() => setCustomAlert(null)}>
            <div className="glass-modal" onClick={e => e.stopPropagation()}>
              <h3 style={{color: customAlert.type === 'error' ? 'var(--red)' : 'var(--blue)'}}>{customAlert.title}</h3>
              <p style={{marginBottom: '20px', color: 'var(--text-dim)', lineHeight: '1.5'}}>{customAlert.message}</p>
              <div className="glass-modal-actions">
                <button className="glass-btn-primary" onClick={() => setCustomAlert(null)}>OK</button>
              </div>
            </div>
          </div>
        )}
"""

# Insert right before Delete Photo Modal
content = content.replace("{/* Delete Photo Modal */}", modal_insertion + "\n        {/* Delete Photo Modal */}")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully replaced alerts with custom modal!")
