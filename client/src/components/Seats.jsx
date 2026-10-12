// Always shows 10 seats: occupied ones from real users, the rest empty.
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
}
