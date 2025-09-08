const express = require('express');
const router = express.Router();

// 临时的认证路由 - 稍后会实现完整功能
router.post('/register', (req, res) => {
  res.json({
    success: true,
    message: '注册功能开发中',
    data: null
  });
});

router.post('/login', (req, res) => {
  res.json({
    success: true,
    message: '登录功能开发中',
    data: null
  });
});

router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: '登出成功'
  });
});

module.exports = router;

