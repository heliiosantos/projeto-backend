const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { Op } = require('sequelize');
const {
  Product,
  Category,
  ProductImage,
  ProductOption,
  ProductCategory,
} = require('../models');

const UPLOAD_ROOT = path.resolve(__dirname, '../../uploads/products');
const ALLOWED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
]);
const PRODUCT_FIELDS = [
  'id', 'enabled', 'name', 'slug', 'stock', 'description',
  'price', 'price_with_discount', 'category_ids', 'images', 'options',
];

function parseOptionValues(values) {
  const list = Array.isArray(values) ? values : (typeof values === 'string' ? values.split(',') : null);
  if (!list || list.length === 0) return null;
  const normalized = list.map((value) => String(value).trim()).filter(Boolean);
  if (normalized.length === 0) return null;
  const result = normalized.join(',');
  return result.length <= 255 ? result : null;
}

function parseRadius(radius) {
  if (radius === undefined || radius === null || radius === '') return 0;
  const match = String(radius).trim().match(/^(\d+)(?:px)?$/i);
  return match ? Number(match[1]) : NaN;
}

function validOption(option, isUpdate = false) {
  if (!option || typeof option !== 'object' || Array.isArray(option)) return false;
  if (option.deleted === true) return Number.isInteger(Number(option.id)) && Number(option.id) > 0;
  if (!isUpdate && (typeof option.title !== 'string' || !option.title.trim())) return false;
  if (option.title !== undefined && (typeof option.title !== 'string' || !option.title.trim())) return false;
  if (option.shape !== undefined && !['square', 'circle'].includes(option.shape)) return false;
  if (option.type !== undefined && !['text', 'color'].includes(option.type)) return false;
  if (option.radius !== undefined && !Number.isInteger(parseRadius(option.radius))) return false;
  if (option.values !== undefined || option.value !== undefined) {
    if (!parseOptionValues(option.values ?? option.value)) return false;
  } else if (!isUpdate || !option.id) {
    return false;
  }
  return true;
}

function decodeImageContent(image) {
  if (!image || typeof image !== 'object' || Array.isArray(image)) return null;
  if (typeof image.content !== 'string' || !image.content.trim()) return null;
  if (/^https?:\/\//i.test(image.content)) {
    return { externalUrl: image.content.trim() };
  }
  const mime = String(image.type || '').toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.has(mime)) return null;
  const data = image.content.replace(/^data:[^;]+;base64,/i, '').replace(/\s/g, '');
  if (!data || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) return null;
  const buffer = Buffer.from(data, 'base64');
  if (!buffer.length || buffer.length > 10 * 1024 * 1024) return null;
  const extension = mime === 'image/jpeg' ? 'jpg' : (mime.split('/')[1] === 'jpg' ? 'jpg' : mime.split('/')[1]);
  return { buffer, extension };
}

async function persistImage(image) {
  const decoded = decodeImageContent(image);
  if (!decoded) throw new Error('Imagem inválida. Informe type e content Base64 ou uma URL HTTP/HTTPS.');
  if (decoded.externalUrl) return decoded.externalUrl;
  await fs.promises.mkdir(UPLOAD_ROOT, { recursive: true });
  const filename = `${randomUUID()}.${decoded.extension}`;
  await fs.promises.writeFile(path.join(UPLOAD_ROOT, filename), decoded.buffer, { flag: 'wx' });
  return `uploads/products/${filename}`;
}

async function removeStoredImage(imagePath) {
  if (!imagePath || /^https?:\/\//i.test(imagePath)) return;
  const normalized = imagePath.replace(/\\/g, '/');
  if (!normalized.startsWith('uploads/products/')) return;
  const fullPath = path.resolve(__dirname, '../../', normalized);
  if (!fullPath.startsWith(`${UPLOAD_ROOT}${path.sep}`)) return;
  await fs.promises.unlink(fullPath).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
  });
}

