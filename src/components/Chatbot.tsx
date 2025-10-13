'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const PREDEFINED_RESPONSES = {
  greeting: "Hello! I'm FrejFund's AI assistant. I can help you understand how we connect founders with investors, answer questions about our platform, or guide you through getting started. What would you like to know?",
  
  about: "FrejFund is an AI-powered platform that connects ambitious founders with the right investors. We use advanced matching algorithms to analyze your business and find investors who align with your vision, industry, and funding needs. Our platform is designed specifically for the European startup ecosystem.",
  
  howItWorks: "Here's how FrejFund works:\n\n1. **Tell us about your business** - Share your pitch, metrics, and goals\n2. **AI Analysis** - Our AI analyzes your business and readiness\n3. **Smart Matching** - We match you with relevant investors\n4. **Connect & Grow** - Get warm intros and coaching support\n\nThe whole process is designed to save you time and increase your chances of finding the right funding partner.",
  
  pricing: "FrejFund offers flexible pricing:\n\n• **Free Tier** - Basic analysis and limited matches\n• **Startup Plan** - Full AI coaching, unlimited matches, and investor insights\n• **Scale Plan** - Everything plus priority support and warm introductions\n\nWe believe in aligning our success with yours. Contact us for detailed pricing.",
  
  investors: "We work with 500+ active investors across Europe, including:\n• Angel investors\n• Venture capital firms\n• Corporate VCs\n• Impact investors\n\nOur network spans from early-stage seed investors to growth-stage funds, with a strong presence in Stockholm, London, Berlin, and other major tech hubs.",
  
  getStarted: "Getting started is easy!\n\n1. Click 'Get Started Free' on our homepage\n2. Tell us about your business (takes ~5 minutes)\n3. Receive your AI-powered analysis\n4. Start connecting with matched investors\n\nNo credit card required for the free tier!",
  
  locations: "FrejFund operates globally with a focus on Europe. We have dedicated pages for 250+ cities and countries, including major tech hubs like Stockholm, London, Berlin, Paris, and Amsterdam. Each location page is tailored to the local startup ecosystem.",
  
  success: "Our platform has helped startups:\n• Reduce fundraising time by 60%\n• Increase investor response rates by 4x\n• Get better terms through competitive processes\n• Access exclusive investor networks\n\nWe measure our success by your fundraising success.",
  
  security: "We take security seriously:\n• Bank-level encryption for all data\n• GDPR compliant\n• Your data is never shared without permission\n• Investors only see what you choose to share\n• Regular security audits",
  
  contact: "You can reach us through:\n• This chat - I'm here 24/7!\n• Email: hello@frejfund.com\n• Book a demo on our website\n• LinkedIn: FrejFund\n\nOur team typically responds within 24 hours."
};

