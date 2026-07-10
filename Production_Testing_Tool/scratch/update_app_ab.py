import os

filepath = r"c:\Users\VCHAUHAN\Desktop\Production_Testing_Tool\frontend\src\App.jsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Add SW-011 to SW-023 to the lists
# The lists are currently:
# ['SW-002', 'SW-004', 'SW-005', 'SW-006', 'SW-007', 'SW-008', 'SW-009', 'SW-010']
old_list = "['SW-002', 'SW-004', 'SW-005', 'SW-006', 'SW-007', 'SW-008', 'SW-009', 'SW-010']"
new_list = "['SW-002', 'SW-004', 'SW-005', 'SW-006', 'SW-007', 'SW-008', 'SW-009', 'SW-010', 'SW-011', 'SW-012', 'SW-013', 'SW-014', 'SW-015', 'SW-016', 'SW-017', 'SW-018', 'SW-019', 'SW-020', 'SW-021', 'SW-022', 'SW-023']"

content = content.replace(old_list, new_list)

# We need to insert the Test AB Configuration button block.
# We'll find the secc-config block and insert it right after.
secc_block = """                    {['SW-006', 'SW-007', 'SW-008', 'SW-009'].includes(c.id) && (
                      <div className="photo-actions" style={{ marginTop: '10px', marginBottom: '10px' }}>
                        <button className="abtn primary" style={{ width: '100%', justifyContent: 'center', background: 'var(--blue)', color: '#000' }} 
                          disabled={uploading[c.id]}
                          onClick={() => {
                            setUploading(prev => ({ ...prev, [c.id]: true }));
                            fetch(`${API_BASE}/api/automate/secc-config`, { 
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ check_id: c.id, charger_id: activeChargerId })
                            })
                              .then(r => r.json())
                              .then(data => {
                                setUploading(prev => ({ ...prev, [c.id]: false }));
                                if (data.success) {
                                  setAutoMessages(prev => ({ ...prev, [c.id]: null }));
                                  handleStatusChange(c.id, 'pass');
                                } else {
                                  setAutoMessages(prev => ({ ...prev, [c.id]: data.message }));
                                  handleStatusChange(c.id, 'fail');
                                }
                              })
                              .catch(err => {
                                setUploading(prev => ({ ...prev, [c.id]: false }));
                                setAutoMessages(prev => ({ ...prev, [c.id]: 'Connection error' }));
                                handleStatusChange(c.id, 'fail');
                              });
                          }}>
                          {uploading[c.id] ? <div className="spinner" style={{borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000'}}></div> : 'Test Configuration'}
                        </button>
                      </div>
                    )}"""

ab_block = """

                    {['SW-011', 'SW-012', 'SW-013', 'SW-014', 'SW-015', 'SW-016', 'SW-017', 'SW-018', 'SW-019', 'SW-020', 'SW-021', 'SW-022', 'SW-023'].includes(c.id) && (
                      <div className="photo-actions" style={{ marginTop: '10px', marginBottom: '10px' }}>
                        <button className="abtn primary" style={{ width: '100%', justifyContent: 'center', background: 'var(--blue)', color: '#000' }} 
                          disabled={uploading[c.id]}
                          onClick={() => {
                            setUploading(prev => ({ ...prev, [c.id]: true }));
                            fetch(`${API_BASE}/api/automate/ab-config`, { 
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ check_id: c.id, charger_id: activeChargerId })
                            })
                              .then(r => r.json())
                              .then(data => {
                                setUploading(prev => ({ ...prev, [c.id]: false }));
                                if (data.success) {
                                  setAutoMessages(prev => ({ ...prev, [c.id]: null }));
                                  handleStatusChange(c.id, 'pass');
                                } else {
                                  setAutoMessages(prev => ({ ...prev, [c.id]: data.message }));
                                  handleStatusChange(c.id, 'fail');
                                }
                              })
                              .catch(err => {
                                setUploading(prev => ({ ...prev, [c.id]: false }));
                                setAutoMessages(prev => ({ ...prev, [c.id]: 'Connection error' }));
                                handleStatusChange(c.id, 'fail');
                              });
                          }}>
                          {uploading[c.id] ? <div className="spinner" style={{borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000'}}></div> : 'Test AB Configuration'}
                        </button>
                      </div>
                    )}"""

if secc_block in content:
    content = content.replace(secc_block, secc_block + ab_block)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully updated App.jsx with AB config button!")
else:
    print("Failed to find secc_block. The block might have different formatting.")
