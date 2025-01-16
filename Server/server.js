const WebSocket = require('ws');
const { SerialPort } = require('serialport');

// Create WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Handle incoming WebSocket messages (servo positions from React app)
  ws.on('message', (message) => {
    // Ensure the message is a string before calling split()
    const messageString = String(message);

    console.log('Received message from client:', messageString);

    // Convert the message (comma-separated string) into an array of positions
    const positions = messageString.split(',').map(Number);
    console.log('Positions to send to Arduino:', positions);

    // Send the positions to the Arduino
    sendToArduino(positions);
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
function sendToArduino(positions) {
  // Convert positions to a string, e.g., "90,90,90,45,90\n"
  const message = positions.join(',') + '\n';
  console.log('Sending to Arduino:', message);

  // Write the message to the serial port (sending data to Arduino)
  port.write(message, (err) => {
    if (err) {
      console.log('Error on write:', err);
    }
  });
}

console.log('WebSocket server running on ws://localhost:8080');
