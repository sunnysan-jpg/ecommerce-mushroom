const pool = require('../config/db.config');
const Product = require('../models/product.model');

// const getAllProducts = async (req, res) => {
//   try {
//     const { category, search, limit = 10, offset = 0 } = req.query;
    
//     let query = `
//       SELECT p.*, c.name as category_name 
//       FROM products p 
//       LEFT JOIN categories c ON p.category_id = c.id 
//       WHERE 1=1
//     `;
//     const params = [];
  
//     if (category) {
//       query += ' AND c.name = $' + (params.length + 1);
//       params.push(category);
//     }

//     if (search) {
//       query += ' AND (p.name ILIKE $' + (params.length + 1) + ' OR p.description ILIKE $' + (params.length + 1) + ')';
//       params.push(`%${search}%`);
//     }

//     query += ' ORDER BY p.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
//     params.push(limit, offset);

//     const result = await pool.query(query, params);
//     res.json(result.rows);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

const getAllProducts = async (req, res) => {
  try {
    const { category, search, limit = 10, offset = 0 } = req.query;

    let query = `
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;

    const bindParams = [];

    if (category) {
      query += ` AND c.name = $${bindParams.length + 1}`;
      bindParams.push(category);
    }

    if (search) {
      query += ` AND (p.name ILIKE $${bindParams.length + 1} OR p.description ILIKE $${bindParams.length + 1})`;
      bindParams.push(`%${search}%`);
    }

    // LIMIT and OFFSET
    query += ` ORDER BY p.created_at DESC LIMIT $${bindParams.length + 1} OFFSET $${bindParams.length + 2}`;
    bindParams.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, {
      bind: bindParams,
      type: pool.QueryTypes.SELECT
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1',
            {
        bind: [id], // ✅ bind parameters properly
        type: pool.QueryTypes.SELECT
      });  
      

    if (result.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
  
    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }  
};

const createProduct = async (req, res) => {  
  try {
    const { name, description, price, category_id, stock_quantity,status } = req.body;

    const image_url = req.file?.path; // 👈 Cloudinary image URL

    const result = await pool.query(
      `INSERT INTO products 
      (name, description, price, category_id, stock_quantity, image_url,status) 
      VALUES ($1, $2, $3, $4, $5, $6,$7) RETURNING *`,
      {
  bind: [name, description, price, category_id, stock_quantity, image_url,status],
  type: pool.QueryTypes.INSERT,
}
    );
  
    res.status(201).json(result.rows);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// const updateProduct = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, description, price, category_id, stock_quantity, image_url } = req.body;

//     const result = await pool.query(
//       'UPDATE products SET name = $1, description = $2, price = $3, category_id = $4, stock_quantity = $5, image_url = $6 WHERE id = $7 RETURNING *',
//       [name, description, price, category_id, stock_quantity, image_url, id]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: 'Product not found' });
//     }

//     res.json(result.rows[0]);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const {
      name,
      description,
      price,
      category_id,
      stock_quantity
    } = req.body;

    // Find the product
    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // If a new image is uploaded
    let image_url = product.image_url;
    if (req.file && req.file.path) {
      image_url = req.file.path;
    }

    // Update product
    await product.update({
      name,
      description,
      price,
      category_id,
      stock_quantity,
      image_url
    });

    return res.status(200).json({
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories
};