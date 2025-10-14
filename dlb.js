// Configuration

// import fetch from "node-fetch";

let expectedMode;

// Connection tracking for gun priority
let connectionTracker = {
    outlet1: { connected: false, connectionTime: null },
    outlet2: { connected: false, connectionTime: null },
    firstConnectedOutlet: null
};

const config = {
    mode: 'singleCombo', // Set the mode here: 'dualCombo' or 'tripleCombo'
    BASE_URL: 'http://localhost:3001',
    SWITCH_PW_LIMIT: 10000,
    UPDATE_INTERVAL: 2000, // ms
    debug: true,
    MAX_POWER_PER_MODULE: 30000, // 30kW per module, should read from state object, convMaxPower
};

// Constants
const MODULE_CONFIGS = {
    // noCombo add for 30Kw Charger
    noCombo: {
        moduleCount: 1,
        states: {
            STATE_0: {
                name: 'state_0',
                description: 'outlet idle - minimal allocation',
                allocation: { outlet1: "", outlet2: "" }
            },
            STATE_1: {
                name: 'state_1',
                description: '1 modules to outlet A',
                allocation: { outlet1: "1", outlet2: '' }
            }
        }
    },
    singleCombo: {
        moduleCount: {
            2: {
                states: {
                    STATE_0: {
                        name: 'state_0',
                        description: 'Both outlets idle - minimal allocation',
                        allocation: { outlet1: "", outlet2: "" }
                    },
                    STATE_1: {
                        name: 'state_1',
                        description: '2 modules to outlet A, 0 to outlet B',
                        allocation: { outlet1: "1,2", outlet2: "" }
                    },
                    STATE_2: {
                        name: 'state_2',
                        description: '1 module to outlet A, 1 to outlet B',
                        allocation: { outlet1: "1", outlet2: "1" }
                    },
                    STATE_3: {
                        name: 'state_3',
                        description: '0 modules to outlet A, 2 to outlet B',
                        allocation: { outlet1: "", outlet2: "1,2" }
                    }
                }
            },
            4: {
                states: {
                    STATE_0: {
                        name: 'state_0',
                        description: 'Both outlets idle - minimal allocation',
                        allocation: { outlet1: "", outlet2: "" }
                    },
                    STATE_1: {
                        name: 'state_1',
                        description: '4 modules to outlet A, 0 to outlet B',
                        allocation: { outlet1: "1,2,3,4", outlet2: "" }
                    },
                    STATE_2: {
                        name: 'state_2',
                        description: '2 modules to outlet A, 2 to outlet B',
                        allocation: { outlet1: "1,2", outlet2: "1,2" }
                    },
                    STATE_3: {
                        name: 'state_3',
                        description: '0 modules to outlet A, 4 to outlet B',
                        allocation: { outlet1: "", outlet2: "1,2,3,4" }
                    }
                }
            },
            6: {
                states: {
                    STATE_0: {
                        name: 'state_0',
                        description: 'Both outlets idle - minimal allocation',
                        allocation: { outlet1: "", outlet2: "" }
                    },
                    STATE_1: {
                        name: 'state_1',
                        description: '6 modules to outlet A, 0 to outlet B',
                        allocation: { outlet1: "1,2,3,4,5,6", outlet2: "" }
                    },
                    STATE_2: {
                        name: 'state_2',
                        description: '3 modules to outlet A, 3 to outlet B',
                        allocation: { outlet1: "1,2,3", outlet2: "1,2,3" }
                    },
                    STATE_3: {
                        name: 'state_3',
                        description: '0 modules to outlet A, 6 to outlet B',
                        allocation: { outlet1: "", outlet2: "1,2,3,4,5,6" }
                    }
                }
            },
            8: {
                states: {
                    STATE_0: {
                        name: 'state_0',
                        description: 'Both outlets idle - minimal allocation',
                        allocation: { outlet1: "", outlet2: "" }
                    },
                    STATE_1: {
                        name: 'state_1',
                        description: '8 modules to outlet A, 0 to outlet B',
                        allocation: { outlet1: "1,2,3,4,5,6,7,8", outlet2: "" }
                    },
                    STATE_2: {
                        name: 'state_2',
                        description: '4 modules to outlet A, 4 to outlet B',
                        allocation: { outlet1: "1,2,3,4", outlet2: "1,2,3,4" }
                    },
                    STATE_3: {
                        name: 'state_3',
                        description: '0 modules to outlet A, 8 to outlet B',
                        allocation: { outlet1: "", outlet2: "1,2,3,4,5,6,7,8" }
                    }
                }
            }
        }
    },
    dualCombo: {
        moduleCount: 3,
        states: {
            STATE_0: {
                name: 'state_0',
                description: 'Both outlets idle - minimal allocation',
                allocation: { outlet1: "", outlet2: "" }
            },
            STATE_1: {
                name: 'state_1',
                description: '3 modules to outlet A, 0 to outlet B',
                allocation: { outlet1: "1,2,3", outlet2: '' }
            },
            STATE_2: {
                name: 'state_2',
                description: '2 modules to outlet A, 1 to outlet B',
                allocation: { outlet1: "1,2", outlet2: "1" }
            },
            STATE_3: {
                name: 'state_3',
                description: '1 module to outlet A, 2 to outlet B',
                allocation: { outlet1: "1", outlet2: "1,2" }
            },
            STATE_4: {
                name: 'state_4',
                description: '0 modules to outlet A, 3 to outlet B',
                allocation: { outlet1: '', outlet2: "1,2,3" }
            },
            STATE_5: {
                name: 'state_5',
                description: '1 module to outlet A, 1 to outlet B',
                allocation: { outlet1: "1", outlet2: "1" }
            },
            STATE_6: {
                name: 'state_6',
                description: '1 module to outlet A, 0 to outlet B',
                allocation: { outlet1: "1", outlet2: "" }
            },
            STATE_7: {
                name: 'state_7',
                description: '2 module to outlet A, 0 to outlet B',
                allocation: { outlet1: "1,2", outlet2: "" }
            },
            STATE_8: {
                name: 'state_8',
                description: '0 module to outlet A, 1 to outlet B',
                allocation: { outlet1: "", outlet2: "1" }
            },
            STATE_9: {
                name: 'state_9',
                description: '0 module to outlet A, 2 to outlet B',
                allocation: { outlet1: "", outlet2: "1,2" }
            }
        }
    },
    tripleCombo: {
        moduleCount: 4,
        states: {
            STATE_0: {
                name: 'state_0',
                description: 'Both outlets idle - minimal allocation',
                allocation: { outlet1: "", outlet2: "" }
            },
            STATE_1: {
                name: 'state_1',
                description: '4 modules to outlet A, 0 to outlet B',
                allocation: { outlet1: "1,2,3,4", outlet2: '' }
            },
            STATE_2: {
                name: 'state_2',
                description: '3 modules to outlet A, 1 to outlet B',
                allocation: { outlet1: "1,2,3", outlet2: "1" }
            },
            STATE_3: {
                name: 'state_3',
                description: '2 modules to outlet A, 2 to outlet B',
                allocation: { outlet1: "1,2", outlet2: "1,2" }
            },
            STATE_4: {
                name: 'state_4',
                description: '1 module to outlet A, 3 to outlet B',
                allocation: { outlet1: "1", outlet2: "1,2,3" }
            },
            STATE_5: {
                name: 'state_5',
                description: '0 modules to outlet A, 4 to outlet B',
                allocation: { outlet1: '', outlet2: "1,2,3,4" }
            },
            STATE_6: {
                name: 'state_6',
                description: '1 module to outlet A, 1 to outlet B',
                allocation: { outlet1: "1", outlet2: "1" }
            },
            STATE_7: {
                name: 'state_7',
                description: '2 modules to outlet A, 1 to outlet B',
                allocation: { outlet1: "1,2", outlet2: "1" }
            },
            STATE_8: {
                name: 'state_8',
                description: '1 module to outlet A, 2 to outlet B',
                allocation: { outlet1: "1", outlet2: "1,2" }
            },
            STATE_9: {
                name: 'state_9',
                description: '1 module to outlet A, 0 to outlet B',
                allocation: { outlet1: "1", outlet2: "" }
            },
            STATE_10: {
                name: 'state_10',
                description: '2 module to outlet A, 0 to outlet B',
                allocation: { outlet1: "1,2", outlet2: "" }
            },
            STATE_11: {
                name: 'state_11',
                description: '3 module to outlet A, 0 to outlet B',
                allocation: { outlet1: "1,2,3", outlet2: "" }
            },
            STATE_12: {
                name: 'state_12',
                description: '0 module to outlet A, 1 to outlet B',
                allocation: { outlet1: "", outlet2: "1" }
            },
            STATE_13: {
                name: 'state_13',
                description: '0 module to outlet A, 2 to outlet B',
                allocation: { outlet1: "", outlet2: "1,2" }
            },
            STATE_14: {
                name: 'state_14',
                description: '0 module to outlet A, 3 to outlet B',
                allocation: { outlet1: "", outlet2: "1,2,3" }
            }
        }
    },
    quadrupleCombo: {
        moduleCount: 5,
        states: {
            STATE_0: {
                name: 'state_0',
                description: 'Both outlets idle - minimal allocation',
                allocation: { outlet1: "", outlet2: "" }
            },
            STATE_1: {
                name: 'state_1',
                description: '5 modules to outlet A, 0 to outlet B',
                allocation: { outlet1: "1,2,3,4,5", outlet2: '' }
            },
            STATE_2: {
                name: 'state_2',
                description: '4 power modules to outlet A, 1 to outlet B',
                allocation: { outlet1: "1,2,3,4", outlet2: "1" }
            },
            STATE_3: {
                name: 'state_3',
                description: '3 power modules to outlet A, 2 to outlet B',
                allocation: { outlet1: "1,2,3", outlet2: "1,2" }
            },
            STATE_4: {
                name: 'state_4',
                description: '2 power modules to outlet A, 3 to outlet B',
                allocation: { outlet1: "1,2", outlet2: "1,2,3" }
            },
            STATE_5: {
                name: 'state_5',
                description: '1 power module to outlet A, 4 to outlet B',
                allocation: { outlet1: "1", outlet2: "1,2,3,4" }
            },
            STATE_6: {
                name: 'state_6',
                description: '0 modules to outlet A, 5 to outlet B',
                allocation: { outlet1: '', outlet2: "1,2,3,4,5" }
            },
            STATE_7: {
                name: 'state_7',
                description: '1 module to outlet A, 1 to outlet B',
                allocation: { outlet1: "1", outlet2: "1" }
            },
            STATE_8: {
                name: 'state_8',
                description: '2 modules to outlet A, 1 to outlet B',
                allocation: { outlet1: "1,2", outlet2: "1" }
            },
            STATE_9: {
                name: 'state_9',
                description: '1 module to outlet A, 2 to outlet B',
                allocation: { outlet1: "1", outlet2: "1,2" }
            },
            STATE_10: {
                name: 'state_10',
                description: '3 modules to outlet A, 1 to outlet B',
                allocation: { outlet1: "1,2,3", outlet2: "1" }
            },
            STATE_11: {
                name: 'state_11',
                description: '1 module to outlet A, 3 to outlet B',
                allocation: { outlet1: "1", outlet2: "1,2,3" }
            }
        }
    },
    quintupleCombo: {
        moduleCount: 6,
        states: {
            STATE_0: {
                name: 'state_0',
                description: 'Both outlets idle - minimal allocation',
                allocation: { outlet1: "", outlet2: "" }
            },
            STATE_1: {
                name: 'state_1',
                description: 'All power modules are assigned to outlet A',
                allocation: { outlet1: "1,2,3,4,5,6", outlet2: '' }
            },
            STATE_2: {
                name: 'state_2',
                description: '5 power modules to outlet A, 1 to outlet B',
                allocation: { outlet1: "1,2,3,4,5", outlet2: "1" }
            },
            STATE_3: {
                name: 'state_3',
                description: '4 power modules to outlet A, 2 to outlet B',
                allocation: { outlet1: "1,2,3,4", outlet2: "1,2" }
            },
            STATE_4: {
                name: 'state_4',
                description: '3 power modules to outlet A, 3 to outlet B',
                allocation: { outlet1: "1,2,3", outlet2: "1,2,3" }
            },
            STATE_5: {
                name: 'state_5',
                description: '2 power modules to outlet A, 4 to outlet B',
                allocation: { outlet1: "1,2", outlet2: "1,2,3,4" }
            },
            STATE_6: {
                name: 'state_6',
                description: '1 power module to outlet A, 5 to outlet B',
                allocation: { outlet1: "1", outlet2: "1,2,3,4,5" }
            },
            STATE_7: {
                name: 'state_7',
                description: '0 modules to outlet A, 6 to outlet B',
                allocation: { outlet1: '', outlet2: "1,2,3,4,5,6" }
            },
            STATE_8: {
                name: 'state_8',
                description: '1 module to outlet A, 1 to outlet B',
                allocation: { outlet1: "1", outlet2: "1" }
            },
            STATE_9: {
                name: 'state_9',
                description: '2 modules to outlet A, 1 to outlet B',
                allocation: { outlet1: "1,2", outlet2: "1" }
            },
            STATE_10: {
                name: 'state_10',
                description: '1 module to outlet A, 2 to outlet B',
                allocation: { outlet1: "1", outlet2: "1,2" }
            },
            STATE_11: {
                name: 'state_11',
                description: '3 modules to outlet A, 1 to outlet B',
                allocation: { outlet1: "1,2,3", outlet2: "1" }
            },
            STATE_12: {
                name: 'state_12',
                description: '1 module to outlet A, 3 to outlet B',
                allocation: { outlet1: "1", outlet2: "1,2,3" }
            },
            STATE_13: {
                name: 'state_13',
                description: '2 modules to outlet A, 2 to outlet B',
                allocation: { outlet1: "1,2", outlet2: "1,2" }
            }
        }
    }
    // to add more configurations as needed for higher module counts
};

