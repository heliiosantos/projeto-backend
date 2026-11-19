const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductImage = sequelize.define('ProductImage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  path: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'product_images',
  timestamps: true,
});

module.exports = ProductImage;
