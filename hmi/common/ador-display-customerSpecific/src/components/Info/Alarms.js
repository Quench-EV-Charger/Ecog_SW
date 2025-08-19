import React, { Component } from "react";
import MainContext from "../../providers/MainContext";
import { Row, Col, Button } from "antd";
import * as S from "./styles";
import { withTranslation } from "react-i18next";
import SessionsFooter from "../Sessions/SessionsFooter";

class Alarms extends Component {
    static contextType = MainContext;

    state = {
        alarms: [], 
        currentPage: 1,
        pageSize: 5,
    };

    componentDidMount() {
        this.fetchAlarms(); 
        this.interval = setInterval(this.fetchAlarms, 30000);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    fetchAlarms = async () => {
        const API = this?.context?.config?.API;
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
            filteredData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
            const alarms = filteredData
                .map((alarm) => ({
                    connectorId: this.checkIfCommonError(alarm.vendorErrorCode, alarm.connectorId),
                    vendorErrorCode: alarm.vendorErrorCode,
                    info: alarm.info,
                    timestamp: this.convertToIndianTime(alarm.timestamp),
                    stopTimestamp: this.addStopTimestamp(alarm.timestamp, alarm.faultDuration?alarm.faultDuration:null),
                    status : this.addStopTimestamp(alarm.timestamp,alarm.faultDuration?alarm.faultDuration:null) === "-"? "-" : "Resolved" ,
                    source: this.addErrorSource(alarm.vendorErrorCode)
                }))
                .filter((alarm) => alarm.connectorId !== null); // Filter out entries with null connectorId
    
            this.setState({ alarms });
        } catch (error) {
            console.error("Error fetching Alarms:", error);
        }
    };
    
    addStopTimestamp = (timestamp, faultDuration) => {
        if(faultDuration!=null){
            const startTime = new Date(timestamp).getTime();
            const endTime = new Date(startTime + faultDuration * 1000);
            return this.convertToIndianTime(endTime);
        }
        else{
            return "-";
        }
    };

    addErrorSource = (ec) => {
        const errorCodeList = {
            "17":"E-Stop button",
            "5":"J11:15 Temp Sensor",
            "6":"J11:16 Temp Sensor",
            "18":"Door limit switch",
            "15":"PowerModule",
            "19":"MCCB",
            "24":"RFID reader",
            "21":"Input Supply",
            "26":"Input Supply",
            "27":"Gun Temp Sensor",
            "30":"Grounding",
            "84":"IMD Resistance Error"
        };
        //console.log(errorCodeList[ec]);
        return errorCodeList[ec]?errorCodeList[ec]:"-";
    };

    checkIfCommonError = (errorCode, connectorID) => {
        const errorListZero = ["5", "6", "9", "17", "18", "19", "21", "22", "24", "26", "30"];
    
        if (errorListZero.includes(errorCode)) {
            if(connectorID === 2){
                return null;
            }
            else{
                return "0";
            }
        } else {
            return connectorID;
        }
    };
    

    convertToIndianTime = (utcDateTime) => {
        const indianDateTime = new Date(utcDateTime);
        const options = {
            timeZone:this?.context?.config?.timezone,
            day: "numeric",
            month: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
        };
        return indianDateTime.toLocaleString("en-IN", options);
    };

    handlePageChange = (pageNumber) => {
        this.setState({ currentPage: pageNumber });
    };

    render() {
        const { alarms, currentPage, pageSize } = this.state;
        const totalAlarms = alarms.length;
        const maxAlarms = 100;

        const totalPages = Math.ceil(Math.min(totalAlarms, maxAlarms) / pageSize); // Adjusted totalPages calculation
        const startIdx = (currentPage - 1) * pageSize;
        const endIdx = Math.min(currentPage * pageSize, totalAlarms, maxAlarms);
        const visibleAlarms = alarms.slice(startIdx, endIdx);

        return (
            <MainContext.Consumer>
                {(context) => (
                    <React.Fragment>
                        <Row>
                            <Col span={24} style={{ textAlign: "center", margin: "2vh" }}>
                                    <Button
                                        disabled={currentPage === 1}
                                        onClick={() => this.handlePageChange(currentPage - 1)}
                                        icon="arrow-left"                                        
                                        />

                                    <span style={{ margin: "0 10px", fontSize:"3vh"}}>Page {currentPage} of {totalPages}</span>
                                    <Button
                                        disabled={currentPage === totalPages}
                                        onClick={() => this.handlePageChange(currentPage + 1)}
                                        icon="arrow-right"
                                    />
                            </Col>
                        </Row>
                        <Row>
                            <div style={S.CenterTable}>
                            <Col span={24}>
                            <div style={{marginBottom: "205px"}}>
                                <div className="table-container">
                                    <table style={S.Table}>
                                        <thead>
                                            <tr>
                                                <th style={S.TableHeader}>Sr no.</th>
                                                <th style={S.TableHeader}>Connector<br/>ID</th>
                                                <th style={S.TableHeader}>Info</th>
                                                <th style={S.TableHeader}>Vendor<br/>ErrorCode</th>
                                                <th style={S.TableHeader}>Status</th>
                                                <th style={S.TableHeader}>Error Start<br/>Timestamp</th>
                                                <th style={S.TableHeader}>Error Resolved<br/>Timestamp</th>
                                                <th style={S.TableHeader}>Error<br/>Source</th>
                                      
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {visibleAlarms.map((alarm, index) => (
                                                <tr key={index} style={S.TableRow}>
                                                    <td style={S.TableContent}>{startIdx + index + 1}</td>
                                                    <td style={S.TableContent}>{alarm.connectorId}</td>
                                                    <td style={S.TableContent}>{alarm.info}</td>
                                                    <td style={S.TableContent}>{alarm.vendorErrorCode}</td>
                                                    <td style={S.TableContent}>{alarm.status}</td>
                                                    <td style={S.TableContent}>{alarm.timestamp}</td>
                                                    <td style={S.TableContent}>{alarm.stopTimestamp}</td>
                                                    <td style={S.TableContent}>{alarm.source}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            </Col>
                            </div>
                        </Row>
                        <div><SessionsFooter></SessionsFooter></div>
                        
                    </React.Fragment>
                )}
            </MainContext.Consumer>
        );
    }
}

export default withTranslation()(Alarms);