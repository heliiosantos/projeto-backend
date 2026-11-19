'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Produtos: adiciona os campos exigidos sem alterar os registros existentes.
    await queryInterface.addColumn('products', 'enabled', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('products', 'use_in_menu', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('products', 'stock', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.changeColumn('products', 'description', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.changeColumn('products', 'price', {
      type: Sequelize.FLOAT,
      allowNull: false,
    });
    await queryInterface.changeColumn('products', 'price_with_discount', {
      type: Sequelize.FLOAT,
      allowNull: false,
    });

    // Imagens: preserva os endereços atuais ao renomear content para path.
    await queryInterface.renameColumn('product_images', 'content', 'path');
    await queryInterface.addColumn('product_images', 'enabled', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    // Opções: prepara coluna temporária para converter JSON em texto separado por vírgulas.
    const [options] = await queryInterface.sequelize.query(
      'SELECT id, `values`, shape, radius, `type` FROM `product_options`'
    );

    await queryInterface.addColumn('product_options', 'values_text', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    for (const option of options) {
      let values = option.values;
      if (typeof values === 'string') {
        try {
          values = JSON.parse(values);
        } catch (_) {
          // Se já for texto simples, mantém o conteúdo.
        }
      }
      if (Array.isArray(values)) values = values.join(',');
      if (values === null || values === undefined) values = '';

      const parsedRadius = option.radius === null || option.radius === undefined
        ? 0
        : Number.parseInt(String(option.radius), 10);
      const radius = Number.isFinite(parsedRadius) ? parsedRadius : 0;
      const shape = ['square', 'circle'].includes(option.shape) ? option.shape : 'square';
      const type = ['text', 'color'].includes(option.type) ? option.type : 'text';

      await queryInterface.bulkUpdate(
        'product_options',
        { values_text: String(values), shape, radius, type },
        { id: option.id }
      );
    }

    await queryInterface.removeColumn('product_options', 'values');
    await queryInterface.renameColumn('product_options', 'values_text', 'values');
    await queryInterface.changeColumn('product_options', 'values', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.changeColumn('product_options', 'shape', {
      type: Sequelize.ENUM('square', 'circle'),
      allowNull: false,
      defaultValue: 'square',
    });
    await queryInterface.changeColumn('product_options', 'radius', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.changeColumn('product_options', 'type', {
      type: Sequelize.ENUM('text', 'color'),
      allowNull: false,
      defaultValue: 'text',
    });
  },

  async down(queryInterface, Sequelize) {
    // Reverte opções para o formato anterior (JSON com lista de valores).
    const [options] = await queryInterface.sequelize.query(
      'SELECT id, `values`, shape, radius, `type` FROM `product_options`'
    );
    await queryInterface.addColumn('product_options', 'values_json', {
      type: Sequelize.JSON,
      allowNull: true,
    });
    for (const option of options) {
      await queryInterface.bulkUpdate(
        'product_options',
        {
          values_json: String(option.values || '').split(',').filter(Boolean),
          shape: option.shape,
          radius: option.radius,
          type: option.type,
        },
        { id: option.id }
      );
    }
    await queryInterface.removeColumn('product_options', 'values');
    await queryInterface.renameColumn('product_options', 'values_json', 'values');
    await queryInterface.changeColumn('product_options', 'shape', {
      type: Sequelize.STRING(50), allowNull: true,
    });
    await queryInterface.changeColumn('product_options', 'radius', {
      type: Sequelize.STRING(50), allowNull: true,
    });
    await queryInterface.changeColumn('product_options', 'type', {
      type: Sequelize.STRING(50), allowNull: true,
    });

    await queryInterface.removeColumn('product_images', 'enabled');
    await queryInterface.renameColumn('product_images', 'path', 'content');

    await queryInterface.removeColumn('products', 'stock');
    await queryInterface.removeColumn('products', 'use_in_menu');
    await queryInterface.removeColumn('products', 'enabled');
    await queryInterface.changeColumn('products', 'description', {
      type: Sequelize.TEXT, allowNull: false,
    });
    await queryInterface.changeColumn('products', 'price', {
      type: Sequelize.DECIMAL(10, 2), allowNull: false,
    });
    await queryInterface.changeColumn('products', 'price_with_discount', {
      type: Sequelize.DECIMAL(10, 2), allowNull: true, defaultValue: 0,
    });
  },
};
