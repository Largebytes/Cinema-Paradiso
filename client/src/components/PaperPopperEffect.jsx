// A burst of colourful paper pieces falling across the screen.
import { useState } from 'react';

const PIECE_COLORS = ['#D6B779', '#F0D9A0', '#641E2B', '#7FAD8B', '#D76A70', '#F5EFE6', '#5B8DEF'];
const PIECE_COUNT = 40;

// Makes random settings for each piece (position, size, colour, timing).
function makePieces() {
  return Array.from({ length: PIECE_COUNT }, () => ({
    left: Math.random() * 100,                          // % from the left edge
    size: 6 + Math.random() * 6,                        // px
    color: PIECE_COLORS[Math.floor(Math.random() * PIECE_COLORS.length)],
    delay: Math.random() * 0.5,                         // seconds before it starts falling
    duration: 2 + Math.random() * 1.5,                  // seconds to fall
    rotation: Math.floor(Math.random() * 360),          // starting angle
    drift: Math.round((Math.random() - 0.5) * 120),     // sideways movement in px
  }));
}

export default function PaperPopperEffect() {
  // useState with a function runs makePieces only once, so pieces don't change on re-render.
  const [pieces] = useState(makePieces);
  return (
    <>
      {pieces.map((p, index) => (
        <span
          key={index}
          className="paper-piece"
          style={{
            '--left': `${p.left}%`, '--size': `${p.size}px`, '--color': p.color,
            '--delay': `${p.delay}s`, '--duration': `${p.duration}s`,
            '--rotation': `${p.rotation}deg`, '--drift': `${p.drift}px`,
          }}
        />
      ))}
    </>
  );
}
