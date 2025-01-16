import React, { useState, useEffect } from 'react';

function ServoControl() {
  const [positions, setPositions] = useState([90, 90, 90, 45, 90]);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    console.log('Attempting to connect to WebSocket server...');
    const socket = new WebSocket('ws://localhost:8080');

    socket.onopen = () => {
      console.log('Connected to WebSocket server');
      setWs(socket); // Save the WebSocket instance to state once connected
    };

    socket.onerror = (error) => {
      console.error('WebSocket Error: ', error);
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Handle incoming WebSocket messages
    socket.onmessage = (event) => {
      console.log('Received from server:', event.data);
    };

    // Clean up WebSocket connection when the component is unmounted
    return () => {
      socket.close();
    };
  }, []);

  const handleSliderChange = (index, value) => {
    const newPositions = [...positions];
    newPositions[index] = value;
    setPositions(newPositions);

    // Check if WebSocket connection is open before trying to send data
    if (ws && ws.readyState === WebSocket.OPEN) {
      const message = newPositions.join(',');
      ws.send(message);
      console.log('Sending message:', message);
    } else {
      console.log('WebSocket is not open, cannot send message');
    }
  };

  return (
    <div>
      <h1>Servo Motor Control</h1>
      {positions.map((position, index) => (
        <div key={index}>
          <label>Servo {index + 1}: {position}</label>
          <input
            type="range"
            min={index === 3 ? 10 : (index === 4 ? 0 : 10)}
            max={index === 3 ? 90 : (index === 4 ? 180 : (index === 2 ? 170 : 140))}
            value={position}
            onChange={(e) => handleSliderChange(index, parseInt(e.target.value))}
          />
        </div>
      ))}
    </div>
  );
}

export default ServoControl;
