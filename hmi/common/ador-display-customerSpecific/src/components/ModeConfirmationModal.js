import { Modal, Icon } from "antd";
import React from "react";

// Modal function to confirm mode change
const ModeChangeConfirmationModal = ({ visible, onConfirm, onCancel }) => (
  <Modal
    visible={visible}
    onOk={onConfirm}
    onCancel={onCancel}
    centered // To center the modal on the screen
    okText="Yes"
    cancelText="No"
    footer={null} // Customize the footer buttons if needed
    closable={false} // No close button in the top corner
    bodyStyle={modalStyles} // Apply similar styles to the modal body
  >
    <div style={alertStyles}>
      <Icon
        type="api"
        style={{
          fontSize: "7.813vw",
          marginTop: "5.469vw",
          marginBottom: "2.344vw",
          color: "#E62518",
        }}
      />
      <p style={{ fontFamily: "Inter", fontSize: "2vw" }}>ALERT</p>
      <p style={{ fontFamily: "Inter", fontSize: "1.5vw" }}>
        Are you sure you want to change the charging mode?
      </p>

      {/* Buttons can be styled manually if needed */}
      <div style={buttonContainerStyles}>
        <button style={confirmButtonStyles} onClick={onConfirm}>
          Yes
        </button>
        <button style={cancelButtonStyles} onClick={onCancel}>
          No
        </button>
      </div>
    </div>
  </Modal>
);

export default ModeChangeConfirmationModal;

// Styles for the modal and buttons (can be adjusted to match your theme)
const modalStyles = {
  textAlign: "center",
  backgroundColor: "#fff",
  padding: "20px",
  borderRadius: "10px",
};

const alertStyles = {
  textAlign: "center",
};

const buttonContainerStyles = {
  display: "flex",
  justifyContent: "space-around",
  marginTop: "20px",
};

const confirmButtonStyles = {
  backgroundColor: "#E62518",
  color: "#fff",
  border: "none",
  padding: "10px 20px",
  borderRadius: "5px",
  cursor: "pointer",
  width: "150px",
};

const cancelButtonStyles = {
  backgroundColor: "#fff",
  color: "#E62518",
  border: "1px solid #E62518",
  padding: "10px 20px",
  borderRadius: "5px",
  cursor: "pointer",
  width: "150px",
};
