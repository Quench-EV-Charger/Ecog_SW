import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle, XCircle, AlertCircle, RefreshCw, Download, 
  Camera, Upload, ChevronDown, ChevronUp, Menu, X, Info, 
  AlertTriangle, QrCode, Home, Plus, Edit, Table, Archive, FileText,
  Settings, Save, Trash2, Cloud
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const HOST = window.location.hostname || 'localhost';
// If we are running on standard web ports (80/443) or via a tunnel, the API is on the same host/port.
// If we are running the Vite dev server (5173), we point to the backend on 8000.
const isDevServer = window.location.port === '5173';
const API_BASE = isDevServer ? `http://${HOST}:8000` : window.location.origin;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [currentView, setCurrentView] = useState('home'); // 'home', 'testing', 'results', 'superuser'
  const [userRole, setUserRole] = useState('operator');
  
  const [profiles, setProfiles] = useState([]);
  const [phases, setPhases] = useState([]);
  const [checks, setChecks] = useState([]);
  const [images, setImages] = useState({});
  const [configs, setConfigs] = useState({});
  const [targetReleases, setTargetReleases] = useState({});
  const [localIp, setLocalIp] = useState('');
  const [tunnelUrl, setTunnelUrl] = useState('');
  
  const [chargers, setChargers] = useState([]);
  const [activeChargerId, setActiveChargerId] = useState('');
  const [activeProfileId, setActiveProfileId] = useState('');
  const [syncToken, setSyncToken] = useState('');
  
  const [activePhaseKey, setActivePhaseKey] = useState('');
  const [results, setResults] = useState({});
  const [chargerImages, setChargerImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [unsyncedImages, setUnsyncedImages] = useState(false);
  const [syncingImages, setSyncingImages] = useState(false);
  
  const [specOpen, setSpecOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightbox, setLightbox] = useState({ open: false, url: '', cap: '' });
  const [notesEditing, setNotesEditing] = useState({});
  const [uploading, setUploading] = useState({});
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [routerConfirmOpen, setRouterConfirmOpen] = useState(false);

  const [qrOpen, setQrOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newChargerId, setNewChargerId] = useState('');
  const [newProfileId, setNewProfileId] = useState('');
  
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeChargerId, setResumeChargerId] = useState('');

  const [sw006Target, setSw006Target] = useState('');
  const [sw007Target, setSw007Target] = useState('');
  const [autoMessages, setAutoMessages] = useState({});
  
  // Super User states
  const [suTab, setSuTab] = useState('profiles'); // 'profiles', 'configs', 'releases', 'users'
  const [usersList, setUsersList] = useState({});
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'operator' });
  const [suConfigTab, setSuConfigTab] = useState('secc_seccle'); // 'secc', 'seccle', 'ocpp', 'router'
  const [routerConfiguring, setRouterConfiguring] = useState(false);
  const [seccConfiguring, setSeccConfiguring] = useState(false);
  const [seccleConfiguring, setSeccleConfiguring] = useState(false);
  const [abConfiguring, setAbConfiguring] = useState(false);
  const [customAlert, setCustomAlert] = useState(null);
  const [routerStatus, setRouterStatus] = useState(null);
  const [editingProfile, setEditingProfile] = useState(null);
  const [editingConfigProfile, setEditingConfigProfile] = useState('');
  const [editingReleaseProfile, setEditingReleaseProfile] = useState('');
  const [unifiedReleases, setUnifiedReleases] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const [wsStatus, setWsStatus] = useState('connecting');

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const fileInputRefs = useRef({});

  // Fetch Config
  useEffect(() => {
    fetch(`${API_BASE}/api/config`)
      .then(res => res.json())
      .then(data => {
        setProfiles(data.profiles);
        setPhases(data.phases);
        setChecks(data.checks);
        setImages(data.images || {});
        setConfigs(data.configs || {});
        setTargetReleases(data.target_releases || {});
        setLocalIp(data.local_ip || HOST);
        setTunnelUrl(data.tunnel_url || '');

        fetch(`${API_BASE}/api/users`)
          .then(r => r.json())
          .then(u => setUsersList(u))
          .catch(() => {});

        if (data.phases.length > 0) setActivePhaseKey(data.phases[0].key);
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get('token');
        const urlUser = params.get('user');
        const storedRole = localStorage.getItem('quench_role') || 'operator';
        setUserRole(storedRole);
        
        if (urlToken) {
          fetch(`${API_BASE}/api/access/${urlToken}`)
            .then(r => r.json())
            .then(accessData => {
              if (accessData.charger_id) {
                if (urlUser) localStorage.setItem('quench_user', urlUser);
                setActiveChargerId(accessData.charger_id);
                setCurrentView('testing');
                setIsAuthenticated(true); // Bypass login for this deep link
              }
              setLoading(false);
            })
            .catch(() => {
              setLoading(false);
            });
        } else {
          if (localStorage.getItem('quench_token') && localStorage.getItem('quench_user')) {
            setIsAuthenticated(true);
          }
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Config fetch error:', err);
        setLoading(false);
      });
  }, []);

  // Fetch Chargers List
  const fetchChargers = () => {
    fetch(`${API_BASE}/api/chargers`)
      .then(res => res.json())
      .then(data => setChargers(data))
      .catch(err => console.error('Error fetching chargers:', err));
  };

  useEffect(() => {
    if (currentView === 'home' || currentView === 'results') {
      fetchChargers();
    }
  }, [currentView]);

  // Fetch specific charger results when testing
  useEffect(() => {
    if (currentView === 'testing' && activeChargerId) {
      fetch(`${API_BASE}/api/results/${activeChargerId}`)
        .then(res => res.json())
        .then(data => {
          setActiveProfileId(data.profile_id);
          setSyncToken(data.sync_token || '');
          setResults(data.results);
          setChargerImages(data.images || {});
          setNotesEditing({});
          setUnsyncedImages(data.unsynced_images || false);
        })
        .catch(err => console.error('Error fetching charger results:', err));
    }
  }, [currentView, activeChargerId]);

  // Set default target releases when profile is known
  useEffect(() => {
    if (activeProfileId && targetReleases[activeProfileId]) {
      const rel = targetReleases[activeProfileId];
      setSw006Target(rel.sw006?.default || '');
      setSw007Target(rel.sw007?.default || '');
    }
  }, [activeProfileId, targetReleases]);

  // WebSocket
  useEffect(() => {
    let wsUrl;
    if (API_BASE.startsWith('https://')) {
      wsUrl = API_BASE.replace('https://', 'wss://') + '/api/ws';
    } else {
      wsUrl = API_BASE.replace('http://', 'ws://') + '/api/ws';
    }
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => setWsStatus('connected');
    ws.onclose = () => setWsStatus('disconnected');
    ws.onerror = () => setWsStatus('error');

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.charger_id && msg.charger_id !== activeChargerId) return;

        if (msg.type === 'RESULT_UPDATE') {
          setResults(prev => ({ ...prev, [msg.check_id]: msg.data }));
        } else if (msg.type === 'RESET') {
          setResults({}); setChargerImages({}); setNotesEditing({});
        } else if (msg.type === 'PHOTO_UPLOAD') {
          if (msg.charger_id === activeChargerId) {
            setUnsyncedImages(true);
            setChargerImages(prev => {
              const current = prev[msg.check_id] || [];
              if (!current.includes(msg.file_url)) {
                return { ...prev, [msg.check_id]: [...current, msg.file_url] };
              }
              return prev;
            });
          }
        } else if (msg.type === 'PHOTO_DELETE') {
          if (msg.charger_id === activeChargerId) {
            setUnsyncedImages(true);
            setChargerImages(prev => {
              const current = prev[msg.check_id] || [];
              return { ...prev, [msg.check_id]: current.filter(u => u !== msg.file_url) };
            });
          }
        } else if (msg.type === 'SYNC_CLOUD') {
          setResults(prev => ({
            ...prev,
            [msg.check_id]: { ...(prev[msg.check_id] || {}), photo_url: msg.file_url }
          }));
        } else if (msg.type === 'ROUTER_STATUS') {
          setRouterStatus(msg.status);
          if (msg.status && (msg.status.includes('SUCCESS') || msg.status.includes('Error') || msg.status.includes('Failed') || msg.status.includes('⚠️'))) {
            if (msg.status.includes('SUCCESS')) {
               handleStatusChange('SW-001', 'pass', { notes: "Router fully configured automatically" });
            }
            setTimeout(() => {
              setRouterConfiguring(false);
              setRouterStatus(null);
            }, 5000);
          }
        }
      } catch (err) { console.error('WS parse error:', err); }
    };
    return () => ws.close();
  }, [activeChargerId]);

  const activeProfile = profiles.find(p => p.profile_id === activeProfileId) || profiles[0] || {};

  const parseTemplate = (text, template) => {
    if (template) {
      return template.replace(/\{(\w+)\}/g, (_, key) => activeProfile[key] !== undefined ? activeProfile[key] : '?');
    }
    return text;
  };

  const deletePhoto = (url) => {
    setPhotoToDelete(url);
  };
  
  const handleRebootStack = (target) => {
    setCustomAlert(null); // close modal
    showToast(target === 'ab' ? 'Rebooting OCPP...' : `Rebooting ${target.toUpperCase()} stack...`);
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
  };

  const confirmDeletePhoto = () => {
    if (!photoToDelete) return;
    const url = photoToDelete;
    setPhotoToDelete(null);
    fetch(`${API_BASE}${url}`, { method: 'DELETE' })
      .catch(err => alert('Failed to delete photo: ' + err.message));
  };
  
  const handleRouterConfigure = () => {
    setRouterConfirmOpen(false);
    setRouterConfiguring(true);
    setRouterStatus('Starting automated router configuration...');
    fetch(`${API_BASE}/api/automate/configure-router`, { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (data.status === 'started') {
           // It's running in background, websocket will provide updates
           console.log('Router config started in background');
        } else if (data.detail) {
           setRouterConfiguring(false);
           showToast('Router config failed: ' + data.detail, 'error');
        }
      })
      .catch(err => {
        setRouterConfiguring(false);
        showToast('Failed to start router config: ' + err.message, 'error');
      });
  };

  const handleStatusChange = (checkId, newStatus, extraData = {}) => {
    if (!activeChargerId) return;
    const currentNotes = notesEditing[checkId] || results[checkId]?.notes || '';
    setResults(prev => ({ ...prev, [checkId]: { ...prev[checkId], status: newStatus, notes: currentNotes, username: localStorage.getItem('quench_user') || 'QR Scanner', ...extraData } }));

    fetch(`${API_BASE}/api/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        charger_id: activeChargerId, 
        check_id: checkId, 
        status: newStatus, 
        notes: currentNotes,
        username: localStorage.getItem('quench_user') || 'Unknown'
      })
    }).catch(err => console.error('Error saving result:', err));
  };

  const handleNotesChange = (checkId, value) => {
    setNotesEditing(prev => ({ ...prev, [checkId]: value }));
  };

  const handleNotesBlur = (checkId) => {
    if (!activeChargerId) return;
    const currentStatus = results[checkId]?.status || '';
    const text = notesEditing[checkId];
    if (text === undefined) return;

    fetch(`${API_BASE}/api/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        charger_id: activeChargerId, 
        check_id: checkId, 
        status: currentStatus, 
        notes: text,
        username: localStorage.getItem('quench_user') || 'Unknown'
      })
    })
    .then(() => setResults(prev => ({ ...prev, [checkId]: { ...prev[checkId], notes: text, username: localStorage.getItem('quench_user') || 'Unknown' } })))
    .catch(err => console.error('Error saving notes:', err));
  };

  const handleFileChange = (checkId, e) => {
    const file = e.target.files[0];
    if (!file || !activeChargerId) return;

    setUploading(prev => ({ ...prev, [checkId]: true }));

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max dimensions
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          const formData = new FormData();
          formData.append('charger_id', activeChargerId);
          formData.append('check_id', checkId);
          formData.append('file', blob, file.name);

          fetch(`${API_BASE}/api/upload-photo`, { 
            method: 'POST', 
            headers: { 'ngrok-skip-browser-warning': 'true' },
            body: formData 
          })
          .then(async res => {
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`HTTP ${res.status}: ${text}`);
            }
            return res.json();
          })
          .then(data => {
            setUploading(prev => ({ ...prev, [checkId]: false }));
            if (data.status === 'success') {
              // Immediately fetch results to get the new images map
              fetch(`${API_BASE}/api/results/${activeChargerId}`)
                .then(r => r.json())
                .then(resData => {
                  setResults(resData.results);
                  setChargerImages(resData.images || {});
                  if (resData.unsynced_images !== undefined) {
                    setUnsyncedImages(resData.unsynced_images);
                  }
                });
            } else {
              alert('Upload failed: ' + JSON.stringify(data));
            }
          }).catch(err => {
            setUploading(prev => ({ ...prev, [checkId]: false }));
            alert('Photo upload failed: ' + err.message);
          });
        }, 'image/jpeg', 0.7); // Compress to 70% quality JPEG
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    if (!activeChargerId || !confirm('Reset ALL progress for this charger?')) return;
    fetch(`${API_BASE}/api/reset/${activeChargerId}`, { method: 'POST' })
      .then(() => { setResults({}); setChargerImages({}); setNotesEditing({}); })
      .catch(err => alert('Reset failed'));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--bg)' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  // ---- VIEWS ----

  const renderUserBadge = (customStyle = {}) => (
    <div style={{ position: 'relative', ...customStyle }}>
      <div 
        onClick={() => setUserMenuOpen(!userMenuOpen)}
        style={{ padding: '6px 12px', background: 'var(--surface)', borderRadius: '12px', fontSize: '13px', border: '1px solid var(--line)', color: 'var(--text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', backdropFilter: 'blur(10px)', cursor: 'pointer', transition: '0.2s', userSelect: 'none' }}
        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--blue)'}
        onMouseOut={e => e.currentTarget.style.borderColor = 'var(--line)'}
      >
        <div style={{ 
          width: 8, height: 8, borderRadius: '50%', 
          background: wsStatus === 'connected' ? 'var(--green)' : wsStatus === 'connecting' ? 'var(--orange)' : 'var(--red)', 
          boxShadow: `0 0 8px ${wsStatus === 'connected' ? 'var(--green)' : wsStatus === 'connecting' ? 'var(--orange)' : 'var(--red)'}` 
        }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--blue)', lineHeight: '1.2' }}>{localStorage.getItem('quench_user')}</span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1' }}>
            {wsStatus === 'connected' ? `Connected: ${HOST}` : wsStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
          </span>
        </div>
      </div>
      {userMenuOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: 'var(--surface)', border: '1px solid var(--line)',
          padding: '4px', borderRadius: '8px', zIndex: 100,
          boxShadow: '0 10px 20px rgba(0,0,0,0.5)', minWidth: '120px'
        }}>
          <button 
            onClick={() => { localStorage.removeItem('quench_token'); localStorage.removeItem('quench_user'); localStorage.removeItem('quench_role'); window.location.reload(); }}
            style={{ background: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255, 59, 48, 0.3)', color: 'var(--red)', fontWeight: 600, cursor: 'pointer', fontSize: '13px', padding: '8px 12px', width: '100%', borderRadius: '6px', display: 'flex', justifyContent: 'center' }}>
            Logout
          </button>
        </div>
      )}
    </div>
  );

  const renderHomeView = () => {
    return (
      <div className="home-view" onClick={() => userMenuOpen && setUserMenuOpen(false)}>
        {renderUserBadge({ position: 'absolute', top: '20px', right: '20px' })}
        <div className="hero">
          <h1>QUENCH</h1>
          <p>Next-Gen Charger Commissioning</p>
        </div>
        
        <div className="home-actions">
          <div className="home-card" onClick={() => {
            setNewChargerId('');
            setNewProfileId(profiles.length > 0 ? profiles[0].profile_id : '');
            setShowNewModal(true);
          }}>
            <div className="hc-icon"><Plus size={32} /></div>
            <h3>Start with New Charger</h3>
            <p>Initialize a new commissioning checklist for a fresh unit.</p>
          </div>

          <div className="home-card" onClick={() => {
            setResumeChargerId('');
            setShowResumeModal(true);
          }}>
            <div className="hc-icon"><Edit size={32} /></div>
            <h3>Update Existing Charger</h3>
            <p>Resume an incomplete checklist for an existing unit.</p>
          </div>

          <div className="home-card" onClick={() => setCurrentView('results')}>
            <div className="hc-icon"><Table size={32} /></div>
            <h3>Check Results</h3>
            <p>View summary table and download export packages.</p>
          </div>

          {userRole === 'superuser' && (
            <div className="home-card" onClick={() => setCurrentView('superuser')}>
              <div className="hc-icon"><Settings size={32} /></div>
              <h3>Super User Config</h3>
              <p>Manage charger templates, default configs, and target releases.</p>
            </div>
          )}
        </div>

        {showNewModal && (
          <div className="glass-overlay" onClick={() => setShowNewModal(false)}>
            <div className="glass-modal" onClick={e => e.stopPropagation()}>
              <h3>Start with New Charger</h3>
              <div className="glass-field">
                <label>Charger ID (Serial Number)</label>
                <input 
                  type="text" 
                  value={newChargerId} 
                  onChange={e => setNewChargerId(e.target.value)} 
                  placeholder="e.g. 100123"
                  autoFocus
                />
              </div>
              <div className="glass-field">
                <label>Charger Profile</label>
                <select 
                  value={newProfileId} 
                  onChange={e => setNewProfileId(e.target.value)}
                >
                  {profiles.map(p => (
                    <option key={p.profile_id} value={p.profile_id}>{p.name} ({p.profile_id})</option>
                  ))}
                </select>
              </div>
              <div className="glass-modal-actions">
                <button className="glass-btn-secondary" onClick={() => setShowNewModal(false)}>Cancel</button>
                <button className="glass-btn-primary" disabled={!newChargerId || !newProfileId} onClick={() => {
                  fetch(`${API_BASE}/api/chargers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ charger_id: newChargerId, profile_id: newProfileId })
                  })
                  .then(res => res.json())
                  .then(data => {
                    if (data.status === 'success') {
                      setActiveChargerId(data.charger_id);
                      setShowNewModal(false);
                      setCurrentView('testing');
                    }
                  });
                }}>Start Commissioning</button>
              </div>
            </div>
          </div>
        )}

        {showResumeModal && (
          <div className="glass-overlay" onClick={() => setShowResumeModal(false)}>
            <div className="glass-modal" onClick={e => e.stopPropagation()}>
              <h3>Update Existing Charger</h3>
              <div className="glass-field">
                <label>Select Existing Charger</label>
                <select 
                  value={resumeChargerId} 
                  onChange={e => setResumeChargerId(e.target.value)}
                >
                  <option value="" disabled>-- Select a charger --</option>
                  {chargers.map(c => (
                    <option key={c.charger_id} value={c.charger_id}>{c.charger_id} ({c.profile_id})</option>
                  ))}
                </select>
              </div>
              <div className="glass-modal-actions">
                <button className="glass-btn-secondary" onClick={() => setShowResumeModal(false)}>Cancel</button>
                <button className="glass-btn-primary" disabled={!resumeChargerId} onClick={() => {
                  setActiveChargerId(resumeChargerId);
                  setShowResumeModal(false);
                  setCurrentView('testing');
                }}>Resume Commissioning</button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  const renderResultsView = () => {
    return (
      <div className="results-view">
        <header className="rv-header">
          <button className="iconbtn" onClick={() => setCurrentView('home')}>
            <Home size={16} /> <span className="icon-text">Back to Home</span>
          </button>
          <h2>Commissioning Results Dashboard</h2>
          <div className="spacer"></div>
          {renderUserBadge()}
        </header>

        <div className="table-container">
          <table className="results-table">
            <thead>
              <tr>
                <th>Charger ID</th>
                <th>Profile</th>
                <th>Completed / Total</th>
                <th>Pass</th>
                <th>Fail</th>
                <th>Pending</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {chargers.map(c => (
                <tr key={c.charger_id}>
                  <td><b>{c.charger_id}</b></td>
                  <td>{c.profile_id}</td>
                  <td>{c.stats.completed} / {c.stats.total}</td>
                  <td className="t-pass">{c.stats.pass}</td>
                  <td className="t-fail">{c.stats.fail}</td>
                  <td className="t-pend">{c.stats.pending}</td>
                  <td>
                    <div className="t-actions">
                      <a href={`${API_BASE}/api/export/${c.charger_id}/csv`} className="tbl-btn" download>
                        <FileText size={14}/> CSV
                      </a>
                      <a href={c.zip_link || `${API_BASE}/api/export/${c.charger_id}/zip`} className="tbl-btn" target={c.zip_link ? "_blank" : "_self"} download={!c.zip_link}>
                        <Archive size={14}/> ZIP
                      </a>
                      <button className="tbl-btn" onClick={() => { setActiveChargerId(c.charger_id); setCurrentView('testing'); setSyncToken(c.sync_token); }}>
                        Open
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {chargers.length === 0 && (
                <tr><td colSpan="7" style={{textAlign:'center', padding:'30px'}}>No chargers found. Start one on the Home page!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSuperUserView = () => {
    const profileFields = [
      { key: 'profile_id', label: 'Profile ID' },
      { key: 'name', label: 'Name' },
      { key: 'num_modules', label: 'Number of Modules' },
      { key: 'maxKW', label: 'Max Power (kW)' },
      { key: 'maxA', label: 'Max Current (A)' },
      { key: 'dlbMode', label: 'DLB Mode' },
      { key: 'ct_primary_A', label: 'CT Primary (A)' },
      { key: 'dc_shunt_A', label: 'DC Shunt (A)' },
      { key: 'ocpp_model', label: 'OCPP Model' },
      { key: 'ocpp_vendor', label: 'OCPP Vendor' },
      { key: 'protocol', label: 'Protocol' },
      { key: 'num_connectors', label: 'Number of Connectors' },
      { key: 'max_power_limit_kw', label: 'Max Power Limit (kW)' },
      { key: 'max_current_limit_a', label: 'Max Current Limit (A)' },
      { key: 'notes', label: 'Notes' }
    ];

    const blankProfile = {
      profile_id: '', name: '', num_modules: '', maxKW: '', maxA: '', dlbMode: '',
      ct_primary_A: '', dc_shunt_A: '', ocpp_model: '', ocpp_vendor: '', protocol: '',
      num_connectors: '', max_power_limit_kw: '', max_current_limit_a: '', notes: '', example: false
    };

    const currentProfile = editingProfile || blankProfile;

    const saveProfile = () => {
      const method = profiles.some(p => p.profile_id === currentProfile.profile_id) ? 'PUT' : 'POST';
      const url = method === 'PUT' ? `${API_BASE}/api/profiles/${currentProfile.profile_id}` : `${API_BASE}/api/profiles`;
      fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentProfile)
      })
      .then(r => {
        if (!r.ok) throw new Error('Please connect to internet (Cloud Sync Failed)');
        return r.json();
      })
      .then(() => {
        fetch(`${API_BASE}/api/config`).then(r => r.json()).then(data => {
          setProfiles(data.profiles);
          setEditingProfile(null);
          showToast('Profile saved successfully');
        });
      })
      .catch(err => showToast(err.message, 'error'));
    };

    const deleteProfile = (id) => {
      if (!confirm(`Delete profile ${id}?`)) return;
      fetch(`${API_BASE}/api/profiles/${id}`, { method: 'DELETE' })
      .then(r => {
        if (!r.ok) throw new Error('Please connect to internet (Cloud Sync Failed)');
      })
      .then(() => fetch(`${API_BASE}/api/config`).then(r => r.json()).then(data => setProfiles(data.profiles)))
      .catch(err => showToast(err.message, 'error'));
    };

    const saveConfig = () => {
      let cfg = configs[editingConfigProfile] || {};
      if (typeof cfg === 'string') {
        try { cfg = JSON.parse(cfg); } catch (err) { setCustomAlert({ title: 'Invalid JSON', message: 'The configuration format is incorrect: ' + err.message, type: 'error' }); return; }
      }
      fetch(`${API_BASE}/api/configs/${editingConfigProfile}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg)
      })
      .then(r => {
        if (!r.ok) throw new Error('Please connect to internet (Cloud Sync Failed)');
        return fetch(`${API_BASE}/api/config`);
      })
      .then(r => r.json())
      .then(data => {
        setConfigs(data.configs || {});
        showToast(`Configuration for ${editingConfigProfile} saved successfully!`);
      })
      .catch(err => showToast(err.message, 'error'));
    };

    const saveReleases = () => {
      const rel = targetReleases[editingReleaseProfile] || {};
      fetch(`${API_BASE}/api/target-releases/${editingReleaseProfile}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rel)
      })
      .then(r => {
        if (!r.ok) throw new Error('Please connect to internet (Cloud Sync Failed)');
        return fetch(`${API_BASE}/api/config`);
      })
      .then(r => r.json())
      .then(data => {
        setTargetReleases(data.target_releases || {});
        showToast(`Target releases for ${editingReleaseProfile} saved successfully!`);
      })
      .catch(err => showToast(err.message, 'error'));
    };

    const pullFromCloud = () => {
      showToast('Pulling from cloud...', 'info');
      fetch(`${API_BASE}/api/sync/pull`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to pull from cloud');
        return r.json();
      })
      .then(data => {
        showToast('Successfully synced with Cloud!');
        fetch(`${API_BASE}/api/config`).then(r => r.json()).then(cfgData => {
          setProfiles(cfgData.profiles);
          setConfigs(cfgData.configs || {});
          setTargetReleases(cfgData.target_releases || {});
        });
        fetch(`${API_BASE}/api/users`).then(r => r.json()).then(u => setUsersList(u));
      })
      .catch(err => showToast(err.message, 'error'));
    };

    const updateReleaseOptionsUnified = (optionsArray) => {
      setTargetReleases(prev => ({
        ...prev,
        [editingReleaseProfile]: {
          ...prev[editingReleaseProfile],
          sw006: { ...prev[editingReleaseProfile]?.sw006, options: optionsArray },
          sw007: { ...prev[editingReleaseProfile]?.sw007, options: optionsArray },
          swAB:  { ...prev[editingReleaseProfile]?.swAB,  options: optionsArray }
        }
      }));
    };

    const updateReleaseDefaultUnified = (value) => {
      setTargetReleases(prev => ({
        ...prev,
        [editingReleaseProfile]: {
          ...prev[editingReleaseProfile],
          sw006: { ...prev[editingReleaseProfile]?.sw006, default: value },
          sw007: { ...prev[editingReleaseProfile]?.sw007, default: value },
          swAB:  { ...prev[editingReleaseProfile]?.swAB,  default: value }
        }
      }));
    };

    const updateReleaseOptions = (check, optionsArray) => {
      setTargetReleases(prev => ({
        ...prev,
        [editingReleaseProfile]: {
          ...prev[editingReleaseProfile],
          [check]: { ...prev[editingReleaseProfile]?.[check], options: optionsArray }
        }
      }));
    };

    const updateReleaseDefault = (check, value) => {
      setTargetReleases(prev => ({
        ...prev,
        [editingReleaseProfile]: {
          ...prev[editingReleaseProfile],
          [check]: { ...prev[editingReleaseProfile]?.[check], default: value }
        }
      }));
    };

    return (
      <div className="results-view superuser-view">
        <header className="rv-header">
          <button className="iconbtn" onClick={() => setCurrentView('home')}>
            <Home size={16} /> <span className="icon-text">Back to Home</span>
          </button>
          <h2>Super User Configuration</h2>
          <div className="spacer"></div>
          <button className="abtn primary" style={{marginRight: '15px'}} onClick={pullFromCloud}>
            <Download size={16} /> Pull from Cloud
          </button>
          {renderUserBadge()}
        </header>

        <div className="su-tabs">
          <button className={`su-tab ${suTab === 'profiles' ? 'on' : ''}`} onClick={() => setSuTab('profiles')}>Charger Templates</button>
          <button className={`su-tab ${suTab === 'configs' ? 'on' : ''}`} onClick={() => setSuTab('configs')}>Default Configs</button>
          <button className={`su-tab ${suTab === 'releases' ? 'on' : ''}`} onClick={() => setSuTab('releases')}>Target Releases</button>
        </div>

        {suTab === 'profiles' && (
          <div className="su-section">
            <div className="su-toolbar">
              <button className="abtn primary" onClick={() => setEditingProfile({...blankProfile})}><Plus size={16}/> Add Profile</button>
            </div>

            {editingProfile && (
              <div className="su-form card">
                <h3>{profiles.some(p => p.profile_id === currentProfile.profile_id) ? 'Edit Profile' : 'New Profile'}</h3>
                <div className="su-grid">
                  {profileFields.map(f => (
                    <div key={f.key} className="su-field">
                      <label>{f.label}</label>
                      <input type="text" value={currentProfile[f.key] || ''}
                        onChange={e => setEditingProfile({...currentProfile, [f.key]: e.target.value})} />
                    </div>
                  ))}
                  <div className="su-field">
                    <label>Example</label>
                    <select value={currentProfile.example ? 'true' : 'false'}
                      onChange={e => setEditingProfile({...currentProfile, example: e.target.value === 'true'})}>
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                </div>
                <div className="su-actions">
                  <button className="abtn primary" onClick={saveProfile}><Save size={16}/> Save Profile</button>
                  <button className="abtn" onClick={() => setEditingProfile(null)}>Cancel</button>
                </div>
              </div>
            )}

            <div className="table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Profile ID</th>
                    <th>Name</th>
                    <th>kW</th>
                    <th>A</th>
                    <th>Modules</th>
                    <th>DLB Mode</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map(p => (
                    <tr key={p.profile_id}>
                      <td><b>{p.profile_id}</b></td>
                      <td>{p.name}</td>
                      <td>{p.maxKW}</td>
                      <td>{p.maxA}</td>
                      <td>{p.num_modules}</td>
                      <td>{p.dlbMode}</td>
                      <td>
                        <div className="t-actions">
                          <button className="tbl-btn" onClick={() => setEditingProfile({...p})}><Edit size={14}/> Edit</button>
                          <button className="tbl-btn" onClick={() => deleteProfile(p.profile_id)} style={{color:'var(--red)'}}><Trash2 size={14}/> Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {suTab === 'configs' && (
          <div className="su-section">
            <div className="su-field">
              <label>Select Charger Type</label>
              <select value={editingConfigProfile} onChange={e => { setEditingConfigProfile(e.target.value); setSuConfigTab('secc_seccle'); }}>
                <option value="">-- Select Profile --</option>
                {profiles.map(p => <option key={p.profile_id} value={p.profile_id}>{p.name}</option>)}
              </select>
            </div>

            {editingConfigProfile && (
              <div className="su-form card">
                <h3>Default Configs for {editingConfigProfile}</h3>
                <div className="su-config-tabs">
                  {[{id: 'secc_seccle', label: 'SECC & SECCLE'}, {id: 'ocpp', label: 'OCPP'}, {id: 'router', label: 'ROUTER'}].map(tab => (
                    <button key={tab.id} className={`su-config-tab ${suConfigTab === tab.id ? 'on' : ''}`}
                      onClick={() => setSuConfigTab(tab.id)}>
                      {tab.label}
                    </button>
                  ))}
                </div>
                {suConfigTab === 'router' ? (
                  <div className="su-field" style={{ textAlign: 'center', padding: '20px' }}>
                    <p style={{ marginBottom: '15px', color: 'var(--text2)' }}>
                      Upload the complete UCI configuration text file for the router.
                    </p>
                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                      <input 
                        type="file" 
                        accept=".txt,.tar.gz,.tar" 
                        id="router-upload" 
                        style={{ display: 'none' }} 
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const formData = new FormData();
                          formData.append('file', file);
                          fetch(`${API_BASE}/api/configs/router`, { method: 'POST', body: formData })
                            .then(res => res.json())
                            .then(data => {
                              if (data.status === 'success') {
                                showToast('Router config uploaded successfully!');
                                alert(`SUCCESS: The configuration file "${file.name}" has been uploaded and saved!`);
                              }
                            })
                            .catch(err => {
                                showToast('Failed to upload router config', 'error');
                                alert('ERROR: Failed to upload configuration file.');
                            })
                            .finally(() => {
                                e.target.value = null; // Clear input so same file can be uploaded again
                            });
                        }} 
                      />
                      <button className="abtn outline" onClick={() => document.getElementById('router-upload').click()}>
                        <Upload size={16} /> Upload Router Config
                      </button>
                      <button className="abtn primary" onClick={() => window.open(`${API_BASE}/api/configs/router`, '_blank')}>
                        <Download size={16} /> Download Current Config
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="su-field">
                      <label>{suConfigTab === 'secc_seccle' ? 'SECC & SECCLE' : suConfigTab.toUpperCase()} Config JSON</label>
                      <textarea
                        value={(() => {
                          const val = suConfigTab === 'secc_seccle' ? configs[editingConfigProfile]?.secc : configs[editingConfigProfile]?.[suConfigTab];
                          return typeof val === 'string' ? val : JSON.stringify(val || {}, null, 2);
                        })()}
                        onChange={e => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            setConfigs(prev => {
                              const next = { ...prev };
                              next[editingConfigProfile] = { ...next[editingConfigProfile] };
                              if (suConfigTab === 'secc_seccle') {
                                next[editingConfigProfile].secc = parsed;
                                next[editingConfigProfile].seccle = parsed;
                              } else {
                                next[editingConfigProfile][suConfigTab] = parsed;
                              }
                              return next;
                            });
                          } catch (err) {
                            setConfigs(prev => {
                              const next = { ...prev };
                              next[editingConfigProfile] = { ...next[editingConfigProfile] };
                              if (suConfigTab === 'secc_seccle') {
                                next[editingConfigProfile].secc = e.target.value;
                                next[editingConfigProfile].seccle = e.target.value;
                              } else {
                                next[editingConfigProfile][suConfigTab] = e.target.value;
                              }
                              return next;
                            });
                          }
                        }}
                        rows={20}
                        style={{ fontFamily: 'var(--mono)', fontSize: '12px' }}
                      />
                    </div>
                    <div className="su-actions">
                      <button className="abtn primary" onClick={() => {
                        const section = suConfigTab === 'secc_seccle' ? configs[editingConfigProfile]?.secc : configs[editingConfigProfile]?.[suConfigTab];
                        if (typeof section === 'string') {
                          try { JSON.parse(section); } catch (err) { showToast('Invalid JSON: ' + err.message, 'error'); return; }
                        }
                        saveConfig();
                      }}><Save size={16}/> Save Config</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}


        {suTab === 'releases' && (
          <div className="su-section">
            <div className="su-field">
              <label>Select Charger Type</label>
              <select value={editingReleaseProfile} onChange={e => setEditingReleaseProfile(e.target.value)}>
                <option value="">-- Select Profile --</option>
                {profiles.map(p => <option key={p.profile_id} value={p.profile_id}>{p.name}</option>)}
              </select>
            </div>

            {editingReleaseProfile && (
              <div className="su-form card">
                <h3>Target Releases for {editingReleaseProfile}</h3>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                  <button className={`abtn ${unifiedReleases ? 'primary' : ''}`} onClick={() => setUnifiedReleases(!unifiedReleases)}>
                    {unifiedReleases ? 'Unified Target Selection (ON)' : 'Unified Target Selection (OFF)'}
                  </button>
                </div>

                <div className="su-release-block">
                  <h4>Available Firmwares Pool</h4>
                  <div className="su-field">
                    <label>Add to Global Release Pool</label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input type="text" id="newReleaseInput" placeholder="Enter new version (e.g. v2.4.1)" />
                      <button className="abtn" style={{ background: 'var(--blue)', color: '#000', border: 'none' }} onClick={() => {
                        const inputEl = document.getElementById('newReleaseInput');
                        const val = inputEl.value.trim();
                        if (val) {
                          const currentOptions = targetReleases[editingReleaseProfile]?.sw006?.options || [];
                          if (!currentOptions.includes(val)) {
                            updateReleaseOptionsUnified([...currentOptions, val]);
                          }
                          inputEl.value = '';
                        }
                      }}>Add Release</button>
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                      {(targetReleases[editingReleaseProfile]?.sw006?.options || []).map(opt => (
                        <div key={opt} style={{ background: 'var(--surface)', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{opt}</span>
                        </div>
                      ))}
                      {(targetReleases[editingReleaseProfile]?.sw006?.options || []).length === 0 && (
                        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>No releases added yet.</span>
                      )}
                    </div>
                  </div>
                </div>

                {unifiedReleases ? (
                  <div className="su-release-block" style={{ marginTop: '16px' }}>
                    <h4>Set Default Targets</h4>
                    <div className="su-field">
                      <label>SECC, SECCLE & Application Board AB Target</label>
                      <select 
                        value={targetReleases[editingReleaseProfile]?.sw006?.default || ''}
                        onChange={e => updateReleaseDefaultUnified(e.target.value)}
                      >
                        <option value="">-- Select Default Release --</option>
                        {(targetReleases[editingReleaseProfile]?.sw006?.options || []).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="su-release-block" style={{ marginTop: '16px' }}>
                    <h4>Set Default Targets</h4>
                    {['sw006', 'sw007', 'swAB'].map(check => {
                      const title = check === 'sw006' ? 'SECC Firmware' : check === 'sw007' ? 'SECCLE Firmware' : 'Application Board AB Firmware';
                      return (
                        <div key={check} className="su-field" style={{ marginBottom: '12px' }}>
                          <label>{title} Target</label>
                          <select 
                            value={targetReleases[editingReleaseProfile]?.[check]?.default || ''}
                            onChange={e => updateReleaseDefault(check, e.target.value)}
                          >
                            <option value="">-- Select Default Release --</option>
                            {(targetReleases[editingReleaseProfile]?.sw006?.options || []).map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="su-actions">
                  <button className="abtn primary" onClick={saveReleases}><Save size={16}/> Save Releases</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTestingView = () => {
    const phaseChecks = checks.filter(c => c.phase === activePhaseKey);
    const totalChecksCount = checks.length;
    const completedChecksCount = Object.keys(results).filter(k => results[k].status).length;
    const passedCount = Object.keys(results).filter(k => results[k].status === 'pass').length;
    const failedCount = Object.keys(results).filter(k => results[k].status === 'fail').length;
    const percentComplete = totalChecksCount > 0 ? (completedChecksCount / totalChecksCount) * 100 : 0;

    const handleSyncImagesToCloud = async () => {
      setSyncingImages(true);
      try {
        const res = await fetch(`${API_BASE}/api/sync-images/${activeChargerId}`, { method: 'POST' });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
          showToast('Images synced to cloud successfully!', 'success');
          setUnsyncedImages(false);
        } else {
          throw new Error(data.detail || data.message || 'Sync failed');
        }
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setSyncingImages(false);
      }
    };

    return (
      <div className="testing-view">
        <header style={{ position: 'relative' }}>
          <div className="hrow">
            <button className="iconbtn" onClick={() => setCurrentView('home')} title="Home">
              <Home size={16} />
            </button>
            <div className="brand" style={{ marginLeft: '10px' }}>
              <b>{activeChargerId}</b> <span className="brand-text">({activeProfileId})</span>
            </div>
            <div className="spacer"></div>
            {unsyncedImages && (
              <button 
                className="abtn primary" 
                onClick={handleSyncImagesToCloud} 
                disabled={syncingImages}
                style={{ background: 'var(--blue)', color: '#000', marginRight: '10px', height: '32px', padding: '0 12px', fontSize: '13px' }}
              >
                {syncingImages ? <div className="spinner" style={{borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000', width: '14px', height: '14px'}}></div> : <Cloud size={14} />}
                <span style={{ marginLeft: '6px' }}>{syncingImages ? 'Syncing...' : 'Sync to Cloud'}</span>
              </button>
            )}
            {renderUserBadge({ marginRight: '10px' })}
            <button className="iconbtn" onClick={() => setQrOpen(!qrOpen)} title="Sync">
              <QrCode size={16} /> <span className="icon-text">Sync</span>
            </button>
            <button className="iconbtn" onClick={() => setMenuOpen(true)}>
              <Menu size={16} /> <span className="icon-text">Menu</span>
            </button>
          </div>

          {qrOpen && (
            <>
              <div style={{position: 'fixed', inset: 0, zIndex: 90}} onClick={() => setQrOpen(false)}></div>
              <div style={{
                position: 'absolute', top: 'calc(100% + 14px)', right: '14px',
                background: 'var(--surface)', backdropFilter: 'blur(20px)',
                padding: '20px', borderRadius: '16px', zIndex: 100, width: '240px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                border: '1px solid var(--line)'
              }}>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '14px', color: 'var(--blue)' }}>SCAN TO SYNC</div>
                <div style={{ background: '#fff', padding: '12px', borderRadius: '12px' }}>
                  {syncToken ? (() => {
                    let baseUrl;
                    if (tunnelUrl) {
                      baseUrl = tunnelUrl;
                    } else {
                      baseUrl = (localIp && localIp.startsWith('http')) 
                        ? localIp 
                        : `http://${localIp || HOST}:${isDevServer ? '5173' : '8000'}`;
                    }
                    const qrUrl = `${baseUrl}/?token=${syncToken}&user=${encodeURIComponent(localStorage.getItem('quench_user') || 'Unknown')}`;
                    return <QRCodeSVG value={qrUrl} size={160} />;
                  })() : (
                    <div style={{width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000'}}>No Token</div>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '16px', wordBreak: 'break-all', textAlign: 'center' }}>
                  {tunnelUrl ? tunnelUrl : `http://${localIp || HOST}:5173`}/?token={syncToken}&user={encodeURIComponent(localStorage.getItem('quench_user') || 'Unknown')}
                </div>
              </div>
            </>
          )}

          <div className="prog"><i style={{ width: `${percentComplete}%` }}></i></div>
          <div className="pmeta">
            <span>{completedChecksCount} / {totalChecksCount} complete</span>
            <span>{passedCount} pass · {failedCount} fail</span>
          </div>
        </header>

        {routerConfiguring && (
          <div style={{ padding: '15px 20px', background: 'var(--blue)', color: '#fff', fontSize: '13px', fontWeight: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: '#fff' }}></div>
              <span>{routerStatus || 'Configuring Router...'}</span>
            </div>
          </div>
        )}

        <div className="testing-layout">
          <div className="sidebar-nav">
            <div className="tabs">
              {phases.map(ph => {
                const phItems = checks.filter(c => c.phase === ph.key);
                const phDone = phItems.filter(c => results[c.id]?.status).length;
                const isSelected = ph.key === activePhaseKey;
                const isDone = phDone === phItems.length && phItems.length > 0;
                return (
                  <button key={ph.key} className={`tab ${isSelected ? 'on' : ''} ${isDone ? 'done' : ''}`} onClick={() => setActivePhaseKey(ph.key)}>
                    <span className="pn">{ph.short}</span>
                    <span className="pc">{phDone}/{phItems.length}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="wrap">
            {activePhaseKey === 'software' && (
              <div className="software-actions" style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', background: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)' }}>
                <button className="abtn primary" disabled={routerConfiguring} onClick={() => setRouterConfirmOpen(true)}>
                  <Settings size={16} /> Configure Router
                </button>
                                <button className="abtn primary" disabled={seccConfiguring} onClick={() => {
                  setSeccConfiguring(true);
                  fetch(`${API_BASE}/api/configure/secc`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ charger_id: activeChargerId })
                  })
                  .then(r => r.json())
                                    .then(data => {
                    setSeccConfiguring(false);
                    setCustomAlert({ title: data.success ? 'SECC Configured' : 'Configuration Failed', message: data.message, type: data.success ? 'success' : 'error', rebootTarget: data.success ? 'secc' : null });
                  })
                                    .catch(err => {
                    setSeccConfiguring(false);
                    setCustomAlert({ title: 'Connection Error', message: 'Could not reach the backend to configure SECC.', type: 'error' });
                  });
                }}>
                  {seccConfiguring ? <div className="spinner" style={{borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000'}}></div> : <Settings size={16} />}
                  {seccConfiguring ? ' Configuring...' : ' Configure SECC'}
                </button>
                                <button className="abtn primary" disabled={seccleConfiguring} onClick={() => {
                  setSeccleConfiguring(true);
                  fetch(`${API_BASE}/api/configure/seccle`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ charger_id: activeChargerId })
                  })
                  .then(r => r.json())
                                    .then(data => {
                    setSeccleConfiguring(false);
                    setCustomAlert({ title: data.success ? 'SECCLE Configured' : 'Configuration Failed', message: data.message, type: data.success ? 'success' : 'error', rebootTarget: data.success ? 'seccle' : null });
                  })
                                    .catch(err => {
                    setSeccleConfiguring(false);
                    setCustomAlert({ title: 'Connection Error', message: 'Could not reach the backend to configure SECCLE.', type: 'error' });
                  });
                }}>
                  {seccleConfiguring ? <div className="spinner" style={{borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000'}}></div> : <Settings size={16} />}
                  {seccleConfiguring ? ' Configuring...' : ' Configure SECCLE'}
                </button>
                                <button className="abtn primary" disabled={abConfiguring} onClick={() => {
                  setAbConfiguring(true);
                  fetch(`${API_BASE}/api/configure/ab`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ charger_id: activeChargerId })
                  })
                  .then(r => r.json())
                  .then(data => {
                    setAbConfiguring(false);
                    setCustomAlert({ title: data.success ? 'OCPP Successfully Configured' : 'Configuration Failed', message: data.message, type: data.success ? 'success' : 'error', rebootTarget: data.success ? 'ab' : null });
                  })
                  .catch(err => {
                    setAbConfiguring(false);
                    setCustomAlert({ title: 'Connection Error', message: 'Could not reach the backend to configure AB.', type: 'error' });
                  });
                }}>
                  {abConfiguring ? <div className="spinner" style={{borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000'}}></div> : <Settings size={16} />}
                  {abConfiguring ? ' Configuring...' : ' Configure Application Board (AB)'}
                </button>
              </div>
            )}

          {(() => {
            let lastSection = null;
            return phaseChecks.map(c => {
              const showSec = c.section !== lastSection;
              if (showSec) lastSection = c.section;

              const res = results[c.id] || {};

              let expectedText = parseTemplate(c.exp, c.tmpl);
              if (activeProfileId && configs[activeProfileId]) {
                const secc = configs[activeProfileId]?.secc || {};
                const ccs = secc.ccs || secc;
                const stack = ccs.stack || {};

                if (c.id === 'SW-006') expectedText = `ccs.num_of_modules = ${ccs.num_of_modules || 6}`;
                if (c.id === 'SW-007') expectedText = `ccs.stack.maxKW = ${stack.maxKW || ccs.maxKW || 180}`;
                if (c.id === 'SW-008') expectedText = `ccs.stack.maxA = ${stack.maxA || ccs.maxA || 500}`;
                if (c.id === 'SW-009') expectedText = `ccs.dlbMode = ${ccs.dlbMode || 'quintupleCombo'}`;
              }

              return (
                <React.Fragment key={c.id}>
                  {showSec && <div className="sec">{c.section}</div>}
                  <div className={`card ${res.status || ''}`}>
                    <div className="ctop">
                      <span className="tid">{c.id}</span>
                      <span className={`badge b-${c.cls.substring(0, 3)}`}>{c.cls}</span>
                      {c.review && <span className="rev">review</span>}
                    </div>
                    <p className="title">{c.title}</p>
                    <p className="exp">
                      <span className={`lab ${c.review ? 'w' : ''}`}>{c.review ? 'Verify:' : 'Expected:'}</span>
                      <span className="val">{expectedText}</span>
                    </p>
                    <div className="meta"><span className="chip">{c.iface}</span></div>
                    {c.action && <p className="act"><b>Action:</b> {c.action}</p>}

                    {/* Sample Images (if any) */}
                    {c.imgs && c.imgs.length > 0 && (
                      <div className="thumbs">
                        {c.imgs.map(imgKey => {
                          const imgObj = images[imgKey];
                          if (!imgObj) return null;
                          return (
                            <img key={imgKey} className="thumb" src={imgObj.uri} alt={imgObj.cap} 
                                 onClick={() => setLightbox({ open: true, url: imgObj.uri, cap: imgObj.cap })} />
                          );
                        })}
                      </div>
                    )}
                    {/* Image Upload/View */}
                    {(c.cls === 'manual' || c.cls === 'hybrid') && !['SW-001', 'SW-002', 'SW-003', 'SW-004', 'SW-005', 'SW-006', 'SW-007', 'SW-008', 'SW-009', 'SW-010', 'SW-011', 'SW-012', 'SW-013', 'SW-014', 'SW-015', 'SW-016', 'SW-017', 'SW-018', 'SW-019', 'SW-020', 'SW-021', 'SW-022', 'SW-023'].includes(c.id) && (
                      <div className="photo-actions" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                        {chargerImages[c.id] && chargerImages[c.id].length > 0 && (
                          <div className="uploaded-photos-section" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', width: '100%' }}>
                            <h4 style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                              Captured Photos ({chargerImages[c.id].length})
                            </h4>
                            <div className="thumbs" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', width: '100%' }}>
                              {chargerImages[c.id].map(url => (
                                <div key={url} style={{ position: 'relative', width: '100%' }}>
                                  <img className="thumb" src={`${API_BASE}${url}`} alt="Uploaded" 
                                       onClick={() => setLightbox({ open: true, url: `${API_BASE}${url}`, cap: `Photo for ${c.id}` })} 
                                       style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border)', display: 'block', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                                  <button onClick={(e) => { e.stopPropagation(); setPhotoToDelete(url); }} 
                                          style={{ position: 'absolute', top: '8px', right: '8px', background: 'var(--red)', color: 'white', border: '2px solid white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, boxShadow: '0 4px 6px rgba(0,0,0,0.3)', transition: 'transform 0.2s' }}
                                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <input type="file" accept="image/*" capture="environment" ref={el => fileInputRefs.current[c.id] = el}
                          style={{ display: 'none' }} onChange={(e) => handleFileChange(c.id, e)} />
                        <button className="photo-btn" onClick={() => fileInputRefs.current[c.id]?.click()} disabled={uploading[c.id]}>
                          {uploading[c.id] ? <div className="spinner"></div> : <Camera size={14} />}
                          <span>Add Photo</span>
                        </button>
                      </div>
                    )}

                    <div className="notes-input-wrapper">
                      <textarea className="notes-input" placeholder="Add notes..." value={notesEditing[c.id] !== undefined ? notesEditing[c.id] : res.notes || ''}
                        onChange={(e) => handleNotesChange(c.id, e.target.value)} onBlur={() => handleNotesBlur(c.id)} rows={1} />
                    </div>



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
                    )}
                    {c.id === 'SW-002' && (
                      <div className="photo-actions" style={{ marginTop: '10px', marginBottom: '10px' }}>
                        <button className="abtn primary" style={{ width: '100%', justifyContent: 'center', background: 'var(--blue)', color: '#000' }} 
                          disabled={uploading[c.id]}
                          onClick={() => {
                            setUploading(prev => ({ ...prev, [c.id]: true }));
                            fetch(`${API_BASE}/api/automate/sw-004`, { method: 'POST' })
                              .then(r => r.json())
                              .then(data => {
                                setUploading(prev => ({ ...prev, [c.id]: false }));
                                if (data.success) {
                                  setAutoMessages(prev => ({ ...prev, [c.id]: null }));
                                  handleStatusChange(c.id, 'pass');
                                } else {
                                  setAutoMessages(prev => ({ ...prev, [c.id]: data.message }));
                                  handleStatusChange(c.id, 'fail', { notes: data.message });
                                }
                              })
                              .catch(err => {
                                setUploading(prev => ({ ...prev, [c.id]: false }));
                                setAutoMessages(prev => ({ ...prev, [c.id]: "IP not assigned please re-configure the router" }));
                                handleStatusChange(c.id, 'fail');
                              });
                          }}>
                          {uploading[c.id] ? <div className="spinner" style={{borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000'}}></div> : 'Test Router Connection'}
                        </button>
                      </div>
                    )}

                    {c.id === 'SW-004' && (
                      <div className="photo-actions" style={{ marginTop: '10px', marginBottom: '10px', flexDirection: 'column', gap: '8px' }}>
                        {(() => {
                          const target = targetReleases[activeProfileId]?.sw006?.default;
                          if (!target) {
                            return <div style={{ color: 'var(--red)', fontSize: '13px', fontWeight: '500' }}>Target release not configured by Super User.</div>;
                          }
                          return (
                            <>
                              <div style={{ padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '8px', color: 'var(--ink)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>Target Release:</span>
                                <b>{target}</b>
                              </div>
                              <button className="abtn primary" style={{ width: '100%', justifyContent: 'center', background: 'var(--blue)', color: '#000' }} 
                                disabled={uploading[c.id]}
                                onClick={() => {
                                  setUploading(prev => ({ ...prev, [c.id]: true }));
                                  fetch(`${API_BASE}/api/automate/sw-006`, { 
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ target_release: target })
                                  })
                                    .then(r => r.json())
                                    .then(data => {
                                      setUploading(prev => ({ ...prev, [c.id]: false }));
                                      if (data.success) {
                                        setAutoMessages(prev => ({ ...prev, [c.id]: null }));
                                        handleStatusChange(c.id, 'pass');
                                      } else {
                                        setAutoMessages(prev => ({ ...prev, [c.id]: data.message }));
                                  handleStatusChange(c.id, 'fail', { notes: data.message });
                                      }
                                    })
                                    .catch(err => {
                                      setUploading(prev => ({ ...prev, [c.id]: false }));
                                      setAutoMessages(prev => ({ ...prev, [c.id]: 'Connection error' }));
                                      handleStatusChange(c.id, 'fail');
                                    });
                                }}>
                                {uploading[c.id] ? <div className="spinner" style={{borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000'}}></div> : 'Test Controller Release'}
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    )}

                    {c.id === 'SW-005' && (
                      <div className="photo-actions" style={{ marginTop: '10px', marginBottom: '10px', flexDirection: 'column', gap: '8px' }}>
                        {(() => {
                          const target = targetReleases[activeProfileId]?.sw007?.default;
                          if (!target) {
                            return <div style={{ color: 'var(--red)', fontSize: '13px', fontWeight: '500' }}>Target release not configured by Super User.</div>;
                          }
                          return (
                            <>
                              <div style={{ padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '8px', color: 'var(--ink)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>Target Release:</span>
                                <b>{target}</b>
                              </div>
                              <button className="abtn primary" style={{ width: '100%', justifyContent: 'center', background: 'var(--blue)', color: '#000' }} 
                                disabled={uploading[c.id]}
                                onClick={() => {
                                  setUploading(prev => ({ ...prev, [c.id]: true }));
                                  fetch(`${API_BASE}/api/automate/sw-007`, { 
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ target_release: target })
                                  })
                                    .then(r => r.json())
                                    .then(data => {
                                      setUploading(prev => ({ ...prev, [c.id]: false }));
                                      if (data.success) {
                                        setAutoMessages(prev => ({ ...prev, [c.id]: null }));
                                        handleStatusChange(c.id, 'pass');
                                      } else {
                                        setAutoMessages(prev => ({ ...prev, [c.id]: data.message }));
                                  handleStatusChange(c.id, 'fail', { notes: data.message });
                                      }
                                    })
                                    .catch(err => {
                                      setUploading(prev => ({ ...prev, [c.id]: false }));
                                      setAutoMessages(prev => ({ ...prev, [c.id]: 'Connection error' }));
                                      handleStatusChange(c.id, 'fail');
                                    });
                                }}>
                                {uploading[c.id] ? <div className="spinner" style={{borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000'}}></div> : 'Test Controller Release'}
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    )}

                    {c.id === 'SW-010' && (
                      <div className="photo-actions" style={{ marginTop: '10px', marginBottom: '10px', flexDirection: 'column', gap: '8px' }}>
                        {(() => {
                          const target = targetReleases[activeProfileId]?.swAB?.default;
                          if (!target) {
                            return <div style={{ color: 'var(--red)', fontSize: '13px', fontWeight: '500' }}>Target release not configured by Super User.</div>;
                          }
                          return (
                            <>
                              <div style={{ padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '8px', color: 'var(--ink)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>Target Release:</span>
                                <b>{target}</b>
                              </div>
                              <button className="abtn primary" style={{ width: '100%', justifyContent: 'center', background: 'var(--blue)', color: '#000' }} 
                                disabled={uploading[c.id]}
                                onClick={() => {
                                  setUploading(prev => ({ ...prev, [c.id]: true }));
                                  fetch(`${API_BASE}/api/automate/sw-012`, { 
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ target_release: target })
                                  })
                                    .then(r => r.json())
                                    .then(data => {
                                      setUploading(prev => ({ ...prev, [c.id]: false }));
                                      if (data.success) {
                                        setAutoMessages(prev => ({ ...prev, [c.id]: null }));
                                        handleStatusChange(c.id, 'pass');
                                      } else {
                                        setAutoMessages(prev => ({ ...prev, [c.id]: data.message }));
                                  handleStatusChange(c.id, 'fail', { notes: data.message });
                                      }
                                    })
                                    .catch(err => {
                                      setUploading(prev => ({ ...prev, [c.id]: false }));
                                      setAutoMessages(prev => ({ ...prev, [c.id]: 'Connection error' }));
                                      handleStatusChange(c.id, 'fail');
                                    });
                                }}>
                                {uploading[c.id] ? <div className="spinner" style={{borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000'}}></div> : 'Test AB Release'}
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    )}

                    {['SW-006', 'SW-007', 'SW-008', 'SW-009'].includes(c.id) && (
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
                                  handleStatusChange(c.id, 'fail', { notes: data.message });
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
                    )}

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
                                  handleStatusChange(c.id, 'fail', { notes: data.message });
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
                    )}

                    {['SW-001', 'SW-002', 'SW-003', 'SW-004', 'SW-005', 'SW-006', 'SW-007', 'SW-008', 'SW-009', 'SW-010', 'SW-011', 'SW-012', 'SW-013', 'SW-014', 'SW-015', 'SW-016', 'SW-017', 'SW-018', 'SW-019', 'SW-020', 'SW-021', 'SW-022', 'SW-023'].includes(c.id) && res.status === 'fail' && autoMessages[c.id] && (
                      <div style={{ color: 'var(--red)', fontSize: '13px', marginTop: '10px', fontWeight: '500' }}>
                        {autoMessages[c.id]}
                      </div>
                    )}

                    <div className="status" style={(['SW-001', 'SW-002', 'SW-003', 'SW-004', 'SW-005', 'SW-006', 'SW-007', 'SW-008', 'SW-009', 'SW-010', 'SW-011', 'SW-012', 'SW-013', 'SW-014', 'SW-015', 'SW-016', 'SW-017', 'SW-018', 'SW-019', 'SW-020', 'SW-021', 'SW-022', 'SW-023'].includes(c.id)) ? (res.status ? { opacity: 1, pointerEvents: 'none' } : { opacity: 0.3, pointerEvents: 'none' }) : {}}>
                      <button className={`sbtn p ${res.status === 'pass' ? 'on' : ''}`} onClick={() => handleStatusChange(c.id, 'pass')}><CheckCircle size={14} /> Pass</button>
                      <button className={`sbtn f ${res.status === 'fail' ? 'on' : ''}`} onClick={() => handleStatusChange(c.id, 'fail')}><XCircle size={14} /> Fail</button>
                      <button className={`sbtn n ${res.status === 'na' ? 'on' : ''}`} onClick={() => handleStatusChange(c.id, 'na')}><AlertCircle size={14} /> N/A</button>
                    </div>
                  </div>
                </React.Fragment>
              );
            });
          })()}
        </div>
        </div>

        <div className="actionbar">
          <button className="abtn" onClick={handleReset}><RefreshCw size={14} /> <span>Reset</span></button>
          <a href={`${API_BASE}/api/export/${activeChargerId}/csv`} className="abtn" download style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: 'inherit' }}>
            <Download size={14} /> <span>CSV</span>
          </a>
          <button className="abtn primary" onClick={() => {
            const nextIdx = phases.findIndex(ph => ph.key === activePhaseKey) + 1;
            if (nextIdx < phases.length) { setActivePhaseKey(phases[nextIdx].key); window.scrollTo({ top: 0, behavior: 'smooth' }); }
          }}><span>Next Phase</span></button>
        </div>

        {/* Router Config Confirmation Modal */}
        {routerConfirmOpen && (
          <div className="glass-overlay" onClick={() => setRouterConfirmOpen(false)}>
            <div className="glass-modal" onClick={e => e.stopPropagation()}>
              <h3 style={{color: 'var(--blue)'}}><Settings size={20} style={{marginRight: '8px', verticalAlign: 'middle'}}/> Configure Router</h3>
              <p style={{marginBottom: '20px', color: 'var(--text-dim)', lineHeight: '1.5'}}>
                This will reboot the router. Ensure your laptop is connected to the charger switch via ethernet.
                <br/><br/>
                <strong>Do you want to continue?</strong>
              </p>
              <div className="glass-modal-actions">
                <button className="glass-btn-secondary" onClick={() => setRouterConfirmOpen(false)}>Cancel</button>
                <button className="glass-btn-primary" onClick={handleRouterConfigure}>Continue</button>
              </div>
            </div>
          </div>
        )}

                {customAlert && (
          <div className="glass-overlay" onClick={() => setCustomAlert(null)}>
            <div className="glass-modal" onClick={e => e.stopPropagation()}>
              <h3 style={{color: customAlert.type === 'error' ? 'var(--red)' : 'var(--blue)'}}>{customAlert.title}</h3>
              <p style={{marginBottom: '20px', color: 'var(--text-dim)', lineHeight: '1.5'}}>{customAlert.message}</p>
              <div className="glass-modal-actions">
                <button className="glass-btn-secondary" onClick={() => setCustomAlert(null)}>Close</button>
                {customAlert.rebootTarget && (
                  <button className="glass-btn-primary" onClick={() => handleRebootStack(customAlert.rebootTarget)}>
                     {customAlert.rebootTarget === 'ab' ? 'Reboot OCPP' : 'Reboot Stack'}
                  </button>
                )}
                {!customAlert.rebootTarget && (
                  <button className="glass-btn-primary" onClick={() => setCustomAlert(null)}>OK</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Photo Modal */}
        {photoToDelete && (
          <div className="glass-overlay" onClick={() => setPhotoToDelete(null)}>
            <div className="glass-modal" onClick={e => e.stopPropagation()}>
              <h3 style={{color: 'var(--red)'}}>Delete Photo</h3>
              <p style={{marginBottom: '20px', color: 'var(--text-dim)'}}>Are you sure you want to permanently delete this photo? This cannot be undone.</p>
              <div className="glass-modal-actions">
                <button className="glass-btn-secondary" onClick={() => setPhotoToDelete(null)}>Cancel</button>
                <button className="glass-btn-primary" style={{background: 'var(--red)', color: '#fff'}} onClick={confirmDeletePhoto}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Lightbox Modal */}
        {lightbox.open && (
          <div className="overlay" onClick={() => setLightbox({ open: false, url: '', cap: '' })}>
            <div className="lbx" onClick={() => setLightbox({ open: false, url: '', cap: '' })}>&times;</div>
            <img className="lb" src={lightbox.url} alt="" onClick={(e) => e.stopPropagation()} />
            <div className="lbcap">{lightbox.cap}</div>
          </div>
        )}

        {/* Menu Sheet */}
        {menuOpen && (
          <>
            <div className="sd" onClick={() => setMenuOpen(false)}></div>
            <div className="sheet">
              <div className="sheethdr"><h3>Menu</h3><span style={{ flex: 1 }}></span><button className="sheetclose" onClick={() => setMenuOpen(false)}><X size={20} /></button></div>
              <div className="sheetbody">
                <a href={`${API_BASE}/api/export/${activeChargerId}/csv`} download className="fullbtn" style={{ textDecoration: 'none' }}><b>Download CSV</b><span>Export test results</span></a>
                <a href={`${API_BASE}/api/export/${activeChargerId}/zip`} download className="fullbtn" style={{ textDecoration: 'none', marginTop: '10px' }}><b>Download ZIP</b><span>Export all uploaded photos</span></a>
                <button className="fullbtn" onClick={handleReset} style={{ marginTop: '10px' }}><b>Reset Progress</b><span>Clear all data</span></button>
                <button className="fullbtn warning" onClick={() => { localStorage.removeItem('quench_token'); localStorage.removeItem('quench_user'); localStorage.removeItem('quench_role'); window.location.reload(); }} style={{ marginTop: '10px', borderColor: 'var(--red)' }}><b>Logout</b><span>Sign out of session</span></button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const handleLogin = (e) => {
    e.preventDefault();
    fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: loginUsername, password: loginPassword })
    })
    .then(res => {
      if (!res.ok) throw new Error('Invalid credentials');
      return res.json();
    })
    .then(data => {
      localStorage.setItem('quench_token', data.token);
      localStorage.setItem('quench_user', loginUsername);
      const role = data.role || 'operator';
      localStorage.setItem('quench_role', role);
      setUserRole(role);
      setIsAuthenticated(true);
    })
    .catch(err => alert(err.message));
  };

  if (!isAuthenticated) {
    return (
      <div className="home-view" style={{ justifyContent: 'center' }}>
        <div className="hero" style={{ marginBottom: '30px' }}>
          <h1>QUENCH</h1>
          <p>Restricted Commissioning Access</p>
        </div>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '300px', background: 'var(--surface)', padding: '30px', borderRadius: '16px', border: '1px solid var(--line)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <input type="text" placeholder="Username" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', background: '#FFFFFF', color: 'var(--ink)' }} />
          <input type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', background: '#FFFFFF', color: 'var(--ink)' }} />
          <button type="submit" className="abtn primary" style={{ width: '100%', justifyContent: 'center' }}>Login</button>
        </form>
        {toastMessage && (
          <div className={`toast ${toastMessage.type}`}>
            {toastMessage.type === 'success' ? <CheckCircle size={18} color="var(--green)" /> : <AlertCircle size={18} color="var(--red)" />}
            {toastMessage.message}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app">
      {toastMessage && (
        <div className={`toast ${toastMessage.type}`}>
          {toastMessage.type === 'success' ? <CheckCircle size={18} color="var(--green)" /> : <AlertCircle size={18} color="var(--red)" />}
          {toastMessage.message}
        </div>
      )}
      {currentView === 'home' && renderHomeView()}
      {currentView === 'results' && renderResultsView()}
      {currentView === 'testing' && renderTestingView()}
      {currentView === 'superuser' && renderSuperUserView()}
    </div>
  );
}

export default App;
