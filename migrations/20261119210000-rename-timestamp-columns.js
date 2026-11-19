'use strict';

// Alinha os nomes das colunas de timestamp ao enunciado sem apagar registros.
module.exports = {
  async up(queryInterface) {
    for (const table of ['users', 'categories', 'products']) {
      await queryInterface.renameColumn(table, 'createdAt', 'created_at');
      await queryInterface.renameColumn(table, 'updatedAt', 'updated_at');
    }
  },

  async down(queryInterface) {
    for (const table of ['products', 'categories', 'users']) {
      await queryInterface.renameColumn(table, 'created_at', 'createdAt');
      await queryInterface.renameColumn(table, 'updated_at', 'updatedAt');
    }
  },
};
