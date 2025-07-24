const jwt = require('jsonwebtoken');
const Sequelize = require('../config/db.config');



const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await Sequelize.query('SELECT * FROM users WHERE id = $1',  {
        bind: [decoded.id], // ✅ bind parameters properly
        type: Sequelize.QueryTypes.SELECT
      });
    
    if (result.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = result[0];
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};



const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };