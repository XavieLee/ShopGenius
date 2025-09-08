const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// 导入产品数据
const PRODUCTS = require('./products').PRODUCTS || [
  {
    id: 'p1', name: 'Velvet Matte Lipstick', category: 'Beauty', color: 'Red', price: 19,
    description: 'Long-wear matte finish with nourishing oils.',
    image: 'https://images.unsplash.com/photo-1582092728069-1d3d3b5c1a9c?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'p2', name: 'AirRun Sneakers', category: 'Shoes', color: 'Black', price: 79,
    description: 'Breathable mesh with cushioned sole.',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'p3', name: 'City Tote', category: 'Bags', color: 'Brown', price: 120,
    description: 'Everyday carry-all with laptop sleeve.',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'p4', name: 'Noise-cancel Headphones', category: 'Electronics', color: 'White', price: 149,
    description: 'Immersive sound and long battery life.',
    image: 'https://images.unsplash.com/photo-1518443895914-6bf7961a8a6e?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'p5', name: 'Trail Running Shoes', category: 'Shoes', color: 'Blue', price: 95,
    description: 'Grip outsole for off-road runs.',
    image: 'https://images.unsplash.com/photo-1520256862855-398228c41684?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'p6', name: 'Stainless Sports Bottle', category: 'Sports', color: 'Green', price: 25,
    description: 'Insulated bottle keeps drinks cold.',
    image: 'https://images.unsplash.com/photo-1599058917513-2918b9a6228d?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'p7', name: 'Classic Leather Belt', category: 'Accessories', color: 'Black', price: 35,
    description: 'Full-grain leather with metal buckle.',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'p8', name: 'Mini Crossbody', category: 'Bags', color: 'Red', price: 59,
    description: 'Compact crossbody with adjustable strap.',
    image: 'https://images.unsplash.com/photo-1591348279358-0b09b5e8b5e7?q=80&w=800&auto=format&fit=crop'
  }
];

// 自然语言解析函数
function parseNaturalLanguage(query) {
  const lowerQuery = query.toLowerCase();
  const result = {
    category: null,
    color: null,
    priceMax: null,
    priceMin: null,
    keywords: []
  };

  // 解析分类
  const categories = ['beauty', 'shoes', 'bags', 'electronics', 'sports', 'accessories'];
  for (const cat of categories) {
    if (lowerQuery.includes(cat)) {
      result.category = cat.charAt(0).toUpperCase() + cat.slice(1);
      break;
    }
  }

  // 解析颜色
  const colors = ['red', 'blue', 'black', 'white', 'green', 'brown'];
  for (const color of colors) {
    if (lowerQuery.includes(color)) {
      result.color = color.charAt(0).toUpperCase() + color.slice(1);
      break;
    }
  }

  // 解析价格
  const pricePatterns = [
    /under\s*\$?(\d+)/i,
    /below\s*\$?(\d+)/i,
    /less\s*than\s*\$?(\d+)/i,
    /under\s*(\d+)\s*元/i,
    /(\d+)\s*元以内/i,
    /(\d+)\s*rmb以内/i
  ];

  for (const pattern of pricePatterns) {
    const match = lowerQuery.match(pattern);
    if (match) {
      result.priceMax = parseInt(match[1]);
      break;
    }
  }

  // 解析关键词
  const words = query.split(/\s+/).filter(word => word.length > 2);
  result.keywords = words;

  return result;
}

