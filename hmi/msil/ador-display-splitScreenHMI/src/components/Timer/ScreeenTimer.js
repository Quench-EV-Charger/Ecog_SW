import { useEffect, useRef, useState } from "react";
import { max32BitInt } from "../../constants/constants";
import IdleCharger from "../IdleCharger/IdleCharger";
import { useSelector } from "react-redux";

const ScreenTimer = ({ timeoutSec }) => {
  const {config} = useSelector((state) => state.charging)
  const timerRef = useRef(null);
  const [isIdle, setIsIdle] = useState(false);
  const events = ["load", "mousemove", "mousedown", "click", "scroll", "keypress"];

  const startTimer = () => {
    const { timeToGoHomeSec } = config || {};
    let timeout = timeoutSec ?? timeToGoHomeSec;
    if (!timeout || timeout < 0 || timeout > max32BitInt) {
      timeout = 60;
    }
    timerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, timeout * 1000);
  };

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const resetTimer = () => {
    clearTimer();
    if (isIdle) setIsIdle(false); // if user interacts, remove idle screen
    startTimer();
  };

  useEffect(() => {
    // Attach event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    startTimer();

    return () => {
      // Cleanup
      clearTimer();
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isIdle]); // Restart listeners when idle state changes

  return isIdle ? <IdleCharger /> : null;
};

export default ScreenTimer;
