import { useState } from 'react';
import { request } from '../socket.js';
export default function Lobby({ profile, onEnter, onLogout }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  async function go(event, extra) {
    const res = await request(event, { userId: profile.id, name: profile.name, ...extra });
    if (res.error) setError(res.error); else onEnter(res.room);
  }
  return (
    <main className="center-screen">
      <div className="panel">
        <h1 className="wordmark">Cinema Paradiso</h1>
        <button className="btn primary" onClick={() => go('room:create')}>Create Room</button>
        <input placeholder="Room code" maxLength={5} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        <button className="btn secondary" onClick={() => go('room:join', { code })}>Join Room</button>
        {error && <p className="error">{error}</p>}
        <button className="link" onClick={onLogout}>Log out</button>
      </div>
    </main>
  );
}
