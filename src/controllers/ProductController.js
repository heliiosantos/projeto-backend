
const {
  Product,
  Category,
  ProductImage,
  ProductOption,
} = require('../models');

const { Op } = require('sequelize');

class ProductController {
  // Cadastrar produto
  async create(req, res) {
    try {
      const {
        name,
        slug,
        description,
        price,
        price_with_discount,
        categoryIds,
        images,
        options,
      } = req.body;

      if (!name || !slug || price === undefined) {
        return res.status(400).json({
          message: 'Nome, slug e preço são obrigatórios.',
        });
      }

      if (
        categoryIds !== undefined &&
        !Array.isArray(categoryIds)
      ) {
        return res.status(400).json({
          message: 'categoryIds deve ser uma lista de IDs.',
        });
      }

      if (
        images !== undefined &&
        (!Array.isArray(images) ||
          images.some(
            (image) =>
              typeof image !== 'string' || !image.trim()
          ))
      ) {
        return res.status(400).json({
          message: 'images deve ser uma lista de endereços válidos.',
        });
      }

      // Validar opções
      if (
        options !== undefined &&
        (!Array.isArray(options) ||
          options.some(
            (option) =>
              !option ||
              typeof option !== 'object' ||
              Array.isArray(option) ||
              typeof option.title !== 'string' ||
              !option.title.trim() ||
              !Array.isArray(option.values)
          ))
      ) {
        return res.status(400).json({
          message: 'options deve ser uma lista de opções com título e valores.',
        });
      }

      const existingProduct = await Product.findOne({
        where: { slug },
      });

      if (existingProduct) {
        return res.status(409).json({
          message: 'Este slug já está cadastrado.',
        });
      }

      // Validar categorias
      if (categoryIds && categoryIds.length > 0) {
        const categories = await Category.findAll({
          where: { id: categoryIds },
        });

        const foundIds = categories.map(
          (category) => Number(category.id)
        );

        const invalidCategories = categoryIds.filter(
          (id) => !foundIds.includes(Number(id))
        );

        if (invalidCategories.length > 0) {
          return res.status(400).json({
            message: 'Uma ou mais categorias não foram encontradas.',
            invalidCategories,
          });
        }
      }

      // Criar produto
      const product = await Product.create({
        name,
        slug,
        description,
        price,
        price_with_discount: price_with_discount ?? 0,
      });

      // Associar categorias
      if (categoryIds && categoryIds.length > 0) {
        await product.setCategories(categoryIds);
      }

      // Cadastrar imagens
      if (images && images.length > 0) {
        await ProductImage.bulkCreate(
          images.map((image) => ({
            content: image.trim(),
            product_id: product.id,
          }))
        );
      }

      // Cadastrar opções
      if (options && options.length > 0) {
        await ProductOption.bulkCreate(
          options.map((option) => ({
            title: option.title.trim(),
            shape: option.shape ?? null,
            radius: option.radius ?? null,
            type: option.type ?? null,
            values: option.values,
            product_id: product.id,
          }))
        );
      }

      const productWithRelations = await Product.findByPk(
        product.id,
        {
          include: [
            {
              model: Category,
              as: 'categories',
              through: { attributes: [] },
            },
            {
              model: ProductImage,
              as: 'images',
            },
            {
              model: ProductOption,
              as: 'options',
            },
          ],
        }
      );

      return res.status(201).json(productWithRelations);

    } catch (error) {
      return res.status(500).json({
        message: 'Erro ao cadastrar produto.',
        error: error.message,
      });
    }
  }

