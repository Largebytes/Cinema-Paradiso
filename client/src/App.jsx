import { useState } from 'react';
import Login from './components/Login.jsx';
import Lobby from './components/Lobby.jsx';
import Arena from './components/Arena.jsx';

const PROFILE_KEY = 'arena:profile'; // the only localStorage key this app uses

export default function App() {
  // Restore the local profile on refresh; null means show the login screen.
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY)); } catch { return null; }
  });
  const [room, setRoom] = useState(null); // room data from the server once we are inside an arena

  function login(name, contact) {
    const p = { id: crypto.randomUUID(), name, contact };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    setProfile(p);
  }
  function logout() {
    localStorage.removeItem(PROFILE_KEY); // removes only this app's data
    setRoom(null); setProfile(null);
  }

  if (!profile) return <Login onLogin={login} />;
  if (!room) return <Lobby profile={profile} onEnter={setRoom} onLogout={logout} />;
  return <Arena profile={profile} initialRoom={room} onLeave={() => setRoom(null)} onLogout={logout} />;
}
