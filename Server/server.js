const WebSocket = require('ws');
const { SerialPort } = require('serialport');

// Create WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Handle incoming WebSocket messages (servo positions from React app)
  ws.on('message', (message) => {
    // Ensure the message is a valid JSON string (not an array directly)
    let positionsString;
    try {
      positionsString = JSON.parse(message);
    } catch (e) {
      console.error('Error parsing incoming message:', e);
      return;
    }

    // Check that the positions array is valid and contains 5 elements
    if (Array.isArray(positionsString) && positionsString.length === 5) {
      console.log('Received message from client:', positionsString);
      console.log('Positions to send to Arduino:', positionsString);
      sendToArduino(positionsString);
    } else {
      console.error('Invalid message format or missing data');
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (err) => {
    console.log('WebSocket error:', err);
  });
});

// Set up SerialPort (connect to Arduino via USB)
const port = new SerialPort({
  path: 'COM3', // Change this to your Arduino port (e.g., COM3 on Windows)
  baudRate: 9600
});

// Open the serial port connection
port.on('open', () => {
  console.log('Serial port opened');
});

// Send data to Arduino
function sendToArduino(positionsArray) {
  // Create a buffer to send the servo positions
  const buffer = Buffer.alloc(10); // 5 servos, 2 bytes per servo

  // Fill the buffer with 2-byte values
  for (let i = 0; i < positionsArray.length; i++) {
    const pos = positionsArray[i];
    buffer.writeUInt16LE(pos, i * 2); // Write each 2-byte integer into the buffer
  }

  console.log('Sending to Arduino:', buffer);

  // Write the message to the serial port (sending data to Arduino)
  port.write(buffer, (err) => {
    if (err) {
      console.log('Error on write:', err);
    }
  });
}

console.log('WebSocket server running on ws://localhost:8080');
