const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// 模拟商品数据库
const PRODUCTS = [
  {
    id: 'p1',
    name: 'Velvet Matte Lipstick',
    category: 'Beauty',
    color: 'Red',
    price: 19,
    originalPrice: 25,
    description: 'Long-wear matte finish with nourishing oils.',
    image: 'https://images.unsplash.com/photo-1582092728069-1d3d3b5c1a9c?q=80&w=800&auto=format&fit=crop',
    rating: 4.5,
    reviews: 234,
    stock: 50,
    features: ['Long-lasting', 'Matte finish', 'Nourishing oils']
  },
  {
    id: 'p2',
    name: 'AirRun Sneakers',
    category: 'Shoes',
    color: 'Black',
    price: 79,
    originalPrice: 99,
    description: 'Breathable mesh with cushioned sole.',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop',
    rating: 4.7,
    reviews: 156,
    stock: 30,
    features: ['Breathable mesh', 'Cushioned sole', 'Lightweight']
  },
  {
    id: 'p3',
    name: 'City Tote',
    category: 'Bags',
    color: 'Brown',
    price: 120,
    originalPrice: 150,
    description: 'Everyday carry-all with laptop sleeve.',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800&auto=format&fit=crop',
    rating: 4.6,
    reviews: 89,
    stock: 25,
    features: ['Laptop sleeve', 'Durable material', 'Multiple compartments']
  },
  {
    id: 'p4',
    name: 'Noise-cancel Headphones',
    category: 'Electronics',
    color: 'White',
    price: 149,
    originalPrice: 199,
    description: 'Immersive sound and long battery life.',
    image: 'https://images.unsplash.com/photo-1518443895914-6bf7961a8a6e?q=80&w=800&auto=format&fit=crop',
    rating: 4.8,
    reviews: 312,
    stock: 40,
    features: ['Active noise cancellation', '30h battery', 'Wireless']
  },
  {
    id: 'p5',
    name: 'Trail Running Shoes',
    category: 'Shoes',
    color: 'Blue',
    price: 95,
    originalPrice: 120,
    description: 'Grip outsole for off-road runs.',
    image: 'https://images.unsplash.com/photo-1520256862855-398228c41684?q=80&w=800&auto=format&fit=crop',
    rating: 4.4,
    reviews: 178,
    stock: 35,
    features: ['Trail grip', 'Water resistant', 'Comfortable fit']
  },
  {
    id: 'p6',
    name: 'Stainless Sports Bottle',
    category: 'Sports',
    color: 'Green',
    price: 25,
    originalPrice: 35,
    description: 'Insulated bottle keeps drinks cold.',
    image: 'https://images.unsplash.com/photo-1599058917513-2918b9a6228d?q=80&w=800&auto=format&fit=crop',
    rating: 4.3,
    reviews: 67,
    stock: 60,
    features: ['Insulated', 'Leak-proof', 'BPA-free']
  },
  {
    id: 'p7',
    name: 'Classic Leather Belt',
    category: 'Accessories',
    color: 'Black',
    price: 35,
    originalPrice: 45,
    description: 'Full-grain leather with metal buckle.',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop',
    rating: 4.5,
    reviews: 123,
    stock: 45,
    features: ['Full-grain leather', 'Metal buckle', 'Adjustable']
  },
  {
    id: 'p8',
    name: 'Mini Crossbody',
    category: 'Bags',
    color: 'Red',
    price: 59,
    originalPrice: 79,
    description: 'Compact crossbody with adjustable strap.',
    image: 'https://images.unsplash.com/photo-1591348279358-0b09b5e8b5e7?q=80&w=800&auto=format&fit=crop',
    rating: 4.4,
    reviews: 98,
    stock: 20,
    features: ['Compact size', 'Adjustable strap', 'Multiple pockets']
  }
];