// Set global variables based on the mode
// For singleCombo, DLB_STATES will be set dynamically based on moduleCountNumber
// For other modes, use the static configuration
let DLB_STATES, totalModules;

const setDLBStatesForMode = (mode, moduleCountNumber = null) => {
    if (mode === 'singleCombo' && moduleCountNumber !== null) {
        // Dynamic selection for singleCombo based on actual module count
        const singleComboConfig = MODULE_CONFIGS.singleCombo.moduleCount[moduleCountNumber];
        if (singleComboConfig) {
            DLB_STATES = singleComboConfig.states;
            totalModules = moduleCountNumber;
        } else {
            // Fallback to 2 modules if moduleCountNumber is not supported
            DLB_STATES = MODULE_CONFIGS.singleCombo.moduleCount[2].states;
            totalModules = 2;
        }
    } else {
        // Static configuration for other modes
        const modeConfig = MODULE_CONFIGS[mode];
        DLB_STATES = modeConfig.states;
        totalModules = modeConfig.moduleCount;
    }
};

// Initialize with default configuration
setDLBStatesForMode(config.mode);

// Utility functions
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Updates connection tracking to determine which gun was connected first
 * @param {Boolean} isOutlet1Connected - Current connection state of outlet 1
 * @param {Boolean} isOutlet2Connected - Current connection state of outlet 2
 */
