const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('user', 'admin','customer'),
    defaultValue: 'user',
  },
    phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
    auth_provider: {
    type: DataTypes.ENUM('manual', 'google'),
    defaultValue: 'manual',
  },

  is_verified: {
    type: DataTypes.BOOLEAN,  
    defaultValue: true
  },
},{

 tableName: 'users'
});

module.exports = User;