  // Listar produtos com filtros e paginação
  async findAll(req, res) {
    try {
      const {
        search,
        name,
        min_price,
        max_price,
        category_id,
        order = 'newest',
        page = 1,
        limit = 10,
      } = req.query;

      // Validar página e limite
      const currentPage = Number(page);
      const pageLimit = Number(limit);

      if (
        !Number.isInteger(currentPage) ||
        currentPage < 1 ||
        !Number.isInteger(pageLimit) ||
        pageLimit < 1 ||
        pageLimit > 100
      ) {
        return res.status(400).json({
          message: 'Página ou limite inválido. O limite máximo é 100.',
        });
      }

      // Validar preços
      const minimumPrice = min_price !== undefined
        ? Number(min_price)
        : undefined;

      const maximumPrice = max_price !== undefined
        ? Number(max_price)
        : undefined;

      if (
        (minimumPrice !== undefined &&
          (!Number.isFinite(minimumPrice) || minimumPrice < 0)) ||
        (maximumPrice !== undefined &&
          (!Number.isFinite(maximumPrice) || maximumPrice < 0))
      ) {
        return res.status(400).json({
          message: 'Informe valores válidos para os filtros de preço.',
        });
      }

      if (
        minimumPrice !== undefined &&
        maximumPrice !== undefined &&
        minimumPrice > maximumPrice
      ) {
        return res.status(400).json({
          message: 'O preço mínimo não pode ser maior que o preço máximo.',
        });
      }

      // Validar categoria
      if (
        category_id !== undefined &&
        (!Number.isInteger(Number(category_id)) ||
          Number(category_id) < 1)
      ) {
        return res.status(400).json({
          message: 'Informe um ID de categoria válido.',
        });
      }

      // Configurar filtros
      const where = {};

      const searchTerm = search || name;

      if (searchTerm) {
        where.name = {
          [Op.like]: `%${searchTerm}%`,
        };
      }

      if (
        minimumPrice !== undefined ||
        maximumPrice !== undefined
      ) {
        where.price = {};

        if (minimumPrice !== undefined) {
          where.price[Op.gte] = minimumPrice;
        }

        if (maximumPrice !== undefined) {
          where.price[Op.lte] = maximumPrice;
        }
      }

      // Configurar ordenação permitida
      const orderOptions = {
        price_asc: [['price', 'ASC']],
        price_desc: [['price', 'DESC']],
        name_asc: [['name', 'ASC']],
        name_desc: [['name', 'DESC']],
        newest: [['createdAt', 'DESC']],
        oldest: [['createdAt', 'ASC']],
      };

      if (!orderOptions[order]) {
        return res.status(400).json({
          message: 'Ordenação inválida.',
          allowedOrders: Object.keys(orderOptions),
        });
      }

      // Configurar relacionamento com categorias
      const categoryInclude = {
        model: Category,
        as: 'categories',
        through: { attributes: [] },
      };

      if (category_id !== undefined) {
        categoryInclude.where = {
          id: Number(category_id),
        };

        categoryInclude.required = true;
      }

      // Calcular deslocamento da paginação
      const offset = (currentPage - 1) * pageLimit;

      // Buscar produtos
      const result = await Product.findAndCountAll({
        where,
        include: [
          categoryInclude,
          {
            model: ProductImage,
            as: 'images',
          },
          {
            model: ProductOption,
            as: 'options',
          },
        ],
        distinct: true,
        limit: pageLimit,
        offset,
        order: orderOptions[order],
      });

      const totalPages = Math.ceil(result.count / pageLimit);

      return res.status(200).json({
        data: result.rows,
        pagination: {
          totalItems: result.count,
          totalPages,
          currentPage,
          limit: pageLimit,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1,
        },
      });

    } catch (error) {
      return res.status(500).json({
        message: 'Erro ao listar produtos.',
        error: error.message,
      });
    }
  }

  // Buscar produto por ID
  async findOne(req, res) {
    try {
      const product = await Product.findByPk(
        req.params.id,
        {
          include: [
            {
              model: Category,
              as: 'categories',
              through: { attributes: [] },
            },
            {
              model: ProductImage,
              as: 'images',
            },
            {
              model: ProductOption,
              as: 'options',
            },
          ],
        }
      );

      if (!product) {
        return res.status(404).json({
          message: 'Produto não encontrado.',
        });
      }

      return res.status(200).json(product);

    } catch (error) {
      return res.status(500).json({
        message: 'Erro ao buscar produto.',
        error: error.message,
      });
    }
  }

