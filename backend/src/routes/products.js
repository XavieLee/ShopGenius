const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { Product } = require('../models');
const { Op } = require('sequelize');

// 获取商品列表
router.get('/', async (req, res) => {
  try {
    const { category, color, maxPrice, minPrice, search, page = 1, limit = 20 } = req.query;
    
    logger.info('🛍️ 获取商品列表请求', {
      filters: { category, color, maxPrice, minPrice, search },
      pagination: { page, limit }
    });
    
    // 构建查询条件
    const whereClause = {
      status: 'active' // 只查询活跃状态的商品
    };
    
    // 应用筛选条件
    if (category) {
      whereClause.category = category;
    }
    
    if (color) {
      whereClause.color = color;
    }
    
    if (minPrice) {
      whereClause.price = {
        ...whereClause.price,
        [Op.gte]: parseFloat(minPrice) || 0
      };
    }
    
    if (maxPrice) {
      whereClause.price = {
        ...whereClause.price,
        [Op.lte]: parseFloat(maxPrice) || 0
      };
    }
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // 计算分页
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // 查询商品
    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']]
    });
    
    // 转换数据格式以匹配前端期望
    const formattedProducts = products.map(product => ({
      id: product.id.toString(),
      name: product.name,
      category: product.category,
      color: product.color,
      price: parseFloat(product.price) || 0,
      originalPrice: product.original_price ? (parseFloat(product.original_price) || null) : undefined,
      description: product.description,
      image: product.image_url,
      rating: product.rating ? (parseFloat(product.rating) || 0) : 0,
      reviews: product.review_count || 0,
      stock: product.stock_quantity || 0,
      features: product.tags || []
    }));
    
    logger.info('✅ 商品列表查询完成', {
      totalProducts: count,
      returnedCount: formattedProducts.length,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit))
    });
    
    res.json({
      success: true,
      message: '获取商品列表成功',
      data: {
        products: formattedProducts,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
    
  } catch (error) {
    logger.error('❌ 获取商品列表失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '获取商品列表失败',
      error: error.message
    });
  }
});

// 获取秒杀商品
router.get('/flash-sale', async (req, res) => {
  try {
    logger.info('⚡ 获取秒杀商品请求');
    
    // 临时改为获取全部商品用于测试
    const flashSaleProducts = await Product.findAll({
      where: {
        status: 'active'
      },
      order: [
        ['created_at', 'DESC']
      ],
      limit: 10
    });
    
    // 转换数据格式
    const formattedProducts = flashSaleProducts.map(product => {
      const price = parseFloat(product.price) || 0;
      const originalPrice = product.original_price ? (parseFloat(product.original_price) || null) : null;
      const discount = originalPrice && originalPrice > price ? 
        Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
      
      return {
        id: product.id.toString(),
        name: product.name || '未知商品',
        category: product.category || '未分类',
        color: product.color || '未知颜色',
        price: price,
        originalPrice: originalPrice,
        discount: discount,
        description: product.description || '',
        image: product.image_url || '/girl.gif',
        rating: product.rating ? (parseFloat(product.rating) || 0) : 0,
        reviews: product.review_count || 0,
        stock: product.stock_quantity || 0,
        features: product.tags || []
      };
    });
    
    logger.info('✅ 秒杀商品查询完成', {
      totalProducts: formattedProducts.length
    });
    
    res.json({
      success: true,
      message: '获取秒杀商品成功',
      data: {
        products: formattedProducts,
        total: formattedProducts.length
      }
    });
    
  } catch (error) {
    logger.error('❌ 获取秒杀商品失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '获取秒杀商品失败',
      error: error.message
    });
  }
});

// 获取本周推荐商品
router.get('/weekly-recommendations', async (req, res) => {
  try {
    logger.info('⭐ 获取本周推荐商品请求');
    
    // 临时改为获取全部商品用于测试
    const weeklyProducts = await Product.findAll({
      where: {
        status: 'active'
      },
      order: [
        ['updated_at', 'DESC']
      ],
      limit: 10
    });
    
    // 转换数据格式
    const formattedProducts = weeklyProducts.map(product => {
      const price = parseFloat(product.price) || 0;
      const originalPrice = product.original_price ? (parseFloat(product.original_price) || null) : null;
      
      return {
        id: product.id.toString(),
        name: product.name || '未知商品',
        category: product.category || '未分类',
        color: product.color || '未知颜色',
        price: price,
        originalPrice: originalPrice,
        description: product.description || '',
        image: product.image_url || '/girl.gif',
        rating: product.rating ? (parseFloat(product.rating) || 0) : 0,
        reviews: product.review_count || 0,
        stock: product.stock_quantity || 0,
        features: product.tags || []
      };
    });
    
    logger.info('✅ 本周推荐商品查询完成', {
      totalProducts: formattedProducts.length
    });
    
    res.json({
      success: true,
      message: '获取本周推荐商品成功',
      data: {
        products: formattedProducts,
        total: formattedProducts.length
      }
    });
    
  } catch (error) {
    logger.error('❌ 获取本周推荐商品失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '获取本周推荐商品失败',
      error: error.message
    });
  }
});

