const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },

  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },

  use_in_menu: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'categories',
  timestamps: true,
});

module.exports = Category;