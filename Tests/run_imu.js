const net = require('net');
const { Buffer } = require('node:buffer');

const ADDR = '127.0.0.1';
const PORT = 3000;

const client = new net.Socket();
client.connect(PORT, ADDR, () => {
  console.log('connected to server');
  client.write(Buffer.from([0x00, 0x00, 0x00, 0x01, 0x40]));
  client.destroy();
  console.log('connection closed');
});
