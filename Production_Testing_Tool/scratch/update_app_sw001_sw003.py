import re

filepath = r"c:\Users\VCHAUHAN\Desktop\Production_Testing_Tool\frontend\src\App.jsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Add SW-001 and SW-003 to the lists
old_list = "['SW-002', 'SW-004', 'SW-005', 'SW-006', 'SW-007', 'SW-008', 'SW-009', 'SW-010', 'SW-011', 'SW-012', 'SW-013', 'SW-014', 'SW-015', 'SW-016', 'SW-017', 'SW-018', 'SW-019', 'SW-020', 'SW-021', 'SW-022', 'SW-023']"
new_list = "['SW-001', 'SW-002', 'SW-003', 'SW-004', 'SW-005', 'SW-006', 'SW-007', 'SW-008', 'SW-009', 'SW-010', 'SW-011', 'SW-012', 'SW-013', 'SW-014', 'SW-015', 'SW-016', 'SW-017', 'SW-018', 'SW-019', 'SW-020', 'SW-021', 'SW-022', 'SW-023']"

content = content.replace(old_list, new_list)

# We need to insert the Verify Router Config button block.
# We'll find the SW-002 block and insert it right before.
sw002_block = """                    {c.id === 'SW-002' && ("""

verify_router_block = """

                    {['SW-001', 'SW-003'].includes(c.id) && (
                      <div className="photo-actions" style={{ marginTop: '10px', marginBottom: '10px' }}>
                        <button className="abtn primary" style={{ width: '100%', justifyContent: 'center', background: 'var(--blue)', color: '#000' }} 
                          disabled={uploading[c.id]}
                          onClick={() => {
                            setUploading(prev => ({ ...prev, [c.id]: true }));
                            fetch(`${API_BASE}/api/automate/verify-router`, { 
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ check_id: c.id, charger_id: activeChargerId })
                            })
                              .then(r => r.json())
                              .then(data => {
                                setUploading(prev => ({ ...prev, [c.id]: false }));
                                if (data.success) {
                                  setAutoMessages(prev => ({ ...prev, [c.id]: null }));
                                  handleStatusChange(c.id, 'pass', { notes: data.message });
                                } else {
                                  setAutoMessages(prev => ({ ...prev, [c.id]: data.message }));
                                  handleStatusChange(c.id, 'fail', { notes: data.message });
                                }
                              })
                              .catch(err => {
                                setUploading(prev => ({ ...prev, [c.id]: false }));
                                setAutoMessages(prev => ({ ...prev, [c.id]: 'Connection error' }));
                                handleStatusChange(c.id, 'fail', { notes: 'Connection error' });
                              });
                          }}>
                          {uploading[c.id] ? <div className="spinner" style={{borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000'}}></div> : 'Verify Router Config'}
                        </button>
                      </div>
                    )}"""

if sw002_block in content:
    content = content.replace(sw002_block, verify_router_block + "\n" + sw002_block)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully updated App.jsx with Verify Router Config button!")
else:
    print("Failed to find sw002_block.")
