/*import { useEffect, useRef, useState } from 'react';
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
}*/
import { useEffect, useRef, useState } from 'react';
import { socket } from '../socket.js';
import AudienceReactions from './AudienceReactions.jsx';

// Emojis shown in the picker. Add or remove any you like.
const EMOJIS = ['😀', '😂', '😍', '😮', '😢', '😡', '👍', '👎', '👏', '🙌', '🔥', '❤️', '🎬', '🍿', '😴', '🤔', '🎉', '💀'];

export default function Chat({ initial }) {
  const [messages, setMessages] = useState(initial); // history only lives in memory
  const [text, setText] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false); // is the emoji panel showing?
  const end = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const onMsg = (m) => setMessages((prev) => [...prev, m]);
    socket.on('chat:message', onMsg);
    return () => socket.off('chat:message', onMsg);
  }, []);

  useEffect(() => {
    end.current?.scrollIntoView();
  }, [messages]);

  function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    socket.emit('chat:send', text.trim().slice(0, 300));
    setText('');
    setPickerOpen(false);
  }

  // Add the clicked emoji to the end of the message and keep typing.
  function addEmoji(emoji) {
    setText((t) => (t + emoji).slice(0, 300));
    inputRef.current?.focus();
  }

  return (
    <aside className="chat">
      <h2>Chat</h2>
      <div className="messages">
        {messages.map((m, i) => <p key={i} className="bubble"><b>{m.name}</b> {m.text}</p>)}
        <div ref={end} />
      </div>

      {pickerOpen && (
        <div className="emoji-panel">
          {EMOJIS.map((emoji) => (
            <button type="button" key={emoji} className="emoji-btn" onClick={() => addEmoji(emoji)}>{emoji}</button>
          ))}
        </div>
      )}

      <form className="chat-form" onSubmit={send}>
        {/* type="button" so clicking it does not send the message */}
        <button type="button" className="emoji-toggle" onClick={() => setPickerOpen((o) => !o)} aria-label="Choose emoji">☺</button>
        <input ref={inputRef} placeholder="Message" maxLength={300} value={text} onChange={(e) => setText(e.target.value)} />
      </form>
      <AudienceReactions />
    </aside>
  );
}
