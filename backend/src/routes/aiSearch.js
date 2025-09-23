const express = require('express');
const router = express.Router();
const productAnalysisService = require('../services/productAnalysisService');
const productQueryService = require('../services/productQueryService');
const logger = require('../utils/logger');

/**
 * POST /api/products/ai-search
 * AI智能搜索商品
 */
router.post('/ai-search', async (req, res) => {
  try {
    const { query, userId = '1' } = req.body;
    
    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_QUERY',
          message: '搜索查询不能为空'
        }
      });
    }

    logger.info('AI智能搜索请求', { query, userId });

    // 使用AI分析用户查询
    const analysis = await productAnalysisService.analyzeUserMessage(query);
    logger.info('AI分析结果', { analysis });

    // 根据分析结果查询商品
    let products = [];
    if (analysis.hasRecommendations) {
      // 如果有明确的商品推荐需求，使用推荐服务
      const recommendations = await productQueryService.getRecommendedProducts(
        analysis.category,
        analysis.color,
        analysis.brand,
        analysis.priceRange,
        analysis.keywords
      );
      products = recommendations;
    } else {
      // 否则使用通用搜索
      products = await productQueryService.searchProducts(
        analysis.keywords.join(' '),
        analysis.category,
        analysis.color,
        analysis.brand,
        analysis.priceRange
      );
    }

    logger.info('AI搜索完成', { 
      query, 
      productCount: products.length,
      analysis: {
        category: analysis.category,
        color: analysis.color,
        brand: analysis.brand,
        priceRange: analysis.priceRange,
        keywords: analysis.keywords
      }
    });

    res.json({
      success: true,
      data: {
        products,
        searchQuery: query,
        analysis: {
          intent: analysis.intent,
          category: analysis.category,
          color: analysis.color,
          brand: analysis.brand,
          priceRange: analysis.priceRange,
          keywords: analysis.keywords,
          hasRecommendations: analysis.hasRecommendations
        },
        total: products.length
      }
    });

  } catch (error) {
    logger.error('AI智能搜索失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'AI_SEARCH_FAILED',
        message: 'AI搜索失败',
        details: error.message
      }
    });
  }
});

/**
 * POST /api/products/ai-filter
 * AI智能筛选商品
 */
router.post('/ai-filter', async (req, res) => {
  try {
    const { filters, userId = '1' } = req.body;
    
    if (!filters || !Array.isArray(filters)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FILTERS',
          message: '筛选条件不能为空'
        }
      });
    }

    logger.info('AI智能筛选请求', { filters, userId });

    // 构建查询条件
    const conditions = {};
    filters.forEach(filter => {
      switch (filter.type) {
        case 'category':
          conditions.category = filter.value;
          break;
        case 'color':
          conditions.color = filter.value;
          break;
        case 'brand':
          conditions.brand = filter.value;
          break;
        case 'price':
          if (filter.value.max) conditions.maxPrice = filter.value.max;
          if (filter.value.min) conditions.minPrice = filter.value.min;
          break;
        case 'rating':
          conditions.minRating = filter.value;
          break;
      }
    });

    // 查询商品
    const products = await productQueryService.getProducts(conditions);

    logger.info('AI智能筛选完成', { 
      filters, 
      productCount: products.length,
      conditions
    });

    res.json({
      success: true,
      data: {
        products,
        filters,
        total: products.length
      }
    });

  } catch (error) {
    logger.error('AI智能筛选失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'AI_FILTER_FAILED',
        message: 'AI筛选失败',
        details: error.message
      }
    });
  }
});

module.exports = router;
