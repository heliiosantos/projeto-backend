const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductOption = sequelize.define('ProductOption', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },

  shape: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },

  radius: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },

  type: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },

  values: {
    type: DataTypes.JSON,
    allowNull: false,
  },

  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'product_options',
  timestamps: true,
});

module.exports = ProductOption;