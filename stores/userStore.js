import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userApi } from '../api/user'

export const useUserStore = defineStore('user', () => {
  const isLoggedIn = ref(false)
  const userInfo = ref(null)
  const token = ref('')

	// 检查登录状态
	const checkLoginStatus = async () => { // 注意这里是 async 函数
	  const storedToken = uni.getStorageSync('userToken');
	  if (storedToken) {
		token.value = storedToken;
		isLoggedIn.value = true;
		// 获取用户信息
		const userInfo = await getUserInfo(); // 使用 await 等待异步操作完成
		console.log("用户信息:", userInfo); // 正确地打印用户信息
	  }
	}

// 用户登录
const login = async (loginData) => {
  console.log('【登录】开始登录，传入参数:', loginData)

  try {
    const response = await userApi.login(loginData)
    console.log('【登录】API 响应:', response)

    if (response.code === '1') {
      token.value = response.data
      isLoggedIn.value = true
      uni.setStorageSync('userToken', response.data)
      console.log('【登录】登录成功，token 已保存:', response.data)

      await getUserInfo() // 假设 getUserInfo 内部已处理用户数据更新

      console.log('【登录】用户信息已获取')
      return { success: true }
    } else {
      console.warn('【登录】业务逻辑失败:', response.message)
      return { success: false, message: response.message }
    }
  } catch (error) {
    console.error('【登录】发生异常:', error)
    return { success: false, message: '登录失败，请检查网络连接' }
  }
}

  // 用户注册
  const register = async (userData) => {
    try {
      const response = await userApi.register(userData)
      if (response.code === '1') {
        return { success: true }
      } else {
        return { success: false, message: response.message }
      }
    } catch (error) {
      return { success: false, message: '注册失败，请检查网络连接' }
    }
  }

  // 获取用户信息
  const getUserInfo = async () => {
    try {
      const response = await userApi.getUserInfo()
      if (response.code === '1') {
        userInfo.value = response.data
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }

  // 更新用户信息
  const updateUserInfo = async (userData) => {
    try {
      const response = await userApi.updateUser(userData)
      if (response.code === '1') {
        userInfo.value = response.data
        return { success: true }
      } else {
        return { success: false, message: response.message }
      }
    } catch (error) {
      return { success: false, message: '更新失败，请检查网络连接' }
    }
  }

  // 退出登录
  const logout = async () => {
    try {
      await userApi.logout()
    } catch (error) {
      console.error('退出登录失败:', error)
    } finally {
      isLoggedIn.value = false
      userInfo.value = null
      token.value = ''
      uni.removeStorageSync('userToken')
    }
  }

  return {
    isLoggedIn,
    userInfo,
    token,
    checkLoginStatus,
    login,
    register,
    getUserInfo,
    updateUserInfo,
    logout
  }
})