function serializeProduct(product, requestedFields) {
  const raw = product.get ? product.get({ plain: true }) : product;
  const result = {
    id: raw.id,
    enabled: raw.enabled,
    name: raw.name,
    slug: raw.slug,
    stock: raw.stock,
    description: raw.description,
    price: raw.price,
    price_with_discount: raw.price_with_discount,
    category_ids: (raw.categories || []).map((category) => category.id),
    images: (raw.images || []).map((image) => ({
      id: image.id,
      content: /^https?:\/\//i.test(image.path) ? image.path : `/${image.path.replace(/^\//, '')}`,
    })),
    options: (raw.options || []).map((option) => ({
      id: option.id,
      title: option.title,
      shape: option.shape,
      radius: option.radius,
      type: option.type,
      values: option.values,
    })),
  };
  if (!requestedFields) return result;
  const selected = { id: result.id };
  for (const field of requestedFields) {
    if (field !== 'id' && Object.prototype.hasOwnProperty.call(result, field)) selected[field] = result[field];
  }
  return selected;
}

const relations = [
  { model: Category, as: 'categories', through: { attributes: [] }, required: false },
  { model: ProductImage, as: 'images', required: false },
  { model: ProductOption, as: 'options', required: false },
];

class ProductController {
  async create(req, res) {
    const createdFiles = [];
    try {
      const {
        enabled = false, name, slug, stock = 0, description = null,
        price, price_with_discount, category_ids = [], images = [], options = [],
      } = req.body;

      if (typeof name !== 'string' || !name.trim() || typeof slug !== 'string' || !slug.trim() ||
          price === undefined || price === null || price === '' ||
          price_with_discount === undefined || price_with_discount === null || price_with_discount === '') {
        return res.status(400).json({ message: 'Nome, slug, preço e preço com desconto são obrigatórios.' });
      }
      if (!Number.isFinite(Number(price)) || Number(price) < 0 ||
          !Number.isFinite(Number(price_with_discount)) || Number(price_with_discount) < 0 ||
          !Number.isInteger(Number(stock)) || Number(stock) < 0 || typeof enabled !== 'boolean') {
        return res.status(400).json({ message: 'Informe valores válidos para enabled, stock e preços.' });
      }
      if (!Array.isArray(category_ids) || !Array.isArray(images) || !Array.isArray(options) ||
          options.some((option) => !validOption(option))) {
        return res.status(400).json({ message: 'Categorias, imagens ou opções possuem formato inválido.' });
      }
      if (images.some((image) => !decodeImageContent(image))) {
        return res.status(400).json({ message: 'Uma ou mais imagens são inválidas.' });
      }
      const categories = category_ids.length ? await Category.findAll({ where: { id: category_ids } }) : [];
      if (categories.length !== new Set(category_ids.map(Number)).size) {
        return res.status(400).json({ message: 'Uma ou mais categorias não foram encontradas.' });
      }
      const duplicateSlug = await Product.findOne({ where: { slug: slug.trim() } });
      if (duplicateSlug) return res.status(400).json({ message: 'Este slug já está cadastrado.' });

      const product = await Product.create({
        enabled, name: name.trim(), slug: slug.trim(), stock: Number(stock),
        description, price: Number(price), price_with_discount: Number(price_with_discount),
      });
      if (categories.length) await product.setCategories(categories);

      for (const image of images) {
        const imagePath = await persistImage(image);
        if (!/^https?:\/\//i.test(imagePath)) createdFiles.push(imagePath);
        await ProductImage.create({ product_id: product.id, path: imagePath, enabled: true });
      }
      if (options.length) {
        await ProductOption.bulkCreate(options.map((option) => ({
          product_id: product.id,
          title: option.title.trim(),
          shape: option.shape ?? 'square',
          radius: parseRadius(option.radius),
          type: option.type ?? 'text',
          values: parseOptionValues(option.values ?? option.value),
        })));
      }
      const fullProduct = await Product.findByPk(product.id, { include: relations });
      return res.status(201).json(serializeProduct(fullProduct));
    } catch (error) {
      await Promise.all(createdFiles.map(removeStoredImage));
      return res.status(500).json({ message: 'Erro ao cadastrar produto.', error: error.message });
    }
  }

  async findAll(req, res) {
    try {
      const {
        limit = '12', page = '1', fields, match,
        'category_ids': categoryIdsParam,
        'price-range': priceRange,
        option,
      } = req.query;
      const pageNumber = Number(page);
      const limitNumber = Number(limit);
      if (!Number.isInteger(pageNumber) || pageNumber < 1 ||
          !Number.isInteger(limitNumber) || (limitNumber !== -1 && limitNumber < 1)) {
        return res.status(400).json({ message: 'Parâmetros de paginação inválidos.' });
      }
      let requestedFields;
      if (fields !== undefined) {
        requestedFields = String(fields).split(',').map((field) => field.trim()).filter(Boolean);
        if (!requestedFields.length || requestedFields.some((field) => !PRODUCT_FIELDS.includes(field))) {
          return res.status(400).json({ message: 'Um ou mais campos solicitados são inválidos.', allowedFields: PRODUCT_FIELDS });
        }
      }
      const where = {};
      if (match !== undefined) {
        if (typeof match !== 'string' || !match.trim()) return res.status(400).json({ message: 'O parâmetro match deve conter um texto.' });
        where[Op.or] = [
          { name: { [Op.like]: `%${match.trim()}%` } },
          { description: { [Op.like]: `%${match.trim()}%` } },
        ];
      }
      if (priceRange !== undefined) {
        const parsed = String(priceRange).match(/^\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*$/);
        if (!parsed || Number(parsed[1]) > Number(parsed[2])) return res.status(400).json({ message: 'O parâmetro price-range deve seguir o formato mínimo-máximo.' });
        where.price = { [Op.between]: [Number(parsed[1]), Number(parsed[2])] };
      }
      let categoryIds;
      if (categoryIdsParam !== undefined) {
        categoryIds = String(categoryIdsParam).split(',').map((id) => Number(id.trim()));
        if (!categoryIds.length || categoryIds.some((id) => !Number.isInteger(id) || id < 1)) return res.status(400).json({ message: 'category_ids deve conter IDs válidos separados por vírgula.' });
        const categoryLinks = await ProductCategory.findAll({
          where: { category_id: { [Op.in]: categoryIds } },
          attributes: ['product_id'],
        });
        const matchingProductIds = categoryLinks.map((link) => link.product_id);
        where.id = { ...(where.id || {}), [Op.in]: matchingProductIds };
      }
      // O Express pode interpretar option[ID] como objeto aninhado ou como chave literal,
      // dependendo do parser de query string configurado. Suportamos os dois formatos.
      const optionFilters = { ...(option && typeof option === 'object' && !Array.isArray(option) ? option : {}) };
      for (const [key, value] of Object.entries(req.query)) {
        const matchOption = key.match(/^option\[(\d+)\]$/);
        if (matchOption) optionFilters[matchOption[1]] = value;
      }
      let optionProductIds;
      if (Object.keys(optionFilters).length) {
        const productIdSets = [];
        for (const [optionIdText, rawValues] of Object.entries(optionFilters)) {
          const optionId = Number(optionIdText);
          const values = String(rawValues).split(',').map((value) => value.trim()).filter(Boolean);
          if (!Number.isInteger(optionId) || optionId < 1 || !values.length) return res.status(400).json({ message: 'Informe IDs e valores válidos no filtro option.' });
          const optionRecord = await ProductOption.findByPk(optionId);
          if (!optionRecord) {
            productIdSets.push(new Set());
            continue;
          }
          const availableValues = String(optionRecord.values).split(',').map((value) => value.trim());
          if (!values.some((value) => availableValues.includes(value))) {
            productIdSets.push(new Set());
          } else {
            productIdSets.push(new Set([optionRecord.product_id]));
          }
        }
        optionProductIds = [...productIdSets.reduce((intersection, current) => new Set([...intersection].filter((id) => current.has(id))))];
        const existingIds = where.id && where.id[Op.in] ? where.id[Op.in] : null;
        where.id = { [Op.in]: existingIds ? existingIds.filter((id) => optionProductIds.includes(id)) : optionProductIds };
      }
      const categoryInclude = { model: Category, as: 'categories', through: { attributes: [] }, required: false };
      const query = { where, include: [categoryInclude, relations[1], relations[2]], distinct: true, order: [['createdAt', 'DESC']] };
      if (limitNumber !== -1) {
        query.limit = limitNumber;
        query.offset = (pageNumber - 1) * limitNumber;
      }
      const result = await Product.findAndCountAll(query);
      const total = result.count;
      const data = result.rows.map((product) => serializeProduct(product, requestedFields));
      return res.status(200).json({ data, total, limit: limitNumber, page: limitNumber === -1 ? 1 : pageNumber });
    } catch (error) {
      return res.status(500).json({ message: 'Erro ao pesquisar produtos.', error: error.message });
    }
  }

  async findOne(req, res) {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id < 1) return res.status(404).json({ message: 'Produto não encontrado.' });
      const product = await Product.findByPk(id, { include: relations });
      if (!product) return res.status(404).json({ message: 'Produto não encontrado.' });
      return res.status(200).json(serializeProduct(product));
    } catch (error) {
      return res.status(500).json({ message: 'Erro ao buscar produto.', error: error.message });
    }
  }

  async update(req, res) {
    const createdFiles = [];
    try {
      const product = await Product.findByPk(req.params.id, { include: relations });
      if (!product) return res.status(404).json({ message: 'Produto não encontrado.' });
      const body = req.body || {};
      const allowed = ['enabled', 'name', 'slug', 'stock', 'description', 'price', 'price_with_discount', 'category_ids', 'images', 'options'];
      if (!allowed.some((field) => Object.prototype.hasOwnProperty.call(body, field))) return res.status(400).json({ message: 'Informe ao menos um campo para atualizar.' });
      if (body.category_ids !== undefined && !Array.isArray(body.category_ids)) return res.status(400).json({ message: 'category_ids deve ser uma lista de IDs.' });
      if (body.images !== undefined && (!Array.isArray(body.images) || body.images.some((image) => !image || typeof image !== 'object' || Array.isArray(image)))) return res.status(400).json({ message: 'images deve ser uma lista de objetos.' });
      if (body.options !== undefined && (!Array.isArray(body.options) || body.options.some((option) => !validOption(option, true)))) return res.status(400).json({ message: 'options deve ser uma lista de opções válidas.' });
      if (body.enabled !== undefined && typeof body.enabled !== 'boolean') return res.status(400).json({ message: 'enabled deve ser booleano.' });
      if (body.name !== undefined && (typeof body.name !== 'string' || !body.name.trim())) return res.status(400).json({ message: 'name deve ser um texto não vazio.' });
      if (body.slug !== undefined && (typeof body.slug !== 'string' || !body.slug.trim())) return res.status(400).json({ message: 'slug deve ser um texto não vazio.' });
      if (body.description !== undefined && body.description !== null && typeof body.description !== 'string') return res.status(400).json({ message: 'description deve ser um texto ou null.' });
      if (body.stock !== undefined && (!Number.isInteger(Number(body.stock)) || Number(body.stock) < 0)) return res.status(400).json({ message: 'stock deve ser um inteiro maior ou igual a zero.' });
      for (const field of ['price', 'price_with_discount']) if (body[field] !== undefined && (!Number.isFinite(Number(body[field])) || Number(body[field]) < 0)) return res.status(400).json({ message: `${field} deve ser um número válido.` });
      if (body.slug && body.slug !== product.slug) {
        const duplicate = await Product.findOne({ where: { slug: body.slug } });
        if (duplicate) return res.status(400).json({ message: 'Este slug já está cadastrado.' });
      }
      if (body.category_ids) {
        const found = await Category.findAll({ where: { id: body.category_ids } });
        if (found.length !== new Set(body.category_ids.map(Number)).size) return res.status(400).json({ message: 'Uma ou mais categorias não foram encontradas.' });
      }
      if (body.images) {
        for (const image of body.images) {
          if (image.deleted === true) continue;
          if (image.id !== undefined) {
            const existing = product.images.find((item) => item.id === Number(image.id));
            if (!existing) return res.status(400).json({ message: `Imagem ${image.id} não pertence ao produto.` });
          }
          if (image.content !== undefined && !decodeImageContent(image)) return res.status(400).json({ message: 'Uma ou mais imagens são inválidas.' });
          if (image.id === undefined && image.content === undefined) return res.status(400).json({ message: 'Nova imagem precisa conter type e content.' });
        }
      }
      if (body.options) {
        for (const option of body.options) if (option.id !== undefined && !product.options.some((item) => item.id === Number(option.id))) return res.status(400).json({ message: `Opção ${option.id} não pertence ao produto.` });
      }
      const updates = {};
      for (const field of ['enabled', 'name', 'slug', 'stock', 'description', 'price', 'price_with_discount']) if (body[field] !== undefined) updates[field] = body[field];
      if (updates.stock !== undefined) updates.stock = Number(updates.stock);
      if (updates.price !== undefined) updates.price = Number(updates.price);
      if (updates.price_with_discount !== undefined) updates.price_with_discount = Number(updates.price_with_discount);
      await product.update(updates);
      if (body.category_ids !== undefined) await product.setCategories(body.category_ids);

      const removedImagePaths = [];
      if (body.images !== undefined) {
        for (const image of body.images) {
          if (image.id !== undefined) {
            const existing = product.images.find((item) => item.id === Number(image.id));
            if (image.deleted === true) {
              removedImagePaths.push(existing.path);
              await existing.destroy();
            } else if (image.content !== undefined) {
              const nextPath = await persistImage(image);
              if (!/^https?:\/\//i.test(nextPath)) createdFiles.push(nextPath);
              removedImagePaths.push(existing.path);
              await existing.update({ path: nextPath, enabled: true });
            }
          } else {
            const nextPath = await persistImage(image);
            if (!/^https?:\/\//i.test(nextPath)) createdFiles.push(nextPath);
            await ProductImage.create({ product_id: product.id, path: nextPath, enabled: true });
          }
        }
      }
      if (body.options !== undefined) {
        for (const option of body.options) {
          if (option.id !== undefined) {
            const existing = product.options.find((item) => item.id === Number(option.id));
            if (option.deleted === true) {
              await existing.destroy();
            } else {
              const changes = {};
              if (option.title !== undefined) changes.title = option.title.trim();
              if (option.shape !== undefined) changes.shape = option.shape;
              if (option.radius !== undefined) changes.radius = parseRadius(option.radius);
              if (option.type !== undefined) changes.type = option.type;
              if (option.values !== undefined || option.value !== undefined) changes.values = parseOptionValues(option.values ?? option.value);
              await existing.update(changes);
            }
          } else {
            await ProductOption.create({
              product_id: product.id,
              title: option.title.trim(),
              shape: option.shape ?? 'square',
              radius: parseRadius(option.radius),
              type: option.type ?? 'text',
              values: parseOptionValues(option.values ?? option.value),
            });
          }
        }
      }
      await Promise.all(removedImagePaths.map(removeStoredImage));
      return res.status(204).end();
    } catch (error) {
      await Promise.all(createdFiles.map(removeStoredImage));
      return res.status(500).json({ message: 'Erro ao atualizar produto.', error: error.message });
    }
  }

  async remove(req, res) {
    try {
      const product = await Product.findByPk(req.params.id, { include: relations });
      if (!product) return res.status(404).json({ message: 'Produto não encontrado.' });
      const imagePaths = product.images.map((image) => image.path);
      await product.setCategories([]);
      await ProductImage.destroy({ where: { product_id: product.id } });
      await ProductOption.destroy({ where: { product_id: product.id } });
      await product.destroy();
      await Promise.all(imagePaths.map(removeStoredImage));
      return res.status(204).end();
    } catch (error) {
      return res.status(500).json({ message: 'Erro ao excluir produto.', error: error.message });
    }
  }
}

module.exports = new ProductController();
