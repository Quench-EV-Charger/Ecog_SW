import React, { useContext, useState, useEffect } from "react";
import MainContext from "../../providers/MainContext";
import Navbar from "../navbar";
import { FaArrowLeft } from "react-icons/fa";

const DLBTest = () => {
  const context = useContext(MainContext);
  const theme = "light";
  const isDark = theme === "dark";

  const handleBackClick = () => {
    const { changePath } = context;
    if (changePath) {
      changePath("/settings");
    }
  };

  // Function to set EOL mode (true or false)
  const setEOLMode = async (eolValue) => {
    try {
      const apiUrl = context?.config?.API;
      if (apiUrl) {
        console.log(`Setting EOL mode to ${eolValue}`);
        
        const response = await fetch(`${apiUrl}/services/secc/api/proxy/iomapper/eol`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ eol: eolValue })
        });
        
        console.log('EOL mode set response status:', response.status);
        
        if (!response.ok) {
          console.warn(`Failed to set EOL mode to ${eolValue}: ${response.status}`);
        } else {
          const data = await response.json();
          console.log(`EOL mode successfully set to ${eolValue}:`, data);
        }
      }
    } catch (err) {
      console.error(`Error setting EOL mode to ${eolValue}:`, err);
    }
  };

  const handleBackClickWithEOLDisable = async () => {
    await setEOLMode(false);
    handleBackClick();
  };

  // Initialize EOL mode when component mounts
  useEffect(() => {
    const initializeEOLMode = async () => {
      try {
        const apiUrl = context?.config?.API;
        if (apiUrl) {
          console.log('Attempting to set EOL mode with API URL:', apiUrl);
          
          const response = await fetch(`${apiUrl}/services/secc/api/proxy/iomapper/eol`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ eol: true })
          });
          
          console.log('EOL mode response status:', response.status);
          
          if (!response.ok) {
            console.warn(`Failed to set EOL mode: ${response.status}`);
          } else {
            const data = await response.json();
            console.log('EOL mode response data:', data);
          }
        }
      } catch (err) {
        console.error('Error setting EOL mode:', err);
      }
    };

    initializeEOLMode();
  }, [context?.config?.API]);

  const styles = React.useMemo(
    () => ({
      container: {
        padding: "2rem",
        fontFamily: "Orbitron, sans-serif",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
        color: isDark ? "#f5f5f5" : "#000000",
      },
      header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        marginBottom: "2rem",
        paddingBottom: "1rem",
        borderBottom: "2px solid #ff0000",
        maxWidth: "100%",
      },
      backButton: {
        background: isDark ? "rgb(136 171 226)" : "#0078d4",
        border: "none",
        color: "#ffffff",
        padding: "8px 16px",
        borderRadius: "6px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "0.9rem",
        marginRight: "1rem",
        transition: "all 0.3s ease",
      },
      heading: {
        fontSize: "2rem",
        margin: 0,
        display: "flex",
        alignItems: "center",
        textShadow: isDark ? "0 0 10px rgba(136, 171, 226, 0.5)" : "0 0 10px rgba(0, 120, 212, 0.3)",
      },
      content: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "2rem",
      },
      sectionTitle: {
        fontSize: "1.3rem",
        fontWeight: "600",
        marginBottom: "1.5rem",
        color: isDark ? "rgb(136 171 226)" : "#0078d4",
        textShadow: isDark ? "0 0 8px rgba(136, 171, 226, 0.3)" : "0 0 8px rgba(0, 120, 212, 0.2)",
      },
      table: {
        width: "100%",
        borderCollapse: "collapse",
        background: isDark ? "rgba(136, 171, 226, 0.05)" : "rgba(0, 120, 212, 0.05)",
        border: isDark ? "1px solid rgba(136, 171, 226, 0.2)" : "1px solid rgba(0, 120, 212, 0.15)",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: isDark ? "0 0 15px rgba(136, 171, 226, 0.2)" : "0 0 15px rgba(0, 120, 212, 0.1)",
      },
      tableHeader: {
        background: isDark ? "rgba(136, 171, 226, 0.15)" : "rgba(0, 120, 212, 0.1)",
        borderBottom: isDark ? "2px solid rgba(136, 171, 226, 0.3)" : "2px solid rgba(0, 120, 212, 0.2)",
      },
      tableHeaderCell: {
        padding: "12px 16px",
        textAlign: "left",
        fontWeight: "600",
        color: isDark ? "rgb(136 171 226)" : "#0078d4",
        fontSize: "1rem",
      },
      tableRow: {
        borderBottom: isDark ? "1px solid rgba(136, 171, 226, 0.1)" : "1px solid rgba(0, 120, 212, 0.08)",
        transition: "all 0.3s ease",
        "&:hover": {
          background: isDark ? "rgba(136, 171, 226, 0.1)" : "rgba(0, 120, 212, 0.08)",
        },
      },
      tableCell: {
        padding: "12px 16px",
        textAlign: "left",
        fontSize: "0.95rem",
        color: isDark ? "#f5f5f5" : "#000000",
      },
      testButton: {
        background: isDark ? "#7B9FD8" : "#6B8FC8",
        border: "none",
        color: "#ffffff",
        padding: "8px 16px",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "0.85rem",
        fontWeight: "600",
        transition: "all 0.3s ease",
      },
    }),
    [isDark]
  );

  return (
    <>
      <Navbar heading="DLB Test" theme={theme} />
      {/* Add CSS keyframes for spinning animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      
      <div style={styles.container}>
        <div style={styles.header}>
          <button
            onClick={handleBackClickWithEOLDisable}
            style={styles.backButton}
            title="Back to Settings"
          >
            <FaArrowLeft /> Back
          </button>
          <h2 style={styles.heading}>DLB Test - Single ComboMode</h2>
        </div>

        <div style={styles.content}>
          <h3 style={styles.sectionTitle}>Test Scenarios</h3>
          
          <table style={styles.table}>
            <thead style={styles.tableHeader}>
              <tr>
                <th style={styles.tableHeaderCell}>State</th>
                <th style={styles.tableHeaderCell}>Gun A</th>
                <th style={styles.tableHeaderCell}>Gun B</th>
                <th style={styles.tableHeaderCell}>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr style={styles.tableRow}>
                <td style={styles.tableCell}>State 1</td>
                <td style={styles.tableCell}>60 KW</td>
                <td style={styles.tableCell}>0 KW</td>
                <td style={styles.tableCell}>
                  <button
                    style={styles.testButton}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "scale(1.05)";
                      e.target.style.boxShadow = isDark
                        ? "0 0 10px rgba(123, 159, 216, 0.6)"
                        : "0 0 10px rgba(107, 143, 200, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "scale(1)";
                      e.target.style.boxShadow = "none";
                    }}
                  >
                    Test
                  </button>
                </td>
              </tr>
              <tr style={styles.tableRow}>
                <td style={styles.tableCell}>State 2</td>
                <td style={styles.tableCell}>30 KW</td>
                <td style={styles.tableCell}>30 KW</td>
                <td style={styles.tableCell}>
                  <button
                    style={styles.testButton}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "scale(1.05)";
                      e.target.style.boxShadow = isDark
                        ? "0 0 10px rgba(123, 159, 216, 0.6)"
                        : "0 0 10px rgba(107, 143, 200, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "scale(1)";
                      e.target.style.boxShadow = "none";
                    }}
                  >
                    Test
                  </button>
                </td>
              </tr>
              <tr style={styles.tableRow}>
                <td style={styles.tableCell}>State 3</td>
                <td style={styles.tableCell}>0 KW</td>
                <td style={styles.tableCell}>60 KW</td>
                <td style={styles.tableCell}>
                  <button
                    style={styles.testButton}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "scale(1.05)";
                      e.target.style.boxShadow = isDark
                        ? "0 0 10px rgba(123, 159, 216, 0.6)"
                        : "0 0 10px rgba(107, 143, 200, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "scale(1)";
                      e.target.style.boxShadow = "none";
                    }}
                  >
                    Test
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default DLBTest;
