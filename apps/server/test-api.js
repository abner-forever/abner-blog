const axios = require('axios');

const baseURL = 'http://localhost:3000';

async function testAPI() {
  try {
    console.log('🚀 开始测试API请求日志...\n');

    // 测试1: GET 请求
    console.log('1. 测试 GET 请求');
    await axios.get(`${baseURL}/`);

    // 测试2: 带查询参数的GET请求
    console.log('\n2. 测试带查询参数的 GET 请求');
    await axios.get(`${baseURL}/blogs`, {
      params: { page: 1, pageSize: 5, keyword: 'test' }
    });

    // 测试3: POST 请求
    console.log('\n3. 测试 POST 请求');
    await axios.post(`${baseURL}/auth/register`, {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    }).catch(err => {
      // 忽略可能的错误，我们只是测试日志
      console.log('预期的错误（数据库可能未连接）:', err.response?.status);
    });

    // 测试4: 错误请求
    console.log('\n4. 测试错误请求');
    await axios.get(`${baseURL}/nonexistent`).catch(err => {
      console.log('预期的404错误:', err.response?.status);
    });

    console.log('\n✅ API测试完成！查看上面的日志输出。');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testAPI(); 