  // Atualizar produto
  async update(req, res) {
    try {
      const product = await Product.findByPk(req.params.id);

      if (!product) {
        return res.status(404).json({
          message: 'Produto não encontrado.',
        });
      }

      const {
        name,
        slug,
        description,
        price,
        price_with_discount,
        categoryIds,
        images,
        options,
      } = req.body;

      if (
        name === undefined &&
        slug === undefined &&
        description === undefined &&
        price === undefined &&
        price_with_discount === undefined &&
        categoryIds === undefined &&
        images === undefined &&
        options === undefined
      ) {
        return res.status(400).json({
          message: 'Informe ao menos um campo para atualizar.',
        });
      }

      if (
        categoryIds !== undefined &&
        !Array.isArray(categoryIds)
      ) {
        return res.status(400).json({
          message: 'categoryIds deve ser uma lista de IDs.',
        });
      }

      if (
        images !== undefined &&
        (!Array.isArray(images) ||
          images.some(
            (image) =>
              typeof image !== 'string' || !image.trim()
          ))
      ) {
        return res.status(400).json({
          message: 'images deve ser uma lista de endereços válidos.',
        });
      }

      // Validar opções
      if (
        options !== undefined &&
        (!Array.isArray(options) ||
          options.some(
            (option) =>
              !option ||
              typeof option !== 'object' ||
              Array.isArray(option) ||
              typeof option.title !== 'string' ||
              !option.title.trim() ||
              !Array.isArray(option.values)
          ))
      ) {
        return res.status(400).json({
          message: 'options deve ser uma lista de opções com título e valores.',
        });
      }

      // Verificar slug duplicado
      if (slug && slug !== product.slug) {
        const existingProduct = await Product.findOne({
          where: { slug },
        });

        if (existingProduct) {
          return res.status(409).json({
            message: 'Este slug já está cadastrado.',
          });
        }
      }

      // Validar categorias
      if (categoryIds !== undefined) {
        const categories = await Category.findAll({
          where: { id: categoryIds },
        });

        const foundIds = categories.map(
          (category) => Number(category.id)
        );

        const invalidCategories = categoryIds.filter(
          (id) => !foundIds.includes(Number(id))
        );

        if (invalidCategories.length > 0) {
          return res.status(400).json({
            message: 'Uma ou mais categorias não foram encontradas.',
            invalidCategories,
          });
        }
      }

      // Atualizar dados do produto
      await product.update({
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(price_with_discount !== undefined && {
          price_with_discount,
        }),
      });

      // Atualizar categorias
      if (categoryIds !== undefined) {
        await product.setCategories(categoryIds);
      }

      // Substituir imagens
      if (images !== undefined) {
        await ProductImage.destroy({
          where: { product_id: product.id },
        });

        if (images.length > 0) {
          await ProductImage.bulkCreate(
            images.map((image) => ({
              content: image.trim(),
              product_id: product.id,
            }))
          );
        }
      }

      // Substituir opções
      if (options !== undefined) {
        await ProductOption.destroy({
          where: { product_id: product.id },
        });

        if (options.length > 0) {
          await ProductOption.bulkCreate(
            options.map((option) => ({
              title: option.title.trim(),
              shape: option.shape ?? null,
              radius: option.radius ?? null,
              type: option.type ?? null,
              values: option.values,
              product_id: product.id,
            }))
          );
        }
      }

      const updatedProduct = await Product.findByPk(
        product.id,
        {
          include: [
            {
              model: Category,
              as: 'categories',
              through: { attributes: [] },
            },
            {
              model: ProductImage,
              as: 'images',
            },
            {
              model: ProductOption,
              as: 'options',
            },
          ],
        }
      );

      return res.status(200).json(updatedProduct);

    } catch (error) {
      return res.status(500).json({
        message: 'Erro ao atualizar produto.',
        error: error.message,
      });
    }
  }

  // Excluir produto
  async remove(req, res) {
    try {
      const product = await Product.findByPk(req.params.id);

      if (!product) {
        return res.status(404).json({
          message: 'Produto não encontrado.',
        });
      }

      await product.destroy();

      return res.status(200).json({
        message: 'Produto excluído com sucesso.',
      });

    } catch (error) {
      return res.status(500).json({
        message: 'Erro ao excluir produto.',
        error: error.message,
      });
    }
  }
}

module.exports = new ProductController();
