'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Send, ArrowLeft, Check, CheckCheck, User, Building2 } from 'lucide-react';

interface Conversation {
  id: string;
  founderId: string;
  founderName: string;
  founderCompany: string;
  founderLogo?: string;
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

export default function VCMessagesPage() {
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
          senderType: 'vc',
        }),
      });

      if (res.ok) {
        setInputValue('');
        await loadMessages(activeConvo.id);
        await loadConversations(); // Refresh last message
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Conversations Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => router.push('/vc')}
            className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h2 className="text-lg font-bold text-black">Messages</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No conversations yet</p>
              <p className="text-sm mt-2">Start swiping to connect with founders</p>
            </div>
          ) : (
            conversations.map((convo) => (
              <motion.div
                key={convo.id}
                whileHover={{ backgroundColor: '#f9fafb' }}
                onClick={() => setActiveConvo(convo)}
                className={`p-4 cursor-pointer border-b border-gray-100 ${
                  activeConvo?.id === convo.id ? 'bg-gray-100' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    {convo.founderLogo ? (
                      <img src={convo.founderLogo} alt="" className="w-full h-full rounded-full" />
                    ) : (
                      <Building2 className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-black truncate">{convo.founderCompany}</h3>
                      {convo.unreadCount > 0 && (
                        <span className="w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {convo.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">{convo.founderName}</p>
                    <p className="text-xs text-gray-500 truncate mt-1">{convo.lastMessage}</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Messages Panel */}
      <div className="flex-1 flex flex-col">
        {activeConvo ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  {activeConvo.founderLogo ? (
                    <img
                      src={activeConvo.founderLogo}
                      alt=""
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <Building2 className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-black">{activeConvo.founderCompany}</h2>
                  <p className="text-sm text-gray-600">{activeConvo.founderName}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderType === 'vc' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md px-4 py-2 rounded-2xl ${
                      msg.senderType === 'vc'
                        ? 'bg-black text-white'
                        : 'bg-white border border-gray-200 text-black'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <div
                      className={`flex items-center gap-1 mt-1 text-xs ${
                        msg.senderType === 'vc' ? 'text-gray-300' : 'text-gray-500'
                      }`}
                    >
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {msg.senderType === 'vc' && (
                        <>{msg.isRead ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}</>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || sending}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}

