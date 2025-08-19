import React, { Component } from "react";
import MainContext from "../../providers/MainContext";
import { Row, Col, Button } from "antd";
import * as S from "./styles";
import { withTranslation } from "react-i18next";
import SessionsFooter from "../Sessions/SessionsFooter";

class Transactions extends Component {
    static contextType = MainContext;

    state = {
        transactions: [],
        currentPage: 1,
        pageSize: 5,
    };

    componentDidMount() {
        this.fetchTransactions();
        this.interval = setInterval(this.fetchTransactions, 30000);
    }

    componentWillUnmount() {
        clearInterval(this.interval); // Clear interval to avoid memory leaks
    }

    fetchTransactions = async () => {
        const API = this?.context?.config?.API;
        try {
            const myHeaders = new Headers();
            myHeaders.append("db-identifer", "sessions");

            const requestOptions = {
                method: "GET",
                headers: myHeaders,
            };

            const response = await fetch(`${API}/db/items`, requestOptions);
            const data = await response.json();
            const filteredData = data.filter((transaction) => transaction.connectorID);
            
            filteredData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            const transactions = filteredData.map((transaction) => ({
                ConnectorID: transaction.connectorID,
                TransactionID: transaction.transactionId,
                // IDTag: transaction.idTag,
                StartSoC: transaction.startSoC,
                StopSoC: transaction.stopSoC,
                CreatedAt: this.convertToIndianTime(transaction.createdAt), 
                TotalTime: this.convertSecondsToHMS(transaction.sessionDuration), 
                Meterstart: transaction.meterStart,
                Meterstop: transaction.meterStop,
                TotalConsumption: (transaction.meterStop - transaction.meterStart)/1000,
                StopReason: transaction.reason,
                SessionStart:this.convertToIndianTime(transaction.sessionStart),
                SessionStop:this.convertToIndianTime(transaction.sessionStop)
            }));

            this.setState({ transactions });
        } catch (error) {
            console.error("Error fetching transactions:", error);
        }
    };

    convertSecondsToHMS = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
    
        return `${this.padZero(hours)}:${this.padZero(minutes)}:${this.padZero(remainingSeconds)}`;
    };
    
    padZero = (num) => (num < 10 ? `0${num}` : num);

    convertToIndianTime = (utcDateTime) => {
        const indianDateTime = new Date(utcDateTime);
        const options = {
            timeZone: this?.context?.config?.timezone,
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
        const { transactions, currentPage, pageSize } = this.state;
        const totalTransactions = transactions.length;
        const maxTransactions = 100; // Maximum number of transactions to display
        const totalPages = Math.ceil(Math.min(totalTransactions, maxTransactions) / pageSize); // Adjusted totalPages calculation
        const startIdx = (currentPage - 1) * pageSize;
        const endIdx = Math.min(currentPage * pageSize, totalTransactions, maxTransactions);
        const visibleTransactions = transactions.slice(startIdx, endIdx);

        return (
            <MainContext.Consumer>
                {(context) => (
                    <React.Fragment>
                        <div style={{marginBottom: "98px"}}>
                            <Row>
                            <Col span={24} style={{ textAlign: "center", margin: "2vh" }}>
                                <Button
                                    disabled={currentPage === 1}
                                    onClick={() => this.handlePageChange(currentPage - 1)}
                                    icon="arrow-left"
                                />

                                <span style={{ margin: "0 10px", fontSize: "3vh" }}>
                                    Page {currentPage} of {totalPages}
                                </span>
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
                                    <div className="table-container">
                                        <table style={S.Table}>
                                            <thead>
                                                <tr>
                                                    <th style={S.TableHeader}>Sr no.</th>
                                                    <th style={S.TableHeader}>Conn<br />ID</th>
                                                    <th style={S.TableHeader}>Trans<br />ID</th>
                                                    {/* <th style={S.TableHeader}>IDTag</th> */}
                                                    <th style={S.TableHeader}>SOC%</th>
                                                    <th style={S.TableHeader}>StartTime<br/>StopTime</th>
                                                    <th style={S.TableHeader}>Duration</th>
                                                    <th style={S.TableHeader}>Meter</th>
                                                    <th style={S.TableHeader}>Consumed<br/>in kWh</th>
                                                    <th style={S.TableHeader}>Stop<br />Reason</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {visibleTransactions.map((transaction, index) => (
                                                    <tr key={index} style={S.TableRow}>
                                                        <td style={S.TableContent}>{startIdx + index + 1}</td>
                                                        <td style={S.TableContent}>{transaction.ConnectorID}</td>
                                                        <td style={S.TableContent}>{transaction.TransactionID}</td>
                                                        {/* <td style={S.TableContent}>{transaction.IDTag}</td> */}
                                                        <td style={S.TableContent}>{transaction.StartSoC}%-{transaction.StopSoC}%</td>
                                                        <td style={S.TableContent}>{transaction.SessionStart}<br/>{transaction.SessionStop}</td>
                                                        <td style={S.TableContent}>{transaction.TotalTime}</td>
                                                        <td style={S.TableContent}>{transaction.Meterstart} -<br />{transaction.Meterstop}</td> {/* Line break added here */}
                                                        <td style={S.TableContent}>{transaction.TotalConsumption}kWh</td>
                                                        <td style={S.TableContent}>{transaction.StopReason}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Col>
                            </div>
                        </Row>
                        </div>
                        <SessionsFooter></SessionsFooter>
                    </React.Fragment>
                )}
            </MainContext.Consumer>
        );
    }
}

export default withTranslation()(Transactions);