// 获取商品列表
router.get('/', (req, res) => {
  const { category, color, maxPrice, minPrice, search, page = 1, limit = 20 } = req.query;
  
  logger.info('🛍️ 获取商品列表请求', {
    filters: { category, color, maxPrice, minPrice, search },
    pagination: { page, limit }
  });
  
  let filteredProducts = [...PRODUCTS];
  
  // 应用筛选条件
  if (category) {
    filteredProducts = filteredProducts.filter(p => p.category === category);
  }
  
  if (color) {
    filteredProducts = filteredProducts.filter(p => p.color === color);
  }
  
  if (minPrice) {
    filteredProducts = filteredProducts.filter(p => p.price >= parseInt(minPrice));
  }
  
  if (maxPrice) {
    filteredProducts = filteredProducts.filter(p => p.price <= parseInt(maxPrice));
  }
  
  if (search) {
    const searchLower = search.toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(searchLower) ||
      p.description.toLowerCase().includes(searchLower) ||
      p.category.toLowerCase().includes(searchLower)
    );
  }
  
  // 分页
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  
  logger.info('✅ 商品列表查询完成', {
    totalProducts: PRODUCTS.length,
    filteredCount: filteredProducts.length,
    returnedCount: paginatedProducts.length,
    page: parseInt(page),
    totalPages: Math.ceil(filteredProducts.length / limit)
  });
  
  res.json({
    success: true,
    message: '获取商品列表成功',
    data: {
      products: paginatedProducts,
      total: filteredProducts.length,
      page: parseInt(page),
      pageSize: parseInt(limit),
      totalPages: Math.ceil(filteredProducts.length / limit)
    }
  });
});

// 获取商品详情
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  logger.info('🔍 获取商品详情请求', { productId: id });
  
  const product = PRODUCTS.find(p => p.id === id);
  
  if (!product) {
    logger.warn('❌ 商品不存在', { productId: id });
    return res.status(404).json({
      success: false,
      message: '商品不存在'
    });
  }

  // 获取相关商品推荐
  const relatedProducts = PRODUCTS
    .filter(p => p.id !== id && (p.category === product.category || p.color === product.color))
    .slice(0, 4);

  logger.info('✅ 商品详情查询完成', {
    productId: id,
    productName: product.name,
    relatedProductsCount: relatedProducts.length
  });

  res.json({
    success: true,
    message: '获取商品详情成功',
    data: {
      ...product,
      relatedProducts
    }
  });
});

// 搜索商品
router.get('/search', (req, res) => {
  const { q, category, minPrice, maxPrice, color } = req.query;
  
  logger.info('🔍 商品搜索请求', {
    query: q,
    filters: { category, minPrice, maxPrice, color }
  });
  
  let filteredProducts = [...PRODUCTS];
  
  // 关键词搜索
  if (q) {
    const searchLower = q.toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(searchLower) ||
      p.description.toLowerCase().includes(searchLower) ||
      p.category.toLowerCase().includes(searchLower) ||
      p.features.some(f => f.toLowerCase().includes(searchLower))
    );
  }
  
  // 其他筛选条件
  if (category) {
    filteredProducts = filteredProducts.filter(p => p.category === category);
  }
  
  if (color) {
    filteredProducts = filteredProducts.filter(p => p.color === color);
  }
  
  if (minPrice) {
    filteredProducts = filteredProducts.filter(p => p.price >= parseInt(minPrice));
  }
  
  if (maxPrice) {
    filteredProducts = filteredProducts.filter(p => p.price <= parseInt(maxPrice));
  }
  
  logger.info('✅ 商品搜索完成', {
    query: q,
    totalResults: filteredProducts.length,
    searchTime: new Date().toISOString()
  });
  
  res.json({
    success: true,
    message: '搜索成功',
    data: {
      products: filteredProducts,
      total: filteredProducts.length,
      query: q
    }
  });
});

// 获取商品分类
router.get('/categories/list', (req, res) => {
  const categories = [...new Set(PRODUCTS.map(p => p.category))];
  const colors = [...new Set(PRODUCTS.map(p => p.color))];
  
  res.json({
    success: true,
    message: '获取分类成功',
    data: {
      categories,
      colors
    }
  });
});

module.exports = router;

