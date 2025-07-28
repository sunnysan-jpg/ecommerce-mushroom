const express = require('express');
const router = express.Router();
const pool = require('../config/db.config');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
// Get user orders
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, 
             json_agg(json_build_object(
               'product_id', oi.product_id,
               'product_name', p.name,
               'quantity', oi.quantity,
               'price', oi.price,
               'image_url', p.image_url
             )) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `,{
      bind: [req.user.id],
      type: Sequelize.QueryTypes.SELECT
    });
    
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create order
const { Sequelize } = require('sequelize');

router.post('/', authMiddleware, async (req, res) => {
  const { shipping_address, items } = req.body;
  const user_id = req.user.id;

  const transaction = await pool.transaction();  // 👈 Start transaction

  try {
    // 1. Calculate total amount
    let total_amount = 0;
    for (const item of items) {
      const productResult = await pool.query(
        'SELECT price FROM products WHERE id = $1',
        {
          bind: [item.product_id],
          type: Sequelize.QueryTypes.SELECT,
          transaction, // 👈 Add transaction context
        }
      );
      total_amount += productResult[0].price * item.quantity;
    }

    // 2. Create order
    const orderResult = await pool.query(
      'INSERT INTO orders (user_id, total_amount, shipping_address) VALUES ($1, $2, $3) RETURNING *',
      {
        bind: [user_id, total_amount, shipping_address],
        type: Sequelize.QueryTypes.SELECT,
        transaction,
      }
    );

    const order = orderResult[0];

    // 3. Insert order_items and update stock
    for (const item of items) {
      const productResult = await pool.query(
        'SELECT price FROM products WHERE id = $1',
        {
          bind: [item.product_id],
          type: Sequelize.QueryTypes.SELECT,
          transaction,
        }
      );
      const price = productResult[0].price;

      await pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        {
          bind: [order.id, item.product_id, item.quantity, price],
          type: Sequelize.QueryTypes.INSERT, // INSERT instead of SELECT
          transaction,
        }
      );

      await pool.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
        {
          bind: [item.quantity, item.product_id],
          type: Sequelize.QueryTypes.UPDATE,
          transaction,
        }
      );
    }

    // 4. Clear user's cart
    // await pool.query(
    //   'DELETE FROM cart WHERE user_id = $1',
    //   {
    //     bind: [user_id],
    //     type: Sequelize.QueryTypes.DELETE,
    //     transaction,
    //   }
    // );
  
    await transaction.commit(); // ✅ COMMIT if all succeeds
    res.status(201).json(order);
  
  } catch (error) {
    await transaction.rollback(); // ❌ ROLLBACK on failure
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});    




// Get single order
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT o.*, 
             json_agg(json_build_object(
               'product_id', oi.product_id,
               'product_name', p.name,
               'quantity', oi.quantity,
               'price', oi.price,
               'image_url', p.image_url
             )) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = $1 AND o.user_id = $2
      GROUP BY o.id
    `, [id, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status (admin only)
router.put('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});




module.exports = router;
