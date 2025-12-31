<template>
  <view>
    <image src="/static/logo.png" class="logo" mode="aspectFit"></image>
    <view class="container">
      <!-- 用户页面路由 -->
      <view v-if="userStore.isLoggedIn" class="user-pages">
        <view class="nav-bar">
          <view class="nav-item" :class="{ active: currentPage === 'enhance' }" @click="switchPage('enhance')">
            <text class="icon">🖼️</text>
            <text>图像增强</text>
          </view>
          <view class="nav-item" :class="{ active: currentPage === 'ai-diagnosis' }" @click="switchPage('ai-diagnosis')">
            <text class="icon">🔍</text>
            <text>AI诊断</text>
          </view>
          <view class="nav-item" :class="{ active: currentPage === 'ai-chat' }" @click="switchPage('ai-chat')">
            <text class="icon">💬</text>
            <text>AI对话</text>
          </view>
          <view class="nav-item" :class="{ active: currentPage === 'profile' }" @click="switchPage('profile')">
            <text class="icon">👤</text>
            <text>个人中心</text>
          </view>
        </view>
        
        <view class="page-content">
          <user-enhance v-if="currentPage === 'enhance'" />
          <user-ai-diagnosis v-if="currentPage === 'ai-diagnosis'" />
          <user-ai-chat v-if="currentPage === 'ai-chat'" />
          <user-profile v-if="currentPage === 'profile'" />
        </view>
      </view>
      
      <!-- 管理员页面路由 -->
      <view v-else-if="adminStore.isLoggedIn" class="admin-pages">
        <view class="nav-bar">
          <view class="nav-item" :class="{ active: currentPage === 'dashboard' }" @click="switchPage('dashboard')">
            <text class="icon">📊</text>
            <text>数据统计</text>
          </view>
          <view class="nav-item" :class="{ active: currentPage === 'user-management' }" @click="switchPage('user-management')">
            <text class="icon">👥</text>
            <text>用户管理</text>
          </view>
          <view class="nav-item" :class="{ active: currentPage === 'admin-profile' }" @click="switchPage('admin-profile')">
            <text class="icon">👤</text>
            <text>个人中心</text>
          </view>
        </view>
        
        <view class="page-content">
          <admin-dashboard v-if="currentPage === 'dashboard'" />
          <admin-user-management v-if="currentPage === 'user-management'" />
          <admin-profile v-if="currentPage === 'admin-profile'" />
        </view>
      </view>
      
      <!-- 未登录状态显示登录选择 -->
      <view v-else class="login-select">
        <view class="welcome">
          <text class="title">黑色素瘤检测平台</text>
          <text class="subtitle">智能皮肤病变分析系统</text>
        </view>
        
        <view class="login-options">
          <view class="option-card" @click="navigateTo('/pages/user/login')">
            <text class="option-icon">👤</text>
            <text class="option-title">用户登录</text>
            <text class="option-desc">使用AI诊断功能</text>
          </view>
          
          <view class="option-card" @click="navigateTo('/pages/admin/login')">
            <text class="option-icon">🔧</text>
            <text class="option-title">管理员登录</text>
            <text class="option-desc">管理系统和数据</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from './stores/userStore'
import { useAdminStore } from './stores/adminStore'

const userStore = useUserStore()
const adminStore = useAdminStore()
const currentPage = ref('enhance')

// 页面切换
const switchPage = (page) => {
  currentPage.value = page
}

// 页面跳转
const navigateTo = (url) => {
  uni.navigateTo({ url })
}

// 检查登录状态
onMounted(() => {
  userStore.checkLoginStatus()
  adminStore.checkLoginStatus()
})
</script>

<style>
/* 全局样式 */
page {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.container {
  padding: 20rpx;
}

.logo {
  width: 200rpx;
  height: 100rpx;
  margin: 20rpx auto;
  display: block;
}

/* 导航栏样式 */
.nav-bar {
  display: flex;
  background: white;
  border-radius: 20rpx;
  padding: 20rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  border-radius: 15rpx;
  transition: all 0.3s;
}

.nav-item.active {
  background: #007AFF;
  color: white;
}

.nav-item .icon {
  font-size: 40rpx;
  margin-bottom: 10rpx;
}

.nav-item text:last-child {
  font-size: 24rpx;
}

/* 页面内容 */
.page-content {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  min-height: 80vh;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

/* 登录选择页面 */
.login-select {
  text-align: center;
  padding: 100rpx 0;
}

.welcome .title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.welcome .subtitle {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 80rpx;
}

.login-options {
  display: flex;
  flex-direction: column;
  gap: 40rpx;
}

.option-card {
  background: white;
  border-radius: 20rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.1);
  transition: transform 0.3s;
}

.option-card:active {
  transform: scale(0.98);
}

.option-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 30rpx;
}

.option-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 15rpx;
}

.option-desc {
  display: block;
  font-size: 26rpx;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 750px) {
  .container {
    padding: 10rpx;
  }
  
  .nav-bar {
    flex-wrap: wrap;
  }
  
  .nav-item {
    min-width: 45%;
    margin: 10rpx;
  }
}
</style>