// The two reaction buttons, shown under the chat input.
import { useEffect, useState } from 'react';
import { request } from '../socket.js';


const COOLDOWN_SECONDS = 10; // must match the server; the server is the one that actually enforces it

export default function AudienceReactions() {
  const [secondsLeft, setSecondsLeft] = useState(0); // 0 means buttons are ready
  const [error, setError] = useState('');

  // Count down once per second while the cooldown is running.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  async function sendReaction(type) {
    if (secondsLeft > 0) return;
    setError('');
    setSecondsLeft(COOLDOWN_SECONDS); // start the cooldown right away so double clicks do nothing
    const reply = await request('reaction:send', { type });
    if (reply.error) {
      setError(reply.error);
      setSecondsLeft(reply.wait ? Math.ceil(reply.wait) : 0); // use the server's wait time if it sent one
    }
  }

  const waiting = secondsLeft > 0;
  return (
    <div className="reactions">
      <div className="reactions-buttons">
        <button className="reaction-btn" disabled={waiting} onClick={() => sendReaction('tomato')}>
          {waiting ? `Wait ${secondsLeft}s` : '🍅 Throw Tomato'}
        </button>
        <button className="reaction-btn" disabled={waiting} onClick={() => sendReaction('popper')}>
          {waiting ? `Wait ${secondsLeft}s` : '🎉 Paper Popper'}
        </button>
      </div>
      {error && <p className="reaction-error">{error}</p>}
    </div>
  );
}
