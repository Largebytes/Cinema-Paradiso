import { useEffect, useState } from 'react';
import { socket, request } from '../socket.js';
import VideoPlayer from './VideoPlayer.jsx';
import Seats from './Seats.jsx';
import Chat from './Chat.jsx';
import './Arena.css';
import MovieSelection from './MovieSelection';

export default function Arena({ profile, initialRoom, onLeave, onLogout }) {
  const [code] = useState(initialRoom.code);
  const [users, setUsers] = useState(initialRoom.users);
  const [hostId, setHostId] = useState(initialRoom.hostId);
  const [video, setVideo] = useState(initialRoom.video);
  /*const [url, setUrl] = useState('');*/
  const [picking, setPicking] = useState(false); // host chose "Change movie"
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [offsets, setOffsets] = useState({}); // userId -> seconds ahead (+) or behind (-) the host
  const isHost = hostId === profile.id;
  const showPicker = isHost && (!video || picking);

  useEffect(() => {
    const onRoom = (r) => { setUsers(r.users); setHostId(r.hostId); };
    const onVideo = (v) => setVideo(v);
    // After a connection drop, rejoin so the server sees us again.
    const onReconnect = async () => {
      const res = await request('room:join', { code, userId: profile.id, name: profile.name });
      if (res.error) onLeave(); else { setUsers(res.room.users); setHostId(res.room.hostId); setVideo(res.room.video); }
    };
    const onOffsets = (o) => setOffsets(o);
    socket.on('sync:offsets', onOffsets);
    
    socket.on('room:update', onRoom);
    socket.on('video:update', onVideo);
    socket.io.on('reconnect', onReconnect);
    return () => { socket.off('room:update', onRoom); socket.off('video:update', onVideo); socket.io.off('reconnect', onReconnect); socket.off('sync:offsets', onOffsets);};

    
  }, []);

  /*async function setVideoUrl(e) {
    e.preventDefault();
    const res = await request('video:set', { url });
    setError(res.error || ''); if (!res.error) setUrl('');
  }*/
  
  // Called by MovieSelection when the host picks a movie. We play its trailer.
  async function handleSelectMovie(movie) {
    if (!movie.trailerKey) return setError('No trailer available for this movie. Pick another.');
    const res = await request('video:set', { url: `https://www.youtube.com/watch?v=${movie.trailerKey}` });
    setError(res.error || '');
    if (!res.error) setPicking(false);
  }
  const leave = () => { socket.emit('room:leave'); onLeave(); };
  const logout = () => { socket.emit('room:leave'); onLogout(); };
  const copyInvite = () => {
    navigator.clipboard.writeText(`Join me in Cinema Paradiso. Room code: ${code}`);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="arena">
      <header className="topbar">
        <span className="wordmark small">Cinema Paradiso</span>
        <span>Room <b className="gold">{code}</b> <button className="link" onClick={copyInvite}>{copied ? 'Copied' : 'Copy invitation'}</button></span>
        <span>{users.length}/10 present</span>
        <span><button className="link" onClick={leave}>Leave Room</button> <button className="link" onClick={logout}>Log out</button></span>
      </header>
      <div className="stage">
        <section className="main">
          {/*<VideoPlayer video={video} isHost={isHost} />
          {isHost && (
            <form className="video-form" onSubmit={setVideoUrl}>
              <input placeholder="YouTube link" value={url} onChange={(e) => setUrl(e.target.value)} />
              <button className="btn primary">Set Video</button>
            </form>
          )}*/}
          {error && <p className="error">{error}</p>}
          
          {/* Hidden, not unmounted, so the host's player keeps its place while browsing */}
          <div style={{ display: showPicker ? 'none' : 'block' }}>
            <VideoPlayer video={video} isHost={isHost} />
          </div>
          {showPicker && (
            <div className="picker">
              <MovieSelection onSelectMovie={handleSelectMovie} />
            </div>
          )}
          {isHost && video && (
            <button className="btn secondary" onClick={() => setPicking((p) => !p)}>
              {picking ? 'Back to video' : 'Change movie'}
            </button>
          )}
          {error && <p className="toast">{error}</p>}
          <Seats users={users} hostId={hostId} myId={profile.id} offsets={offsets} />
        </section>
        <Chat initial={initialRoom.chat} />
      </div>
    </div>
  );
}
