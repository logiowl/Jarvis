import React, { useState, useEffect, useRef } from "react";

function ServoControl() {
  const [positions, setPositions] = useState([90, 90, 90, 50, 130]); // [Segment 1, Segment 2, Segment 3, Grip, Z-Axis Rotation]
  const canvasRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    wsRef.current = new WebSocket("ws://localhost:8080");

    wsRef.current.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket Error: ", error);
    };

    wsRef.current.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const sendPositionsToWebSocket = (updatedPositions) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = JSON.stringify(updatedPositions);
      wsRef.current.send(message);
      console.log("Sent to WebSocket:", message);
    } else {
      console.log("WebSocket not open, cannot send message");
    }
  };

  const handleSliderChange = (index, value) => {
    const newPositions = [...positions];
    newPositions[index] = value;
    setPositions(newPositions);
    sendPositionsToWebSocket(newPositions);
  };

  useEffect(() => {
    drawCanvas();
  }, [positions]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = 800;
    canvas.height = 400;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const sideViewBaseX = 100; // Base of the first segment in the left 400x400 area
    const sideViewBaseY = 100;
    const zAxisViewCenterX = 600; // Center of the right 400x400 area
    const zAxisViewCenterY = 200;

    drawArm(ctx, sideViewBaseX, sideViewBaseY);
    drawZAxisArm(ctx, zAxisViewCenterX, zAxisViewCenterY, positions[4]);
  };

  const drawArm = (ctx, startX, startY) => {
    let baseX = startX;
    let baseY = startY;
    const segmentLength = 49;
    const maxWidth = 40;
    const minWidth = 16;
    const angleOffset = -90;

    drawBaseProjection(ctx, baseX, baseY);

    ctx.save();
    ctx.translate(baseX, baseY);

    for (let i = 0; i < 3; i++) {
      const angle = (positions[i] + angleOffset) * (Math.PI / 180);
      const nextX = baseX + segmentLength * Math.cos(angle);
      const nextY = baseY + segmentLength * Math.sin(angle);

      const width = maxWidth - (i * (maxWidth - minWidth) / 3);
      drawSegment(ctx, baseX, baseY, nextX, nextY, segmentLength, width);

      baseX = nextX;
      baseY = nextY;
    }

    drawGrip(ctx, baseX, baseY, positions[3]);
    ctx.restore();
  };

  const drawBaseProjection = (ctx, baseX, baseY) => {
    const rectWidth = 80;
    const rectHeight = 30;
    const rectX = baseX - rectWidth / 2;
    const rectY = baseY;

    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.rect(rectX, rectY, rectWidth, rectHeight);
    ctx.fill();
    ctx.stroke();
  };

  const drawZAxisArm = (ctx, centerX, centerY, zRotation) => {
    const segmentLength = 35;
    const width = 30;
    const baseRadius = 40;

    ctx.save();
    ctx.translate(centerX, centerY);

    ctx.beginPath();
    ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    ctx.rotate(zRotation * (Math.PI / 180));

    let baseX = 0;
    let baseY = 0;

    for (let i = 0; i < 3; i++) {
      const nextX = baseX + segmentLength;
      const nextY = baseY;

      drawSegment(ctx, baseX, baseY, nextX, nextY, segmentLength, width);
      baseX = nextX;
      baseY = nextY;
    }

    drawGrip(ctx, baseX, baseY, positions[3]);
    ctx.restore();
  };

  const drawGrip = (ctx, x, y, gripValue) => {
    const gripSegmentLength = 25;
    const gripWidth = 20;

    const leftGripAngle = -gripValue * (Math.PI / 180);
    const rightGripAngle = gripValue * (Math.PI / 180);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(leftGripAngle);
    drawSegment(ctx, 0, 0, gripSegmentLength, 0, gripSegmentLength, gripWidth);
    ctx.restore();

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rightGripAngle);
    drawSegment(ctx, 0, 0, gripSegmentLength, 0, gripSegmentLength, gripWidth);
    ctx.restore();
  };

  const drawSegment = (ctx, x1, y1, x2, y2, length, width) => {
    ctx.save();
    ctx.translate(x1, y1);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.rotate(angle);

    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, -width / 2);
    ctx.lineTo(length, -width / 4);
    ctx.arc(length, 0, width / 4, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(0, width / 2);
    ctx.arc(0, 0, width / 2, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();

    ctx.restore();

    ctx.beginPath();
    ctx.arc(x1, y1, 6, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
  };

  return (
    <div>
      <h1>Servo Motor Control</h1>
      <canvas ref={canvasRef} style={{ border: "1px solid black" }}></canvas>
      {["Segment 1", "Segment 2", "Segment 3", "Grip", "Z-Axis Rotation"].map(
        (label, index) => (
          <div key={index}>
            <label>
              {label}: {positions[index]}
            </label>
            <input
              type="range"
              min={index === 3 ? 0 : (index === 5 ? 130 : 10)}
              max={index === 3 ? 90 : (index === 4 ? 180 : 170)}
              value={positions[index]}
              onChange={(e) =>
                handleSliderChange(index, parseInt(e.target.value))
              }
            />
          </div>
        )
      )}
    </div>
  );
}

export default ServoControl;
