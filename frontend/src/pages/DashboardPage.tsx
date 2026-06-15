import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LogOut, Activity, DollarSign, BrainCircuit, RefreshCw, Plus, List, Download, Target } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const ML_URL = 'http://localhost:8000';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Transaction form state
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [type, setType] = useState('expense');

  // Goals form state
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [goals, setGoals] = useState<any[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    fetchDashboardData();
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/goals`, { headers: { Authorization: `Bearer ${token}` } });
      setGoals(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      navigate('/');
    }
  };

  const handleAiAsk = async (optionalQuery?: string) => {
    const queryToUse = optionalQuery || aiQuery;
    if (!queryToUse) return;
    setAiResponse('Analyzing...');
    try {
      // Inject user's live financial data into the prompt invisibly
      const context = `[SYSTEM CONTEXT: User's Income is ₹${data?.totalIncome || 0}, Expense is ₹${data?.totalExpense || 0}, Balance is ₹${data?.balance || 0}. Credit Score: ${data?.creditRiskScore || 'N/A'}. Recent transactions: ${JSON.stringify(data?.transactions?.slice(0, 3) || [])}. Goals: ${JSON.stringify(goals.slice(0,2))}]. `;
      
      const res = await axios.post(`${ML_URL}/ask-ai`, { query: context + queryToUse });
      setAiResponse(res.data.response);
      if (optionalQuery) setAiQuery(''); 
    } catch (err) {
      setAiResponse('AI service unavailable at the moment.');
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/transactions`, {
        amount: parseFloat(amount),
        category,
        date,
        note,
        type
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAmount('');
      setNote('');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/goals`, { name: goalName, targetAmount: parseFloat(goalAmount) }, { headers: { Authorization: `Bearer ${token}` } });
      setGoalName('');
      setGoalAmount('');
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const allocateToGoal = async (id: string, name: string) => {
    const amountStr = window.prompt(`How much money would you like to allocate to ${name}? (Available balance: ₹${data?.balance?.toFixed(2) || 0})`);
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid positive number.");
      return;
    }
    if (data?.balance !== undefined && amount > data.balance) {
      alert("Insufficient balance! You cannot allocate more than your current balance.");
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/goals/${id}/allocate`, { amount }, { headers: { Authorization: `Bearer ${token}` } });
      fetchGoals();
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert("Failed to allocate funds.");
    }
  };

  const downloadCSV = () => {
    if (!data?.transactions) return;
    const header = "Date,Category,Note,Type,Amount\n";
    const csv = data.transactions.map((t: any) => 
      `${new Date(t.date).toLocaleDateString()},${t.category},"${t.note || ''}",${t.type},${t.amount}`
    ).join("\n");
    const blob = new Blob([header + csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finvision_transactions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[var(--color-vintage-cream)] text-[var(--color-vintage-dark)]">Loading Vault...</div>;
  }

  // Mock chart data based on recent transactions or just generic for demo
  const chartData = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 500 },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-vintage-cream)] p-6 font-sans">
      <nav className="flex justify-between items-center mb-8 bg-[var(--color-vintage-paper)] p-4 rounded-xl border border-[var(--color-vintage-gold)]/30 shadow-md">
        <div className="flex items-center gap-2">
          <Activity className="text-[var(--color-vintage-bronze)]" />
          <h1 className="text-xl font-serif font-bold text-[var(--color-vintage-dark)] tracking-wide">FinVision Dashboard</h1>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-[var(--color-vintage-bronze)] hover:text-[var(--color-vintage-dark)] transition-colors">
          <LogOut size={20} />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--color-vintage-dark)] text-[var(--color-vintage-cream)] p-6 rounded-xl shadow-lg border-b-4 border-[var(--color-vintage-gold)]">
          <div className="flex items-center gap-2 mb-2 text-[var(--color-vintage-gold)]">
            <DollarSign size={20} />
            <h3 className="font-semibold uppercase tracking-wider text-sm">Total Balance</h3>
          </div>
          <p className="text-4xl font-serif">₹{data?.balance?.toFixed(2)}</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[var(--color-vintage-paper)] p-6 rounded-xl shadow-md border border-[var(--color-vintage-gold)]/20">
          <h3 className="text-[var(--color-vintage-bronze)] font-semibold uppercase tracking-wider text-sm mb-2">Income & Expenses</h3>
          <p className="text-xl font-medium text-green-700">In: ₹{data?.totalIncome?.toFixed(2)}</p>
          <p className="text-xl font-medium text-red-700">Out: ₹{data?.totalExpense?.toFixed(2)}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[var(--color-vintage-paper)] p-6 rounded-xl shadow-md border border-[var(--color-vintage-gold)]/20 flex flex-col justify-between">
          <h3 className="text-[var(--color-vintage-bronze)] font-semibold uppercase tracking-wider text-sm mb-2">Credit Risk Score</h3>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-serif text-[var(--color-vintage-dark)]">{data?.creditRiskScore}</span>
            <span className="text-sm font-medium text-[var(--color-vintage-bronze)] mb-1">/ 850</span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 bg-[var(--color-vintage-paper)] p-6 rounded-xl shadow-md border border-[var(--color-vintage-gold)]/20">
          <h3 className="text-lg font-serif font-bold text-[var(--color-vintage-dark)] mb-6 border-b border-[var(--color-vintage-gold)]/20 pb-2">Cash Flow Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-vintage-bronze)" opacity={0.2} />
                <XAxis dataKey="name" stroke="var(--color-vintage-bronze)" />
                <YAxis stroke="var(--color-vintage-bronze)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-vintage-dark)', color: 'var(--color-vintage-cream)', border: 'none', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="value" stroke="var(--color-vintage-gold)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-vintage-dark)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="bg-[var(--color-vintage-dark)] text-[var(--color-vintage-cream)] p-6 rounded-xl shadow-lg flex flex-col">
          <div className="flex items-center gap-2 mb-6 border-b border-[var(--color-vintage-gold)]/30 pb-2">
            <BrainCircuit className="text-[var(--color-vintage-gold)]" />
            <h3 className="text-lg font-serif font-bold text-[var(--color-vintage-gold)]">Financial AI Assistant</h3>
          </div>
          
          <div className="flex-1 bg-[var(--color-vintage-cream)]/5 rounded-lg p-4 mb-4 min-h-[150px] overflow-y-auto font-medium text-sm text-[var(--color-vintage-paper)]">
            {aiResponse ? (
              <p className="leading-relaxed">{aiResponse}</p>
            ) : (
              <p className="text-[var(--color-vintage-bronze)] italic text-center mt-10">Ask a question to unlock insights.</p>
            )}
          </div>
          
          <div className="flex gap-2">
            <input 
              type="text" 
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="e.g. How to budget?" 
              className="flex-1 bg-[var(--color-vintage-cream)]/10 border border-[var(--color-vintage-gold)]/50 rounded p-2 text-sm text-[var(--color-vintage-cream)] placeholder-[var(--color-vintage-bronze)] focus:outline-none focus:border-[var(--color-vintage-gold)]"
              onKeyPress={(e) => e.key === 'Enter' && handleAiAsk()}
            />
            <button onClick={() => handleAiAsk("Please analyze my dashboard and give me 3 specific financial tips.")} className="bg-[var(--color-vintage-bronze)] text-[var(--color-vintage-cream)] px-3 py-2 rounded text-sm hover:opacity-90 transition-opacity whitespace-nowrap">
              Analyze Dashboard
            </button>
            <button onClick={() => handleAiAsk()} className="bg-[var(--color-vintage-gold)] text-[var(--color-vintage-dark)] p-2 rounded hover:bg-[var(--color-vintage-cream)] transition-colors">
              <RefreshCw size={18} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* New Section: Add Transaction & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-[var(--color-vintage-paper)] p-6 rounded-xl shadow-md border border-[var(--color-vintage-gold)]/20">
          <h3 className="text-lg font-serif font-bold text-[var(--color-vintage-dark)] mb-4 flex items-center gap-2 border-b border-[var(--color-vintage-gold)]/20 pb-2">
            <Plus size={20} className="text-[var(--color-vintage-bronze)]" />
            Add Transaction
          </h3>
          <form onSubmit={handleAddTransaction} className="space-y-4">
            <div className="flex gap-4">
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-1/3 bg-[var(--color-vintage-cream)] border border-[var(--color-vintage-gold)]/50 rounded p-2 text-sm text-[var(--color-vintage-dark)] focus:outline-none focus:ring-1 focus:ring-[var(--color-vintage-gold)]">
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" className="w-2/3 bg-[var(--color-vintage-cream)] border border-[var(--color-vintage-gold)]/50 rounded p-2 text-sm text-[var(--color-vintage-dark)] focus:outline-none focus:ring-1 focus:ring-[var(--color-vintage-gold)]" />
            </div>
            <div className="flex gap-4">
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-1/2 bg-[var(--color-vintage-cream)] border border-[var(--color-vintage-gold)]/50 rounded p-2 text-sm text-[var(--color-vintage-dark)] focus:outline-none focus:ring-1 focus:ring-[var(--color-vintage-gold)]" />
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-1/2 bg-[var(--color-vintage-cream)] border border-[var(--color-vintage-gold)]/50 rounded p-2 text-sm text-[var(--color-vintage-dark)] focus:outline-none focus:ring-1 focus:ring-[var(--color-vintage-gold)]">
                <option value="Food">Food</option>
                <option value="Travel">Travel</option>
                <option value="Shopping">Shopping</option>
                <option value="Bills">Bills</option>
                <option value="Salary">Salary</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className="w-full bg-[var(--color-vintage-cream)] border border-[var(--color-vintage-gold)]/50 rounded p-2 text-sm text-[var(--color-vintage-dark)] focus:outline-none focus:ring-1 focus:ring-[var(--color-vintage-gold)]" />
            <button type="submit" className="w-full py-2 bg-gradient-to-r from-[var(--color-vintage-dark)] to-[var(--color-vintage-bronze)] text-[var(--color-vintage-cream)] rounded font-medium shadow hover:opacity-90 transition-opacity">Save Record</button>
          </form>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="lg:col-span-2 bg-[var(--color-vintage-paper)] p-6 rounded-xl shadow-md border border-[var(--color-vintage-gold)]/20">
          <div className="flex justify-between items-center mb-4 border-b border-[var(--color-vintage-gold)]/20 pb-2">
            <h3 className="text-lg font-serif font-bold text-[var(--color-vintage-dark)] flex items-center gap-2">
              <List size={20} className="text-[var(--color-vintage-bronze)]" />
              Recent Vault Activity
            </h3>
            <button onClick={downloadCSV} className="text-xs bg-[var(--color-vintage-cream)] border border-[var(--color-vintage-gold)]/50 px-3 py-1 rounded text-[var(--color-vintage-dark)] hover:bg-[var(--color-vintage-gold)] transition-colors flex items-center gap-1">
              <Download size={14} /> Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[var(--color-vintage-bronze)] text-sm border-b border-[var(--color-vintage-gold)]/30">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Note</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data?.transactions?.length > 0 ? (
                  data.transactions.map((t: any) => (
                    <tr key={t.id} className="border-b border-[var(--color-vintage-gold)]/10 text-sm text-[var(--color-vintage-dark)]">
                      <td className="py-3">{new Date(t.date).toLocaleDateString()}</td>
                      <td className="py-3"><span className="px-2 py-1 bg-[var(--color-vintage-cream)] rounded border border-[var(--color-vintage-gold)]/30 text-xs">{t.category}</span></td>
                      <td className="py-3 text-[var(--color-vintage-bronze)]">{t.note || '-'}</td>
                      <td className={`py-3 text-right font-medium ${t.type === 'income' ? 'text-green-700' : 'text-[var(--color-vintage-dark)]'}`}>
                        {t.type === 'income' ? '+' : '-'}₹{t.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[var(--color-vintage-bronze)] italic">No transactions recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Financial Goals Section */}
      <div className="mt-6 bg-[var(--color-vintage-paper)] p-6 rounded-xl shadow-md border border-[var(--color-vintage-gold)]/20">
        <h3 className="text-lg font-serif font-bold text-[var(--color-vintage-dark)] mb-6 flex items-center gap-2 border-b border-[var(--color-vintage-gold)]/20 pb-2">
          <Target size={20} className="text-[var(--color-vintage-bronze)]" />
          Financial Planning & Goals
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <form onSubmit={handleAddGoal} className="space-y-4">
            <input type="text" required value={goalName} onChange={(e) => setGoalName(e.target.value)} placeholder="Goal Name (e.g. New Car)" className="w-full bg-[var(--color-vintage-cream)] border border-[var(--color-vintage-gold)]/50 rounded p-2 text-sm text-[var(--color-vintage-dark)] focus:outline-none focus:ring-1 focus:ring-[var(--color-vintage-gold)]" />
            <input type="number" required value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} placeholder="Target Amount" className="w-full bg-[var(--color-vintage-cream)] border border-[var(--color-vintage-gold)]/50 rounded p-2 text-sm text-[var(--color-vintage-dark)] focus:outline-none focus:ring-1 focus:ring-[var(--color-vintage-gold)]" />
            <button type="submit" className="w-full py-2 bg-[var(--color-vintage-dark)] text-[var(--color-vintage-cream)] rounded font-medium shadow hover:bg-[var(--color-vintage-bronze)] transition-colors">Create Goal</button>
          </form>

          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {goals.length > 0 ? goals.map(g => (
              <div key={g.id} className="bg-[var(--color-vintage-cream)] border border-[var(--color-vintage-gold)]/30 p-4 rounded-lg relative overflow-hidden">
                <div className="flex justify-between items-end mb-2">
                  <h4 className="font-medium text-[var(--color-vintage-dark)]">{g.name}</h4>
                  <span className="text-xs text-[var(--color-vintage-bronze)]">₹{g.currentAmount} / ₹{g.targetAmount}</span>
                </div>
                <div className="w-full bg-[var(--color-vintage-paper)] rounded-full h-2.5 border border-[var(--color-vintage-gold)]/20 mb-3">
                  <div className="bg-[var(--color-vintage-gold)] h-2.5 rounded-full" style={{ width: `${Math.min(100, (g.currentAmount / g.targetAmount) * 100)}%` }}></div>
                </div>
                <button onClick={() => allocateToGoal(g.id, g.name)} className="w-full text-xs py-1.5 bg-[var(--color-vintage-dark)] text-[var(--color-vintage-cream)] rounded font-medium shadow hover:bg-[var(--color-vintage-bronze)] transition-colors">
                  Allocate Funds
                </button>
              </div>
            )) : (
              <div className="col-span-2 flex items-center justify-center text-[var(--color-vintage-bronze)] italic">
                No financial goals set. Start planning!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
