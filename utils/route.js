// @/utils/route.js

// 模拟 Vue Router 的 useRoute 功能
export const useRoute = () => {
  // 获取当前页面实例
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  
  if (!currentPage) {
    return {
      query: {},
      params: {},
      path: ''
    }
  }
  
  // 获取页面参数
  const options = currentPage.options || {}
  
  return {
    // 查询参数（URL参数）
    query: options,
    // 路径参数（需要根据实际路由配置解析）
    params: {},
    // 当前页面路径
    path: currentPage.route || '',
    // 完整路径
    fullPath: currentPage.$page ? currentPage.$page.fullPath : ''
  }
}

// 路由跳转方法
export const router = {
  // 跳转到指定页面
  push(path, query = {}) {
    return new Promise((resolve, reject) => {
      // 构建查询字符串
      const queryStr = Object.keys(query)
        .map(key => `${key}=${encodeURIComponent(query[key])}`)
        .join('&')
      
      const url = `/${path}${queryStr ? '?' + queryStr : ''}`
      
      uni.navigateTo({
        url: url,
        success: resolve,
        fail: reject
      })
    })
  },
  
  // 返回上一页
  back(delta = 1) {
    uni.navigateBack({
      delta: delta
    })
  },
  
  // 替换当前页面
  replace(path, query = {}) {
    const queryStr = Object.keys(query)
      .map(key => `${key}=${encodeURIComponent(query[key])}`)
      .join('&')
    
    const url = `/${path}${queryStr ? '?' + queryStr : ''}`
    
    uni.redirectTo({
      url: url
    })
  },
  
  // 跳转到 tabBar 页面
  switchTab(path) {
    uni.switchTab({
      url: `/${path}`
    })
  },
  
  // 重启动到指定页面
  reLaunch(path, query = {}) {
    const queryStr = Object.keys(query)
      .map(key => `${key}=${encodeURIComponent(query[key])}`)
      .join('&')
    
    const url = `/${path}${queryStr ? '?' + queryStr : ''}`
    
    uni.reLaunch({
      url: url
    })
  }
}

// 路由守卫（可选扩展）
export const createRouterGuard = (router) => {
  // 这里可以添加路由守卫逻辑
  return router
}

export default {
  useRoute,
  router
}