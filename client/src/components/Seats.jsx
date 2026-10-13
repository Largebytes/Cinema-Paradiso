/*// Always shows 10 seats: occupied ones from real users, the rest empty.
export default function Seats({ users, hostId, myId }) {
  const seats = Array.from({ length: 10 }, (_, i) => users[i] || null);
  return (
    <div className="seats">
      {seats.map((u, i) => (
        <div key={i} className={'seat' + (u ? ' taken' : '') + (u && u.id === hostId ? ' host' : '')}>
          {u ? (u.id === myId ? u.name + ' (you)' : u.name) : ''}
        </div>
      ))}
    </div>
  );
}*/
// Always shows 10 seats. Guests also show how far ahead/behind the host they are.
function syncLabel(offset) {
  if (offset === undefined) return '';              // no report yet
  if (Math.abs(offset) < 2) return 'in sync';       // same 2s tolerance the player uses
  const secs = Math.round(Math.abs(offset));
  return offset > 0 ? `${secs}s ahead` : `${secs}s behind`;
}

export default function Seats({ users, hostId, myId, offsets }) {
  const seats = Array.from({ length: 10 }, (_, i) => users[i] || null);
  return (
    <div className="seats">
      {seats.map((u, i) => (
        <div key={i} className={'seat' + (u ? ' taken' : '') + (u && u.id === hostId ? ' host' : '')}>
          <span className="seat-name">{u ? (u.id === myId ? u.name + ' (you)' : u.name) : ''}</span>
          {u && u.id !== hostId && <span className="seat-sync">{syncLabel(offsets[u.id])}</span>}
        </div>
      ))}
    </div>
  );
}
