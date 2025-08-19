import React, { useState, useEffect, useContext } from "react";
import { Button } from "antd";
import * as S from "./alarmsStyle";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { ThemeContext } from "../ThemeContext/ThemeProvider";

const Alarms = () => {
  const { config } = useSelector((state) => state.charging);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { t } = useTranslation();

  const [alarms, setAlarms] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    fetchAlarms();
    const interval = setInterval(fetchAlarms, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchAlarms = async () => {
    const API = config?.API;
    try {
      const myHeaders = new Headers();
      myHeaders.append("db-identifer", "alerts");

      const requestOptions = {
        method: "GET",
        headers: myHeaders,
      };

      const response = await fetch(`${API}/db/items`, requestOptions);
      const data = await response.json();
      const filteredData = data.filter((alarm) => alarm.vendorErrorCode);
      filteredData.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      const mappedAlarms = filteredData
        .map((alarm) => ({
          connectorId: checkIfCommonError(
            alarm.vendorErrorCode,
            alarm.connectorId
          ),
          vendorErrorCode: alarm.vendorErrorCode,
          info: alarm.info,
          timestamp: convertToIndianTime(alarm.timestamp),
          stopTimestamp: addStopTimestamp(
            alarm.timestamp,
            alarm.faultDuration ?? null
          ),
          status:
            addStopTimestamp(alarm.timestamp, alarm.faultDuration ?? null) ===
            "-"
              ? "-"
              : "Resolved",
          source: addErrorSource(alarm.vendorErrorCode),
        }))
        .filter((alarm) => alarm.connectorId !== null);

      setAlarms(mappedAlarms);
    } catch (error) {
      console.error("Error fetching Alarms:", error);
    }
  };

  const addStopTimestamp = (timestamp, faultDuration) => {
    if (faultDuration != null) {
      const startTime = new Date(timestamp).getTime();
      const endTime = new Date(startTime + faultDuration * 1000);
      return convertToIndianTime(endTime);
    } else {
      return "-";
    }
  };

  const addErrorSource = (ec) => {
    const errorCodeList = {
      17: "E-Stop button",
      5: "J11:15 Temp Sensor",
      6: "J11:16 Temp Sensor",
      18: "Door limit switch",
      15: "PowerModule",
      19: "MCCB",
      24: "RFID reader",
      21: "Input Supply",
      26: "Input Supply",
      27: "Gun Temp Sensor",
      30: "Grounding",
    };
    return errorCodeList[ec] || "-";
  };

  const checkIfCommonError = (errorCode, connectorID) => {
    const errorListZero = [
      "5",
      "6",
      "9",
      "17",
      "18",
      "19",
      "21",
      "22",
      "24",
      "26",
      "30",
    ];
    if (errorListZero.includes(errorCode)) {
      return connectorID === 2 ? null : "0";
    }
    return connectorID;
  };

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

  const totalAlarms = alarms.length;
  const maxAlarms = 100;
  const totalPages = Math.ceil(Math.min(totalAlarms, maxAlarms) / pageSize);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(currentPage * pageSize, totalAlarms, maxAlarms);
  const visibleAlarms = alarms.slice(startIdx, endIdx);

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
                Connector
                <br />
                ID
              </th>
              <th style={S.TableHeader(theme)}>Info</th>
              <th style={S.TableHeader(theme)}>
                Vendor
                <br />
                ErrorCode
              </th>
              <th style={S.TableHeader(theme)}>Status</th>
              <th style={S.TableHeader(theme)}>
                Error Start
                <br />
                Timestamp
              </th>
              <th style={S.TableHeader(theme)}>
                Error Resolved
                <br />
                Timestamp
              </th>
              <th style={S.TableHeader(theme)}>
                Error
                <br />
                Source
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleAlarms.map((alarm, index) => (
              <tr key={index}>
                <td style={S.TableContent(theme)}>{startIdx + index + 1}</td>
                <td style={S.TableContent(theme)}>{alarm.connectorId}</td>
                <td style={S.TableContent(theme)}>{alarm.info}</td>
                <td style={S.TableContent(theme)}>{alarm.vendorErrorCode}</td>
                <td style={S.TableContent(theme)}>{alarm.status}</td>
                <td style={S.TableContent(theme)}>{alarm.timestamp}</td>
                <td style={S.TableContent(theme)}>{alarm.stopTimestamp}</td>
                <td style={S.TableContent(theme)}>{alarm.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* <div><SessionsFooter /></div> */}
    </>
  );
};

export default Alarms;