// 获取商品详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info('🔍 获取商品详情请求', { productId: id });
    
    const product = await Product.findOne({
      where: { 
        id: parseInt(id),
        status: 'active'
      }
    });
    
    if (!product) {
      logger.warn('❌ 商品不存在', { productId: id });
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }
    
    // 获取相关商品推荐
    const relatedProducts = await Product.findAll({
      where: {
        id: { [Op.ne]: product.id },
        status: 'active',
        [Op.or]: [
          { category: product.category },
          { color: product.color }
        ]
      },
      limit: 4,
      order: [['rating', 'DESC']]
    });
    
    // 转换数据格式
    const formattedProduct = {
      id: product.id.toString(),
      name: product.name,
      category: product.category,
      color: product.color,
      price: parseFloat(product.price) || 0,
      originalPrice: product.original_price ? (parseFloat(product.original_price) || null) : undefined,
      description: product.description,
      image: product.image_url,
      rating: product.rating ? (parseFloat(product.rating) || 0) : 0,
      reviews: product.review_count || 0,
      stock: product.stock_quantity || 0,
      features: product.tags || []
    };
    
    const formattedRelatedProducts = relatedProducts.map(p => ({
      id: p.id.toString(),
      name: p.name,
      category: p.category,
      color: p.color,
      price: parseFloat(p.price) || 0,
      originalPrice: p.original_price ? (parseFloat(p.original_price) || null) : undefined,
      description: p.description,
      image: p.image_url,
      rating: p.rating ? (parseFloat(p.rating) || 0) : 0,
      reviews: p.review_count || 0,
      stock: p.stock_quantity || 0,
      features: p.tags || []
    }));
    
    logger.info('✅ 商品详情查询完成', {
      productId: id,
      productName: product.name,
      relatedProductsCount: formattedRelatedProducts.length
    });
    
    res.json({
      success: true,
      message: '获取商品详情成功',
      data: {
        ...formattedProduct,
        relatedProducts: formattedRelatedProducts
      }
    });
    
  } catch (error) {
    logger.error('❌ 获取商品详情失败', { productId: req.params.id, error: error.message });
    res.status(500).json({
      success: false,
      message: '获取商品详情失败',
      error: error.message
    });
  }
});

// 搜索商品
router.get('/search', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, color } = req.query;
    
    logger.info('🔍 商品搜索请求', {
      query: q,
      filters: { category, minPrice, maxPrice, color }
    });
    
    // 构建查询条件
    const whereClause = {
      status: 'active'
    };
    
    // 关键词搜索
    if (q) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
        { category: { [Op.like]: `%${q}%` } }
      ];
    }
    
    // 其他筛选条件
    if (category) {
      whereClause.category = category;
    }
    
    if (color) {
      whereClause.color = color;
    }
    
    if (minPrice) {
      whereClause.price = {
        ...whereClause.price,
        [Op.gte]: parseFloat(minPrice) || 0
      };
    }
    
    if (maxPrice) {
      whereClause.price = {
        ...whereClause.price,
        [Op.lte]: parseFloat(maxPrice) || 0
      };
    }
    
    const products = await Product.findAll({
      where: whereClause,
      order: [['rating', 'DESC']]
    });
    
    // 转换数据格式
    const formattedProducts = products.map(product => ({
      id: product.id.toString(),
      name: product.name,
      category: product.category,
      color: product.color,
      price: parseFloat(product.price) || 0,
      originalPrice: product.original_price ? (parseFloat(product.original_price) || null) : undefined,
      description: product.description,
      image: product.image_url,
      rating: product.rating ? (parseFloat(product.rating) || 0) : 0,
      reviews: product.review_count || 0,
      stock: product.stock_quantity || 0,
      features: product.tags || []
    }));
    
    logger.info('✅ 商品搜索完成', {
      query: q,
      totalResults: formattedProducts.length,
      searchTime: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: '搜索成功',
      data: {
        products: formattedProducts,
        total: formattedProducts.length,
        query: q
      }
    });
    
  } catch (error) {
    logger.error('❌ 商品搜索失败', { query: req.query.q, error: error.message });
    res.status(500).json({
      success: false,
      message: '搜索失败',
      error: error.message
    });
  }
});

// 获取商品分类
router.get('/categories/list', async (req, res) => {
  try {
    logger.info('📂 获取商品分类请求');
    
    // 获取所有分类
    const categories = await Product.findAll({
      attributes: ['category'],
      where: { status: 'active' },
      group: ['category'],
      order: [['category', 'ASC']]
    });
    
    // 获取所有颜色
    const colors = await Product.findAll({
      attributes: ['color'],
      where: { 
        status: 'active',
        color: { [Op.ne]: null }
      },
      group: ['color'],
      order: [['color', 'ASC']]
    });
    
    const categoryList = categories.map(c => c.category).filter(Boolean);
    const colorList = colors.map(c => c.color).filter(Boolean);
    
    logger.info('✅ 商品分类查询完成', {
      categoriesCount: categoryList.length,
      colorsCount: colorList.length
    });
    
    res.json({
      success: true,
      message: '获取分类成功',
      data: {
        categories: categoryList,
        colors: colorList
      }
    });
    
  } catch (error) {
    logger.error('❌ 获取商品分类失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '获取分类失败',
      error: error.message
    });
  }
});

module.exports = router;