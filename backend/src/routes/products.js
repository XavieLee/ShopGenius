const express = require('express');
const router = express.Router();

// 获取商品列表
router.get('/', (req, res) => {
  // 模拟商品数据
  const mockProducts = [
    {
      id: '1',
      name: 'iPhone 15 Pro Max',
      price: 9999,
      originalPrice: 11999,
      image: '📱',
      description: '最新款iPhone，性能强劲',
      rating: 4.8,
      reviews: 1234,
      category: '智能手机'
    },
    {
      id: '2',
      name: 'AirPods Pro 2',
      price: 1899,
      originalPrice: 2299,
      image: '🎧',
      description: '主动降噪无线耳机',
      rating: 4.7,
      reviews: 856,
      category: '音频设备'
    },
    {
      id: '3',
      name: 'MacBook Air M2',
      price: 8999,
      image: '💻',
      description: '轻薄笔记本电脑',
      rating: 4.9,
      reviews: 645,
      category: '电脑设备'
    }
  ];

  res.json({
    success: true,
    message: '获取商品列表成功',
    data: {
      products: mockProducts,
      total: mockProducts.length,
      page: 1,
      pageSize: 20
    }
  });
});

// 获取商品详情
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  // 模拟商品详情数据
  const mockProduct = {
    id,
    name: 'iPhone 15 Pro Max',
    price: 9999,
    originalPrice: 11999,
    images: ['📱', '💻', '🎧'],
    description: '全新iPhone 15 Pro Max，搭载A17 Pro芯片，钛金属设计，拍照更出色，续航更持久。',
    features: [
      'A17 Pro芯片，性能强劲',
      '6.7英寸Super Retina XDR显示屏',
      '48MP主摄像头系统',
      '钛金属设计，更轻更坚固',
      '支持5G网络',
      '最长29小时视频播放'
    ],
    rating: 4.8,
    reviews: 1234,
    stock: 99,
    category: '智能手机'
  };

  res.json({
    success: true,
    message: '获取商品详情成功',
    data: mockProduct
  });
});

// 搜索商品
router.get('/search', (req, res) => {
  const { q, category, minPrice, maxPrice } = req.query;
  
  res.json({
    success: true,
    message: '搜索功能开发中',
    data: {
      products: [],
      total: 0,
      query: q
    }
  });
});

module.exports = router;

