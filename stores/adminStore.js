import { defineStore } from 'pinia'
import { ref } from 'vue'
import { adminApi } from '../api/admin'

export const useAdminStore = defineStore('admin', () => {
  const isLoggedIn = ref(false)
  const adminInfo = ref(null)
  const token = ref('')

  // 检查登录状态
  const checkLoginStatus = () => {
    const storedToken = uni.getStorageSync('adminToken')
    if (storedToken) {
      token.value = storedToken
      isLoggedIn.value = true
      // 获取管理员信息
      getAdminInfo()
    }
  }

  // 管理员登录
  const login = async (loginData) => {
    try {
      const response = await adminApi.login(loginData)
      if (response.code === '1') {
        token.value = response.data
        isLoggedIn.value = true
        uni.setStorageSync('adminToken', response.data)
        return { success: true }
      } else {
        return { success: false, message: response.message }
      }
    } catch (error) {
      return { success: false, message: '登录失败，请检查网络连接' }
    }
  }

  // 管理员注册
  const register = async (adminData) => {
    try {
      const response = await adminApi.register(adminData)
      if (response.code === '1') {
        return { success: true }
      } else {
        return { success: false, message: response.message }
      }
    } catch (error) {
      return { success: false, message: '注册失败，请检查网络连接' }
    }
  }

  // 获取管理员信息（需要根据实际情况实现）
  const getAdminInfo = async () => {
    // 实现获取管理员信息的逻辑
  }

  // 退出登录
  const logout = async () => {
    try {
      await adminApi.logout()
    } catch (error) {
      console.error('退出登录失败:', error)
    } finally {
      isLoggedIn.value = false
      adminInfo.value = null
      token.value = ''
      uni.removeStorageSync('adminToken')
    }
  }

  return {
    isLoggedIn,
    adminInfo,
    token,
    checkLoginStatus,
    login,
    register,
    getAdminInfo,
    logout
  }
})