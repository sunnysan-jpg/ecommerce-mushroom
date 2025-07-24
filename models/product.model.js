const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');
const Category = require('./category.model');

const Product = sequelize.define('Product', {
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  stock_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  image_url: {
    type: DataTypes.STRING(500)
  },
  status: {
  type: DataTypes.BOOLEAN,
  allowNull: false,
  defaultValue: true
},
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'products',
  timestamps: false
});

// 🔗 Association
Product.belongsTo(Category, {
  foreignKey: 'category_id',
  onDelete: 'SET NULL'
});

Category.hasMany(Product, {
  foreignKey: 'category_id'
});

module.exports = Product;
