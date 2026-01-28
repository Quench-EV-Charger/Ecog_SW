import React, { useContext, useEffect, useState } from "react";
import MainContext from "../../providers/MainContext";
import Navbar from "../navbar";
import SingleCombo from "./SingleCombo";
import DualCombo from "./DualCombo";
import TripleCombo from "./TripleCombo";
import QuadrupleCombo from "./QuadrupleCombo";
import QuintupleCombo from "./QuintupleCombo";

const Maintenance = () => {
  const context = useContext(MainContext);
  const theme = "light";

  const [dlbMode, setDlbMode] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize EOL mode when component mounts - call both controllers
  useEffect(() => {
    const initializeEOLMode = async () => {
      try {
        const apiUrl = context?.config?.API || "http://10.20.27.50:3001";
        console.log('Attempting to set EOL mode for both controllers');

        // Call EOL for Controller 1
        const response1 = await fetch(`${apiUrl}/controllers/1/api/proxy/iomapper/eol`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eol: true })
        });
        console.log('EOL mode Controller 1 response:', response1.status);

        // Call EOL for Controller 2
        const response2 = await fetch(`${apiUrl}/controllers/2/api/proxy/iomapper/eol`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eol: true })
        });
        console.log('EOL mode Controller 2 response:', response2.status);

      } catch (err) {
        console.error('Error setting EOL mode:', err);
      }
    };

    initializeEOLMode();
  }, [context?.config?.API]);

  // Fetch dlbMode from hardware config
  useEffect(() => {
    const fetchDlbMode = async () => {
      try {
        setLoading(true);
        // Using hardcoded IP for userconfig as per requirement
        const response = await fetch('http://10.20.27.100/api/system/userconfig');
        if (response.ok) {
          const data = await response.json();
          // Access ccs.dlbMode safely
          const fetchedMode = data?.ccs?.dlbMode;
          console.log('Fetched DLB Mode from hardware config:', fetchedMode);

          if (fetchedMode) {
            setDlbMode(fetchedMode);
          } else {
            console.warn('DLB Mode not found in hardware config, defaulting to singleCombo');
            // If fetching works but no dlbMode, default to singleCombo
            setDlbMode('singleCombo');
          }
        } else {
          // If fetch fails (non-200), default to singleCombo.
          // This handles cases where endpoint might not be reachable in some environments.
          // You might want to remove this fallback if you prefer a strict loading/error state.
          console.warn('Failed to fetch hardware config, status:', response.status);
          setDlbMode('singleCombo');
        }
      } catch (err) {
        console.error('Error fetching hardware config for DLB mode:', err);
        // Fallback for dev environment or errors
        setDlbMode('singleCombo');
      } finally {
        setLoading(false);
      }
    };

    fetchDlbMode();
  }, []);


  // Render appropriate combo based on config
  const renderCombo = () => {
    if (loading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '1.5rem',
          color: '#000'
        }}>
          Loading Maintenance Configuration...
        </div>
      );
    }

    switch (dlbMode) {
      case 'singleCombo':
        return <SingleCombo />;
      case 'dualCombo':
        return <DualCombo />;
      case 'tripleCombo':
        return <TripleCombo />;
      case 'quadrupleCombo':
        return <QuadrupleCombo />;
      case 'quintupleCombo':
        return <QuintupleCombo />;
      default:
        // Also support old values as fallback or default behavior
        if (dlbMode === 'single') return <SingleCombo />;
        if (dlbMode === 'dual') return <DualCombo />;
        return <SingleCombo />;
    }
  };

  return (
    <>
      <Navbar heading="Maintenance Mode" theme={theme} disableAll={true} />
      {renderCombo()}
    </>
  );
};

export default Maintenance;
