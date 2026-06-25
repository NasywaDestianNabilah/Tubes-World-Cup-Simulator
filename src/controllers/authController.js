const jwt = require('jsonwebtoken');

const login = (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ 
      error: 'Password is required' 
    });
  }
  
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ 
      error: 'Invalid password' 
    });
  }
  
  const token = jwt.sign(
    { 
      role: 'admin',
      timestamp: Date.now()
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({ 
    token,
    message: 'Login successful',
    expiresIn: '24 hours'
  });
};

module.exports = { login };