// AI聊天接口
router.post('/chat', (req, res) => {
  const { message, context, persona = 'friendly' } = req.body;
  
  logger.info('🤖 AI聊天请求', {
    message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
    persona,
    context: context ? 'provided' : 'none'
  });
  
  if (!message) {
    logger.warn('❌ AI聊天请求失败: 消息内容为空');
    return res.status(400).json({
      success: false,
      message: '消息内容不能为空'
    });
  }

  // 解析用户消息
  const parsed = parseNaturalLanguage(message);
  
  // 根据解析结果推荐商品
  let recommendedProducts = [];
  let reply = '';

  if (parsed.category || parsed.color || parsed.priceMax || parsed.keywords.length > 0) {
    // 根据条件筛选商品
    recommendedProducts = PRODUCTS.filter(product => {
      if (parsed.category && product.category !== parsed.category) return false;
      if (parsed.color && product.color !== parsed.color) return false;
      if (parsed.priceMax && product.price > parsed.priceMax) return false;
      if (parsed.keywords.length > 0) {
        const productText = `${product.name} ${product.description}`.toLowerCase();
        return parsed.keywords.some(keyword => productText.includes(keyword.toLowerCase()));
      }
      return true;
    }).slice(0, 3);

    if (recommendedProducts.length > 0) {
      reply = `根据您的需求，我为您找到了${recommendedProducts.length}款商品：`;
    } else {
      reply = '抱歉，没有找到完全匹配的商品，但我可以为您推荐一些相似的产品。';
      recommendedProducts = PRODUCTS.slice(0, 3);
    }
  } else {
    // 通用回复
    const responses = {
      friendly: '您好！我是您的AI购物助手，请告诉我您想要什么类型的商品，我会为您推荐最合适的选择！',
      rational: '您好！请描述您的具体需求，包括商品类型、预算范围等，我会为您分析最性价比的选择。',
      luxury: '您好！欢迎来到我们的精品购物体验，请告诉我您的偏好，我将为您推荐最优质的商品。'
    };
    reply = responses[persona] || responses.friendly;
    recommendedProducts = PRODUCTS.slice(0, 3);
  }

  logger.info('✅ AI聊天回复完成', {
    replyLength: reply.length,
    recommendedProductsCount: recommendedProducts.length,
    parsedQuery: parsed
  });

  res.json({
    success: true,
    message: 'AI回复成功',
    data: {
      reply,
      products: recommendedProducts,
      parsedQuery: parsed,
      suggestions: ['查看更多同类商品', '比较价格', '查看用户评价', '添加到购物车']
    }
  });
});

// 智能搜索接口
router.post('/search', (req, res) => {
  const { query } = req.body;
  
  logger.info('🔍 AI智能搜索请求', {
    query: query.substring(0, 100) + (query.length > 100 ? '...' : '')
  });
  
  if (!query) {
    logger.warn('❌ AI搜索请求失败: 搜索内容为空');
    return res.status(400).json({
      success: false,
      message: '搜索内容不能为空'
    });
  }

  const parsed = parseNaturalLanguage(query);
  
  // 根据解析结果搜索商品
  let filteredProducts = PRODUCTS.filter(product => {
    if (parsed.category && product.category !== parsed.category) return false;
    if (parsed.color && product.color !== parsed.color) return false;
    if (parsed.priceMax && product.price > parsed.priceMax) return false;
    if (parsed.priceMin && product.price < parsed.priceMin) return false;
    if (parsed.keywords.length > 0) {
      const productText = `${product.name} ${product.description}`.toLowerCase();
      return parsed.keywords.some(keyword => productText.includes(keyword.toLowerCase()));
    }
    return true;
  });

  logger.info('✅ AI智能搜索完成', {
    query: query.substring(0, 50) + '...',
    totalResults: filteredProducts.length,
    parsedFilters: parsed
  });

  res.json({
    success: true,
    message: '智能搜索成功',
    data: {
      interpretation: `我理解您想要：${query}`,
      products: filteredProducts,
      total: filteredProducts.length,
      filters: {
        category: parsed.category,
        color: parsed.color,
        priceMax: parsed.priceMax,
        priceMin: parsed.priceMin,
        keywords: parsed.keywords
      }
    }
  });
});

// 商品推荐接口
router.get('/recommend/:productId?', (req, res) => {
  const { productId } = req.params;
  
  let recommendedProducts = [];
  let reason = '为您推荐热门商品';

  if (productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (product) {
      // 推荐同类别或相似颜色的商品
      recommendedProducts = PRODUCTS
        .filter(p => p.id !== productId && (p.category === product.category || p.color === product.color))
        .slice(0, 4);
      reason = `基于"${product.name}"的相似商品推荐`;
    }
  }

  if (recommendedProducts.length === 0) {
    recommendedProducts = PRODUCTS.slice(0, 4);
    reason = '为您推荐热门商品';
  }

  res.json({
    success: true,
    message: '获取推荐成功',
    data: {
      recommended: recommendedProducts,
      reason
    }
  });
});

module.exports = router;


