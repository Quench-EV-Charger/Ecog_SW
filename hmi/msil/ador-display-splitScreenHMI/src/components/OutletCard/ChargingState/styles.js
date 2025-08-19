import styled, { keyframes } from "styled-components";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 20px;
`;

export const ButtonWrapper = styled.div`
  position: relative;
  width: 100%;
  margin-top: 20px;
`;

export const StopButton = styled.button`
  display: flex;
  justify-content: center; /* center content horizontally */
  align-items: center; /* center content vertically */
  width: 100%;
  gap: 10px;
  background-color: #ff4d4f;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 30px;
  cursor: pointer;
  position: relative;
  height: 50px;

  img {
    width: 40px;
  }

  &:hover {
    background-color: #e04142;
  }

  transition: transform 0.3s ease;
`;

export const InfoWrapper = styled.div`
  position: relative;
  width: 100%;
  margin-top: 20px;
  display: flex;
  flex-flow: column;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 5px;
`;
export const InfoCardBattery = styled.div`
  background-color: rgba(255, 255, 255, 0.05); /* subtle background for dark theme */
  padding: 10px 15px;
  border-radius: 8px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;

  h3 {
    margin: 0 0 10px 0;
    font-weight: 600;
  }

  p {
    font-size: 18px;
    margin: 0;
  }

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.6);
    border-color: rgba(255, 255, 255, 0.3);
  }
`;

export const InfoCard = styled.div`
  background-color: transparent;
  padding: 6px 9px;
  border-radius: 10px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;

  h3 {
    margin: 0 0 2px 0;
    font-weight: 600;
  }

  p {
    font-size: 18px;
    margin: 0;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
    border-bottom-color: rgba(255, 255, 255, 0.4);
  }
`;


export const ProgressBarContainer = styled.div`
  position: relative;
  background-color: #1a1a1a;
  height: 30px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solidrgb(29, 223, 58);
`;

const pulseAnimation = keyframes`
  0% {
    transform: scaleX(1);
    opacity: 0.8;
  }
  50% {
    transform: scaleX(1.05);
    opacity: 1;
  }
  100% {
    transform: scaleX(1);
    opacity: 0.8;
  }
`;

export const ProgressBarFill = styled.div`
  height: 100%;
  width: 0;
  border-radius: 10px;
  position: relative;
  background: linear-gradient(90deg, rgb(60, 98, 65), rgb(0, 255, 47));
  animation: ${pulseAnimation} 1.5s ease-in-out infinite;
  transition: width 1s ease-in-out;
  box-shadow: 0 0 15px #00ff66;
`;

export const BatteryText = styled.span`
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 18px;
  line-height: 20px;
  font-weight: 900;
  color: white;
`;

// Inside styles.js (assuming you're using styled-components)


export const DetailsSection = styled.div`
   background-color: transparent;
  padding: 6px 9px;
  border-radius: 10px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;

  h3 {
    margin: 0 0 2px 0;
    font-weight: 600;
  }

  p {
    font-size: 18px;
    margin: 0;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
    border-bottom-color: rgba(255, 255, 255, 0.4);
  }
`;

export const InfoRowGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 24px;
  margin-top: 8px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }

  span {
    font-size: 14px;
    display: flex;
    align-items: center; /* Vertically aligns the text in the center */
  }

  strong {
    margin-right: 6px;
  }
`;


export const MoreDetailsButton = styled.button`
  background-color: transparent;
  color: rgb(54, 126, 202); /* Text color */
  border: 1px solid rgb(54, 126, 202); /* Border color */
  border-radius: 40px;
  padding: 8px 16px;
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: all 3s ease; /* Smooth transition for hover effect */
  
  &:hover {
    background-color: rgba(42, 42, 215, 0.1); /* Light blue background on hover */
    color: rgb(54, 126, 202); /* Text color change on hover */
    border-color:rgb(54, 126, 202); /* Change border color on hover */
  }
  
  & svg {
    margin-right: 1px;
  }
`;

export const ButtonFixedRight = styled.div`
 display: flex;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 10px;
`;


