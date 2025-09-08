const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  short_description: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  original_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  brand: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'out_of_stock'),
    defaultValue: 'active'
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  features: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  specifications: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  review_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  sales_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  weight: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    comment: '商品重量(kg)'
  },
  dimensions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '商品尺寸 {length, width, height}'
  },
  meta_title: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  meta_description: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
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

