import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_for_interview';
const MONGO_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/finvision';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected successfully via Mongoose'))
  .catch(err => console.error('MongoDB connection error:', err));

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });
const User = mongoose.model('User', UserSchema);

const TransactionSchema = new mongoose.Schema({
  amount: Number,
  category: String,
  date: Date,
  note: String,
  type: { type: String, default: 'expense' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
const Transaction = mongoose.model('Transaction', TransactionSchema);

const GoalSchema = new mongoose.Schema({
  name: String,
  targetAmount: Number,
  currentAmount: { type: Number, default: 0 },
  deadline: Date,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
const Goal = mongoose.model('Goal', GoalSchema);

app.use(cors());
app.use(express.json());

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword });
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, username: user.username });
});

// --- Middleware ---
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.userId = decoded.userId;
    next();
  });
};

// --- Transaction Routes ---
app.get('/api/transactions', authenticate, async (req: any, res: any) => {
  const transactions = await Transaction.find({ userId: req.userId }).sort({ date: -1 });
  res.json(transactions.map(t => ({ ...t.toObject(), id: t._id })));
});

app.post('/api/transactions', authenticate, async (req: any, res: any) => {
  const { amount, category, date, note, type } = req.body;
  const transaction = await Transaction.create({ amount, category, date: new Date(date), note, type, userId: req.userId });
  res.status(201).json({ ...transaction.toObject(), id: transaction._id });
});

// --- Goals Routes ---
app.get('/api/goals', authenticate, async (req: any, res: any) => {
  const goals = await Goal.find({ userId: req.userId });
  res.json(goals.map(g => ({ ...g.toObject(), id: g._id })));
});

app.post('/api/goals', authenticate, async (req: any, res: any) => {
  const { name, targetAmount, deadline } = req.body;
  const goal = await Goal.create({ name, targetAmount, deadline: deadline ? new Date(deadline) : null, userId: req.userId });
  res.status(201).json({ ...goal.toObject(), id: goal._id });
});

app.post('/api/goals/:id/allocate', authenticate, async (req: any, res: any) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    
    await Transaction.create({
      amount,
      category: 'Savings',
      date: new Date(),
      note: `Allocated to goal: ${goal.name}`,
      type: 'expense',
      userId: req.userId
    });
    
    goal.currentAmount += amount;
    await goal.save();
    
    res.json({ message: 'Funds allocated successfully', goal: { ...goal.toObject(), id: goal._id } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Dashboard Data Route ---
app.get('/api/dashboard', authenticate, async (req: any, res: any) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId }).sort({ date: -1 });
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpense;

    const creditRiskScore = Math.min(850, Math.max(300, 600 + (totalIncome - totalExpense) / 100));

    res.json({
      totalIncome,
      totalExpense,
      balance,
      creditRiskScore: Math.round(creditRiskScore),
      transactions: transactions.slice(0, 5).map(t => ({ ...t.toObject(), id: t._id }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
