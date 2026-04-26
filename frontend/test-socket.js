const { io } = require('socket.io-client');
const socket = io('http://localhost:3000', {
  path: '/socket.io',
  transports: ['websocket'],
  withCredentials: true
});

socket.on('connect', () => {
  console.log('Connected to socket!');
  socket.emit('select_seat', { scheduleId: 154, seatId: 1, maxSeats: 1 });
});

socket.on('connect_error', (err) => {
  console.log('Connect error:', err.message);
  process.exit(1);
});

socket.on('seat_lock_acquired', (data) => {
  console.log('seat_lock_acquired:', data);
  process.exit(0);
});
socket.on('seat_lock_error', (data) => {
  console.log('seat_lock_error:', data);
  process.exit(1);
});
socket.on('seat_lock_failed', (data) => {
   console.log('seat_lock_failed:', data);
   process.exit(1);
});

setTimeout(() => {
  console.log('Timeout reached');
  process.exit(2);
}, 5000);
