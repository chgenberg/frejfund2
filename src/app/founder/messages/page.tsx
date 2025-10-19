'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Send, ArrowLeft, Check, CheckCheck, Building2, User } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Conversation {
  id: string;
  vcEmail: string;
  vcName: string;
  vcFirm: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: string;
}

interface Message {
  id: string;
  content: string;
  senderType: 'vc' | 'founder';
  senderEmail: string;
  isRead: boolean;
  createdAt: string;
}

export default function FounderMessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConvo) {
      loadMessages(activeConvo.id);
    }
  }, [activeConvo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const res = await fetch('/api/messages/match');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        if (data.conversations?.length > 0 && !activeConvo) {
          setActiveConvo(data.conversations[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadMessages = async (introRequestId: string) => {
    try {
      const res = await fetch(`/api/messages/match?introRequestId=${introRequestId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        // Mark as read
        await fetch('/api/messages/match/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ introRequestId }),
        });
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !activeConvo) return;

    setSending(true);
    try {
      const res = await fetch('/api/messages/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          introRequestId: activeConvo.id,
          content: inputValue,
          senderType: 'founder',
        }),
      });

      if (res.ok) {
        setInputValue('');
        await loadMessages(activeConvo.id);
        await loadConversations();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <div className="flex-1 flex pt-20">
        {/* Conversations Sidebar */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-white">
            <h2 className="text-xl font-bold text-black">Messages</h2>
            <p className="text-sm text-gray-600 mt-1">
              {conversations.length} active conversation{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No messages yet</p>
                <p className="text-sm mt-2">VCs will reach out when interested</p>
              </div>
            ) : (
              conversations.map((convo) => (
                <motion.div
                  key={convo.id}
                  whileHover={{ backgroundColor: '#ffffff' }}
                  onClick={() => setActiveConvo(convo)}
                  className={`p-4 cursor-pointer border-b border-gray-100 transition-all ${
                    activeConvo?.id === convo.id ? 'bg-white' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                      {convo.vcFirm.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-black truncate text-sm">
                          {convo.vcFirm}
                        </h3>
                        {convo.unreadCount > 0 && (
                          <span className="w-5 h-5 bg-black text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {convo.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{convo.lastMessage}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Messages Panel */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {activeConvo ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {activeConvo.vcFirm.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-semibold text-black text-sm">{activeConvo.vcFirm}</h2>
                    <p className="text-xs text-gray-500">{activeConvo.vcName}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-white">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderType === 'founder' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md px-4 py-3 rounded-3xl ${
                        msg.senderType === 'founder'
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-black'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <div
                        className={`flex items-center gap-1 mt-1.5 text-xs ${
                          msg.senderType === 'founder' ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {msg.senderType === 'founder' && (
                          <>
                            {msg.isRead ? (
                              <CheckCheck className="w-3 h-3" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Message..."
                    className="flex-1 px-4 py-3 bg-gray-50 border-0 rounded-3xl focus:ring-2 focus:ring-gray-200 focus:bg-white transition-all text-sm"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={sendMessage}
                    disabled={!inputValue.trim() || sending}
                    className="w-10 h-10 bg-black text-white rounded-full hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
