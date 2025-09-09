const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '商品ID'
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '商品名称'
  },
  description: {
    type: DataTypes.TEXT,
    comment: '商品描述'
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '商品分类'
  },
  subcategory: {
    type: DataTypes.STRING(100),
    comment: '商品子分类'
  },
  brand: {
    type: DataTypes.STRING(100),
    comment: '品牌'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '价格'
  },
  original_price: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '原价'
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'CNY',
    comment: '货币单位'
  },
  color: {
    type: DataTypes.STRING(50),
    comment: '颜色'
  },
  size: {
    type: DataTypes.STRING(50),
    comment: '尺寸'
  },
  material: {
    type: DataTypes.STRING(100),
    comment: '材质'
  },
  weight: {
    type: DataTypes.DECIMAL(8, 2),
    comment: '重量(kg)'
  },
  dimensions: {
    type: DataTypes.STRING(100),
    comment: '尺寸规格'
  },
  image_url: {
    type: DataTypes.STRING(500),
    comment: '主图URL'
  },
  images: {
    type: DataTypes.JSON,
    comment: '商品图片列表'
  },
  tags: {
    type: DataTypes.JSON,
    comment: '商品标签'
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.00,
    comment: '评分'
  },
  review_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '评价数量'
  },
  stock_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '库存数量'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'out_of_stock', 'discontinued'),
    defaultValue: 'active',
    comment: '商品状态'
  },
  seo_title: {
    type: DataTypes.STRING(200),
    comment: 'SEO标题'
  },
  seo_description: {
    type: DataTypes.TEXT,
    comment: 'SEO描述'
  }
}, {
  tableName: 'products',
  indexes: [
    {
      fields: ['category']
    },
    {
      fields: ['brand']
    },
    {
      fields: ['status']
    },
    {
      fields: ['price']
    },
    {
      fields: ['rating']
    },
    {
      fields: ['is_featured']
    }
  ]
});

module.exports = Product;

