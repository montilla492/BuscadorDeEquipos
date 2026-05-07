import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  limit, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Message } from '../types';
import { Send, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatProps {
  squadId: string;
  user: any;
}

export const Chat: React.FC<ChatProps> = ({ squadId, user }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'squads', squadId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, (error) => {
      console.warn("Chat access restricted:", error.message);
    });
  }, [squadId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      await addDoc(collection(db, 'squads', squadId, 'messages'), {
        squadId,
        senderId: user.uid,
        senderName: user.displayName || 'Anon',
        senderPhoto: user.photoURL || '',
        text: text.trim(),
        createdAt: serverTimestamp()
      });
      setText('');
    } catch (err) {
      console.error("Chat error:", err);
    }
  };

  return (
    <div className="flex flex-col h-[300px] md:h-[400px] border border-white/10 bg-void/50 rounded-sm overflow-hidden">
      <div className="p-3 border-b border-white/10 flex items-center gap-2 bg-nebula">
        <Hash size={14} className="text-neon-green" />
        <span className="font-mono text-[10px] font-black uppercase tracking-widest">Canal_de_Voz_Text_Sync</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex gap-3 ${msg.senderId === user.uid ? 'flex-row-reverse' : ''}`}
            >
              <img src={msg.senderPhoto} className="w-8 h-8 rounded-sm shrink-0 border border-white/10" />
              <div className={`max-w-[70%] ${msg.senderId === user.uid ? 'items-end' : ''} flex flex-col`}>
                <span className="text-[8px] font-mono text-white/30 uppercase mb-1">{msg.senderName}</span>
                <p className={`p-2 text-xs font-mono brutal-border ${msg.senderId === user.uid ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' : 'bg-white/5 text-on-surface'}`}>
                  {msg.text}
                </p>
              </div>
            </motion.div>
          ))}
          <div ref={scrollRef} />
        </AnimatePresence>
      </div>

      <form onSubmit={handleSend} className="p-2 border-t border-white/10 bg-nebula flex gap-2">
        <input 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribir mensaje..."
          className="flex-1 bg-void border border-white/10 px-3 py-2 text-xs font-mono outline-none focus:border-neon-green transition-all"
        />
        <button type="submit" className="p-2 bg-neon-green text-black hover:scale-105 active:scale-95 transition-all">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
