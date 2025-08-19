import React from 'react';
import warningIcon from "../../assets/icons/warning.png"
import { PauseCircleOutlined } from '@ant-design/icons';


const EVChargerStatus = () => {
  const fullScreenStyle = {
    width: '100vw',
    height: '100vh',
    background: 'radial-gradient(circle at center, #121212, #000)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Segoe UI, Roboto, sans-serif',
    overflow: 'hidden',
  };

  const cardStyle = {
    background: 'rgba(40, 40, 40, 0.95)',
    border: '1px solid #444',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 0 30px rgba(0, 255, 255, 0.2)',
    textAlign: 'center',
    maxWidth: '400px',
    animation: 'pulse 2s infinite',
    zIndex: 2,
  };

  const iconStyle = {
    fontSize: '64px',
    marginBottom: '20px',
    color: '#ffcc00',
  };

  const titleStyle = {
    fontSize: '30px',
    fontWeight: 'bold',
    marginBottom: '10px',
  };

  const descStyle = {
    fontSize: '16px',
    color: '#ccc',
  };

  const barsWrapperStyle = {
    display: 'flex',
    gap: '10px',
    marginTop: '50px',
    zIndex: 1,
  };

  const barStyle = {
    width: '10px',
    height: '50px',
    background: 'rgba(23, 156, 209, 0.4)',
    borderRadius: '4px',
    animation: 'barPulse 1.2s infinite ease-in-out',
  };

  // Slightly different delays per bar for wave effect
  const getBarStyle = (delay) => ({
    ...barStyle,
    animationDelay: `${delay}s`,
  });

  return (
    <div style={fullScreenStyle}>
      <div style={cardStyle}>
        <div style={iconStyle}>
            <PauseCircleOutlined style={{ fontSize: '100px', color: 'rgba(23, 156, 209, 0.4)' }} data-testid="pause-circle-icon" />
        </div>
        <div style={titleStyle}>No charge outlet active</div>
        {/* <div style={descStyle}>
          Please plug in your EV charger or switch to another station.
        </div> */}
      </div>

      <div style={barsWrapperStyle}>
        <div style={getBarStyle(0)}></div>
        <div style={getBarStyle(0.1)}></div>
        <div style={getBarStyle(0.2)}></div>
        <div style={getBarStyle(0.3)}></div>
        <div style={getBarStyle(0.4)}></div>
      </div>

      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              box-shadow: 0 0 30px rgba(0, 255, 255, 0.2);
            }
            50% {
              box-shadow: 0 0 60px rgba(23, 156, 209, 0.4);
            }
          }
          @keyframes barPulse {
            0%, 100% {
              transform: scaleY(1);
              opacity: 0.7;
            }
            50% {
              transform: scaleY(2);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

export default EVChargerStatus;
