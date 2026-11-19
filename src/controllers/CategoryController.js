const { Op, ValidationError, UniqueConstraintError } = require('sequelize');
const { Category } = require('../models');

class CategoryController {
  async create(req, res) {
    try {
      const { name, slug, use_in_menu } = req.body;
      if (!name || !slug) {
        return res.status(400).json({ message: 'Nome e slug são obrigatórios.' });
      }
      if (use_in_menu !== undefined && typeof use_in_menu !== 'boolean') {
        return res.status(400).json({ message: 'use_in_menu deve ser booleano.' });
      }

      const category = await Category.create({ name, slug, use_in_menu: use_in_menu ?? false });
      return res.status(201).json(category);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof UniqueConstraintError) {
        return res.status(400).json({ message: 'Dados de categoria inválidos ou duplicados.' });
      }
      console.error('Erro ao cadastrar categoria:', error);
      return res.status(500).json({ message: 'Erro interno ao cadastrar categoria.' });
    }
  }

  async search(req, res) {
    try {
      const rawLimit = req.query.limit === undefined ? '12' : req.query.limit;
      const rawPage = req.query.page === undefined ? '1' : req.query.page;
      const { fields, use_in_menu: useInMenu } = req.query;
      const limit = Number(rawLimit);
      const page = Number(rawPage);

      if (!Number.isInteger(limit) || (limit !== -1 && limit < 1)) {
        return res.status(400).json({ message: 'limit deve ser um inteiro positivo ou -1.' });
      }
      if (!Number.isInteger(page) || page < 1) {
        return res.status(400).json({ message: 'page deve ser um inteiro maior ou igual a 1.' });
      }
      if (useInMenu !== undefined && !['true', 'false'].includes(String(useInMenu).toLowerCase())) {
        return res.status(400).json({ message: 'use_in_menu deve ser true ou false.' });
      }

      let attributes;
      if (fields !== undefined) {
        const allowedFields = ['name', 'slug'];
        attributes = String(fields).split(',').map((field) => field.trim()).filter(Boolean);
        if (!attributes.length || attributes.some((field) => !allowedFields.includes(field))) {
          return res.status(400).json({ message: 'fields aceita somente name e slug.' });
        }
        attributes = [...new Set(attributes)];
      }

      const where = {};
      if (useInMenu !== undefined) where.use_in_menu = String(useInMenu).toLowerCase() === 'true';

      const queryOptions = { where, attributes, order: [['id', 'ASC']] };
      let data;
      let total;

      if (limit === -1) {
        data = await Category.findAll(queryOptions);
        total = data.length;
      } else {
        const result = await Category.findAndCountAll({
          ...queryOptions,
          limit,
          offset: (page - 1) * limit,
        });
        data = result.rows;
        total = result.count;
      }

      return res.status(200).json({ data, total, limit, page: limit === -1 ? 1 : page });
    } catch (error) {
      console.error('Erro ao pesquisar categorias:', error);
      return res.status(500).json({ message: 'Erro interno ao pesquisar categorias.' });
    }
  }

  async findAll(req, res) {
    try {
      const categories = await Category.findAll();
      return res.status(200).json(categories);
    } catch (error) {
      console.error('Erro ao listar categorias:', error);
      return res.status(500).json({ message: 'Erro interno ao listar categorias.' });
    }
  }

  async findOne(req, res) {
    try {
      const category = await Category.findByPk(req.params.id);
      if (!category) return res.status(404).json({ message: 'Categoria não encontrada.' });
      return res.status(200).json(category);
    } catch (error) {
      console.error('Erro ao consultar categoria:', error);
      return res.status(500).json({ message: 'Erro interno ao consultar categoria.' });
    }
  }

  async update(req, res) {
    try {
      const { name, slug, use_in_menu: useInMenu } = req.body;
      if (name === undefined && slug === undefined && useInMenu === undefined) {
        return res.status(400).json({ message: 'Informe name, slug ou use_in_menu para atualizar.' });
      }
      if (useInMenu !== undefined && typeof useInMenu !== 'boolean') {
        return res.status(400).json({ message: 'use_in_menu deve ser booleano.' });
      }

      const category = await Category.findByPk(req.params.id);
      if (!category) return res.status(404).json({ message: 'Categoria não encontrada.' });
      if (name !== undefined) category.name = name;
      if (slug !== undefined) category.slug = slug;
      if (useInMenu !== undefined) category.use_in_menu = useInMenu;
      await category.save();
      return res.status(204).send();
    } catch (error) {
      if (error instanceof ValidationError || error instanceof UniqueConstraintError) {
        return res.status(400).json({ message: 'Dados de categoria inválidos ou duplicados.' });
      }
      console.error('Erro ao atualizar categoria:', error);
      return res.status(500).json({ message: 'Erro interno ao atualizar categoria.' });
    }
  }

  async remove(req, res) {
    try {
      const category = await Category.findByPk(req.params.id);
      if (!category) return res.status(404).json({ message: 'Categoria não encontrada.' });
      await category.destroy();
      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      return res.status(500).json({ message: 'Erro interno ao excluir categoria.' });
    }
  }
}

module.exports = new CategoryController();
