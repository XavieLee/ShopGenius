const path = require('path');
const fs = require('fs');

/**
 * 环境配置加载器
 * 支持 dev 和 test 两个环境
 */
class EnvConfig {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    this.config = {};
    this.loadConfig();
  }

  /**
   * 加载环境配置
   */
  loadConfig() {
    // 确定配置文件路径
    const configFile = this.getConfigFilePath();
    
    if (fs.existsSync(configFile)) {
      console.log(`📋 加载环境配置: ${configFile}`);
      this.loadFromFile(configFile);
    } else {
      console.log(`⚠️  配置文件不存在: ${configFile}，使用默认配置`);
    }

    // 加载环境变量（优先级更高）
    this.loadFromEnv();
    
    // 设置到 process.env
    this.setProcessEnv();
  }

  /**
   * 获取配置文件路径
   */
  getConfigFilePath() {
    const configDir = path.join(__dirname, '../../');
    
    // 根据 NODE_ENV 确定配置文件
    if (this.env === 'development' || this.env === 'dev') {
      return path.join(configDir, 'config.dev.env');
    } else if (this.env === 'test') {
      return path.join(configDir, 'config.test.env');
    } else {
      // 默认使用开发环境配置
      return path.join(configDir, 'config.dev.env');
    }
  }

  /**
   * 从文件加载配置
   */
  loadFromFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      lines.forEach(line => {
        line = line.trim();
        
        // 跳过空行和注释
        if (!line || line.startsWith('#')) {
          return;
        }

        // 解析 KEY=VALUE 格式
        const equalIndex = line.indexOf('=');
        if (equalIndex > 0) {
          const key = line.substring(0, equalIndex).trim();
          const value = line.substring(equalIndex + 1).trim();
          
          // 移除引号
          const cleanValue = value.replace(/^["']|["']$/g, '');
          this.config[key] = cleanValue;
        }
      });
    } catch (error) {
      console.error(`❌ 加载配置文件失败: ${error.message}`);
    }
  }

  /**
   * 从环境变量加载配置
   */
  loadFromEnv() {
    // 将现有的环境变量合并到配置中
    Object.keys(process.env).forEach(key => {
      if (process.env[key] !== undefined) {
        this.config[key] = process.env[key];
      }
    });
  }

  /**
   * 设置到 process.env
   */
  setProcessEnv() {
    Object.keys(this.config).forEach(key => {
      if (process.env[key] === undefined) {
        process.env[key] = this.config[key];
      }
    });
  }

  /**
   * 获取配置值
   */
  get(key, defaultValue = null) {
    return this.config[key] || process.env[key] || defaultValue;
  }

  /**
   * 获取数据库配置
   */
  getDatabaseConfig() {
    return {
      host: this.get('DB_HOST', 'localhost'),
      port: parseInt(this.get('DB_PORT', '3306')),
      database: this.get('DB_NAME', 'shopgenius'),
      username: this.get('DB_USER', 'root'),
      password: this.get('DB_PASSWORD', ''),
      dialect: 'mysql'
    };
  }

  /**
   * 显示当前配置信息
   */
  displayConfig() {
    console.log(`\n🔧 当前环境: ${this.env}`);
    console.log(`📋 配置信息:`);
    console.log(`   端口: ${this.get('PORT', '3001')}`);
    console.log(`   数据库: ${this.get('DB_HOST', 'localhost')}:${this.get('DB_PORT', '3306')}/${this.get('DB_NAME', 'shopgenius')}`);
    console.log(`   用户: ${this.get('DB_USER', 'root')}`);
    console.log(`   日志级别: ${this.get('LOG_LEVEL', 'info')}`);
    console.log('');
  }
}

// 创建全局实例
const envConfig = new EnvConfig();

module.exports = envConfig;
