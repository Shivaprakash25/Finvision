import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Landmark, User, KeyRound } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export default function LandingPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        const res = await axios.post(`${API_URL}/auth/login`, { username, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('username', res.data.username);
        navigate('/dashboard');
      } else {
        await axios.post(`${API_URL}/auth/register`, { username, password });
        setIsLogin(true);
        setError('Registration successful! Please login.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-vintage-cream)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full border border-[var(--color-vintage-gold)] mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full border border-[var(--color-vintage-bronze)] mix-blend-multiply"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[var(--color-vintage-paper)] p-10 rounded-2xl shadow-2xl border border-[var(--color-vintage-gold)]/30 backdrop-blur-md">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-[var(--color-vintage-dark)] p-4 rounded-full mb-4 shadow-lg border border-[var(--color-vintage-gold)]">
              <Landmark className="w-10 h-10 text-[var(--color-vintage-gold)]" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-[var(--color-vintage-dark)] tracking-tight">FinVision</h1>
            <p className="text-[var(--color-vintage-bronze)] mt-2 font-medium tracking-wide">ENTERPRISE WEALTH</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-[var(--color-vintage-bronze)]" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-[var(--color-vintage-gold)]/50 rounded-lg bg-[var(--color-vintage-cream)]/50 text-[var(--color-vintage-dark)] placeholder-[var(--color-vintage-bronze)]/70 focus:outline-none focus:ring-2 focus:ring-[var(--color-vintage-gold)] focus:bg-[var(--color-vintage-cream)] transition-all"
                  placeholder="Username / Client ID"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-[var(--color-vintage-bronze)]" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-[var(--color-vintage-gold)]/50 rounded-lg bg-[var(--color-vintage-cream)]/50 text-[var(--color-vintage-dark)] placeholder-[var(--color-vintage-bronze)]/70 focus:outline-none focus:ring-2 focus:ring-[var(--color-vintage-gold)] focus:bg-[var(--color-vintage-cream)] transition-all"
                  placeholder="Passcode"
                />
              </div>
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-sm text-red-700 text-center bg-red-100/50 p-2 rounded"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-[var(--color-vintage-cream)] bg-gradient-to-r from-[var(--color-vintage-dark)] to-[var(--color-vintage-bronze)] hover:from-[var(--color-vintage-bronze)] hover:to-[var(--color-vintage-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-vintage-gold)] transition-all duration-300 transform hover:-translate-y-0.5"
            >
              {isLogin ? 'Access Vault' : 'Establish Account'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-sm font-medium text-[var(--color-vintage-bronze)] hover:text-[var(--color-vintage-dark)] transition-colors underline decoration-[var(--color-vintage-gold)]/50 underline-offset-4"
            >
              {isLogin ? "New to FinVision? Establish Account" : "Already a client? Access Vault"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
