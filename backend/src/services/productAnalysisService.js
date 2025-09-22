const logger = require('../utils/logger');

/**
 * 商品需求分析服务
 * 从用户消息中提取商品相关的需求信息
 */
class ProductAnalysisService {
  constructor() {
    // 商品类别映射
    this.categoryMap = {
      '运动鞋': 'shoes',
      '鞋子': 'shoes',
      '鞋': 'shoes',
      '高跟鞋': 'shoes',
      '平底鞋': 'shoes',
      '靴子': 'shoes',
      '手机': 'electronics',
      'iPhone': 'electronics',
      '苹果手机': 'electronics',
      '三星': 'electronics',
      '华为': 'electronics',
      '小米': 'electronics',
      '电脑': 'electronics',
      '笔记本': 'electronics',
      'MacBook': 'electronics',
      '衣服': 'clothing',
      '服装': 'clothing',
      '上衣': 'clothing',
      '裤子': 'clothing',
      '裙子': 'clothing',
      '外套': 'clothing',
      '包包': 'bags',
      '包': 'bags',
      '手提包': 'bags',
      '背包': 'bags',
      '化妆品': 'beauty',
      '护肤品': 'beauty',
      '口红': 'beauty',
      '香水': 'beauty'
    };

    // 颜色映射
    this.colorMap = {
      '红色': 'red',
      '红': 'red',
      '黑色': 'black',
      '黑': 'black',
      '白色': 'white',
      '白': 'white',
      '蓝色': 'blue',
      '蓝': 'blue',
      '绿色': 'green',
      '绿': 'green',
      '黄色': 'yellow',
      '黄': 'yellow',
      '粉色': 'pink',
      '粉': 'pink',
      '紫色': 'purple',
      '紫': 'purple',
      '灰色': 'gray',
      '灰': 'gray',
      '棕色': 'brown',
      '棕': 'brown'
    };

    // 品牌映射
    this.brandMap = {
      'Nike': 'nike',
      '耐克': 'nike',
      'Adidas': 'adidas',
      '阿迪达斯': 'adidas',
      'Apple': 'apple',
      '苹果': 'apple',
      'Samsung': 'samsung',
      '三星': 'samsung',
      '华为': 'huawei',
      'Huawei': 'huawei',
      '小米': 'xiaomi',
      'Xiaomi': 'xiaomi',
      'LV': 'louis_vuitton',
      '路易威登': 'louis_vuitton',
      'Gucci': 'gucci',
      '古驰': 'gucci',
      'Chanel': 'chanel',
      '香奈儿': 'chanel'
    };
  }

