// ARENA server: Express + Socket.IO. All room state lives in the `rooms` Map (lost on restart).
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const MAX_USERS = 10;
const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: CLIENT_ORIGIN } });

// code -> { hostId, users: Map(userId -> {id, name, socketId}), video: {id, playing, time, at} | null, chat: [] }
const rooms = new Map();

function makeRoomCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no look-alike characters
  let code;
  do { code = Array.from({ length: 5 }, () => letters[Math.floor(Math.random() * letters.length)]).join(''); }
  while (rooms.has(code));
  return code;
}

// Accepts watch, youtu.be, embed and shorts URLs. Returns the 11-char video ID or null.
function parseYouTubeId(text) {
  try {
    const url = new URL(String(text).trim());
    const host = url.hostname.replace(/^www\.|^m\./, '');
    let id = null;
    if (host === 'youtu.be') id = url.pathname.slice(1);
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (url.pathname === '/watch') id = url.searchParams.get('v');
      else if (/^\/(embed|shorts)\//.test(url.pathname)) id = url.pathname.split('/')[2];
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}

const publicUsers = (room) => [...room.users.values()].map(({ id, name }) => ({ id, name }));
const sendRoom = (code) => {
  const room = rooms.get(code);
  if (room) io.to(code).emit('room:update', { code, hostId: room.hostId, users: publicUsers(room) });
};

function removeUser(socket) {
  const { code, userId } = socket.data;
  const room = rooms.get(code);
  if (!room) return;
  const user = room.users.get(userId);
  if (user && user.socketId === socket.id) { // ignore if the same user already reconnected on a new socket
    room.users.delete(userId);
    if (room.users.size === 0) { rooms.delete(code); return; } // empty rooms are deleted
    if (room.hostId === userId) room.hostId = room.users.keys().next().value; // oldest member becomes host
    sendRoom(code);
  }
  socket.leave(code);
  socket.data.code = null;
}

function enterRoom(socket, room, code, userId, name) {
  room.users.set(userId, { id: userId, name, socketId: socket.id });
  socket.data = { code, userId };
  socket.join(code);
  sendRoom(code);
  // Late joiners get the current video, play state and estimated position.
  const v = room.video;
  const video = v && { id: v.id, playing: v.playing, time: v.time + (v.playing ? (Date.now() - v.at) / 1000 : 0) };
  return { code, hostId: room.hostId, users: publicUsers(room), video, chat: room.chat };
}

const cleanName = (n) => String(n || '').trim().slice(0, 30);
const cleanId = (i) => (typeof i === 'string' && /^[\w-]{8,64}$/.test(i) ? i : null);

io.on('connection', (socket) => {
  socket.on('room:create', ({ userId, name }, reply) => {
    userId = cleanId(userId); name = cleanName(name);
    if (!userId || !name) return reply({ error: 'Invalid profile.' });
    const code = makeRoomCode();
    const room = { hostId: userId, users: new Map(), video: null, chat: [] };
    rooms.set(code, room);
    reply({ room: enterRoom(socket, room, code, userId, name) });
  });

  socket.on('room:join', ({ code, userId, name }, reply) => {
    userId = cleanId(userId); name = cleanName(name); code = String(code || '').trim().toUpperCase();
    if (!userId || !name) return reply({ error: 'Invalid profile.' });
    const room = rooms.get(code);
    if (!room) return reply({ error: 'Room not found.' });
    if (!room.users.has(userId) && room.users.size >= MAX_USERS) return reply({ error: 'Room is full.' });
    reply({ room: enterRoom(socket, room, code, userId, name) });
  });

  socket.on('room:leave', () => removeUser(socket));
  socket.on('disconnect', () => removeUser(socket));

  // Permission check used by every host-only event.
  const hostRoom = () => {
    const room = rooms.get(socket.data.code);
    return room && room.hostId === socket.data.userId ? room : null;
  };

  socket.on('video:set', ({ url }, reply) => {
    const room = hostRoom();
    if (!room) return reply({ error: 'Only the host can set the video.' });
    const id = parseYouTubeId(url);
    if (!id) return reply({ error: 'Not a valid YouTube link.' });
    room.video = { id, playing: false, time: 0, at: Date.now() };
    io.to(socket.data.code).emit('video:update', { id, playing: false, time: 0 });
    reply({});
  });

  // Host sends play/pause/seek and periodic heartbeats; the server stores and relays them.
  socket.on('video:state', ({ playing, time }) => {
    const room = hostRoom();
    if (!room || !room.video || typeof time !== 'number') return;
    room.video = { ...room.video, playing: !!playing, time, at: Date.now() };
    socket.to(socket.data.code).emit('video:update', { id: room.video.id, playing: !!playing, time });
  });

  socket.on('chat:send', (text) => {
    const room = rooms.get(socket.data.code);
    text = String(text || '').trim().slice(0, 300);
    if (!room || !text) return;
    const msg = { name: room.users.get(socket.data.userId).name, text };
    room.chat.push(msg);
    if (room.chat.length > 100) room.chat.shift();
    io.to(socket.data.code).emit('chat:message', msg);
  });
});

httpServer.listen(PORT, () => console.log(`ARENA server on :${PORT}`));
