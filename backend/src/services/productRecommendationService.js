const productAnalysisService = require('./productAnalysisService');
const productQueryService = require('./productQueryService');
const logger = require('../utils/logger');

/**
 * 商品推荐服务
 * 整合AI分析和商品查询，为用户提供智能商品推荐
 */
class ProductRecommendationService {
  constructor() {
    this.maxRecommendations = 6; // 最大推荐数量
  }

  /**
   * 根据用户消息生成商品推荐
   * @param {string} userMessage - 用户消息
   * @param {Object} options - 推荐选项
   * @returns {Object} 推荐结果
   */
  async generateRecommendations(userMessage, options = {}) {
    try {
      logger.info('开始生成商品推荐', { userMessage, options });

      // 1. 分析用户消息
      const analysis = productAnalysisService.analyzeUserMessage(userMessage);
      
      if (!analysis.hasProductIntent) {
        logger.info('用户消息不包含商品意图，跳过推荐');
        return {
          hasRecommendations: false,
          products: [],
          analysis: null,
          message: '未检测到商品相关需求'
        };
      }

      // 2. 根据分析结果查询商品
      const products = await this.queryProductsBasedOnAnalysis(analysis, options);

      // 3. 生成推荐消息
      const recommendationMessage = this.generateRecommendationMessage(analysis, products);

      const result = {
        hasRecommendations: true,
        products: products,
        analysis: analysis,
        message: recommendationMessage,
        searchQuery: analysis.searchQuery
      };

      logger.info('商品推荐生成完成', { 
        userMessage,
        foundProducts: products.length,
        analysis: analysis
      });

      return result;

    } catch (error) {
      logger.error('生成商品推荐失败', { userMessage, error: error.message });
      return {
        hasRecommendations: false,
        products: [],
        analysis: null,
        message: '推荐生成失败，请稍后重试'
      };
    }
  }

  /**
   * 根据分析结果查询商品
   * @param {Object} analysis - AI分析结果
   * @param {Object} options - 查询选项
   * @returns {Array} 商品列表
   */
  async queryProductsBasedOnAnalysis(analysis, options = {}) {
    try {
      let products = [];

      // 如果有具体的类别、颜色、品牌等条件，进行精确查询
      if (analysis.category || analysis.color || analysis.brand || analysis.priceRange) {
        products = await productQueryService.queryProducts(analysis, {
          limit: this.maxRecommendations,
          ...options
        });
      }

      // 如果精确查询结果不足，进行补充查询
      if (products.length < 3) {
        const supplementaryProducts = await this.getSupplementaryProducts(analysis, products);
        products = [...products, ...supplementaryProducts].slice(0, this.maxRecommendations);
      }

      // 如果还是没有结果，进行模糊搜索
      if (products.length === 0 && analysis.keywords.length > 0) {
        for (const keyword of analysis.keywords) {
          const searchResults = await productQueryService.searchProducts(keyword, 3);
          products = [...products, ...searchResults];
          if (products.length >= 3) break;
        }
        products = products.slice(0, this.maxRecommendations);
      }

      // 如果仍然没有结果，推荐热门商品
      if (products.length === 0) {
        products = await productQueryService.getRecommendedProducts(this.maxRecommendations);
      }

      return products;

    } catch (error) {
      logger.error('根据分析结果查询商品失败', { analysis, error: error.message });
      return [];
    }
  }

  /**
   * 获取补充商品（当精确查询结果不足时）
   * @param {Object} analysis - AI分析结果
   * @param {Array} existingProducts - 已有商品列表
   * @returns {Array} 补充商品列表
   */
  async getSupplementaryProducts(analysis, existingProducts) {
    try {
      const existingIds = existingProducts.map(p => p.id);
      let supplementaryProducts = [];

      // 如果指定了类别，推荐同类别的热门商品
      if (analysis.category) {
        const categoryProducts = await productQueryService.getPopularProductsByCategory(
          analysis.category, 
          3
        );
        supplementaryProducts = categoryProducts.filter(p => !existingIds.includes(p.id));
      }

      // 如果指定了价格范围，推荐同价格范围的热门商品
      if (analysis.priceRange && supplementaryProducts.length < 3) {
        const { min, max } = analysis.priceRange;
        if (min && max) {
          const priceProducts = await productQueryService.getProductsByPriceRange(min, max, 3);
          const newProducts = priceProducts.filter(p => !existingIds.includes(p.id));
          supplementaryProducts = [...supplementaryProducts, ...newProducts];
        }
      }

      return supplementaryProducts.slice(0, 3);

    } catch (error) {
      logger.error('获取补充商品失败', { analysis, error: error.message });
      return [];
    }
  }

