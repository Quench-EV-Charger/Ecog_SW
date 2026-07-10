import re

filepath = r"c:\Users\VCHAUHAN\Desktop\Production_Testing_Tool\frontend\src\App.jsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Add states
state_insertion = """  const [routerConfiguring, setRouterConfiguring] = useState(false);
  const [seccConfiguring, setSeccConfiguring] = useState(false);
  const [seccleConfiguring, setSeccleConfiguring] = useState(false);"""
content = content.replace("  const [routerConfiguring, setRouterConfiguring] = useState(false);", state_insertion)

# Replace buttons
old_secc_btn = "<button className=\"abtn primary\" onClick={() => alert('SECC Configuration logic pending')}><Settings size={16} /> Configure SECC</button>"
new_secc_btn = """                <button className="abtn primary" disabled={seccConfiguring} onClick={() => {
                  setSeccConfiguring(true);
                  fetch(`${API_BASE}/api/configure/secc`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ charger_id: activeChargerId })
                  })
                  .then(r => r.json())
                  .then(data => {
                    setSeccConfiguring(false);
                    alert(data.message);
                  })
                  .catch(err => {
                    setSeccConfiguring(false);
                    alert('Connection error configuring SECC');
                  });
                }}>
                  {seccConfiguring ? <div className="spinner" style={{borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000'}}></div> : <Settings size={16} />}
                  {seccConfiguring ? ' Configuring...' : ' Configure SECC'}
                </button>"""

old_seccle_btn = "<button className=\"abtn primary\" onClick={() => alert('SECCLE Configuration logic pending')}><Settings size={16} /> Configure SECCLE</button>"
new_seccle_btn = """                <button className="abtn primary" disabled={seccleConfiguring} onClick={() => {
                  setSeccleConfiguring(true);
                  fetch(`${API_BASE}/api/configure/seccle`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ charger_id: activeChargerId })
                  })
                  .then(r => r.json())
                  .then(data => {
                    setSeccleConfiguring(false);
                    alert(data.message);
                  })
                  .catch(err => {
                    setSeccleConfiguring(false);
                    alert('Connection error configuring SECCLE');
                  });
                }}>
                  {seccleConfiguring ? <div className="spinner" style={{borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000'}}></div> : <Settings size={16} />}
                  {seccleConfiguring ? ' Configuring...' : ' Configure SECCLE'}
                </button>"""

content = content.replace(old_secc_btn, new_secc_btn)
content = content.replace(old_seccle_btn, new_seccle_btn)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated App.jsx with functional Configure SECC/SECCLE buttons!")