const QUICK_ACTIONS = [
  "How does it work?",
  "Who are your investors?",
  "Pricing plans",
  "Get started"
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initial greeting
      addBotMessage(PREDEFINED_RESPONSES.greeting);
    }
  }, [isOpen]);

  useEffect(() => {
    // Listen for custom event to open chatbot
    const handleOpenChatbot = () => setIsOpen(true);
    window.addEventListener('openChatbot', handleOpenChatbot);
    
    return () => {
      window.removeEventListener('openChatbot', handleOpenChatbot);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addBotMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate bot thinking
    setTimeout(() => {
      const response = generateResponse(input);
      addBotMessage(response);
      setIsTyping(false);
    }, 1000);
  };

  const generateResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    // Check for greetings
    if (input.match(/^(hi|hello|hey|hej|hallå)/)) {
      return PREDEFINED_RESPONSES.greeting;
    }

    // Check for specific questions
    if (input.includes('how') && (input.includes('work') || input.includes('does'))) {
      return PREDEFINED_RESPONSES.howItWorks;
    }

    if (input.includes('pric') || input.includes('cost') || input.includes('fee')) {
      return PREDEFINED_RESPONSES.pricing;
    }

    if (input.includes('investor') || input.includes('vc') || input.includes('fund')) {
      return PREDEFINED_RESPONSES.investors;
    }

    if (input.includes('start') || input.includes('begin') || input.includes('sign up')) {
      return PREDEFINED_RESPONSES.getStarted;
    }

    if (input.includes('location') || input.includes('city') || input.includes('country')) {
      return PREDEFINED_RESPONSES.locations;
    }

    if (input.includes('success') || input.includes('result') || input.includes('testimonial')) {
      return PREDEFINED_RESPONSES.success;
    }

    if (input.includes('security') || input.includes('privacy') || input.includes('gdpr')) {
      return PREDEFINED_RESPONSES.security;
    }

    if (input.includes('contact') || input.includes('reach') || input.includes('email')) {
      return PREDEFINED_RESPONSES.contact;
    }

    if (input.includes('about') || input.includes('what is frejfund')) {
      return PREDEFINED_RESPONSES.about;
    }

    // Default response for unmatched queries
    return `I understand you're asking about "${userInput}". While I can help with general questions about FrejFund, for specific inquiries, I recommend:\n\n• Starting with our free analysis to see how we can help\n• Booking a demo for a personalized walkthrough\n• Emailing hello@frejfund.com for detailed questions\n\nIs there anything else about our platform, investors, or process I can help you with?`;
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
    handleSend();
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 bg-black rounded-full flex items-center justify-center shadow-2xl z-[9999] group"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 400 }}
      >
        {/* Mobile: Just the blinking dot */}
        <div className="sm:hidden w-14 h-14 flex items-center justify-center relative">
          <div className="w-2.5 h-2.5 bg-white rounded-full" />
          <motion.div
            className="absolute inset-0 w-2.5 h-2.5 bg-white rounded-full m-auto"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        </div>
        
        {/* Desktop: CHAT text with blinking dot */}
        <div className="hidden sm:flex items-center space-x-2 px-5 py-3">
          <div className="relative">
            <div className="w-2.5 h-2.5 bg-white rounded-full" />
            <motion.div
              className="absolute inset-0 w-2.5 h-2.5 bg-white rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </div>
          <span className="text-white font-medium text-sm tracking-wide">CHAT</span>
        </div>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 left-4 sm:left-auto w-auto sm:w-96 h-[500px] sm:h-[600px] bg-white rounded-2xl shadow-2xl z-[9999] flex flex-col overflow-hidden"
            style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
          >
            {/* Header */}
            <div className="bg-black text-white p-3 sm:p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-black rounded-full" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">FrejFund Assistant</h3>
                  <p className="text-[10px] sm:text-xs opacity-80">Always here to help</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] p-2.5 sm:p-3 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-black text-white rounded-br-md text-sm'
                        : 'bg-gray-100 text-gray-900 rounded-bl-md text-sm'
                    }`}
                  >
                    <div className="text-xs sm:text-sm">
                      {message.text.split('\n').map((line, idx) => {
                        // Check if line is a bullet point
                        const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
                        const lineContent = isBullet ? line.trim().substring(1).trim() : line;
                        
                        // Parse markdown-style bold text
                        const parts = lineContent.split(/(\*\*[^*]+\*\*)/);
                        
                        const parsedContent = parts.map((part, partIdx) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return (
                              <strong key={partIdx} className="font-semibold">
                                {part.slice(2, -2)}
                              </strong>
                            );
                          }
                          return part;
                        });
                        
                        if (isBullet) {
                          return (
                            <div key={idx} className={`flex items-start ${idx > 0 ? 'mt-1' : ''}`}>
                              <span className="mr-2">•</span>
                              <span>{parsedContent}</span>
                            </div>
                          );
                        }
                        
                        return (
                          <p key={idx} className={idx > 0 && !isBullet ? 'mt-3' : ''}>
                            {parsedContent}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1">
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length === 1 && (
              <div className="px-3 sm:px-4 pb-2">
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action}
                      onClick={() => handleQuickAction(action)}
                      className="px-2.5 sm:px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs sm:text-sm text-gray-700 transition-colors"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 sm:p-4 border-t border-gray-200">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-black transition-colors text-sm"
                  disabled={isTyping}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="p-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
