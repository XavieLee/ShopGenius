const express = require('express');
const router = express.Router();

// 获取用户信息
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    message: '用户功能开发中',
    data: null
  });
});

// 更新用户信息
router.put('/profile', (req, res) => {
  res.json({
    success: true,
    message: '更新用户信息成功',
    data: null
  });
});

module.exports = router;


