// Transparent layer that sits on top of the movie screen and plays reactions from everyone in the room.
import { useEffect, useState } from 'react';
import { socket } from '../socket.js';
import TomatoEffect from './TomatoEffect.jsx';
import PaperPopperEffect from './PaperPopperEffect.jsx';


// How long each effect stays on screen before it is removed.
const EFFECT_DURATION_MS = { tomato: 3500, popper: 4500 };

export default function ReactionLayer() {
  const [effects, setEffects] = useState([]); // effects currently playing

  useEffect(() => {
    function onReaction({ type, x, y }) {
      if (!EFFECT_DURATION_MS[type]) return;
      const id = `${Date.now()}-${Math.random()}`;
      setEffects((current) => [...current.slice(-5), { id, type, x, y }]); // at most 6 at once
      // Cleanup: remove the effect from the page when its animation is over.
      setTimeout(() => setEffects((current) => current.filter((e) => e.id !== id)), EFFECT_DURATION_MS[type]);
    }
    socket.on('reaction:show', onReaction);
    return () => socket.off('reaction:show', onReaction);
  }, []);

  return (
    <div className="reaction-layer">
      {effects.map((effect) =>
        effect.type === 'tomato'
          ? <TomatoEffect key={effect.id} x={effect.x} y={effect.y} />
          : <PaperPopperEffect key={effect.id} />
      )}
    </div>
  );
}
