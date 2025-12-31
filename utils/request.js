const BASE_URL = 'http://127.0.0.1:8080'

// 请求拦截器
const requestInterceptor = (config) => {
  // 添加token到header
  const token = uni.getStorageSync('userToken') || uni.getStorageSync('adminToken')
  console.log('【登录】用户token:', token)
  if (token) {
    config.header = config.header || {}
    if (uni.getStorageSync('userToken')) {
      config.header['Authorization'] = token
    } else {
      config.header['Authorization-Admin'] = token
    }
  }
  return config
}

// 响应拦截器
const responseInterceptor = (response) => {
  return response.data
}

// 通用请求方法
export const request = (options) => {
  return new Promise((resolve, reject) => {
    // 请求拦截
    const config = requestInterceptor(options)
    
    uni.request({
      url: BASE_URL + config.url,
      method: config.method || 'GET',
      data: config.data,
      header: config.header,
      success: (res) => {
        const data = responseInterceptor(res)
        resolve(data)
      },
      fail: (error) => {
        reject(error)
      }
    })
  })
}

// 文件上传方法
export const uploadFile = (url, filePath, formData = {}) => {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: BASE_URL + url,
      filePath: filePath,
      name: 'image',
      formData: formData,
      header: {
        'Authorization': uni.getStorageSync('userToken') || '',
        'Authorization-Admin': uni.getStorageSync('adminToken') || ''
      },
      success: (res) => {
        const data = JSON.parse(res.data)
        resolve(data)
      },
      fail: (error) => {
        reject(error)
      }
    })
  })
}