import { io } from 'socket.io-client';
// One shared connection. Set VITE_SERVER_URL in client/.env when deploying.
export const socket = io(import.meta.env.VITE_SERVER_URL );
// Promise wrapper around Socket.IO acknowledgements: resolves with the server's reply.
export const request = (event, data) => new Promise((resolve) => socket.emit(event, data, resolve));
