const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { Product } = require('../models');
const { Op } = require('sequelize');

// 从数据库查询产品的函数
async function getProductsFromDatabase(filters = {}) {
  try {
    const whereClause = {
      status: 'active'
    };

    // 应用筛选条件
    if (filters.category) {
      whereClause.category = filters.category;
    }
    
    if (filters.color) {
      whereClause.color = filters.color;
    }
    
    if (filters.priceMax) {
      whereClause.price = {
        ...whereClause.price,
        [Op.lte]: filters.priceMax
      };
    }
    
    if (filters.priceMin) {
      whereClause.price = {
        ...whereClause.price,
        [Op.gte]: filters.priceMin
      };
    }
    
    if (filters.keywords && filters.keywords.length > 0) {
      whereClause[Op.or] = filters.keywords.map(keyword => [
        { name: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } },
        { category: { [Op.like]: `%${keyword}%` } }
      ]).flat();
    }

    const products = await Product.findAll({
      where: whereClause,
      order: [['rating', 'DESC'], ['review_count', 'DESC']],
      limit: filters.limit || 10
    });

    // 转换数据格式以匹配前端期望的格式
    return products.map(product => ({
      id: product.id.toString(),
      name: product.name,
      category: product.category,
      color: product.color,
      price: parseFloat(product.price),
      originalPrice: product.original_price ? parseFloat(product.original_price) : undefined,
      description: product.description,
      image: product.image_url,
      rating: product.rating ? parseFloat(product.rating) : 0,
      reviews: product.review_count || 0,
      stock: product.stock_quantity || 0,
      features: product.tags || []
    }));
  } catch (error) {
    logger.error('从数据库查询产品失败', { error: error.message });
    return [];
  }
}

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
router.post('/chat', async (req, res) => {
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

  try {
    // 解析用户消息
    const parsed = parseNaturalLanguage(message);
    
    // 根据解析结果推荐商品
    let recommendedProducts = [];
    let reply = '';

    if (parsed.category || parsed.color || parsed.priceMax || parsed.keywords.length > 0) {
      // 从数据库查询商品
      recommendedProducts = await getProductsFromDatabase({
        category: parsed.category,
        color: parsed.color,
        priceMax: parsed.priceMax,
        keywords: parsed.keywords,
        limit: 3
      });

      if (recommendedProducts.length > 0) {
        reply = `根据您的需求，我为您找到了${recommendedProducts.length}款商品：`;
      } else {
        reply = '抱歉，没有找到完全匹配的商品，但我可以为您推荐一些相似的产品。';
        recommendedProducts = await getProductsFromDatabase({ limit: 3 });
      }
    } else {
      // 通用回复
      const responses = {
        friendly: '您好！我是您的AI购物助手，请告诉我您想要什么类型的商品，我会为您推荐最合适的选择！',
        rational: '您好！请描述您的具体需求，包括商品类型、预算范围等，我会为您分析最性价比的选择。',
        luxury: '您好！欢迎来到我们的精品购物体验，请告诉我您的偏好，我将为您推荐最优质的商品。'
      };
      reply = responses[persona] || responses.friendly;
      recommendedProducts = await getProductsFromDatabase({ limit: 3 });
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
  } catch (error) {
    logger.error('AI聊天处理失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'AI聊天处理失败',
      error: error.message
    });
  }
});

// 智能搜索接口
router.post('/search', async (req, res) => {
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

  try {
    const parsed = parseNaturalLanguage(query);
    
    // 从数据库查询商品
    const filteredProducts = await getProductsFromDatabase({
      category: parsed.category,
      color: parsed.color,
      priceMax: parsed.priceMax,
      priceMin: parsed.priceMin,
      keywords: parsed.keywords,
      limit: 20
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
  } catch (error) {
    logger.error('AI智能搜索失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'AI智能搜索失败',
      error: error.message
    });
  }
});

// 商品推荐接口
router.get('/recommend/:productId?', async (req, res) => {
  const { productId } = req.params;
  
  try {
    let recommendedProducts = [];
    let reason = '为您推荐热门商品';

    if (productId) {
      const product = await Product.findByPk(productId);
      if (product) {
        // 推荐同类别或相似颜色的商品
        const similarProducts = await Product.findAll({
          where: {
            id: { [Op.ne]: productId },
            status: 'active',
            [Op.or]: [
              { category: product.category },
              { color: product.color }
            ]
          },
          order: [['rating', 'DESC']],
          limit: 4
        });

        recommendedProducts = similarProducts.map(p => ({
          id: p.id.toString(),
          name: p.name,
          category: p.category,
          color: p.color,
          price: parseFloat(p.price),
          originalPrice: p.original_price ? parseFloat(p.original_price) : undefined,
          description: p.description,
          image: p.image_url,
          rating: p.rating ? parseFloat(p.rating) : 0,
          reviews: p.review_count || 0,
          stock: p.stock_quantity || 0,
          features: p.tags || []
        }));

        reason = `基于"${product.name}"的相似商品推荐`;
      }
    }

    if (recommendedProducts.length === 0) {
      recommendedProducts = await getProductsFromDatabase({ limit: 4 });
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
  } catch (error) {
    logger.error('商品推荐失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '商品推荐失败',
      error: error.message
    });
  }
});

module.exports = router;


