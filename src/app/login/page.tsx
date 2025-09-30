'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Sparkles, Clock, MessageCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [showSessions, setShowSessions] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/session/save?email=${encodeURIComponent(email)}`);
      
      if (res.ok) {
        const data = await res.json();
        
        if (data.sessions && data.sessions.length > 0) {
          // User exists with sessions
          setSessions(data.sessions);
          setShowSessions(true);
          
          // Save user info to localStorage
          localStorage.setItem('frejfund-user-email', email);
          localStorage.setItem('frejfund-user-data', JSON.stringify(data.user));
        } else {
          // User exists but no sessions - go to wizard
          localStorage.setItem('frejfund-user-email', email);
          router.push('/?start=true');
        }
      } else if (res.status === 404) {
        // New user - go to wizard
        localStorage.setItem('frejfund-user-email', email);
        router.push('/?start=true');
      } else {
        setError('Failed to login. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    localStorage.setItem('frejfund-session-id', sessionId);
    router.push('/chat');
  };

  const handleNewSession = () => {
    // Create new session ID
    const newSessionId = `sess-${Date.now()}`;
    localStorage.setItem('frejfund-session-id', newSessionId);
    router.push('/?start=true');
  };

  if (showSessions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-black mb-2">Welcome back!</h1>
            <p className="text-gray-600">Select a session to continue or start fresh</p>
          </div>

          {/* Sessions List */}
          <div className="space-y-3 mb-6">
            {sessions.map((session) => (
              <motion.button
                key={session.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => handleSelectSession(session.id)}
                className="w-full bg-white rounded-xl p-6 border border-gray-200 hover:border-black transition-all text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-black mb-1">
                      {session.businessInfo?.company || 'Unnamed Session'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {session.businessInfo?.industry} • {session.businessInfo?.stage}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(session.lastActivity).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      {session.messageCount} messages
                    </div>
                  </div>
                </div>
                {session.lastMessage && (
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {session.lastMessage}...
                  </p>
                )}
              </motion.button>
            ))}
          </div>

          {/* New Session Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNewSession}
            className="w-full px-6 py-4 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            Start New Session
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">Welcome to FrejFund</h1>
          <p className="text-gray-600">Your AI business advisor is ready</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="founder@company.com"
                required
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black placeholder-gray-400"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full px-6 py-4 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-600 hover:text-black transition-colors"
          >
            ← Back to home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
