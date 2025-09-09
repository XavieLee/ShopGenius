#!/usr/bin/env node

/**
 * ShopGenius API 测试脚本
 * 用于测试新增的AI导购相关API接口
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const TEST_USER_ID = 'user_001';

// 测试用例
const tests = [
  {
    name: '获取AI风格列表',
    method: 'GET',
    url: '/ai/persona/list',
    expectedStatus: 200
  },
  {
    name: '获取用户AI风格初始化',
    method: 'GET',
    url: `/ai/persona/init?userId=${TEST_USER_ID}`,
    expectedStatus: 200
  },
  {
    name: '切换AI风格到理性模式',
    method: 'POST',
    url: '/ai/persona/switch',
    data: {
      userId: TEST_USER_ID,
      personaId: 'rational'
    },
    expectedStatus: 200
  },
  {
    name: '切换AI风格到奢华模式',
    method: 'POST',
    url: '/ai/persona/switch',
    data: {
      userId: TEST_USER_ID,
      personaId: 'luxury'
    },
    expectedStatus: 200
  },
  {
    name: '创建聊天会话',
    method: 'POST',
    url: '/ai/chat/session/create',
    data: {
      userId: TEST_USER_ID,
      personaId: 'friendly'
    },
    expectedStatus: 200
  },
  {
    name: '获取聊天历史',
    method: 'GET',
    url: `/ai/chat/history?userId=${TEST_USER_ID}&limit=10`,
    expectedStatus: 200
  }
];

// 执行测试
async function runTests() {
  console.log('🚀 开始测试 ShopGenius API...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`📋 测试: ${test.name}`);
      
      const config = {
        method: test.method,
        url: `${BASE_URL}${test.url}`,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (test.data) {
        config.data = test.data;
      }
      
      const response = await axios(config);
      
      if (response.status === test.expectedStatus) {
        console.log(`✅ 通过 - 状态码: ${response.status}`);
        if (response.data.success) {
          console.log(`   响应: ${JSON.stringify(response.data.data || response.data.message).substring(0, 100)}...`);
        }
        passed++;
      } else {
        console.log(`❌ 失败 - 期望状态码: ${test.expectedStatus}, 实际: ${response.status}`);
        failed++;
      }
      
    } catch (error) {
      console.log(`❌ 失败 - 错误: ${error.message}`);
      if (error.response) {
        console.log(`   状态码: ${error.response.status}`);
        console.log(`   响应: ${JSON.stringify(error.response.data).substring(0, 100)}...`);
      }
      failed++;
    }
    
    console.log(''); // 空行分隔
  }
  
  // 测试结果汇总
  console.log('📊 测试结果汇总:');
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`📈 成功率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 所有测试通过！API接口工作正常。');
  } else {
    console.log('\n⚠️  部分测试失败，请检查服务器状态和API实现。');
  }
}

// 检查服务器是否运行
async function checkServer() {
  try {
    const response = await axios.get('http://localhost:3001/health');
    console.log('✅ 服务器运行正常');
    return true;
  } catch (error) {
    console.log('❌ 服务器未运行或无法访问');
    console.log('请确保后端服务已启动: npm start');
    return false;
  }
}

// 主函数
async function main() {
  console.log('🔍 检查服务器状态...');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    process.exit(1);
  }
  
  console.log('');
  await runTests();
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runTests, checkServer };