  /**
   * 生成推荐消息
   * @param {Object} analysis - AI分析结果
   * @param {Array} products - 推荐商品列表
   * @returns {string} 推荐消息
   */
  generateRecommendationMessage(analysis, products) {
    if (products.length === 0) {
      return '抱歉，没有找到符合您需求的商品。您可以尝试调整搜索条件或浏览其他商品。';
    }

    const categoryName = this.getCategoryDisplayName(analysis.category);
    const colorName = this.getColorDisplayName(analysis.color);
    const brandName = this.getBrandDisplayName(analysis.brand);
    
    let message = `根据您的需求，我为您推荐了${products.length}款商品：\n\n`;

    if (categoryName) {
      message += `**类别**: ${categoryName}\n`;
    }
    if (colorName) {
      message += `**颜色**: ${colorName}\n`;
    }
    if (brandName) {
      message += `**品牌**: ${brandName}\n`;
    }
    if (analysis.priceRange) {
      if (analysis.priceRange.min && analysis.priceRange.max) {
        message += `**价格**: ${analysis.priceRange.min}-${analysis.priceRange.max}元\n`;
      } else if (analysis.priceRange.max) {
        message += `**价格**: ${analysis.priceRange.max}元以下\n`;
      } else if (analysis.priceRange.min) {
        message += `**价格**: ${analysis.priceRange.min}元以上\n`;
      }
    }

    message += '\n这些商品都经过精心筛选，具有良好的性价比和用户评价。您可以点击查看详情或直接加入购物车。';

    return message;
  }

  /**
   * 获取类别显示名称
   * @param {string} category - 类别代码
   * @returns {string} 显示名称
   */
  getCategoryDisplayName(category) {
    const categoryNames = {
      'shoes': '鞋类',
      'electronics': '电子产品',
      'clothing': '服装',
      'bags': '包包',
      'beauty': '美妆'
    };
    return categoryNames[category] || category;
  }

  /**
   * 获取颜色显示名称
   * @param {string} color - 颜色代码
   * @returns {string} 显示名称
   */
  getColorDisplayName(color) {
    const colorNames = {
      'red': '红色',
      'black': '黑色',
      'white': '白色',
      'blue': '蓝色',
      'green': '绿色',
      'yellow': '黄色',
      'pink': '粉色',
      'purple': '紫色',
      'gray': '灰色',
      'brown': '棕色'
    };
    return colorNames[color] || color;
  }

  /**
   * 获取品牌显示名称
   * @param {string} brand - 品牌代码
   * @returns {string} 显示名称
   */
  getBrandDisplayName(brand) {
    const brandNames = {
      'nike': 'Nike',
      'adidas': 'Adidas',
      'apple': 'Apple',
      'samsung': 'Samsung',
      'huawei': '华为',
      'xiaomi': '小米',
      'louis_vuitton': 'Louis Vuitton',
      'gucci': 'Gucci',
      'chanel': 'Chanel'
    };
    return brandNames[brand] || brand;
  }

  /**
   * 检查是否需要商品推荐
   * @param {string} message - 用户消息
   * @returns {boolean} 是否需要推荐
   */
  shouldRecommendProducts(message) {
    const analysis = productAnalysisService.analyzeUserMessage(message);
    return analysis.hasProductIntent || 
           productAnalysisService.hasRecommendationRequest(message);
  }
}

module.exports = new ProductRecommendationService();

