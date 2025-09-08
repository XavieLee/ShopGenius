const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

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
router.post('/add', (req, res) => {
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

  // 模拟商品数据（实际项目中应该从数据库获取）
  const PRODUCTS = [
    { id: 'p1', name: 'Velvet Matte Lipstick', price: 19, image: 'https://images.unsplash.com/photo-1582092728069-1d3d3b5c1a9c?q=80&w=800&auto=format&fit=crop' },
    { id: 'p2', name: 'AirRun Sneakers', price: 79, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop' },
    { id: 'p3', name: 'City Tote', price: 120, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800&auto=format&fit=crop' },
    { id: 'p4', name: 'Noise-cancel Headphones', price: 149, image: 'https://images.unsplash.com/photo-1518443895914-6bf7961a8a6e?q=80&w=800&auto=format&fit=crop' },
    { id: 'p5', name: 'Trail Running Shoes', price: 95, image: 'https://images.unsplash.com/photo-1520256862855-398228c41684?q=80&w=800&auto=format&fit=crop' },
    { id: 'p6', name: 'Stainless Sports Bottle', price: 25, image: 'https://images.unsplash.com/photo-1599058917513-2918b9a6228d?q=80&w=800&auto=format&fit=crop' },
    { id: 'p7', name: 'Classic Leather Belt', price: 35, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop' },
    { id: 'p8', name: 'Mini Crossbody', price: 59, image: 'https://images.unsplash.com/photo-1591348279358-0b09b5e8b5e7?q=80&w=800&auto=format&fit=crop' }
  ];

  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) {
    logger.warn('❌ 添加到购物车失败: 商品不存在', { productId });
    return res.status(404).json({
      success: false,
      message: '商品不存在'
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
      price: product.price,
      image: product.image,
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