const updateConnectionTracking = (isOutlet1Connected, isOutlet2Connected) => {
    const currentTime = Date.now();
    
    // Track outlet 1 connection changes
    if (isOutlet1Connected && !connectionTracker.outlet1.connected) {
        // Outlet 1 just connected
        connectionTracker.outlet1.connected = true;
        connectionTracker.outlet1.connectionTime = currentTime;
        
        if (!connectionTracker.firstConnectedOutlet) {
            connectionTracker.firstConnectedOutlet = 'outlet1';
            logger.info('Outlet 1 is the first gun connected');
        }
    } else if (!isOutlet1Connected && connectionTracker.outlet1.connected) {
        // Outlet 1 just disconnected
        connectionTracker.outlet1.connected = false;
        connectionTracker.outlet1.connectionTime = null;
        
        // If outlet 1 was the first connected and it disconnects, reset priority
        if (connectionTracker.firstConnectedOutlet === 'outlet1' && !isOutlet2Connected) {
            connectionTracker.firstConnectedOutlet = null;
        } else if (connectionTracker.firstConnectedOutlet === 'outlet1' && isOutlet2Connected) {
            connectionTracker.firstConnectedOutlet = 'outlet2';
            logger.info('Outlet 2 is now the priority gun after outlet 1 disconnected');
        }
    }
    
    // Track outlet 2 connection changes
    if (isOutlet2Connected && !connectionTracker.outlet2.connected) {
        // Outlet 2 just connected
        connectionTracker.outlet2.connected = true;
        connectionTracker.outlet2.connectionTime = currentTime;
        
        if (!connectionTracker.firstConnectedOutlet) {
            connectionTracker.firstConnectedOutlet = 'outlet2';
            logger.info('Outlet 2 is the first gun connected');
        }
    } else if (!isOutlet2Connected && connectionTracker.outlet2.connected) {
        // Outlet 2 just disconnected
        connectionTracker.outlet2.connected = false;
        connectionTracker.outlet2.connectionTime = null;
        
        // If outlet 2 was the first connected and it disconnects, reset priority
        if (connectionTracker.firstConnectedOutlet === 'outlet2' && !isOutlet1Connected) {
            connectionTracker.firstConnectedOutlet = null;
        } else if (connectionTracker.firstConnectedOutlet === 'outlet2' && isOutlet1Connected) {
            connectionTracker.firstConnectedOutlet = 'outlet1';
            logger.info('Outlet 1 is now the priority gun after outlet 2 disconnected');
        }
    }
    
    // Reset if both are disconnected
    if (!isOutlet1Connected && !isOutlet2Connected) {
        connectionTracker.firstConnectedOutlet = null;
    }
};

/**
 * Gets the priority outlet (first connected gun)
 * @returns {string|null} - 'outlet1', 'outlet2', or null if no priority
 */
const getPriorityOutlet = () => {
    return connectionTracker.firstConnectedOutlet;
};

const logger = {
    info: (message, ...args) => console.log(`[INFO] ${message}`, ...args),
    error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args),
    warn: (message, ...args) => console.error(`[WARM] ${message}`, ...args),
    debug: (message, ...args) => {
        if (config.debug) {
            console.log(`[DEBUG] ${message}`, ...args);
        }
    }
};

