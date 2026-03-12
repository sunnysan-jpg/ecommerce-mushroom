const express = require('express');
const router = express.Router();
const Sequelize = require('../config/db.config');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');

// Admin: Get all customers with order stats
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await Sequelize.query(`
      SELECT u.id, u.name, u.email, u.phone, u.address, u.role,
             u.auth_provider, u.is_verified, u."createdAt",
             COUNT(o.id) AS total_orders,
             COALESCE(SUM(o.total_amount), 0) AS total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role != 'admin'
      GROUP BY u.id
      ORDER BY u."createdAt" DESC
    `, {
      type: Sequelize.QueryTypes.SELECT
    });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
