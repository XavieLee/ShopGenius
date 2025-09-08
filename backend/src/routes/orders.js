const express = require('express');
const router = express.Router();

// 模拟订单存储
let orderStorage = {};

// 创建订单
router.post('/', (req, res) => {
  const { items, userId = 'default', paymentMethod = 'credit_card' } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: '订单商品不能为空'
    });
  }

  // 计算订单总价
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // 生成订单号
  const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // 创建订单
  const order = {
    orderId: orderId,
    userId: userId,
    items: items,
    total: total,
    status: 'pending',
    paymentMethod: paymentMethod,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 存储订单
  if (!orderStorage[userId]) {
    orderStorage[userId] = [];
  }
  orderStorage[userId].push(order);

  res.json({
    success: true,
    message: '订单创建成功',
    data: {
      orderId: orderId,
      total: total,
      status: 'pending',
      paymentUrl: `/api/payment/process/${orderId}`
    }
  });
});

// 处理支付
router.post('/payment/process/:orderId', (req, res) => {
  const { orderId } = req.params;
  const { paymentMethod = 'credit_card', paymentDetails } = req.body;
  
  // 模拟支付处理
  const paymentSuccess = Math.random() > 0.1; // 90% 成功率
  
  if (paymentSuccess) {
    // 更新订单状态
    for (const userId in orderStorage) {
      const order = orderStorage[userId].find(o => o.orderId === orderId);
      if (order) {
        order.status = 'paid';
        order.paymentMethod = paymentMethod;
        order.paymentDetails = paymentDetails;
        order.updatedAt = new Date().toISOString();
        break;
      }
    }

    res.json({
      success: true,
      message: '支付成功',
      data: {
        orderId: orderId,
        status: 'paid',
        transactionId: `TXN-${Date.now()}`,
        paymentMethod: paymentMethod
      }
    });
  } else {
    res.status(400).json({
      success: false,
      message: '支付失败，请重试',
      data: {
        orderId: orderId,
        status: 'failed'
      }
    });
  }
});

// 获取订单列表
router.get('/', (req, res) => {
  const { userId = 'default' } = req.query;
  
  const orders = orderStorage[userId] || [];
  
  res.json({
    success: true,
    message: '获取订单列表成功',
    data: {
      orders: orders,
      total: orders.length
    }
  });
});

// 获取订单详情
router.get('/:orderId', (req, res) => {
  const { orderId } = req.params;
  const { userId = 'default' } = req.query;
  
  const orders = orderStorage[userId] || [];
  const order = orders.find(o => o.orderId === orderId);
  
  if (!order) {
    return res.status(404).json({
      success: false,
      message: '订单不存在'
    });
  }

  res.json({
    success: true,
    message: '获取订单详情成功',
    data: order
  });
});

// 取消订单
router.put('/:orderId/cancel', (req, res) => {
  const { orderId } = req.params;
  const { userId = 'default' } = req.body;
  
  const orders = orderStorage[userId] || [];
  const order = orders.find(o => o.orderId === orderId);
  
  if (!order) {
    return res.status(404).json({
      success: false,
      message: '订单不存在'
    });
  }

  if (order.status === 'paid') {
    return res.status(400).json({
      success: false,
      message: '已支付的订单无法取消'
    });
  }

  order.status = 'cancelled';
  order.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    message: '订单已取消',
    data: {
      orderId: orderId,
      status: 'cancelled'
    }
  });
});

module.exports = router;
