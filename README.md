# ARENA
Synchronized YouTube watch parties in a theatre-style room (max 10 people). Local prototype.

## Structure
- `server/index.js` – Express + Socket.IO. Rooms live in a `Map`; validates room codes, the 10-person limit, YouTube URLs and host-only actions.
- `client/src/App.jsx` – picks screen (Login / Lobby / Arena); stores the local profile in localStorage key `arena:profile`, removed on logout.
- `client/src/components/` – `Login`, `Lobby`, `Arena` (top bar, host form, listeners), `VideoPlayer` (YouTube sync), `Seats`, `Chat` (+ `Arena.css`).
- `client/src/socket.js` – shared Socket.IO connection and a small `request()` helper.

## Run
```
cd server && npm install && npm start     # port 3001
cd client && npm install && npm run dev   # http://localhost:5173
```
## Test with two sessions
Open the app in a normal window and a private window, log in with different names. Create a room in one, join with the code in the other, then paste a YouTube link as host.

## Socket.IO events
Client to server: `room:create`, `room:join`, `room:leave`, `video:set`, `video:state`, `chat:send`. Server to room: `room:update`, `video:update`, `chat:message`. Each room is a Socket.IO room named by its code.

## Video sync
Host player is the source of truth. It sends play/pause/seek and a 3s heartbeat; the server stores it (so late joiners get the position) and relays it. Guests seek only if more than 2s off. Sync is approximate; browsers/YouTube may block autoplay for guests until they click the page.

## Limitations
Local-profile login is not secure (anyone can edit localStorage and impersonate an id). Rooms vanish on server restart. Chat history is memory-only (last 100 messages).

## Environment variables
`PORT`, `CLIENT_ORIGIN` (server; default `http://localhost:5173`), `VITE_SERVER_URL` (client; default `http://localhost:3001`).

## Deploy
Host `client` (`npm run build`, folder `dist`) on a static host with `VITE_SERVER_URL` set; host `server` on any Node host with `CLIENT_ORIGIN` set to the client URL.
