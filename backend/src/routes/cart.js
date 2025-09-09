const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { Product } = require('../models');

// 模拟购物车存储（实际项目中应该使用数据库）
let cartStorage = {};

// 获取购物车
router.get('/', (req, res) => {
  const { userId = 'default' } = req.query;
  
  logger.info('🛒 获取购物车请求', { userId });
  
  const cart = cartStorage[userId] || [];
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  logger.info('✅ 购物车查询完成', {
    userId,
    itemCount,
    totalValue: total,
    uniqueItems: cart.length
  });

  res.json({
    success: true,
    message: '获取购物车成功',
    data: {
      items: cart,
      total: total,
      itemCount: itemCount
    }
  });
});

// 添加到购物车
router.post('/add', async (req, res) => {
  const { productId, quantity = 1, userId = 'default' } = req.body;
  
  logger.info('➕ 添加到购物车请求', {
    productId,
    quantity,
    userId
  });
  
  if (!productId) {
    logger.warn('❌ 添加到购物车失败: 商品ID为空');
    return res.status(400).json({
      success: false,
      message: '商品ID不能为空'
    });
  }

  try {
    // 从数据库查询商品信息
    const product = await Product.findByPk(productId);
    if (!product) {
      logger.warn('❌ 添加到购物车失败: 商品不存在', { productId });
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }

    // 检查商品状态
    if (product.status !== 'active') {
      logger.warn('❌ 添加到购物车失败: 商品已下架', { productId, status: product.status });
      return res.status(400).json({
        success: false,
        message: '商品已下架'
      });
    }

    // 初始化用户购物车
    if (!cartStorage[userId]) {
      cartStorage[userId] = [];
    }

    // 检查商品是否已在购物车中
    const existingItem = cartStorage[userId].find(item => item.productId === productId);
    
    if (existingItem) {
      // 更新数量
      existingItem.quantity += quantity;
      logger.info('✅ 购物车商品数量更新', {
        productId,
        productName: product.name,
        newQuantity: existingItem.quantity,
        userId
      });
    } else {
      // 添加新商品
      cartStorage[userId].push({
        productId: productId,
        name: product.name,
        price: parseFloat(product.price),
        image: product.image_url,
        quantity: quantity,
        addedAt: new Date().toISOString()
      });
      logger.info('✅ 新商品添加到购物车', {
        productId,
        productName: product.name,
        quantity,
        userId
      });
    }

    res.json({
      success: true,
      message: '添加到购物车成功',
      data: {
        productId: productId,
        quantity: existingItem ? existingItem.quantity : quantity
      }
    });
  } catch (error) {
    logger.error('❌ 添加到购物车失败', { productId, error: error.message });
    res.status(500).json({
      success: false,
      message: '添加到购物车失败',
      error: error.message
    });
  }
});

// 更新购物车商品数量
router.put('/:productId', (req, res) => {
  const { productId } = req.params;
  const { quantity, userId = 'default' } = req.body;
  
  if (!cartStorage[userId]) {
    return res.status(404).json({
      success: false,
      message: '购物车为空'
    });
  }

  const item = cartStorage[userId].find(item => item.productId === productId);
  if (!item) {
    return res.status(404).json({
      success: false,
      message: '商品不在购物车中'
    });
  }

  if (quantity <= 0) {
    // 删除商品
    cartStorage[userId] = cartStorage[userId].filter(item => item.productId !== productId);
    res.json({
      success: true,
      message: '商品已从购物车中移除',
      data: null
    });
  } else {
    // 更新数量
    item.quantity = quantity;
    res.json({
      success: true,
      message: '购物车更新成功',
      data: {
        productId: productId,
        quantity: quantity
      }
    });
  }
});

// 删除购物车商品
router.delete('/:productId', (req, res) => {
  const { productId } = req.params;
  const { userId = 'default' } = req.query;
  
  if (!cartStorage[userId]) {
    return res.status(404).json({
      success: false,
      message: '购物车为空'
    });
  }

  const initialLength = cartStorage[userId].length;
  cartStorage[userId] = cartStorage[userId].filter(item => item.productId !== productId);
  
  if (cartStorage[userId].length === initialLength) {
    return res.status(404).json({
      success: false,
      message: '商品不在购物车中'
    });
  }

  res.json({
    success: true,
    message: '商品删除成功',
    data: null
  });
});

// 清空购物车
router.delete('/', (req, res) => {
  const { userId = 'default' } = req.query;
  
  cartStorage[userId] = [];
  
  res.json({
    success: true,
    message: '购物车已清空',
    data: null
  });
});

module.exports = router;

