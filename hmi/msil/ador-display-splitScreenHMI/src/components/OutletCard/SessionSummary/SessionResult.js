import React, { useContext, useEffect, useState } from 'react';
import { Row, Col, Button, Typography, Spin, Card, theme } from 'antd';
import { CheckCircleTwoTone, WarningTwoTone } from '@ant-design/icons';
import { elapsedTime, timestampToTime } from '../../../Utilis/UtilityFunction';
import { useSelector } from 'react-redux';
import { useTranslation } from "react-i18next";
import { ThemeContext } from '../../ThemeContext/ThemeProvider';

const { Title, Text } = Typography;

const SessionResult = ({ handleClick }) => {
  const store = useSelector(state => state.charging);
  const [transaction, setTransaction] = useState(null);
  const [isWentWrong, setIsWentWrong] = useState(false);
  const { t } = useTranslation();
  const { theme, toggleTheme } = useContext(ThemeContext);

  const textStyle = {
    color: theme === "dark" ? "white" : "black",
    fontSize: 17,
    fontWeight: 700,
  };
  
  const containerStyle = {
    minHeight: '65vh',
    background: 'transparent',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  //   padding: '20px',
  };
  
  const cardStyle = {
    background: theme === "dark" ? '#1e1e1e' : "transparent",
    borderRadius: 10,
    boxShadow: theme === "dark" ? '0 1px 6px rgba(24,144,255,0.3)' : '0 1px 6px rgb(33, 196, 93)',
    border: theme === "dark" ? '1px solid rgba(24,144,255,0.3)' : '1px solid rgb(33, 196, 93)',
    width: '100%',
    maxWidth: '400px',
  };
  


  useEffect(() => {
    const fetchTransaction = async () => {
      const API = store?.config?.API;
      try {
        const res = await fetch(`${API}/db/items`, {
          method: 'GET',
          headers: { 'db-identifer': 'sessions' },
        });
        const data = await res.json();
        setTransaction(data[data.length - 1]);
      } catch (err) {
        console.error('Error:', err);
      }
    };
    fetchTransaction();
  }, [store?.config?.API]);

  const handleDoneClick = () => {
    handleClick('initial');
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      handleClick('initial');
    }, 120000); // 2 minutes
  
    return () => clearTimeout(timeout); // Cleanup
  }, []);

  if (!transaction) return (
    <div style={containerStyle}>
      <Spin size="large" />
    </div>
  );

  const {
    sessionStart,
    sessionStop,
    meterStart,
    meterStop,
    startSoC,
    stopSoC,
  } = transaction;

  const energyConsumed = ((meterStop - meterStart) / 1000).toFixed(3);
  const isInternalError = store.selectedState?.pilot === 7 || store.selectedState?.evsestat === 5;

  return (
    <div style={containerStyle}>
      {isWentWrong && isInternalError && (
        <div style={{ color: '#ff4d4f', marginBottom: 24 }}>
          <WarningTwoTone twoToneColor="#ff4d4f" style={{ fontSize: 28 }} />
          <Title level={4} style={{ color: '#f55', marginTop: 8 }}>{t('UNPLUG_FAULT')}</Title>
        </div>
      )}

      <div>
        <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 58 }} />
        <Title level={3} style={{ color: theme === "dark" ? "white" : "black", marginTop: 10 }}>{t('THANKS_FOR_CHARGING')}</Title>
      </div>

      <Card bordered={false} style={cardStyle} bodyStyle={{ padding: '16px' }}>
        <Title level={4} style={{ color: theme === "dark" ? '#eee' : "black", marginBottom: 10, marginTop: 1 }}>{t('SESSION_DETAILS')}</Title>
        <Text style={textStyle}>{t('START_TIME')}: {timestampToTime(sessionStart, store?.config?.timezone)}</Text><br />
        <Text style={textStyle}>{t('STOP_TIME')}: {timestampToTime(sessionStop, store?.config?.timezone)}</Text><br />
        <Text style={textStyle}>{t('TIME_TAKEN')}: {elapsedTime(sessionStart, sessionStop)}</Text><br />
        <Text style={textStyle}>{t('START_SOC')}: {startSoC}%</Text><br />
        <Text style={textStyle}>{t('STOP_SOC')}: {stopSoC}%</Text><br />
        <Text style={textStyle}>{t('ENERGY_DELIVERED')}: {energyConsumed} kWh</Text>
      </Card>

      <div style={{ marginTop: 30 }}>
        <Button
          type="primary"
          onClick={handleDoneClick}
          size="large"
          style={{
            background: 'transparent',
            border: theme === "dark" ? '1px solid rgba(24,144,255,0.3)' : '1px solid rgb(33, 196, 93)',
            padding: '0 24px',
            borderRadius: 6,
            height: 42,
            fontSize: 15,
            boxShadow: theme === "dark" ? '0 1px 6px rgba(24,144,255,0.3)' : '0 1px 6px rgb(33, 196, 93)',
            color: theme === "dark" ? '#fff' : "black"
          }}
        >
          {t('DONE')}
        </Button>
      </div>
    </div>
  );
};


export default SessionResult;
