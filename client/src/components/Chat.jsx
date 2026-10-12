import { useEffect, useRef, useState } from 'react';
import { socket } from '../socket.js';
export default function Chat({ initial }) {
  const [messages, setMessages] = useState(initial); // history only lives in memory
  const [text, setText] = useState('');
  const end = useRef(null);
  useEffect(() => {
    const onMsg = (m) => setMessages((prev) => [...prev, m]);
    socket.on('chat:message', onMsg);
    return () => {socket.off('chat:message', onMsg);};
  }, []);
  useEffect(() => {
    end.current?.scrollIntoView();
  }, [messages]);
  function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    socket.emit('chat:send', text.trim().slice(0, 300));
    setText('');
  }
  return (
    <aside className="chat">
      <h2>Chat</h2>
      <div className="messages">
        {messages.map((m, i) => <p key={i} className="bubble"><b>{m.name}</b> {m.text}</p>)}
        <div ref={end} />
      </div>
      <form onSubmit={send}><input placeholder="Message" maxLength={300} value={text} onChange={(e) => setText(e.target.value)} /></form>
    </aside>
  );
}
