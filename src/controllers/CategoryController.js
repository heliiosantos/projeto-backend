
const { Category } = require('../models');

class CategoryController {
  // Cadastrar categoria
  async create(req, res) {
    try {
      const { name, slug, use_in_menu } = req.body;

      if (!name || !slug) {
        return res.status(400).json({
          message: 'Nome e slug são obrigatórios.',
        });
      }

      const categoryExists = await Category.findOne({
        where: {
          name,
        },
      });

      if (categoryExists) {
        return res.status(409).json({
          message: 'Esta categoria já está cadastrada.',
        });
      }

      const slugExists = await Category.findOne({
        where: {
          slug,
        },
      });

      if (slugExists) {
        return res.status(409).json({
          message: 'Este slug já está em uso.',
        });
      }

      const category = await Category.create({
        name,
        slug,
        use_in_menu: use_in_menu ?? false,
      });

      return res.status(201).json(category);

    } catch (error) {
      console.error('Erro ao cadastrar categoria:', error);

      return res.status(500).json({
        message: 'Erro interno ao cadastrar categoria.',
      });
    }
  }

  // Listar todas as categorias
  async findAll(req, res) {
    try {
      const categories = await Category.findAll();

      return res.status(200).json(categories);

    } catch (error) {
      console.error('Erro ao listar categorias:', error);

      return res.status(500).json({
        message: 'Erro interno ao listar categorias.',
      });
    }
  }

  // Consultar categoria por ID
  async findOne(req, res) {
    try {
      const { id } = req.params;

      const category = await Category.findByPk(id);

      if (!category) {
        return res.status(404).json({
          message: 'Categoria não encontrada.',
        });
      }

      return res.status(200).json(category);

    } catch (error) {
      console.error('Erro ao consultar categoria:', error);

      return res.status(500).json({
        message: 'Erro interno ao consultar categoria.',
      });
    }
  }

  // Atualizar categoria
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, slug, use_in_menu } = req.body;

      const category = await Category.findByPk(id);

      if (!category) {
        return res.status(404).json({
          message: 'Categoria não encontrada.',
        });
      }

      if (
        name === undefined &&
        slug === undefined &&
        use_in_menu === undefined
      ) {
        return res.status(400).json({
          message: 'Informe pelo menos um campo para atualizar.',
        });
      }

      if (name && name !== category.name) {
        const nameExists = await Category.findOne({
          where: { name },
        });

        if (nameExists) {
          return res.status(409).json({
            message: 'Este nome de categoria já está cadastrado.',
          });
        }
      }

      if (slug && slug !== category.slug) {
        const slugExists = await Category.findOne({
          where: { slug },
        });

        if (slugExists) {
          return res.status(409).json({
            message: 'Este slug já está em uso.',
          });
        }
      }

      if (name !== undefined) category.name = name;
      if (slug !== undefined) category.slug = slug;

      if (use_in_menu !== undefined) {
        category.use_in_menu = use_in_menu;
      }

      await category.save();

      return res.status(200).json(category);

    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);

      return res.status(500).json({
        message: 'Erro interno ao atualizar categoria.',
      });
    }
  }

  // Excluir categoria
  async remove(req, res) {
    try {
      const { id } = req.params;

      const category = await Category.findByPk(id);

      if (!category) {
        return res.status(404).json({
          message: 'Categoria não encontrada.',
        });
      }

      await category.destroy();

      return res.status(200).json({
        message: 'Categoria excluída com sucesso.',
      });

    } catch (error) {
      console.error('Erro ao excluir categoria:', error);

      return res.status(500).json({
        message: 'Erro interno ao excluir categoria.',
      });
    }
  }
}

module.exports = new CategoryController();
