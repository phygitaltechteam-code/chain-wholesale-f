/**
 * Local Weighing Scale Bridge Server
 * Reads scale data from COM4 (SerialPort) and broadcasts live & stable weight over WebSocket (ws://localhost:8080)
 *
 * To run:
 *   npm run scale
 */

import { SerialPort } from 'serialport';
import { WebSocketServer } from 'ws';

const COM_PORT = process.env.SCALE_PORT || 'COM4';
const BAUD_RATE = Number(process.env.SCALE_BAUD) || 9600;
const WS_PORT = Number(process.env.WS_PORT) || 8080;

// 1. WebSocket Server for Frontend Connection
const wss = new WebSocketServer({ port: WS_PORT });

console.log(`🚀 Scale WebSocket Server running on ws://localhost:${WS_PORT}`);

const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`🔌 Frontend connected to scale bridge (Total clients: ${clients.size})`);

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`❌ Frontend disconnected (Total clients: ${clients.size})`);
  });
});

function broadcast(data) {
  const json = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(json);
    }
  }
}

// 2. Open Serial Port to Weighing Scale
console.log(`⏳ Connecting to Scale on ${COM_PORT} @ ${BAUD_RATE} baud...`);

const port = new SerialPort({
  path: COM_PORT,
  baudRate: BAUD_RATE,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
});

let buffer = '';
let previousWeight = null;
let stableCount = 0;

const STABLE_REQUIRED = 5;
const TOLERANCE = 0.001; // grams

port.on('open', () => {
  console.log('✅ Scale connected on', COM_PORT);
});

port.on('data', (data) => {
  buffer += data.toString();

  if (!buffer.includes('\r\n')) {
    return;
  }

  const message = buffer.trim();
  buffer = '';

  // Parse numeric weight (handles pure numbers or strings containing numbers)
  let weight = Number(message);
  if (Number.isNaN(weight)) {
    const matches = message.match(/[-+]?\d*\.?\d+/);
    if (matches) {
      weight = parseFloat(matches[0]);
    }
  }

  if (Number.isNaN(weight)) {
    return;
  }

  console.log('Live:', weight, 'g');

  // Check stability
  if (
    previousWeight !== null &&
    Math.abs(weight - previousWeight) <= TOLERANCE
  ) {
    stableCount++;
  } else {
    stableCount = 0;
  }

  previousWeight = weight;

  let isStable = false;
  let stableWeight = weight;

  // Stable after 5 consecutive readings
  if (stableCount >= STABLE_REQUIRED) {
    isStable = true;
    stableWeight = weight;
    const milligrams = stableWeight * 1000;

    console.log('✅ STABLE WEIGHT:', stableWeight, 'g');
    console.log('✅ STABLE WEIGHT:', milligrams, 'mg');

    stableCount = 0;
  }

  // Broadcast to frontend (ws://localhost:8080)
  broadcast({
    liveWeight: weight,
    stableWeight: stableWeight,
    isStable: isStable,
    rawMessage: message,
    timestamp: Date.now(),
  });
});

port.on('error', (err) => {
  console.error('⚠️ Scale Error:', err.message);
});

