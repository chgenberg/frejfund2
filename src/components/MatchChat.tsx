'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, X } from 'lucide-react';

interface MatchChatProps {
  introRequestId: string;
  userEmail: string;
  userType: 'vc' | 'founder';
  matchName: string; // Name of the other party
  onClose: () => void;
}

interface Message {
  id: string;
  senderType: string;
  senderEmail: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export default function MatchChat({ introRequestId, userEmail, userType, matchName, onClose }: MatchChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    // Subscribe via SSE
    const subId = Math.random().toString(36).slice(2);
    const es = new EventSource(`/api/messages/match/stream?introRequestId=${introRequestId}&subId=${subId}`);
    es.onmessage = (ev) => {
      try {
        const parsed = JSON.parse(ev.data);
        if (parsed?.message) {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === parsed.message.id);
            return exists ? prev : [...prev, parsed.message];
          });
        }
        if (parsed?.count) {
          // read receipt event -> refetch or ignore for now
        }
      } catch {}
    };
    es.addEventListener('message', () => {});
    es.addEventListener('read_receipt', () => {});
    es.onerror = () => {
      // Fallback silently; SSE may not work in some environments
    };
    return () => {
      try { es.close(); } catch {}
    };
  }, [introRequestId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/messages/match?introRequestId=${introRequestId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const tempMessage = {
      id: `temp-${Date.now()}`,
      senderType: userType,
      senderEmail: userEmail,
      content: inputValue,
      createdAt: new Date().toISOString(),
      isRead: false
    };

    setMessages(prev => [...prev, tempMessage]);
    setInputValue('');

    try {
      await fetch('/api/messages/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          introRequestId,
          senderType: userType,
          senderEmail: userEmail,
          content: inputValue
        })
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Mark messages as read when opened or updated
  useEffect(() => {
    const unreadFromOther = messages.some(m => !m.isRead && m.senderEmail !== userEmail);
    if (unreadFromOther) {
      fetch('/api/messages/match/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ introRequestId, readerEmail: userEmail })
      }).catch(()=>{});
    }
  }, [messages, introRequestId, userEmail]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full h-[600px] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-black p-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Chat with {matchName}</h3>
            <p className="text-xs text-gray-400">Matched conversation</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => {
              const isMe = message.senderEmail === userEmail;
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
                      isMe
                        ? 'bg-black text-white rounded-br-sm'
                        : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-xs ${isMe ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(message.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      {isMe && (
                        <span className={`text-[10px] ${message.isRead ? 'text-green-600' : 'text-gray-400'}`}>
                          {message.isRead ? 'Seen' : 'Sent'}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={sendMessage}
              disabled={!inputValue.trim()}
              className={`p-3 rounded-full transition-colors ${
                inputValue.trim()
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
