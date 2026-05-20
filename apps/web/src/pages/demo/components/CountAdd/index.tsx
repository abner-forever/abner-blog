import { Button } from "antd";
import { useEffect, useState } from "react";

const CountAdd = () => {
  const [count, setCount] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if(!running) return;

    const interval = setInterval(() => {
      setCount(count=>count+1);
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);
  return (
   <div>
     <div>{count}</div>
     <Button onClick={() => setRunning(true)}>开始</Button>
   </div>
  )
}

export default CountAdd