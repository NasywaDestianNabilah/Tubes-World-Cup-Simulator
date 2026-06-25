const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ROUTE LOGIN
app.post('/login', (req, res) => {
  console.log('📝 Login hit!');
  console.log('Body:', req.body);
  
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }
  
  if (password !== 'admin123') {
    return res.status(401).json({ error: 'Wrong password' });
  }
  
  const token = jwt.sign({ role: 'admin' }, 'secret123', { expiresIn: '24h' });
  res.json({ token, message: 'Login OK!' });
});

// ROUTE TEST
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
  console.log(`🔐 POST http://localhost:${PORT}/login`);
  console.log(`📝 GET http://localhost:${PORT}/test`);
});