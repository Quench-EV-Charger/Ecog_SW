import React, { useState } from "react";
import { useSelector } from "react-redux";

const DualCombo = () => {
    const { config } = useSelector((state) => state.charging);
    const themeColor = "#7A96C5";
    const themeColorRgb = "122, 150, 197";

    const [gunA_AcContactor, setGunA_AcContactor] = useState(false);
    const [gunA_DcContactor, setGunA_DcContactor] = useState(false);
    const [gunA_Combos, setGunA_Combos] = useState({});
    const [gunB_AcContactor, setGunB_AcContactor] = useState(false);
    const [gunB_DcContactor, setGunB_DcContactor] = useState(false);
    const [gunB_Combos, setGunB_Combos] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const gunA_ComboList = [{ id: '1a', name: 'Combo 1a' }, { id: '2a', name: 'Combo 2a' }];
    const gunB_ComboList = [{ id: '1b', name: 'Combo 1b' }, { id: '2b', name: 'Combo 2b' }];

    const comboConfigs = {
        '1a': { on: [{ controller: 1, gpio: 47, value: true }], off: [{ controller: 1, gpio: 47, value: false }] },
        '1b': { on: [{ controller: 2, gpio: 47, value: true }], off: [{ controller: 2, gpio: 47, value: false }] },
        '2a': { on: [{ controller: 1, gpio: 504, value: true }], off: [{ controller: 1, gpio: 504, value: false }] },
        '2b': { on: [{ controller: 2, gpio: 504, value: true }], off: [{ controller: 2, gpio: 504, value: false }] },
    };

    const postGpioValue = async (controllerId, gpioPin, value) => {
        try {
            const apiUrl = config?.API || "http://10.20.27.50:3001";
            const response = await fetch(`${apiUrl}/controllers/${controllerId}/api/proxy/iomapper/gpio/${gpioPin}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value)
            });
            return response.ok;
        } catch (err) { console.error(err); return false; }
    };

    const handleGunA_AcContactor = async () => { if (isLoading) return; setIsLoading(true); try { await postGpioValue(1, 44, !gunA_AcContactor); setGunA_AcContactor(!gunA_AcContactor); } finally { setIsLoading(false); } };
    const handleGunA_DcContactor = async () => { if (isLoading) return; setIsLoading(true); try { await postGpioValue(1, 505, !gunA_DcContactor); setGunA_DcContactor(!gunA_DcContactor); } finally { setIsLoading(false); } };
    const handleGunB_AcContactor = async () => { if (isLoading) return; setIsLoading(true); try { await postGpioValue(2, 44, !gunB_AcContactor); setGunB_AcContactor(!gunB_AcContactor); } finally { setIsLoading(false); } };
    const handleGunB_DcContactor = async () => { if (isLoading) return; setIsLoading(true); try { await postGpioValue(2, 505, !gunB_DcContactor); setGunB_DcContactor(!gunB_DcContactor); } finally { setIsLoading(false); } };

    const handleComboToggle = async (comboId, isGunA) => {
        if (isLoading) return;
        const currentState = isGunA ? gunA_Combos[comboId] : gunB_Combos[comboId];
        const endpoints = currentState ? comboConfigs[comboId].off : comboConfigs[comboId].on;
        setIsLoading(true);
        try {
            for (const ep of endpoints) await postGpioValue(ep.controller, ep.gpio, ep.value);
            if (isGunA) setGunA_Combos(prev => ({ ...prev, [comboId]: !currentState }));
            else setGunB_Combos(prev => ({ ...prev, [comboId]: !currentState }));
        } finally { setIsLoading(false); }
    };

    const styles = {
        container: { padding: "1rem 2rem", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: "#1a1a2e", minHeight: "calc(100vh - 80px)", maxHeight: "calc(100vh - 80px)", overflowY: "auto" },
        flashMessage: { textAlign: "center", color: "#ff6b6b", fontSize: "1.2rem", fontWeight: "600", padding: "0.75rem", marginBottom: "1rem", background: "linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(220, 38, 38, 0.3) 100%)", borderRadius: "8px", border: "2px solid rgba(220, 38, 38, 0.5)", animation: "flash 2s infinite" },
        header: { display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "1rem" },
        modeLabel: { fontSize: "1.1rem", fontWeight: "600", color: themeColor, background: `linear-gradient(135deg, rgba(${themeColorRgb}, 0.2) 0%, rgba(${themeColorRgb}, 0.3) 100%)`, padding: "0.5rem 1.5rem", borderRadius: "20px", border: `2px solid ${themeColor}` },
        gunContainer: { display: "flex", gap: "1.5rem", height: "calc(100vh - 200px)" },
        gunPanel: { flex: 1, background: "#16213e", border: `2px solid ${themeColor}`, display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: "8px" },
        gunHeader: { fontSize: "1.3rem", fontWeight: "700", color: "#ffffff", textAlign: "center", padding: "0.75rem", background: `linear-gradient(135deg, ${themeColor} 0%, #5a7ab5 100%)`, borderBottom: `2px solid ${themeColor}` },
        tableContainer: { flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", borderBottom: `2px solid ${themeColor}` },
        sectionHeader: { fontSize: "0.95rem", fontWeight: "700", color: "#ffffff", textTransform: "uppercase", letterSpacing: "1px", padding: "0.6rem 1rem", background: `rgba(${themeColorRgb}, 0.5)`, borderBottom: `2px solid ${themeColor}` },
        tableRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", borderBottom: `1px solid rgba(${themeColorRgb}, 0.3)`, backgroundColor: "#16213e" },
        tableRowAlt: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", borderBottom: `1px solid rgba(${themeColorRgb}, 0.3)`, backgroundColor: "#1a1a2e" },
        toggleLabel: { fontSize: "1rem", fontWeight: "500", color: "#e0e0e0" },
        toggleWrapper: { display: "flex", alignItems: "center", gap: "8px" },
        toggleState: { fontSize: "0.85rem", fontWeight: "600", minWidth: "30px" },
        toggleButton: { width: "52px", height: "28px", borderRadius: "14px", border: "none", cursor: "pointer", position: "relative" },
        toggleCircle: { width: "22px", height: "22px", borderRadius: "50%", backgroundColor: "#ffffff", position: "absolute", top: "3px", boxShadow: "0 2px 4px rgba(0,0,0,0.4)" },
    };

    const getToggleStyle = (isActive) => ({ ...styles.toggleButton, backgroundColor: isActive ? themeColor : "#4a5568" });
    const getToggleCircleStyle = (isActive) => ({ ...styles.toggleCircle, left: isActive ? "27px" : "3px" });
    const getStateStyle = (isActive, type) => ({ ...styles.toggleState, color: type === "on" ? (isActive ? themeColor : "#718096") : (!isActive ? "#a0aec0" : "#718096") });

    const renderToggle = (label, isActive, onToggle, isAlt) => (
        <div style={isAlt ? styles.tableRowAlt : styles.tableRow}>
            <span style={styles.toggleLabel}>{label}</span>
            <div style={styles.toggleWrapper}>
                <span style={getStateStyle(isActive, "off")}>OFF</span>
                <button style={getToggleStyle(isActive)} onClick={onToggle} disabled={isLoading}><span style={getToggleCircleStyle(isActive)}></span></button>
                <span style={getStateStyle(isActive, "on")}>ON</span>
            </div>
        </div>
    );

    return (
        <div style={styles.container}>
            <style>{`@keyframes flash { 0%, 50%, 100% { opacity: 1; } 25%, 75% { opacity: 0.3; } }`}</style>
            <div style={styles.flashMessage}>To exit maintenance mode provide physical reset to the system</div>
            <div style={styles.header}><span style={styles.modeLabel}>Selected Mode: Dual Combo</span></div>
            <div style={styles.gunContainer}>
                <div style={styles.gunPanel}>
                    <div style={styles.gunHeader}>GUN A</div>
                    <div style={styles.tableContainer}>
                        <div style={styles.sectionHeader}>CONTACTORS</div>
                        {renderToggle("AC Contactor", gunA_AcContactor, handleGunA_AcContactor, false)}
                        {renderToggle("DC Contactor", gunA_DcContactor, handleGunA_DcContactor, true)}
                        <div style={styles.sectionHeader}>COMBOS</div>
                        {gunA_ComboList.map((combo, idx) => renderToggle(combo.name, gunA_Combos[combo.id], () => handleComboToggle(combo.id, true), idx % 2 === 1))}
                    </div>
                </div>
                <div style={styles.gunPanel}>
                    <div style={styles.gunHeader}>GUN B</div>
                    <div style={styles.tableContainer}>
                        <div style={styles.sectionHeader}>CONTACTORS</div>
                        {renderToggle("AC Contactor", gunB_AcContactor, handleGunB_AcContactor, false)}
                        {renderToggle("DC Contactor", gunB_DcContactor, handleGunB_DcContactor, true)}
                        <div style={styles.sectionHeader}>COMBOS</div>
                        {gunB_ComboList.map((combo, idx) => renderToggle(combo.name, gunB_Combos[combo.id], () => handleComboToggle(combo.id, false), idx % 2 === 1))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DualCombo;
