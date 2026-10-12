import { useState } from 'react';
export default function Login({ onLogin }) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [error, setError] = useState('');
  function submit(e) {
    e.preventDefault();
    if (!name.trim() || !contact.trim()) return setError('Please fill in both fields.');
    onLogin(name.trim(), contact.trim());
  }
  return (
    <main className="center-screen">
      <form className="panel" onSubmit={submit}>
        <h1 className="wordmark">Cinema Paradiso</h1>
        <input placeholder="Display name" maxLength={30} value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Username or email" value={contact} onChange={(e) => setContact(e.target.value)} />
        {error && <p className="error">{error}</p>}
        <button className="btn primary">Enter Cinema Paradiso</button>
        <p className="note">Local prototype profile, stored only in this browser. Not secure authentication; no password is used.</p>
      </form>
    </main>
  );
}