// API functions
const api = {
    getState: async () => {
        try {
            const response = await fetch(`${config.BASE_URL}/state`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            let data = await response.json();
            if (!Array.isArray(data)) {
                data = [data]; // Ensure data is always an array
            }
            return data;
        } catch (error) {
            logger.error('Failed to fetch state:', error);
            return null;
        }
    },

    postPowercap: async (controllerId, powerCapW) => {
        try {
            const response = await fetch(`${config.BASE_URL}/outlets/${controllerId}/powercap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ PowerCapW: powerCapW }),
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            logger.error(`Failed to post powercap for controller ${controllerId}:`, error);
        }
    },

    postDlbSwitch: async (controllerId, DLBState) => {
        try {

            const raw = {
                state: DLBState.name,
                reason: DLBState.description,
            };

            const response = await fetch(`${config.BASE_URL}/controllers/${controllerId}/api/proxy/iomapper/dlb/switch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(raw),
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            logger.error(`Failed to post DLB switch for controller ${controllerId}:`, error);
        }
    },

    sendActiveModules: async (outletId, modules) => {
        try {

            const activeModules = JSON.stringify({ ActiveConverterModules: modules });

            const response = await fetch(`${config.BASE_URL}/controllers/${outletId}/api/outlets/ccs/coap/active-conv-modules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: activeModules,
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            logger.error(`Failed to send active modules for outlet ${outletId}:`, error);
        }
    },

    getIOmapper: async (controllerId) => {
        try {
            const response = await fetch(`${config.BASE_URL}/controllers/${controllerId}/api/proxy/iomapper/`, {
                method: 'GET',
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            logger.error(`Failed to get IOMapper state for outlet ${controllerId}:`, error);
        }
    },

    getDlbMode: async (controllerId) => {
        try {
            const response = await fetch(`${config.BASE_URL}/controllers/${controllerId}/api/proxy/iomapper/dlb/mode`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            return data.current_mode ;
        } catch (error) {
            logger.error('Failed to get DLB mode:', error);
            return null;
        }
    },

    /**
     * Set DLB operating mode
     */
    setDlbMode: async (controllerId, mode) => {
        try {
            const response = await fetch(`${config.BASE_URL}/controllers/${controllerId}/api/proxy/iomapper/dlb/mode`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode }),
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            logger.error(`Failed to set DLB mode to ${mode}:`, error);
            return null;
        }
    },

    getDLBModeFromBothConfigs: async () => {
        try {
            const urls = [
                "http://10.20.27.100/api/system/userconfig",
                "http://10.20.27.101/api/system/userconfig"
            ];

            // Run both requests in parallel
            const responses = await Promise.all(urls.map(url => fetch(url)));

            // Validate responses
            for (let i = 0; i < responses.length; i++) {
                if (!responses[i].ok) {
                    throw new Error("HTTP error! status: " + responses[i].status);
                }
            }

            // Parse JSON
            const configs = await Promise.all(responses.map(res => res.json()));

            // Extract dlbMode safely
            const dlbModes = configs.map(cfg => {
                if (cfg && cfg.ccs && cfg.ccs.dlbMode) {
                    return cfg.ccs.dlbMode;
                }
                return null;
            });

            // Compare both
            if (dlbModes[0] && dlbModes[1] && dlbModes[0] === dlbModes[1]) {
                return dlbModes[0];
            } else {
                return null;
            }

        } catch (error) {
            logger.error("Failed to get dlbMode from both user configs:", error);
            return null;
        }
    },

    getModuleCountFromBothConfigs: async () => {
        try {
            const urls = [
                "http://10.20.27.100/api/system/userconfig",
                "http://10.20.27.101/api/system/userconfig"
            ];

            // Run both requests in parallel
            const responses = await Promise.all(urls.map(url => fetch(url)));

            // Validate responses
            for (let i = 0; i < responses.length; i++) {
                if (!responses[i].ok) {
                    throw new Error("HTTP error! status: " + responses[i].status);
                }
            }

            // Parse JSON
            const configs = await Promise.all(responses.map(res => res.json()));

            // Extract dlbMode safely
            const moduleCounts = configs.map(cfg => {
                if (cfg && cfg.ccs && cfg.ccs.num_of_modules) {
                    return cfg.ccs.num_of_modules;
                }
                return 2; //by default return number of module 2
            });

            // Compare both
            if (moduleCounts[0] && moduleCounts[1] && moduleCounts[0] === moduleCounts[1]) {
                return moduleCounts[0];
            } else {
                return 2; //by default return number of module 2;
            }

        } catch (error) {
            logger.error("Failed to get dlbMode from both user configs:", error);
            return 2; //by default return number of module 2;
        }
    },

    fetchSmartChargingLimits: async() => {
        try {
            const response = await fetch(config.BASE_URL + '/services/ocpp/smartCharging/limits');
            if (!response.ok) {
                // throw new Error(`HTTP error! status: ${response.status}`);
                return { limits: [], CPMaxProfileLimit: null };
            }
            const data = await response.json();
            logger.info('Smart Charging Limits:', data);
            return data;
        } catch (error) {
            logger.error('Error fetching smart charging limits:', error);
            return { limits: [], CPMaxProfileLimit: null };
        }
    }

};

///////////////////////// V1 start ////////////////////////
function selectOptimalState(isOutlet1Connected, isOutlet2Connected, outlet1Demand, outlet2Demand) {
    console.log({
        isOutlet1Connected,
        isOutlet2Connected,
        outlet1Demand,
        outlet2Demand
    })   // correct this
    const powerOfModule = config.MAX_POWER_PER_MODULE

    logger.warn("selectOptimalState");
    logger.warn(`[expectedMode] Mode: ${expectedMode} | [CONFIG] Mode: ${config.mode} | [DEMAND] Outlet 1: ${outlet1Demand} W | [DEMAND] Outlet 2: ${outlet2Demand} W`);

    // Update connection tracking
    updateConnectionTracking(isOutlet1Connected, isOutlet2Connected);
    const priorityOutlet = getPriorityOutlet();

    // conditions for state switching
    // no EV connected
    if (!isOutlet1Connected && !isOutlet2Connected) {
        return findStateWithMinimalModules(true);
    }

    // EV connected to outlet 1
    if (isOutlet1Connected && !isOutlet2Connected) {
        if(expectedMode === 'tripleCombo' && outlet1Demand > 100) {
            logger.warn("selectOptimalState: tripleCombo");
            if(outlet1Demand <= powerOfModule  ) {
                return findStateByAllocation(1,0)
            } 

            if(outlet1Demand <= powerOfModule*2){
                return findStateByAllocation(2,0)
            }

            if(outlet1Demand <= powerOfModule*3){
                return findStateByAllocation(3,0)
            }
        }

        if(expectedMode === 'dualCombo' && outlet1Demand > 100) {
            logger.warn("selectOptimalState: dualCombo");
            if(outlet1Demand <= powerOfModule  ) {
                return findStateByAllocation(1,0)
            } 

            if(outlet1Demand <= powerOfModule*2){
                return findStateByAllocation(2,0)
            }
        }

        return findStateByAllocation(totalModules, 0);
    }

    // EV connected to outlet 2
    if (!isOutlet1Connected && isOutlet2Connected) {
        
        if ( expectedMode === 'tripleCombo' && outlet2Demand > 100) {
            logger.warn("selectOptimalState: tripleCombo");
             if(outlet2Demand <= powerOfModule) {
                return findStateByAllocation(0,1)
            }

            if(outlet2Demand <= powerOfModule*2){
                return findStateByAllocation(0,2)
            }

            if(outlet2Demand <= powerOfModule*3){
                return findStateByAllocation(0,3)
            }
        }

        if ( expectedMode === 'dualCombo' && outlet2Demand > 100) {
            logger.warn("selectOptimalState: dualCombo");
             if(outlet2Demand <= powerOfModule) {
                return findStateByAllocation(0,1)
            }

            if(outlet2Demand <= powerOfModule*2){
                logger.warn("findStateByAllocation(0,2)");
                return findStateByAllocation(0,2)
            }
        }
        return findStateByAllocation(0, totalModules);
    }

    // EV connected to both outlets and demand is balanced
    if (outlet1Demand === 0 && outlet2Demand === 0) {   // Before Auth
        if(expectedMode == 'tripleCombo') {
            return DLB_STATES['STATE_6'];
        } else if( expectedMode === 'singleCombo') {
            return DLB_STATES['STATE_2']
        } else if( expectedMode === 'dualCombo') {
            return DLB_STATES['STATE_5'];

        }
    }

    // One outlet has demand, other doesn't - use priority logic for odd module counts
    if (outlet1Demand > 100 && outlet2Demand < 100) {
        if(expectedMode === 'singleCombo') {
            return DLB_STATES['STATE_2'];
        }

        // Use priority-aware allocation for odd module counts
        if (totalModules % 2 === 1 && priorityOutlet) {
            return findStateByAllocationWithPriority(totalModules - 1, 1, priorityOutlet);
        }
        return findStateByAllocation(totalModules -1, 1);
    }

    if (outlet2Demand > 100 && outlet1Demand < 100) {
        if(expectedMode === 'singleCombo') {
            return DLB_STATES['STATE_2'];
        }

        // Use priority-aware allocation for odd module counts
        if (totalModules % 2 === 1 && priorityOutlet) {
            return findStateByAllocationWithPriority(1, totalModules - 1, priorityOutlet);
        }
        return findStateByAllocation(1, totalModules -1);
    }


    if(expectedMode === 'tripleCombo'){
        // Both outlets have a demand. We now use the new rule-based logic.
        // NOTE: The demand values are in Watts, so thresholds must be adjusted (e.g., 60kW -> 60000W).
        // Scenario 1: A 3-1 module split in favor of outlet 1.
        // Occurs with a significant imbalance where outlet 1's demand is high (>60kW) and outlet 2's demand is low (<=30kW).
        if (outlet1Demand > powerOfModule*2 && outlet2Demand <= powerOfModule) {
            return findStateByAllocation(3,1);
        }

        // Scenario 2: A 1-3 module split in favor of outlet 2.
        // Occurs with a significant imbalance where outlet 2's demand is high (>60kW) and outlet 1's demand is low (<=30kW).
        if (outlet1Demand <= powerOfModule && outlet2Demand > powerOfModule*2) {
           return findStateByAllocation(1,3);
        }

        if (outlet1Demand <= powerOfModule && outlet2Demand <= powerOfModule) {
            //state 6
            return DLB_STATES['STATE_6'];
        }

         if (outlet1Demand <= powerOfModule*2 && outlet1Demand > powerOfModule && outlet2Demand <= powerOfModule) {
            //state 7
            return findStateByAllocation(2,1);
        }

         if (outlet2Demand <= powerOfModule*2 && outlet2Demand > powerOfModule && outlet1Demand <= powerOfModule) {
            // state 8
            return findStateByAllocation(1,2);
        }
        

        // Default Scenario: An equal 2-2 split.
        // All other cases default to STATE_3. This includes low demands (like 5kW and 10kW),
        // medium demands, or a slight imbalance that doesn't fit the above rules.
        return findStateByAllocation(2,2);;

    } else if (expectedMode === 'dualCombo') {
        // Dynamic allocation optimization: Check if we can better utilize modules
        // by considering actual demand vs allocated capacity
        
        // Calculate modules needed based on actual demand
        const outlet1ModulesNeeded = Math.ceil(outlet1Demand / powerOfModule);
        const outlet2ModulesNeeded = Math.ceil(outlet2Demand / powerOfModule);
        const totalModulesNeeded = outlet1ModulesNeeded + outlet2ModulesNeeded;
        
        // If total needed modules <= available modules, optimize allocation
        if (totalModulesNeeded <= totalModules) {
            // Check for optimization opportunities with priority consideration
            if (priorityOutlet === 'outlet1') {
                // Gun A has priority - ensure it gets what it needs, give rest to Gun B
                const outlet1Allocation = Math.max(outlet1ModulesNeeded, 1); // At least 1 module
                const outlet2Allocation = Math.max(outlet2ModulesNeeded, totalModulesNeeded - outlet1Allocation);
                
                // If Gun B needs more than what's left, give Gun A only what it needs
                if (outlet2ModulesNeeded > outlet2Allocation && outlet1ModulesNeeded < outlet1Allocation) {
                    const optimizedOutlet1 = outlet1ModulesNeeded;
                    const optimizedOutlet2 = Math.min(outlet2ModulesNeeded, totalModulesNeeded - optimizedOutlet1);
                    return findStateByAllocation(optimizedOutlet1, optimizedOutlet2);
                }
                
                return findStateByAllocation(outlet1Allocation, outlet2Allocation);
                
            } else if (priorityOutlet === 'outlet2') {
                // Gun B has priority - ensure it gets what it needs, give rest to Gun A
                const outlet2Allocation = Math.max(outlet2ModulesNeeded, 1); // At least 1 module
                const outlet1Allocation = Math.min(outlet1ModulesNeeded, totalModulesNeeded - outlet2Allocation);
                
                // If Gun A needs more than what's left, give Gun B only what it needs
                if (outlet1ModulesNeeded > outlet1Allocation && outlet2ModulesNeeded < outlet2Allocation) {
                    const optimizedOutlet2 = outlet2ModulesNeeded;
                    const optimizedOutlet1 = Math.min(outlet1ModulesNeeded, totalModulesNeeded - optimizedOutlet2);
                    return findStateByAllocation(outlet1Allocation, optimizedOutlet2);
                }
                
                return findStateByAllocation(outlet1Allocation, outlet2Allocation);
            }
        }
        
        // Fallback to original logic if optimization isn't applicable
        if(outlet1Demand > powerOfModule && outlet2Demand <= powerOfModule) {
            if (totalModules % 2 === 1 && priorityOutlet) {
                return findStateByAllocationWithPriority(2, 1, priorityOutlet);
            }
            return findStateByAllocation(2,1)
        }

        if(outlet1Demand <= powerOfModule && outlet2Demand > powerOfModule) {
            if (totalModules % 2 === 1 && priorityOutlet) {
                return findStateByAllocationWithPriority(1, 2, priorityOutlet);
            }
            return findStateByAllocation(1,2)
        }

        if (outlet1Demand <= powerOfModule && outlet2Demand <= powerOfModule) {
            //state 5
            return DLB_STATES['STATE_5'];
        }

        // Both outlets demand > 30kW - use priority to decide allocation
        if (outlet1Demand > powerOfModule && outlet2Demand > powerOfModule) {
            if (priorityOutlet) {
                // Give 2 modules to priority outlet, 1 to the other
                if (priorityOutlet === 'outlet1') {
                    return findStateByAllocation(2, 1); // STATE_2
                } else {
                    return findStateByAllocation(1, 2); // STATE_3
                }
            }
            // If no priority is set, default to 2-1 allocation (first outlet gets priority)
            return findStateByAllocation(2, 1); // STATE_2
        }

        return DLB_STATES['STATE_5'];
    } else if(expectedMode === 'singleCombo') {
        return DLB_STATES['STATE_2'];

    }
}

function findStateWithMinimalModules(balanced = false) {

    // Assuming state_0 is always balanced state
    return DLB_STATES['STATE_0'];

    /* // or we can evaluate all states and find the one with minimal modules
        let minModules = Infinity;
        let selectedState = null;
    
        for (const state of Object.values(DLB_STATES)) {
            const outlet1Modules = state.allocation.outlet1 ? state.allocation.outlet1.split(',').length : 0;
            const outlet2Modules = state.allocation.outlet2 ? state.allocation.outlet2.split(',').length : 0;
            const totalModules = outlet1Modules + outlet2Modules;
    
            if (balanced && outlet1Modules !== outlet2Modules) {
                continue; // Skip unbalanced states if balance is required
            }
    
            if (totalModules < minModules) {
                minModules = totalModules;
                selectedState = state;
            }
        }
    
        return selectedState;
    */
}

/**
 * Finds the DLB state that prioritizes the first connected gun for odd module counts
 * @param {number} outlet1Modules - Target modules for outlet 1
 * @param {number} outlet2Modules - Target modules for outlet 2
 * @param {string} priorityOutlet - The outlet that should be prioritized ('outlet1' or 'outlet2')
 * @returns {Object} - The DLB state object with priority allocation
 */
function findStateByAllocationWithPriority(outlet1Modules, outlet2Modules, priorityOutlet = null) {
    // If no priority is set or modules are even, use normal allocation
    if (!priorityOutlet || (outlet1Modules + outlet2Modules) % 2 === 0) {
        return findStateByAllocation(outlet1Modules, outlet2Modules);
    }
    
    const totalModules = outlet1Modules + outlet2Modules;
    
    // For odd module counts with both guns connected, ensure priority gun gets extra module
    // and second gun gets at least 1 module
    if (totalModules % 2 === 1 && outlet1Modules > 0 && outlet2Modules > 0) {
        if (priorityOutlet === 'outlet1') {
            // Ensure outlet1 gets the extra module and outlet2 gets at least 1
            const minOutlet2Modules = Math.max(1, outlet2Modules);
            const remainingForOutlet1 = totalModules - minOutlet2Modules;
            return findStateByAllocation(remainingForOutlet1, minOutlet2Modules);
        } else if (priorityOutlet === 'outlet2') {
            // Ensure outlet2 gets the extra module and outlet1 gets at least 1
            const minOutlet1Modules = Math.max(1, outlet1Modules);
            const remainingForOutlet2 = totalModules - minOutlet1Modules;
            return findStateByAllocation(minOutlet1Modules, remainingForOutlet2);
        }
    }
    
    // Default to normal allocation if no special priority handling needed
    return findStateByAllocation(outlet1Modules, outlet2Modules);
}

function findStateByAllocation(outlet1Modules, outlet2Modules) {
    const exactState = Object.values(DLB_STATES).find(state => {
        const outlet1Count = state.allocation.outlet1 ? state.allocation.outlet1.split(',').length : 0;
        const outlet2Count = state.allocation.outlet2 ? state.allocation.outlet2.split(',').length : 0;
        return outlet1Count === outlet1Modules && outlet2Count === outlet2Modules;
    });

    if (exactState) {
        return exactState;
    }

    // very unlikely to happen
    return findClosestState(outlet1Modules, outlet2Modules);
}

/**
 * Finds the DLB state that has the closest number of modules assigned to each outlet
 * @param {number} targetOutlet1Modules - The target number of modules for outlet 1
 * @param {number} targetOutlet2Modules - The target number of modules for outlet 2
 * @returns {Object} - The closest DLB state object
 *
 * This function iterates through all DLB states and calculates the distance between the target
 * number of modules and the actual number of modules assigned to each outlet for each state.
 * The state with the smallest total distance is considered the closest state.
 */
function findClosestState(targetOutlet1Modules, targetOutlet2Modules) {
    let minDistance = Infinity;
    let closestState = null;

    Object.entries(DLB_STATES).forEach(([key, state]) => {
        // Count the number of modules assigned to each outlet
        const outlet1Modules = state.allocation.outlet1 ? state.allocation.outlet1.split(',').length : 0;
        const outlet2Modules = state.allocation.outlet2 ? state.allocation.outlet2.split(',').length : 0;

        // Calculate the distance between the target and actual number of modules
        const distance = Math.abs(outlet1Modules - targetOutlet1Modules) + Math.abs(outlet2Modules - targetOutlet2Modules);

        // Keep track of the closest state
        if (distance < minDistance) {
            minDistance = distance;
            closestState = state;
        }
    });

    return closestState;
}

/**
 * Gets the current DLB state from the iomapper API
 * @returns {Object} - The current DLB state object
 */
const getCurrentDlbStateFromApi = async () => {
    try {
        // Get state from both controllers to ensure consistency
        const data1 = await api.getIOmapper(1);
        const data2 = await api.getIOmapper(2);

        const currentStateName1 = data1["dlb.current_state"];
        const currentStateName2 = data2["dlb.current_state"];

        // For logging purposes
        if (currentStateName1 !== currentStateName2) {
            logger.info(`Warning: Controllers report different states: Controller 1: ${currentStateName1}, Controller 2: ${currentStateName2}`);
        }

        // Use controller 1's state as the source of truth (or choose controller 2 if preferred)
        const currentStateName = currentStateName1 || currentStateName2;

        // Find the matching state object
        for (const [key, state] of Object.entries(DLB_STATES)) {
            if (state.name === currentStateName) {
                return state;
            }
        }

        // If no match found, return STATE_0 as default
        logger.warn(`Unknown state name from API: ${currentStateName}, defaulting to STATE_0`);
        return DLB_STATES.STATE_0;
    } catch (error) {
        logger.error('Error getting current DLB state from API:', error, 'Falling back to STATE_0');
        // Fallback to STATE_0 if API call fails
        return DLB_STATES.STATE_0;
    }
};

/**
 * Gets the current module allocation from outlet states
 * @param {Object} outlet1State - State data for outlet 1
 * @param {Object} outlet2State - State data for outlet 2
 * @returns {Object} - Current module allocation
 */
const getCurrentModuleAllocation = (outlet1State, outlet2State) => {
    return {
        outlet1: outlet1State.ActiveConverterModules || '',
        outlet2: outlet2State.ActiveConverterModules || ''
    };
};

/**
 * Gets the target module allocation from a DLB state
 * @param {Object} targetState - The target DLB state
 * @returns {Object} - Target module allocation
 */
const getTargetModuleAllocation = (targetState) => {
    if (!targetState || !targetState.allocation) {
        return { outlet1: [], outlet2: [] };
    }
    
    // Convert string allocations to arrays
    const outlet1Modules = targetState.allocation.outlet1 
        ? targetState.allocation.outlet1.split(',').map(m => m.trim()).filter(m => m !== '')
        : [];
    const outlet2Modules = targetState.allocation.outlet2 
        ? targetState.allocation.outlet2.split(',').map(m => m.trim()).filter(m => m !== '')
        : [];
    
    return { outlet1: outlet1Modules, outlet2: outlet2Modules };
};



/**
 * Calculates the power demand in watts for a given outlet state
 * @param {Object} outletState - Outlet state object
 * @returns {Number} - Power demand in watts
 */
const calculatePowerDemand = (outletState) => {
    const demandInWatts = Math.round((outletState.tv * outletState.tc));
    return Math.min(demandInWatts, outletState.pLimit);
};


/**
 * Checks if an EV is connected to an outlet
 * @param {Object} outletData - Outlet state object
 * @returns {Boolean} - True if EV is connected
 */
const isEvConnected = (outletData) => {
    return outletData.pilot >= 2 && outletData.phs >= 2;
};


/**
 * Applies a safety power limit (10000W) to each outlet with an EV connected.
 * This is done to ensure that the power limit is set to a safe value before
 * switching the power module and DLB state.
 *
 * @param {Object} params - Object containing connection state for each outlet
 * @param {Boolean} params.isOutlet1Connected - Whether an EV is connected to outlet 1
 * @param {Boolean} params.isOutlet2Connected - Whether an EV is connected to outlet 2
 */
const applySafetyPowerLimit = async ({ isOutlet1Connected, isOutlet2Connected }) => {
    const safetyPowerReductions = [];

    if (isOutlet1Connected) {
        safetyPowerReductions.push(api.postPowercap(1, config.SWITCH_PW_LIMIT));
    }

    if (isOutlet2Connected) {
        safetyPowerReductions.push(api.postPowercap(2, config.SWITCH_PW_LIMIT));
    }

    if (safetyPowerReductions.length > 0) {
        await Promise.all(safetyPowerReductions);
        logger.info(`Applied SWITCH_PW_LIMIT(${config.SWITCH_PW_LIMIT}W) for EV connected outlets`);
        await wait(1000); // Wait for caps to take effect
    }
};


/**
 * Checks and sets the DLB mode on both controllers if needed
 * @returns {Promise<boolean>} - Returns true if mode was set correctly
 */
const checkAndSetDlbMode = async () => {
    try {
        // Get current mode from both controllers
        const [mode1, mode2] = await Promise.all([
            api.getDlbMode(1),
            api.getDlbMode(2)
        ]);

        const dlbModeInUserConfig = await api.getDLBModeFromBothConfigs()

        expectedMode = dlbModeInUserConfig != null ? dlbModeInUserConfig : config.mode;
        logger.debug(`Current DLB modes - Controller 1: ${mode1}, Controller 2: ${mode2}, Expected: ${expectedMode}`);

        // Check if modes match expected configuration
        const needsUpdate1 = mode1 !== expectedMode;
        const needsUpdate2 = mode2 !== expectedMode;

        if (needsUpdate1 || needsUpdate2) {
            logger.info(`DLB mode mismatch detected. Setting mode to: ${expectedMode}`);
            
            const updatePromises = [];
            if (needsUpdate1) {
                updatePromises.push(api.setDlbMode(1, expectedMode));
            }
            if (needsUpdate2) {
                updatePromises.push(api.setDlbMode(2, expectedMode));
            }

            await Promise.all(updatePromises);
            logger.info(`DLB mode successfully set to: ${expectedMode}`);
            await wait(2000); // Wait for mode change to take effect
        } else {
            logger.debug(`DLB mode is correctly set to: ${expectedMode}`);
        }
        return {modeSetSuccessfully:true, expectedMode};
    } catch (error) {
        logger.error('Failed to check/set DLB mode:', error);
        return {modeSetSuccessfully:true, expectedMode};
    }
};

/**
 * Updates both controllers to the target DLB state
 * @param {Object} targetState - The target DLB state
 * @returns {Promise<void>} - Resolves once both controllers have been updated
 */
const updateControllerDLBStates = async (targetState) => {
    await Promise.all([
        api.postDlbSwitch(1, targetState),
        api.postDlbSwitch(2, targetState)
    ]);
    logger.debug(`Controllers updated to state: ${targetState.name}`);
    await wait(1000); // Wait for state change to take effect
};

/**
 * Given the current and target states, determine which modules need to be assigned or deallocated for each outlet.
 *
 * @param {Object} currentState - The current state, with an allocation property containing the current module assignments
 * @param {Object} targetState - The target state, with an allocation property containing the target module assignments
 * @returns {Object} An object with two properties - outlet1 and outlet2 - each containing the target module assignment for that outlet as a string,
 *      and two boolean properties - isLosing and isGaining - indicating if the outlet is losing or gaining modules.
 */
const determineModuleChanges = (currentState, targetState) => {
    // Default empty allocations if not present
    const currentAllocation = (currentState && currentState.allocation) || {};
    const targetAllocation = (targetState && targetState.allocation) || {};

    // Helper function to parse module string into an array of module IDs
    const parseModules = (moduleStr) => {
        if (!moduleStr || moduleStr === '') return [];
        return moduleStr.split(',').map(m => m.trim()).filter(m => m !== '');
    };

    // Get current modules
    const currentOutlet1Modules = parseModules(currentAllocation.outlet1);
    const currentOutlet2Modules = parseModules(currentAllocation.outlet2);

    // Get target modules
    const targetOutlet1Modules = parseModules(targetAllocation.outlet1);
    const targetOutlet2Modules = parseModules(targetAllocation.outlet2);

    // Log the actual module arrays for debugging
    logger.debug(`Current modules - Outlet 1: (${currentOutlet1Modules.join(',')}), Outlet 2: (${currentOutlet2Modules.join(',')})`);
    logger.debug(`Target modules - Outlet 1: (${targetOutlet1Modules.join(',')}), Outlet 2: (${targetOutlet2Modules.join(',')})`);

    // Determine if outlets are losing or gaining modules by comparing the actual module arrays
    // We can't just compare counts - we need to check if the specific modules are different
    const outlet1Different = JSON.stringify(currentOutlet1Modules.sort()) !== JSON.stringify(targetOutlet1Modules.sort());
    const outlet2Different = JSON.stringify(currentOutlet2Modules.sort()) !== JSON.stringify(targetOutlet2Modules.sort());

    const outlet1IsLosing = outlet1Different && currentOutlet1Modules.length > targetOutlet1Modules.length;
    const outlet1IsGaining = outlet1Different && currentOutlet1Modules.length < targetOutlet1Modules.length;
    const outlet2IsLosing = outlet2Different && currentOutlet2Modules.length > targetOutlet2Modules.length;
    const outlet2IsGaining = outlet2Different && currentOutlet2Modules.length < targetOutlet2Modules.length;

    // Log the module change flags
    logger.debug(`Outlet 1 - different: ${outlet1Different}, isLosing: ${outlet1IsLosing}, isGaining: ${outlet1IsGaining}`);
    logger.debug(`Outlet 2 - different: ${outlet2Different}, isLosing: ${outlet2IsLosing}, isGaining: ${outlet2IsGaining}`);

    return {
        outlet1: {
            modules: targetAllocation.outlet1 || '',
            isLosing: outlet1IsLosing,
            isGaining: outlet1IsGaining
        },
        outlet2: {
            modules: targetAllocation.outlet2 || '',
            isLosing: outlet2IsLosing,
            isGaining: outlet2IsGaining
        }
    };
};


/**
 * Given the module changes (outlet1 and outlet2 objects containing the new module assignments and flags for if the outlet is losing or gaining modules),
 * update the module allocations by first deallocating modules from outlets that are losing them, and then allocating modules to outlets that are gaining them.
 *
 * @param {Object} moduleChanges - Object with two properties - outlet1 and outlet2 - each containing the new module assignment for that outlet as a string,
 *      and two boolean properties - isLosing and isGaining - indicating if the outlet is losing or gaining modules.
 */
const updateModuleAllocations = async (moduleChanges) => {
    // First update outlets that are LOSING modules to free them up
    const updatePromises = [];
    
    logger.warn(`moduleChanges: ${moduleChanges}`);

    // Handle outlet 1 first if it's losing modules
    if (moduleChanges.outlet1.isLosing && moduleChanges.outlet1.modules !== '') {
        const moduleStr = moduleChanges.outlet1.modules;
        logger.debug(`First updating outlet 1 that's losing modules to: ${moduleStr}`);
        updatePromises.push(
            api.sendActiveModules(1, moduleStr)
        );
    }

    // Handle outlet 2 if it's losing modules
    if (moduleChanges.outlet2.isLosing && moduleChanges.outlet2.modules !== '') {
        const moduleStr = moduleChanges.outlet2.modules;
        logger.debug(`First updating outlet 2 that's losing modules to: ${moduleStr}`);
        updatePromises.push(
            api.sendActiveModules(2, moduleStr)
        );
    }

    // Wait for losing module updates to complete
    if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        await wait(1000); // Wait for module deallocation to take effect
    }

    // Clear the promises array for the next set
    updatePromises.length = 0;

    // Then handle outlets that are GAINING modules
    if (moduleChanges.outlet1.isGaining) {
        const moduleStr = moduleChanges.outlet1.modules || '';
        logger.debug(`Then updating outlet 1 that's gaining modules to: ${moduleStr}`);
        updatePromises.push(
            api.sendActiveModules(1, moduleStr)
        );
    }

    if (moduleChanges.outlet2.isGaining) {
        const moduleStr = moduleChanges.outlet2.modules || '';
        logger.debug(`Then updating outlet 2 that's gaining modules to: ${moduleStr}`);
        updatePromises.push(
            api.sendActiveModules(2, moduleStr)
        );
    }

    // Wait for gaining module updates to complete
    if (updatePromises.length > 0) {
        logger.warn("Waiting for 5 sec for new convertor allocation")
        await wait(5000)
        await Promise.all(updatePromises);
        logger.warn("Waiting for 1 sec for new state allocation")
        await wait(1000); // Wait for module allocation to take effect
    }
};


/**
 * Given the final power cap values for each outlet, set the power caps and log the result.
 *
 * @param {Object} powerCaps - Object with two properties - calculatedPowerCap1 and calculatedPowerCap2 - containing the final power cap values for each outlet.
 */
const updateFinalPowerCaps = async ({ calculatedPowerCap1, calculatedPowerCap2 }) => {
    await Promise.all([
        api.postPowercap(1, calculatedPowerCap1),
        api.postPowercap(2, calculatedPowerCap2)
    ]);
    logger.info(`Power caps set: [1:${calculatedPowerCap1}W, 2:${calculatedPowerCap2}W]`);
};


/**
 * Periodically called function that checks the current state of the outlets and EVs, calculates the optimal power allocation and
 * updates the power caps and module assignments accordingly. If the state needs to change, it first applies safety power
 * reductions, updates the DLB state on both controllers, then determines the module changes and allocates the modules in the
 * correct order.
 */
const handleAssignments = async () => {
    try {
        const outletStates = await api.getState();
        if (outletStates.length !== 2) {
            logger.error('Invalid number of outlets:', outletStates.length);
            return;
        }

        const [outlet1State, outlet2State] = outletStates;
        const outlet1Demand = calculatePowerDemand(outlet1State);
        const outlet2Demand = calculatePowerDemand(outlet2State);
        const isOutlet1Connected = isEvConnected(outlet1State);
        const isOutlet2Connected = isEvConnected(outlet2State);
        
        // Update connection tracking for priority determination
        updateConnectionTracking(isOutlet1Connected, isOutlet2Connected);

        const { limits, CPMaxProfileLimit } = await api.fetchSmartChargingLimits();
        const outlet1LimitRaw = (limits && limits.find(l => l.outlet == "1") && limits.find(l => l.outlet == "1").limit) || null;
        const outlet2LimitRaw = (limits && limits.find(l => l.outlet == "2") && limits.find(l => l.outlet == "2").limit) || null;

        logger.info(`Demands: [O1=${outlet1Demand}W, O2=${outlet2Demand}W], Connected: [O1=${isOutlet1Connected}, O2=${isOutlet2Connected}]`);

        // STEP 1: Effective max power allowed by system
        const maxTotalPower = outlet1State.pLimit; // station pLimit
        const effectiveMaxTotalPower = (CPMaxProfileLimit !== null && CPMaxProfileLimit !== undefined)
            ? Math.min(CPMaxProfileLimit, maxTotalPower)
            : maxTotalPower;

        // STEP 2: Dynamic module count from DLB and determine target state
        const moduleCount = totalModules
        const powerPerModule = config.MAX_POWER_PER_MODULE
        
        // Get target state to determine actual module allocation
        const targetState = selectOptimalState(isOutlet1Connected, isOutlet2Connected, outlet1Demand, outlet2Demand);
        const targetAllocation = getTargetModuleAllocation(targetState);

        // STEP 3: Calculate power caps based on module allocation with priority consideration
        let calculatedPowerCap1 = CPMaxProfileLimit !== null && CPMaxProfileLimit !== undefined ? effectiveMaxTotalPower : config.MAX_POWER_PER_MODULE;
        let calculatedPowerCap2 = CPMaxProfileLimit !== null && CPMaxProfileLimit !== undefined ? effectiveMaxTotalPower : config.MAX_POWER_PER_MODULE;

        if (isOutlet1Connected && isOutlet2Connected) {
            // Calculate power based on actual module allocation
            const outlet1ModuleCount = targetAllocation.outlet1.length;
            const outlet2ModuleCount = targetAllocation.outlet2.length;
            
            // Base power allocation from modules
            const basePowerCap1 = CPMaxProfileLimit !== null && CPMaxProfileLimit !== undefined ? Math.floor(effectiveMaxTotalPower / 2) : outlet1ModuleCount * powerPerModule;
            const basePowerCap2 = CPMaxProfileLimit !== null && CPMaxProfileLimit !== undefined ? Math.floor(effectiveMaxTotalPower / 2) : outlet2ModuleCount * powerPerModule;
            
            // Apply smart charging limits and other constraints
            calculatedPowerCap1 = Math.min(
                outlet1LimitRaw || Infinity,
                basePowerCap1 > 0 ? basePowerCap1 : config.MAX_POWER_PER_MODULE,
                outlet1State.pLimit
            );

            calculatedPowerCap2 = Math.min(
                outlet2LimitRaw || Infinity,
                basePowerCap2 > 0 ? basePowerCap2 : config.MAX_POWER_PER_MODULE,
                outlet2State.pLimit
            );

            // Ensure minimum power allocation
            if (calculatedPowerCap1 < 1) {
                calculatedPowerCap1 = config.MAX_POWER_PER_MODULE;
            }
            if (calculatedPowerCap2 < 1) {
                calculatedPowerCap2 = config.MAX_POWER_PER_MODULE;
            }

            logger.info(`Module-based allocation: O1=${outlet1ModuleCount} modules (${basePowerCap1}W), O2=${outlet2ModuleCount} modules (${basePowerCap2}W)`);
            
        } else if (isOutlet1Connected) {
            const basePowerCap1 = effectiveMaxTotalPower;
            
            calculatedPowerCap1 = Math.min(
                outlet1LimitRaw || Infinity,
                basePowerCap1,
                outlet1State.pLimit
            );

            if (calculatedPowerCap1 < 1) {
                calculatedPowerCap1 = config.MAX_POWER_PER_MODULE;
            }

        } else if (isOutlet2Connected) {
            const basePowerCap2 = effectiveMaxTotalPower;
            
            calculatedPowerCap2 = Math.min(
                outlet2LimitRaw || Infinity,
                basePowerCap2,
                outlet2State.pLimit
            );
            
            if (calculatedPowerCap2 < 1) {
                calculatedPowerCap2 = config.MAX_POWER_PER_MODULE;
            }

        } else {
            // No EV connected – just keep minimal allocation per module
            calculatedPowerCap1 = CPMaxProfileLimit !== null && CPMaxProfileLimit !== undefined ? effectiveMaxTotalPower : maxTotalPower;
            calculatedPowerCap2 = CPMaxProfileLimit !== null && CPMaxProfileLimit !== undefined ? effectiveMaxTotalPower : maxTotalPower;
        }

        logger.info(`Final PowerCaps: O1=${calculatedPowerCap1}W, O2=${calculatedPowerCap2}W (Modules=${moduleCount}, Power/Module=${powerPerModule}W)`);
        
        // STEP 4: Apply state change only if needed
        const currentIOState = await getCurrentDlbStateFromApi();
        // Reuse the targetState already calculated above
        
        const needsUpdate = currentIOState.name !== targetState.name;
        const powerCapChanged = (outlet1State.PowerCapW !== calculatedPowerCap1) || (outlet2State.PowerCapW !== calculatedPowerCap2);

        if (needsUpdate) {
            logger.info(`State change: ${currentIOState.name} → ${targetState.name}`);
            await applySafetyPowerLimit({ isOutlet1Connected, isOutlet2Connected });
            await updateControllerDLBStates(targetState);

            const moduleChanges = determineModuleChanges(
                { name: currentIOState.name, allocation: getCurrentModuleAllocation(outlet1State, outlet2State) },
                targetState
            );

            await updateModuleAllocations(moduleChanges);

            await updateFinalPowerCaps({ calculatedPowerCap1, calculatedPowerCap2 });
        } else if (powerCapChanged) {
            await updateFinalPowerCaps({ calculatedPowerCap1, calculatedPowerCap2 });
        } else {
            logger.info("No update required.");
        }
    } catch (err) {
        logger.error("Smart charging error:", err);
    }
};


async function setModuleRating() {
    try {
        const LwiUserConfig = await fetch('http://10.20.27.100/api/system/userconfig', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!LwiUserConfig.ok) {
            throw new Error(`HTTP error! status: ${LwiUserConfig.status}`);
        }

        const data = await LwiUserConfig.json();

        // Safely check nested properties
        if (data && data.ccs && data.ccs.intcc && data.ccs.intcc.power_rating) {
            if(data.ccs.intcc.power_rating == 30000 || data.ccs.intcc.power_rating == 40000) {
                config.MAX_POWER_PER_MODULE = data.ccs.intcc.power_rating;
            } else {
                config.MAX_POWER_PER_MODULE = 30000;
            }
        } else {
            config.MAX_POWER_PER_MODULE = 30000;
        }

        logger.info("Power Rating of module is: ", config.MAX_POWER_PER_MODULE)

    } catch (error) {
        logger.error('Error fetching module rating:', error.message);
        // Fallback value in case of error
        config.MAX_POWER_PER_MODULE = 30000;
        logger.info("Power Rating of module is: ", config.MAX_POWER_PER_MODULE)
    }
}


const main = async () => {
    logger.info('Starting main execution');

    await setModuleRating()
    const moduleCountNumber = await api.getModuleCountFromBothConfigs()
    


    // Main loop
    while (true) {
        // Check and set DLB mode before starting main loop
        await setModuleRating()
        const moduleCountNumber = await api.getModuleCountFromBothConfigs()
        logger.info('Checking DLB mode configuration...');
        const {modeSetSuccessfully, expectedMode} = await checkAndSetDlbMode();
        // Update DLB_STATES dynamically for singleCombo mode based on actual module count
        setDLBStatesForMode(expectedMode, moduleCountNumber);
        logger.info(`DLB_STATES configured for ${expectedMode} mode with ${moduleCountNumber} modules`);
        await handleAssignments();
        await wait(config.UPDATE_INTERVAL);
    }
};

// Start the main execution
main().catch(error => logger.error('Unhandled error in main execution:', error));