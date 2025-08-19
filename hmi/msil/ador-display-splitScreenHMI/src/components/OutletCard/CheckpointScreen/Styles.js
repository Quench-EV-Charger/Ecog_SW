import styled, { keyframes } from "styled-components";

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
`;


const spin = keyframes`
0% { transform: rotate(0deg); }
100% { transform: rotate(360deg); }
`;

export const CheckPointsPage = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  backgroundColor: "transparent", // Dark background
  padding: "2px",
  marginTop: "20px"
};

export const CheckPointContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: ${({ theme }) =>
    theme === "dark" ? "#1e1e1e" : "white"};
  border-radius: 12px;
  padding: 4px 6px;
  margin: 1px 0;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  animation: ${fadeInUp} 0.4s ease-out both;

  transition: all 0.3s ease;

  .spin {
    animation: ${spin} 1s linear infinite;
  }

  &:hover {
    background-color: ${({ theme }) =>
      theme === "dark" ? "#2a2a2a" : "#eaeaea"};
    transform: scale(1.02);
  }

  .icon {
    font-size: 24px;
    margin-right: 16px;
  }

  .text {
    font-size: 16px;
    font-weight: 500;
    color: ${({ theme }) =>
      theme === "dark" ? "#e0e0e0" : "#1e1e1e"};
  }
`;


