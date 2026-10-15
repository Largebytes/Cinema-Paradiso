import { useEffect, useRef, useState } from 'react';
import { socket } from '../socket.js';
import ReactionLayer from './ReactionLayer.jsx';

// Loads the YouTube IFrame API script once and resolves when it is ready.
let apiPromise;
function loadYouTubeApi() {
  /*if (!apiPromise) apiPromise = new Promise((resolve) => {
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  });*/
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { previous?.(); resolve(window.YT); };
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const s = document.createElement('script');
        s.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(s);
      }
    });
  }
  return apiPromise;
}

// Sync model: the HOST's player is the source of truth. The host emits play/pause/seek and a
// heartbeat every 3s. Guests apply each update and re-seek only if >2s out of sync.
export default function VideoPlayer({ video, isHost }) {
  const holder = useRef(null);
  const player = useRef(null);
  const latest = useRef(video);   // newest video state, readable inside callbacks
  const [error, setError] = useState('');
  latest.current = video;

  // Apply a state received from the host to the local player (guests only).
  function apply(v) {
    const p = player.current;
    if (!p || !p.loadVideoById || !v) return;
    try {
      if (p.getVideoData().video_id !== v.id) p.loadVideoById(v.id, v.time);
      else if (Math.abs(p.getCurrentTime() - v.time) > 2) p.seekTo(v.time, true);
      if (v.playing) p.playVideo(); else p.pauseVideo();
    } catch { /* player not ready yet; the next update will fix it */ }
  }

  useEffect(() => {
    let alive = true, timer, positionTimer;
    loadYouTubeApi().then((YT) => {
      if (!alive) return;
      const sendState = () => {
        const p = player.current;
        if (!isHost || !p?.getCurrentTime) return;
        socket.emit('video:state', { playing: p.getPlayerState() === YT.PlayerState.PLAYING, time: p.getCurrentTime() });
      };
      player.current = new YT.Player(holder.current, {
        width: '100%', height: '100%',
        playerVars: { controls: isHost ? 1 : 0, disablekb: isHost ? 0 : 1, rel: 0 }, // guests cannot use controls
        events: {
          onReady: () => { setError(''); if (latest.current) apply(latest.current); },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING || e.data === YT.PlayerState.PAUSED) sendState(); // host play/pause/seek
          },
          onError: () => setError('This video cannot be embedded or played. Try another one.'),
        },
      });
      // Guests tell the server where their player is, so seats can show the offset.
      const sendPosition = () => {
        const p = player.current;
        if (isHost || !p?.getCurrentTime) return;
        socket.emit('video:position', { time: p.getCurrentTime() });
      };
      timer = setInterval(sendState, 3000);           // host heartbeat stays at 3s
      positionTimer = setInterval(sendPosition, 1000); // guests report every 1s
    });
    return () => { alive = false; clearInterval(timer); player.current?.destroy?.(); player.current = null;clearInterval(positionTimer); };
  }, [isHost]);

  // Guests follow every update from the server.
  useEffect(() => { if (!isHost) apply(video); }, [video, isHost]);
  // Host loads a newly chosen video.
  useEffect(() => {
    const p = player.current;
    if (isHost && video && p?.loadVideoById && p.getVideoData?.().video_id !== video.id) p.loadVideoById(video.id, video.time || 0);
  }, [video?.id, isHost]);

  return (
    <div className="screen">
      <ReactionLayer />
      <div ref={holder} />
      {!video && <p className="screen-empty">{isHost ? 'Paste a YouTube link to begin' : 'Waiting for the host to choose a video'}</p>}
      {error && <p className="screen-error">{error}</p>}
    </div>
  );
}
