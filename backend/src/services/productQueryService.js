const { Product } = require('../models');
const logger = require('../utils/logger');

/**
 * 商品查询服务
 * 根据AI分析结果查询数据库中的商品
 */
class ProductQueryService {
  constructor() {
    // 查询限制
    this.DEFAULT_LIMIT = 10;
    this.MAX_LIMIT = 50;
  }

  /**
   * 根据分析结果查询商品
   * @param {Object} analysis - AI分析结果
   * @param {Object} options - 查询选项
   * @returns {Array} 商品列表
   */
  async queryProducts(analysis, options = {}) {
    try {
      logger.info('开始查询商品', { analysis, options });

      const {
        limit = this.DEFAULT_LIMIT,
        offset = 0,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = options;

      // 构建查询条件
      const whereConditions = this.buildWhereConditions(analysis);
      
      // 构建排序条件
      const orderConditions = this.buildOrderConditions(sortBy, sortOrder);

      // 执行查询
      const products = await Product.findAll({
        where: whereConditions,
        order: orderConditions,
        limit: Math.min(limit, this.MAX_LIMIT),
        offset: offset,
        raw: true
      });

      logger.info('商品查询完成', { 
        analysis,
        foundCount: products.length,
        conditions: whereConditions
      });

      return products;

    } catch (error) {
      logger.error('查询商品失败', { analysis, error: error.message });
      return [];
    }
  }

  /**
   * 构建查询条件
   * @param {Object} analysis - AI分析结果
   * @returns {Object} Sequelize查询条件
   */
  buildWhereConditions(analysis) {
    const conditions = {};

    // 类别条件
    if (analysis.category) {
      conditions.category = analysis.category;
    }

    // 颜色条件
    if (analysis.color) {
      conditions.color = analysis.color;
    }

    // 品牌条件
    if (analysis.brand) {
      conditions.brand = analysis.brand;
    }

    // 价格范围条件
    if (analysis.priceRange) {
      if (analysis.priceRange.min && analysis.priceRange.max) {
        conditions.price = {
          [require('sequelize').Op.between]: [analysis.priceRange.min, analysis.priceRange.max]
        };
      } else if (analysis.priceRange.min) {
        conditions.price = {
          [require('sequelize').Op.gte]: analysis.priceRange.min
        };
      } else if (analysis.priceRange.max) {
        conditions.price = {
          [require('sequelize').Op.lte]: analysis.priceRange.max
        };
      }
    }

    // 关键词搜索（在名称和描述中搜索）
    if (analysis.keywords && analysis.keywords.length > 0) {
      const keywordConditions = analysis.keywords.map(keyword => ({
        [require('sequelize').Op.or]: [
          { name: { [require('sequelize').Op.like]: `%${keyword}%` } },
          { description: { [require('sequelize').Op.like]: `%${keyword}%` } }
        ]
      }));

      if (keywordConditions.length > 0) {
        conditions[require('sequelize').Op.or] = keywordConditions;
      }
    }

    // 只查询有库存的商品
    conditions.stock_quantity = {
      [require('sequelize').Op.gt]: 0
    };

    // 只查询上架的商品
    conditions.status = 'active';

    return conditions;
  }

  /**
   * 构建排序条件
   * @param {string} sortBy - 排序字段
   * @param {string} sortOrder - 排序方向
   * @returns {Array} 排序条件数组
   */
  buildOrderConditions(sortBy, sortOrder) {
    const validSortFields = ['name', 'price', 'rating', 'sales_count', 'created_at'];
    const validSortOrders = ['ASC', 'DESC'];

    const field = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    return [[field, order]];
  }

  /**
   * 根据类别查询热门商品
   * @param {string} category - 商品类别
   * @param {number} limit - 限制数量
   * @returns {Array} 商品列表
   */
  async getPopularProductsByCategory(category, limit = 5) {
    try {
      logger.info('查询类别热门商品', { category, limit });

      const products = await Product.findAll({
        where: {
          category: category,
          status: 'active',
          stock_quantity: { [require('sequelize').Op.gt]: 0 }
        },
        order: [
          ['rating', 'DESC'],
          ['review_count', 'DESC'],
          ['created_at', 'DESC']
        ],
        limit: limit,
        raw: true
      });

      logger.info('类别热门商品查询完成', { category, foundCount: products.length });
      return products;

    } catch (error) {
      logger.error('查询类别热门商品失败', { category, error: error.message });
      return [];
    }
  }

  /**
   * 根据价格范围查询商品
   * @param {number} minPrice - 最低价格
   * @param {number} maxPrice - 最高价格
   * @param {number} limit - 限制数量
   * @returns {Array} 商品列表
   */
  async getProductsByPriceRange(minPrice, maxPrice, limit = 10) {
    try {
      logger.info('根据价格范围查询商品', { minPrice, maxPrice, limit });

      const products = await Product.findAll({
        where: {
          price: {
            [require('sequelize').Op.between]: [minPrice, maxPrice]
          },
          status: 'active',
          stock_quantity: { [require('sequelize').Op.gt]: 0 }
        },
        order: [
          ['rating', 'DESC'],
          ['review_count', 'DESC']
        ],
        limit: limit,
        raw: true
      });

      logger.info('价格范围商品查询完成', { minPrice, maxPrice, foundCount: products.length });
      return products;

    } catch (error) {
      logger.error('根据价格范围查询商品失败', { minPrice, maxPrice, error: error.message });
      return [];
    }
  }

  /**
   * 搜索商品（模糊匹配）
   * @param {string} searchTerm - 搜索词
   * @param {number} limit - 限制数量
   * @returns {Array} 商品列表
   */
  async searchProducts(searchTerm, limit = 10) {
    try {
      logger.info('搜索商品', { searchTerm, limit });

      const products = await Product.findAll({
        where: {
          [require('sequelize').Op.or]: [
            { name: { [require('sequelize').Op.like]: `%${searchTerm}%` } },
            { description: { [require('sequelize').Op.like]: `%${searchTerm}%` } },
            { brand: { [require('sequelize').Op.like]: `%${searchTerm}%` } }
          ],
          status: 'active',
          stock_quantity: { [require('sequelize').Op.gt]: 0 }
        },
        order: [
          ['rating', 'DESC'],
          ['review_count', 'DESC']
        ],
        limit: limit,
        raw: true
      });

      logger.info('商品搜索完成', { searchTerm, foundCount: products.length });
      return products;

    } catch (error) {
      logger.error('搜索商品失败', { searchTerm, error: error.message });
      return [];
    }
  }

  /**
   * 获取推荐商品（基于评分和销量）
   * @param {number} limit - 限制数量
   * @returns {Array} 商品列表
   */
  async getRecommendedProducts(limit = 10) {
    try {
      logger.info('获取推荐商品', { limit });

      const products = await Product.findAll({
        where: {
          status: 'active',
          stock_quantity: { [require('sequelize').Op.gt]: 0 },
          rating: { [require('sequelize').Op.gte]: 4.0 } // 评分4.0以上
        },
        order: [
          ['rating', 'DESC'],
          ['review_count', 'DESC'],
          ['created_at', 'DESC']
        ],
        limit: limit,
        raw: true
      });

      logger.info('推荐商品查询完成', { foundCount: products.length });
      return products;

    } catch (error) {
      logger.error('获取推荐商品失败', { error: error.message });
      return [];
    }
  }
}

module.exports = new ProductQueryService();

