import re

filepath = r"c:\Users\VCHAUHAN\Desktop\Production_Testing_Tool\frontend\src\App.jsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add state variable
state_insertion = """  const [seccleConfiguring, setSeccleConfiguring] = useState(false);
  const [abConfiguring, setAbConfiguring] = useState(false);"""
content = content.replace("  const [seccleConfiguring, setSeccleConfiguring] = useState(false);", state_insertion)

# 2. Replace the AB button
old_ab_btn = "<button className=\"abtn primary\" onClick={() => alert('AB Configuration logic pending')}><Settings size={16} /> Configure Application Board (AB)</button>"
new_ab_btn = """                <button className="abtn primary" disabled={abConfiguring} onClick={() => {
                  setAbConfiguring(true);
                  fetch(`${API_BASE}/api/configure/ab`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ charger_id: activeChargerId })
                  })
                  .then(r => r.json())
                  .then(data => {
                    setAbConfiguring(false);
                    setCustomAlert({ title: data.success ? 'AB Configured' : 'Configuration Failed', message: data.message, type: data.success ? 'success' : 'error', rebootTarget: data.success ? 'ab' : null });
                  })
                  .catch(err => {
                    setAbConfiguring(false);
                    setCustomAlert({ title: 'Connection Error', message: 'Could not reach the backend to configure AB.', type: 'error' });
                  });
                }}>
                  {abConfiguring ? <div className="spinner" style={{borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000'}}></div> : <Settings size={16} />}
                  {abConfiguring ? ' Configuring...' : ' Configure Application Board (AB)'}
                </button>"""

content = content.replace(old_ab_btn, new_ab_btn)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated App.jsx with AB logic!")
