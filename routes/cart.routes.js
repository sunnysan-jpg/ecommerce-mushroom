const express = require('express');
const router = express.Router();
const pool = require('../config/db.config');
const { authMiddleware } = require('../middleware/auth.middleware');
const Sequelize = require('../config/db.config');
const Cart = require('../models/cart.model');
// Get user cart
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await Sequelize.query(`
      SELECT c.*, p.name, p.price, p.image_url, p.stock_quantity,p.description
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
    `, {
      bind: [req.user.id],
       type: Sequelize.QueryTypes.SELECT
    });
    
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add to cart
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const user_id = req.user.id;  

    // Check if item already exists in cart
    const existingItem = await pool.query(
      'SELECT * FROM cart WHERE user_id = $1 AND product_id = $2',
      {
   
        bind:[user_id, product_id],
        type: Sequelize.QueryTypes.SELECT
      }
    );   

    if (existingItem.length > 0) {
      // Update quantity
      const result = await pool.query(
        'UPDATE cart SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3 RETURNING *',
        {
          bind: [quantity, user_id, product_id],
          type: Sequelize.QueryTypes.update
        }
       
      );
      res.json(result.rows);  
    } else {
      // Add new item
      const result = await pool.query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
        {
bind:[user_id, product_id, quantity],
 type: Sequelize.QueryTypes.SELECT
        }
       
      );
      res.status(201).json(result[0]);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update cart item
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const user_id = req.user.id;

    const result = await pool.query(
      'UPDATE cart SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      {
        bind:  [quantity, id, user_id],
        type: Sequelize.QueryTypes.update
      }
    
    );

    if (result.length === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// remove whole cart - put this first
router.delete('/clear', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;  // ✅ use req.user.id from middleware

    const deleted = await Cart.destroy({
      where: { user_id: userId }
    });

    res.status(200).json({ message: 'Cart cleared successfully', deleted });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Failed to clear cart', error });
  }
});

// remove one item - keep this after
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const result = await pool.query(
      'DELETE FROM cart WHERE id = $1 AND user_id = $2 RETURNING *',
      {
        bind: [id, user_id],
        type: Sequelize.QueryTypes.DELETE
      }
    );

    if (result.length === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
 

module.exports = router;  