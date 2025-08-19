import React, { useContext, useEffect, useState } from "react";
import { Button } from "antd";
import * as S from "./alarmsStyle";
import { useTranslation } from "react-i18next";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { ThemeContext } from "../ThemeContext/ThemeProvider";

const Transactions = () => {
  const { t } = useTranslation();
  const { config } = useSelector((state) => state.charging);
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const pageSize = 5;

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 30000);

    return () => clearInterval(interval); // cleanup
  }, []);

  const fetchTransactions = async () => {
    const API = config?.API;
    try {
      const myHeaders = new Headers();
      myHeaders.append("db-identifer", "sessions");

      const requestOptions = {
        method: "GET",
        headers: myHeaders,
      };

      const response = await fetch(`${API}/db/items`, requestOptions);
      const data = await response.json();
      const filteredData = data.filter(
        (transaction) => transaction.connectorID
      );

      filteredData.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      const mappedTransactions = filteredData.map((transaction) => ({
        ConnectorID: transaction.connectorID,
        TransactionID: transaction.transactionId,
        StartSoC: transaction.startSoC,
        StopSoC: transaction.stopSoC,
        CreatedAt: convertToIndianTime(transaction.createdAt),
        TotalTime: convertSecondsToHMS(transaction.sessionDuration),
        Meterstart: transaction.meterStart,
        Meterstop: transaction.meterStop,
        TotalConsumption:
          (transaction.meterStop - transaction.meterStart) / 1000,
        StopReason: transaction.reason,
        SessionStart: convertToIndianTime(transaction.sessionStart),
        SessionStop: convertToIndianTime(transaction.sessionStop),
      }));

      setTransactions(mappedTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const convertSecondsToHMS = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${padZero(hours)}:${padZero(minutes)}:${padZero(remainingSeconds)}`;
  };

  const padZero = (num) => (num < 10 ? `0${num}` : num);

  const convertToIndianTime = (utcDateTime) => {
    const indianDateTime = new Date(utcDateTime);
    const options = {
      timeZone: config?.timezone,
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    };
    return indianDateTime.toLocaleString("en-IN", options);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const totalTransactions = transactions.length;
  const maxTransactions = 100;
  const totalPages = Math.ceil(
    Math.min(totalTransactions, maxTransactions) / pageSize
  );
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(
    currentPage * pageSize,
    totalTransactions,
    maxTransactions
  );
  const visibleTransactions = transactions.slice(startIdx, endIdx);

  return (
    <>
      <div style={{ margin: "20px" }}>
        <Button
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
          icon={<LeftOutlined />}
        />
        <span style={S.PaginationText(theme)}>
          Page {currentPage} of {totalPages}
        </span>
        <Button
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          icon={<RightOutlined />}
        />
      </div>

      <div style={{ display: "flex", flexFlow: "column", margin: "8px" }}>
        <table style={S.Table}>
          <thead>
            <tr>
              <th style={S.TableHeader(theme)}>Sr no.</th>
              <th style={S.TableHeader(theme)}>
                Conn
                <br />
                ID
              </th>
              <th style={S.TableHeader(theme)}>
                Trans
                <br />
                ID
              </th>
              <th style={S.TableHeader(theme)}>SOC%</th>
              <th style={S.TableHeader(theme)}>
                StartTime
                <br />
                StopTime
              </th>
              <th style={S.TableHeader(theme)}>Duration</th>
              <th style={S.TableHeader(theme)}>Meter</th>
              <th style={S.TableHeader(theme)}>
                Consumed
                <br />
                in kWh
              </th>
              <th style={S.TableHeader(theme)}>
                Stop
                <br />
                Reason
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleTransactions.map((transaction, index) => (
              <tr key={index}>
                <td style={S.TableContent(theme)}>{startIdx + index + 1}</td>
                <td style={S.TableContent(theme)}>{transaction.ConnectorID}</td>
                <td style={S.TableContent(theme)}>{transaction.TransactionID}</td>
                <td style={S.TableContent(theme)}>
                  {transaction.StartSoC}%-{transaction.StopSoC}%
                </td>
                <td style={S.TableContent(theme)}>
                  {transaction.SessionStart}
                  <br />
                  {transaction.SessionStop}
                </td>
                <td style={S.TableContent(theme)}>{transaction.TotalTime}</td>
                <td style={S.TableContent(theme)}>
                  {transaction.Meterstart} -<br />
                  {transaction.Meterstop}
                </td>
                <td style={S.TableContent(theme)}>
                  {transaction.TotalConsumption}kWh
                </td>
                <td style={S.TableContent(theme)}>{transaction.StopReason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Transactions;