  /**
   * 分析用户消息，提取商品需求
   * @param {string} message - 用户消息
   * @returns {Object} 分析结果
   */
  analyzeUserMessage(message) {
    try {
      logger.info('开始分析用户消息', { message });

      const analysis = {
        hasProductIntent: false,
        category: null,
        color: null,
        brand: null,
        priceRange: null,
        keywords: [],
        searchQuery: null
      };

      // 检查是否包含商品相关关键词
      const productKeywords = Object.keys(this.categoryMap);
      const hasProductIntent = productKeywords.some(keyword => 
        message.includes(keyword)
      );

      if (!hasProductIntent) {
        logger.info('消息不包含商品意图', { message });
        return analysis;
      }

      analysis.hasProductIntent = true;

      // 提取类别
      for (const [keyword, category] of Object.entries(this.categoryMap)) {
        if (message.includes(keyword)) {
          analysis.category = category;
          analysis.keywords.push(keyword);
          break;
        }
      }

      // 提取颜色
      for (const [keyword, color] of Object.entries(this.colorMap)) {
        if (message.includes(keyword)) {
          analysis.color = color;
          analysis.keywords.push(keyword);
          break;
        }
      }

      // 提取品牌
      for (const [keyword, brand] of Object.entries(this.brandMap)) {
        if (message.includes(keyword)) {
          analysis.brand = brand;
          analysis.keywords.push(keyword);
          break;
        }
      }

      // 提取价格范围
      const pricePatterns = [
        { pattern: /(\d+)块以下/, type: 'max', multiplier: 1 },
        { pattern: /(\d+)元以下/, type: 'max', multiplier: 1 },
        { pattern: /(\d+)以下/, type: 'max', multiplier: 1 },
        { pattern: /(\d+)块以上/, type: 'min', multiplier: 1 },
        { pattern: /(\d+)元以上/, type: 'min', multiplier: 1 },
        { pattern: /(\d+)以上/, type: 'min', multiplier: 1 },
        { pattern: /(\d+)到(\d+)/, type: 'range', multiplier: 1 },
        { pattern: /(\d+)-(\d+)/, type: 'range', multiplier: 1 },
        { pattern: /(\d+)k以下/, type: 'max', multiplier: 1000 },
        { pattern: /(\d+)k以上/, type: 'min', multiplier: 1000 }
      ];

      for (const { pattern, type, multiplier } of pricePatterns) {
        const match = message.match(pattern);
        if (match) {
          if (type === 'max') {
            analysis.priceRange = { max: parseInt(match[1]) * multiplier };
          } else if (type === 'min') {
            analysis.priceRange = { min: parseInt(match[1]) * multiplier };
          } else if (type === 'range') {
            analysis.priceRange = { 
              min: parseInt(match[1]) * multiplier,
              max: parseInt(match[2]) * multiplier
            };
          }
          analysis.keywords.push(match[0]);
          break;
        }
      }

      // 生成搜索查询
      analysis.searchQuery = this.generateSearchQuery(analysis);

      logger.info('用户消息分析完成', { 
        message, 
        analysis,
        extractedKeywords: analysis.keywords
      });

      return analysis;

    } catch (error) {
      logger.error('分析用户消息失败', { message, error: error.message });
      return {
        hasProductIntent: false,
        category: null,
        color: null,
        brand: null,
        priceRange: null,
        keywords: [],
        searchQuery: null
      };
    }
  }

  /**
   * 生成搜索查询字符串
   * @param {Object} analysis - 分析结果
   * @returns {string} 搜索查询
   */
  generateSearchQuery(analysis) {
    const queryParts = [];

    if (analysis.category) {
      const categoryName = Object.keys(this.categoryMap).find(
        key => this.categoryMap[key] === analysis.category
      );
      if (categoryName) {
        queryParts.push(categoryName);
      }
    }

    if (analysis.color) {
      const colorName = Object.keys(this.colorMap).find(
        key => this.colorMap[key] === analysis.color
      );
      if (colorName) {
        queryParts.push(colorName);
      }
    }

    if (analysis.brand) {
      const brandName = Object.keys(this.brandMap).find(
        key => this.brandMap[key] === analysis.brand
      );
      if (brandName) {
        queryParts.push(brandName);
      }
    }

    if (analysis.priceRange) {
      if (analysis.priceRange.max) {
        queryParts.push(`${analysis.priceRange.max}元以下`);
      } else if (analysis.priceRange.min) {
        queryParts.push(`${analysis.priceRange.min}元以上`);
      }
    }

    return queryParts.join(' ');
  }

  /**
   * 检查消息是否包含商品推荐请求
   * @param {string} message - 用户消息
   * @returns {boolean} 是否包含推荐请求
   */
  hasRecommendationRequest(message) {
    const recommendationKeywords = [
      '推荐', '建议', '介绍', '有什么', '哪些', '选择', '买什么',
      '推荐一下', '给我推荐', '帮我推荐', '有什么好的',
      '性价比', '便宜', '实惠', '质量好', '口碑好'
    ];

    return recommendationKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * 检查消息是否包含比较请求
   * @param {string} message - 用户消息
   * @returns {boolean} 是否包含比较请求
   */
  hasComparisonRequest(message) {
    const comparisonKeywords = [
      '对比', '比较', '哪个好', '区别', '差异', 'vs', 'VS',
      '和', '与', '相比', '对比一下', '比较一下'
    ];

    return comparisonKeywords.some(keyword => message.includes(keyword));
  }
}

module.exports = new ProductAnalysisService();

