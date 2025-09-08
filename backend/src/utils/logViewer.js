/**
 * 日志查看工具
 * 提供实时日志查看和过滤功能
 */

const fs = require('fs');
const path = require('path');

class LogViewer {
  constructor() {
    this.logFile = path.join(__dirname, '../../server.log');
    this.watchers = new Set();
    
    // 如果日志文件不存在，尝试从控制台输出中获取日志
    if (!fs.existsSync(this.logFile)) {
      console.log('日志文件不存在，将使用控制台输出');
    }
  }

  /**
   * 获取最近的日志条目
   * @param {number} lines - 要获取的行数
   * @returns {Array} 日志条目数组
   */
  getRecentLogs(lines = 50) {
    try {
      if (!fs.existsSync(this.logFile)) {
        return ['日志文件不存在'];
      }

      const content = fs.readFileSync(this.logFile, 'utf8');
      const logLines = content.split('\n').filter(line => line.trim());
      
      return logLines.slice(-lines);
    } catch (error) {
      return [`读取日志文件失败: ${error.message}`];
    }
  }

  /**
   * 过滤日志条目
   * @param {string} filter - 过滤关键词
   * @param {number} lines - 要获取的行数
   * @returns {Array} 过滤后的日志条目
   */
  filterLogs(filter, lines = 100) {
    try {
      if (!fs.existsSync(this.logFile)) {
        return ['日志文件不存在'];
      }

      const content = fs.readFileSync(this.logFile, 'utf8');
      const logLines = content.split('\n').filter(line => line.trim());
      
      const filtered = logLines.filter(line => 
        line.toLowerCase().includes(filter.toLowerCase())
      );
      
      return filtered.slice(-lines);
    } catch (error) {
      return [`过滤日志失败: ${error.message}`];
    }
  }

  /**
   * 获取API请求统计
   * @returns {Object} 统计信息
   */
  getApiStats() {
    try {
      if (!fs.existsSync(this.logFile)) {
        return { error: '日志文件不存在' };
      }

      const content = fs.readFileSync(this.logFile, 'utf8');
      const logLines = content.split('\n').filter(line => line.trim());
      
      const stats = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        apiEndpoints: {},
        responseTimes: [],
        errors: []
      };

      logLines.forEach(line => {
        // 统计请求总数
        if (line.includes('📥 请求接收:')) {
          stats.totalRequests++;
          
          // 提取API端点
          const match = line.match(/📥 请求接收: (\w+) (\/[^\s]+)/);
          if (match) {
            const method = match[1];
            const endpoint = match[2];
            const key = `${method} ${endpoint}`;
            stats.apiEndpoints[key] = (stats.apiEndpoints[key] || 0) + 1;
          }
        }

        // 统计成功请求
        if (line.includes('📤 请求成功:')) {
          stats.successfulRequests++;
          
          // 提取响应时间
          const timeMatch = line.match(/duration: (\d+)ms/);
          if (timeMatch) {
            stats.responseTimes.push(parseInt(timeMatch[1]));
          }
        }

        // 统计失败请求
        if (line.includes('❌ 请求失败:')) {
          stats.failedRequests++;
          
          // 提取错误信息
          const errorMatch = line.match(/error: (.+)/);
          if (errorMatch) {
            stats.errors.push(errorMatch[1]);
          }
        }
      });

      // 计算平均响应时间
      if (stats.responseTimes.length > 0) {
        stats.averageResponseTime = Math.round(
          stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length
        );
      }

      return stats;
    } catch (error) {
      return { error: `获取统计信息失败: ${error.message}` };
    }
  }

  /**
   * 实时监控日志
   * @param {Function} callback - 回调函数
   */
  watchLogs(callback) {
    if (!fs.existsSync(this.logFile)) {
      callback(['日志文件不存在']);
      return;
    }

    const watcher = fs.watchFile(this.logFile, { interval: 1000 }, () => {
      const recentLogs = this.getRecentLogs(10);
      callback(recentLogs);
    });

    this.watchers.add(watcher);
    return watcher;
  }

  /**
   * 停止监控
   * @param {Object} watcher - 监控器对象
   */
  stopWatching(watcher) {
    if (watcher) {
      fs.unwatchFile(this.logFile);
      this.watchers.delete(watcher);
    }
  }

  /**
   * 停止所有监控
   */
  stopAllWatching() {
    this.watchers.forEach(watcher => {
      fs.unwatchFile(this.logFile);
    });
    this.watchers.clear();
  }
}

module.exports = LogViewer;
