import React, { useState, useContext } from "react";
import MainContext from "../../providers/MainContext";

const QuintupleCombo = () => {
    const context = useContext(MainContext);
    const themeColor = "#7A96C5";
    const themeColorRgb = "122, 150, 197";

    const [gunA_AcContactor, setGunA_AcContactor] = useState(false);
    const [gunA_DcContactor, setGunA_DcContactor] = useState(false);
    const [gunA_Combos, setGunA_Combos] = useState({});
    const [gunB_AcContactor, setGunB_AcContactor] = useState(false);
    const [gunB_DcContactor, setGunB_DcContactor] = useState(false);
    const [gunB_Combos, setGunB_Combos] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const gunA_ComboList = [{ id: '1a', name: 'Combo 1a' }, { id: '2a', name: 'Combo 2a' }, { id: '3a', name: 'Combo 3a' }, { id: '4a', name: 'Combo 4a' }, { id: '5a', name: 'Combo 5a' }];
    const gunB_ComboList = [{ id: '1b', name: 'Combo 1b' }, { id: '2b', name: 'Combo 2b' }, { id: '3b', name: 'Combo 3b' }, { id: '4b', name: 'Combo 4b' }, { id: '5b', name: 'Combo 5b' }];

    const comboConfigs = {
        '1a': { on: [{ controller: 1, gpio: 47, value: true }], off: [{ controller: 1, gpio: 47, value: false }] },
        '1b': { on: [{ controller: 2, gpio: 47, value: true }], off: [{ controller: 2, gpio: 47, value: false }] },
        '2a': { on: [{ controller: 1, gpio: 504, value: true }], off: [{ controller: 1, gpio: 504, value: false }] },
        '2b': { on: [{ controller: 2, gpio: 504, value: true }], off: [{ controller: 2, gpio: 504, value: false }] },
        '3a': { on: [{ controller: 1, gpio: 45, value: true }], off: [{ controller: 1, gpio: 45, value: false }] },
        '3b': { on: [{ controller: 2, gpio: 45, value: true }], off: [{ controller: 2, gpio: 45, value: false }] },
        '4a': { on: [{ controller: 1, gpio: 506, value: true }], off: [{ controller: 1, gpio: 506, value: false }] },
        '4b': { on: [{ controller: 2, gpio: 506, value: true }], off: [{ controller: 2, gpio: 506, value: false }] },
        '5a': { on: [{ controller: 1, gpio: 507, value: true }], off: [{ controller: 1, gpio: 507, value: false }] },
        '5b': { on: [{ controller: 2, gpio: 507, value: true }], off: [{ controller: 2, gpio: 507, value: false }] },
    };

    const postGpioValue = async (cId, gpio, val) => {
        try {
            const apiUrl = context?.config?.API || "http://10.20.27.50:3001";
            const res = await fetch(`${apiUrl}/controllers/${cId}/api/proxy/iomapper/gpio/${gpio}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(val) });
            return res.ok;
        } catch { return false; }
    };

    const handleGunA_AcContactor = async () => { if (isLoading) return; setIsLoading(true); try { await postGpioValue(1, 44, !gunA_AcContactor); setGunA_AcContactor(!gunA_AcContactor); } finally { setIsLoading(false); } };
    const handleGunA_DcContactor = async () => { if (isLoading) return; setIsLoading(true); try { await postGpioValue(1, 505, !gunA_DcContactor); setGunA_DcContactor(!gunA_DcContactor); } finally { setIsLoading(false); } };
    const handleGunB_AcContactor = async () => { if (isLoading) return; setIsLoading(true); try { await postGpioValue(2, 44, !gunB_AcContactor); setGunB_AcContactor(!gunB_AcContactor); } finally { setIsLoading(false); } };
    const handleGunB_DcContactor = async () => { if (isLoading) return; setIsLoading(true); try { await postGpioValue(2, 505, !gunB_DcContactor); setGunB_DcContactor(!gunB_DcContactor); } finally { setIsLoading(false); } };

    const handleComboToggle = async (comboId, isGunA) => {
        if (isLoading) return;
        const cur = isGunA ? gunA_Combos[comboId] : gunB_Combos[comboId];
        const eps = cur ? comboConfigs[comboId].off : comboConfigs[comboId].on;
        setIsLoading(true);
        try { for (const ep of eps) await postGpioValue(ep.controller, ep.gpio, ep.value); if (isGunA) setGunA_Combos(p => ({ ...p, [comboId]: !cur })); else setGunB_Combos(p => ({ ...p, [comboId]: !cur })); } finally { setIsLoading(false); }
    };

    const tc = themeColor, rgb = themeColorRgb;
    const s = {
        ctr: { padding: "1rem 2rem", fontFamily: "'Segoe UI', sans-serif", backgroundColor: "#f8fafc", minHeight: "calc(100vh - 80px)", maxHeight: "calc(100vh - 80px)", overflowY: "auto" },
        fm: { textAlign: "center", color: "#dc2626", fontSize: "1.2rem", fontWeight: "600", padding: "0.75rem", marginBottom: "1rem", background: "linear-gradient(135deg, #fef2f2, #fee2e2)", borderRadius: "8px", border: "2px solid #fecaca", animation: "flash 2s infinite" },
        hdr: { display: "flex", justifyContent: "flex-end", marginBottom: "1rem" },
        ml: { fontSize: "1.1rem", fontWeight: "600", color: tc, background: `linear-gradient(135deg, rgba(${rgb}, 0.1), rgba(${rgb}, 0.2))`, padding: "0.5rem 1.5rem", borderRadius: "20px", border: `2px solid ${tc}` },
        gc: { display: "flex", gap: "1.5rem", height: "calc(100vh - 200px)" },
        gp: { flex: 1, background: "#fff", border: `2px solid ${tc}`, display: "flex", flexDirection: "column", overflow: "hidden" },
        gh: { fontSize: "1.3rem", fontWeight: "700", color: "#fff", textAlign: "center", padding: "0.75rem", background: `linear-gradient(135deg, ${tc}, #5a7ab5)`, borderBottom: `2px solid ${tc}` },
        tbc: { flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", borderBottom: `2px solid ${tc}` },
        sh: { fontSize: "0.95rem", fontWeight: "700", color: "#fff", textTransform: "uppercase", letterSpacing: "1px", padding: "0.6rem 1rem", background: `rgba(${rgb}, 0.7)`, borderBottom: `2px solid ${tc}` },
        tr: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", borderBottom: `1px solid ${tc}`, backgroundColor: "#fff" },
        tra: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", borderBottom: `1px solid ${tc}`, backgroundColor: "#f8fafc" },
        tl: { fontSize: "1rem", fontWeight: "500", color: "#334155" },
        tw: { display: "flex", alignItems: "center", gap: "8px" },
        ts: { fontSize: "0.85rem", fontWeight: "600", minWidth: "30px" },
        tb: { width: "52px", height: "28px", borderRadius: "14px", border: "none", cursor: "pointer", position: "relative" },
        tcir: { width: "22px", height: "22px", borderRadius: "50%", backgroundColor: "#fff", position: "absolute", top: "3px", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" },
    };

    const gts = (a) => ({ ...s.tb, backgroundColor: a ? tc : "#cbd5e1" });
    const gtcs = (a) => ({ ...s.tcir, left: a ? "27px" : "3px" });
    const gss = (a, t) => ({ ...s.ts, color: t === "on" ? (a ? tc : "#94a3b8") : (!a ? "#64748b" : "#94a3b8") });

    const rT = (l, a, h, alt) => (
        <div style={alt ? s.tra : s.tr}><span style={s.tl}>{l}</span><div style={s.tw}><span style={gss(a, "off")}>OFF</span><button style={gts(a)} onClick={h} disabled={isLoading}><span style={gtcs(a)}></span></button><span style={gss(a, "on")}>ON</span></div></div>
    );

    return (
        <div style={s.ctr}>
            <style>{`@keyframes flash { 0%, 50%, 100% { opacity: 1; } 25%, 75% { opacity: 0.3; } }`}</style>
            <div style={s.fm}>To exit maintenance mode provide physical reset to the system</div>
            <div style={s.hdr}><span style={s.ml}>Selected Mode: Quintuple Combo</span></div>
            <div style={s.gc}>
                <div style={s.gp}><div style={s.gh}>GUN A</div><div style={s.tbc}><div style={s.sh}>CONTACTORS</div>{rT("AC Contactor", gunA_AcContactor, handleGunA_AcContactor, false)}{rT("DC Contactor", gunA_DcContactor, handleGunA_DcContactor, true)}<div style={s.sh}>COMBOS</div>{gunA_ComboList.map((c, i) => rT(c.name, gunA_Combos[c.id], () => handleComboToggle(c.id, true), i % 2 === 1))}</div></div>
                <div style={s.gp}><div style={s.gh}>GUN B</div><div style={s.tbc}><div style={s.sh}>CONTACTORS</div>{rT("AC Contactor", gunB_AcContactor, handleGunB_AcContactor, false)}{rT("DC Contactor", gunB_DcContactor, handleGunB_DcContactor, true)}<div style={s.sh}>COMBOS</div>{gunB_ComboList.map((c, i) => rT(c.name, gunB_Combos[c.id], () => handleComboToggle(c.id, false), i % 2 === 1))}</div></div>
            </div>
        </div>
    );
};

export default QuintupleCombo;
