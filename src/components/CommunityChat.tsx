import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Send, User, Bot, LogIn } from 'lucide-react';
import { getAIStewardResponse } from '../services/gemini';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
  isAI?: boolean;
}

interface Location {
  id: string;
  name: string;
  city: string;
  country: string;
  description: string;
  intellectualTags: string[];
}

export default function CommunityChat({ communityId, location }: { communityId: string, location: Location }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track auth state changes within the chat
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((u) => setCurrentUser(u));
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'communities', communityId, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
    }, (error) => {
      console.error("Chat error:", error);
    });

    return () => unsubscribe();
  }, [communityId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const triggerAISteward = async (userMessage: string) => {
    setIsTyping(true);
    try {
      const responseText = await getAIStewardResponse(userMessage, {
        name: location.name,
        city: location.city,
        country: location.country,
        tags: location.intellectualTags,
        description: location.description
      });

      const aiResponse = responseText || "I'm here to help you navigate the community formation process in " + location.name + ".";

      await addDoc(collection(db, 'communities', communityId, 'messages'), {
        senderId: 'ai-steward',
        senderName: 'AI Steward',
        text: aiResponse,
        timestamp: serverTimestamp(),
        isAI: true
      });
    } catch (error) {
      console.error("AI Steward error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const text = newMessage;
    setNewMessage('');

    try {
      await addDoc(collection(db, 'communities', communityId, 'messages'), {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Nomad',
        text: text,
        timestamp: serverTimestamp()
      });

      // Trigger AI if mentioned or message is a question
      if (text.toLowerCase().includes('steward') || text.toLowerCase().includes('ai') || text.includes('?')) {
        setTimeout(() => triggerAISteward(text), 1000);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-900 border border-white/5 overflow-hidden">
      <div className="p-3 border-b border-white/5 bg-stone-800/50 flex justify-between items-center">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Live Chat</h3>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
          <span className="text-[8px] font-bold text-sky-500 uppercase tracking-tighter">AI Steward Active</span>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
      >
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full py-4 text-center">
            <Bot size={24} className="text-sky-500/40 mb-2" />
            <p className="text-[10px] text-stone-600">Start the conversation. Ask the AI Steward anything about this community.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col ${msg.senderId === currentUser?.uid ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              {msg.isAI && <Bot size={10} className="text-sky-500" />}
              {!msg.isAI && <User size={10} className="text-stone-500" />}
              <span className={`text-[9px] font-bold uppercase tracking-wider ${msg.isAI ? 'text-sky-500' : 'text-stone-500'}`}>
                {msg.senderName}
              </span>
            </div>
            <div className={`px-3 py-2 rounded-xl max-w-[90%] text-[11px] leading-relaxed ${
              msg.senderId === currentUser?.uid 
                ? 'bg-sky-500 text-stone-950 font-medium rounded-tr-none' 
                : msg.isAI
                  ? 'bg-sky-500/10 text-emerald-100 rounded-tl-none border border-sky-500/20'
                  : 'bg-stone-800 text-stone-200 rounded-tl-none border border-white/5'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 mb-1">
              <Bot size={10} className="text-sky-500" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-sky-500">AI Steward</span>
            </div>
            <div className="bg-sky-500/5 border border-sky-500/10 px-3 py-2 rounded-xl rounded-tl-none">
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-1 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {currentUser ? (
        <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 flex gap-2 bg-stone-900">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ask the Steward or chat with the community..."
            className="flex-1 bg-stone-800 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-stone-200 placeholder-stone-600 focus:ring-1 focus:ring-emerald-500 outline-none"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="w-8 h-8 rounded-xl bg-sky-500 text-stone-950 flex items-center justify-center hover:bg-sky-400 transition-colors shadow-lg disabled:opacity-40"
          >
            <Send size={14} />
          </button>
        </form>
      ) : (
        <div className="p-3 border-t border-white/5 bg-stone-900/80 flex items-center justify-center gap-2">
          <LogIn size={14} className="text-stone-500" />
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Sign in to join the conversation</span>
        </div>
      )}
    </div>
  );
}
