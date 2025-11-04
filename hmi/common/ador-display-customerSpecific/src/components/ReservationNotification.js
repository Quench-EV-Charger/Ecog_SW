import React from 'react';
import { Icon } from 'antd';
import MainContext from "../providers/MainContext";
import { reservationHour, reservedDetails } from "../utils";

class ReservationNotification extends React.Component {
    
    static contextType = MainContext;

    state = {
        showReservationPrompt: false,
        reservationDetails: null,
        showReservationDetails: false,
        reservationDetailsHome: null,
    };

    componentDidMount = () => {
        this.checkReservation();
        this.checkReservationDetails();
    };

    handleClosePrompt = () => {
        this.setState({
            showReservationPrompt: false,
            showReservationDetails: false,
        });
    };

    checkReservation = async () => {
        try {
            const { outletId } = this.props;
            const { chargerState } = this.context;
            const details = await reservationHour(this.context.config?.API, outletId);
            if (details) {
                this.setState({
                    reservationDetails: details.message
                });
            }
        } catch (error) {
            console.error("Error fetching reservation details:", error);
        }
    };

    checkReservationDetails = async () => {

        try {
            const { chargerState } = this.context;
            const { outletId } = this.props;
            const resp = await fetch(`${this.context.config?.API}/services/ocpp/reservations`);
            const json = await resp.json();
            console.log("Raw Reservation API:", json);

            const details = await reservedDetails(this.context.config?.API, outletId);
            console.log("Reservation API Response:", details);
         
            if (details && (chargerState[outletId - 1].phs === 1 || chargerState[outletId - 1].phs === 2)) {
                this.setState({
                    reservationDetailsHome: details,
                    showReservationDetails: true, // Show details by default
                });
            }
        } catch (error) {
            console.error("Error fetching reservation details:", error);
        }
    };

    render() {
        const { showReservationPrompt, reservationDetails, showReservationDetails, reservationDetailsHome } = this.state;
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgb(255, 235, 235)',
                    color: 'rgb(230, 37, 24)',
                    border: '2px solid rgb(230, 37, 24)',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    padding: '16px 10px',
                    width: 'auto',
                    minWidth: '180px',
                    maxWidth: '300px',
                    marginTop: '-8vw',
                    zIndex: 100,
                    position: 'relative',
                    cursor: 'pointer',
                    flexDirection: 'column',
                    gap: '4px',
                }}
            >
                {showReservationDetails && reservationDetailsHome ? (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            gap: '2px',
                            width: '100%',
                            whiteSpace: 'nowrap', // Prevent text from wrapping
                            overflow: 'hidden', // Hide overflow
                            textOverflow: 'ellipsis', // Add ellipsis for overflow text
                        }}
                    >
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                            Reserved For: {reservationDetailsHome.vehicleId}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                            Ends at: {reservationDetailsHome.expiryDate}
                        </span>
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon
                            type="info-circle"
                            style={{ fontSize: '14px', color: '#E62518' }}
                            data-testid="alert-icon"
                        />
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{'Reservation Alert!'}</span>
                    </div>
                )}
            </div>
        );
    }
}

export default ReservationNotification;