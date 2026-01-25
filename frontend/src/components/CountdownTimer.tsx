import { useEffect, useState } from "react";

type Props = {
  minutes: number;
  resetKey: number;
};

const CountdownTimer = ({ minutes, resetKey }: Props) => {
  const [timeLeft, setTimeLeft] = useState(minutes * 60);

  useEffect(() => {
    setTimeLeft(minutes * 60);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [minutes, resetKey]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const expired = timeLeft === 0;

  return (
    <div className={`timer ${expired ? "timer-expired" : "timer-active"}`}>
      {expired
        ? "Access Expired"
        : `Time Remaining: ${mins}:${secs.toString().padStart(2, "0")}`}
    </div>
  );
};

export default CountdownTimer;
