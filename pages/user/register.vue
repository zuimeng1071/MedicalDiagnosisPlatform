<template>
  <view class="register-container">
    <view class="register-header">
      <text class="title">用户注册</text>
      <text class="subtitle">创建您的黑色素瘤检测平台账号</text>
    </view>
    
    <view class="register-form">
      <view class="form-item">
        <text class="label">用户名</text>
        <input v-model="registerForm.username" placeholder="请输入用户名" class="input" />
      </view>
      
      <view class="form-item">
        <text class="label">密码</text>
        <input v-model="registerForm.password" placeholder="请输入密码" type="password" class="input" />
      </view>
      
      <view class="form-item">
        <text class="label">确认密码</text>
        <input v-model="registerForm.confirmPassword" placeholder="请再次输入密码" type="password" class="input" />
      </view>
      
      <view class="form-item">
        <text class="label">邮箱</text>
        <input v-model="registerForm.email" placeholder="请输入邮箱" type="email" class="input" />
      </view>
      
      <view class="form-item">
        <text class="label">手机号</text>
        <input v-model="registerForm.phone" placeholder="请输入手机号" type="tel" class="input" />
      </view>
      
      <button class="register-btn" @click="handleRegister">注册</button>
      
      <view class="login-link">
        <text>已有账号？</text>
        <text class="link" @click="navigateToLogin">立即登录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '../../stores/userStore'

const userStore = useUserStore()
const registerForm = ref({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  phone: ''
})

const handleRegister = async () => {
  if (!registerForm.value.username || !registerForm.value.password) {
    uni.showToast({ title: '请输入用户名和密码', icon: 'none' })
    return
  }
  
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    uni.showToast({ title: '两次输入的密码不一致', icon: 'none' })
    return
  }
  
  uni.showLoading({ title: '注册中...' })
  const result = await userStore.register(registerForm.value)
  uni.hideLoading()
  
  if (result.success) {
    uni.showToast({ title: '注册成功', icon: 'success' })
    uni.navigateBack()
  } else {
    uni.showToast({ title: result.message || '注册失败', icon: 'none' })
  }
}

const navigateToLogin = () => {
  uni.navigateTo({ url: '/pages/user/login' })
}
</script>

<style scoped lang="scss">
// 主题变量
$primary-color: #1a9372;
$primary-light: #34c759;
$gray-light: #f5f5f5;
$gray-medium: #e0e0e0;
$text-primary: #333333;
$text-secondary: #666666;
$text-muted: #999999;
$border-radius: 12rpx;
$spacing-base: 16rpx;

// 动画时长
$transition-fast: 0.2s;
$transition-normal: 0.3s;
$transition-slow: 0.5s;

// 断点
$tablet: 768px;
$desktop: 1024px;

.register-container {
  padding: $spacing-base * 3.75; // 60rpx
  min-height: 100vh;
  background: linear-gradient(135deg, $gray-light 0%, white 100%);
  
  // 平板端适配
  @media (min-width: $tablet) {
    padding: $spacing-base * 5; // 80rpx
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  // 桌面端适配
  @media (min-width: $desktop) {
    padding: $spacing-base * 7.5; // 120rpx
  }
}

.register-header {
  margin-bottom: $spacing-base * 5; // 80rpx
  text-align: center;
  
  @media (min-width: $tablet) {
    margin-bottom: $spacing-base * 6.25; // 100rpx
  }
}

.register-header .title {
  font-size: 48rpx;
  font-weight: 700;
  color: $text-primary;
  display: block;
  margin-bottom: $spacing-base * 1.25; // 20rpx
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  
  @media (min-width: $tablet) {
    font-size: 56rpx;
  }
}

.register-header .subtitle {
  font-size: 28rpx;
  color: $text-secondary;
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  
  @media (min-width: $tablet) {
    font-size: 32rpx;
  }
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-base * 1.875; // 30rpx
  
  @media (min-width: $tablet) {
    max-width: 450rpx;
    margin: 0 auto;
    gap: $spacing-base * 2.5; // 40rpx
  }
  
  @media (min-width: $desktop) {
    max-width: 520rpx;
  }
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: $spacing-base * 0.9375; // 15rpx
}

.form-item .label {
  font-size: 30rpx;
  color: $text-primary;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  
  @media (min-width: $tablet) {
    font-size: 32rpx;
  }
}

.form-item .input {
  border: 2rpx solid $gray-medium;
  border-radius: $border-radius;
  padding: $spacing-base * 1.5625; // 25rpx
  font-size: 28rpx;
  background: white;
  transition: all $transition-fast ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  
  &:focus {
    border-color: $primary-color;
    box-shadow: 0 0 0 2rpx rgba($primary-color, 0.1);
    transform: translateY(-1rpx);
  }
  
  &:hover {
    border-color: darken($gray-medium, 10%);
  }
  
  // 错误状态
  &.error {
    border-color: #ff3b30;
    box-shadow: 0 0 0 2rpx rgba(#ff3b30, 0.1);
  }
  
  @media (min-width: $tablet) {
    font-size: 30rpx;
    padding: $spacing-base * 1.875; // 30rpx
  }
}

.register-btn {
  background: linear-gradient(135deg, $primary-color 0%, $primary-light 100%);
  color: white;
  border: none;
  border-radius: $border-radius;
  padding: $spacing-base * 1.5625; // 25rpx
  font-size: 32rpx;
  margin-top: $spacing-base * 2.5; // 40rpx
  font-weight: 600;
  transition: all $transition-normal ease;
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  
  // 手势反馈
  &:active {
    transform: scale(0.98);
    background: linear-gradient(135deg, darken($primary-color, 5%) 0%, darken($primary-light, 5%) 100%);
  }
  
  // 加载状态
  &.loading {
    pointer-events: none;
    opacity: 0.8;
    
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 20rpx;
      height: 20rpx;
      margin: -10rpx 0 0 -10rpx;
      border: 2rpx solid transparent;
      border-top: 2rpx solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  }
  
  // 禁用状态
  &:disabled {
    background: $gray-medium;
    color: $text-muted;
    transform: none;
  }
  
  @media (min-width: $tablet) {
    font-size: 34rpx;
    padding: $spacing-base * 1.875; // 30rpx
    
    // 悬停效果
    &:hover {
      transform: translateY(-2rpx);
      box-shadow: 0 4rpx 12rpx rgba($primary-color, 0.3);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
}

.login-link {
  text-align: center;
  font-size: 26rpx;
  color: $text-secondary;
  margin-top: $spacing-base * 1.875; // 30rpx
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  
  @media (min-width: $tablet) {
    font-size: 28rpx;
  }
}

.login-link .link {
  color: $primary-color;
  font-weight: 500;
  margin-left: $spacing-base * 0.625; // 10rpx
  transition: color $transition-fast ease;
  
  // 手势反馈
  &:active {
    color: darken($primary-color, 10%);
  }
  
  @media (min-width: $tablet) {
    // 悬停效果
    &:hover {
      color: darken($primary-color, 15%);
    }
  }
}

// 表单验证提示
.form-hint {
  font-size: 24rpx;
  color: $text-muted;
  margin-top: $spacing-base * 0.625; // 10rpx
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  
  &.error {
    color: #ff3b30;
  }
}

// 加载动画
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// 错误提示动画
.error-message {
  animation: shake $transition-fast ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5rpx); }
  75% { transform: translateX(5rpx); }
}

// 页面进入动画
.register-container {
  animation: fadeInUp $transition-slow ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 表单项动画
.form-item {
  animation: slideInUp $transition-normal ease-out;
  animation-fill-mode: both;
  
  @for $i from 1 through 5 {
    &:nth-child(#{$i}) {
      animation-delay: $i * 0.1s;
    }
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 密码强度指示器
.password-strength {
  margin-top: $spacing-base * 0.625; // 10rpx
  height: 4rpx;
  background: $gray-medium;
  border-radius: 2rpx;
  overflow: hidden;
  
  .strength-bar {
    height: 100%;
    transition: all $transition-normal ease;
    border-radius: 2rpx;
    
    &.weak {
      background: #ff3b30;
      width: 33%;
    }
    
    &.medium {
      background: #ff9500;
      width: 66%;
    }
    
    &.strong {
      background: $primary-light;
      width: 100%;
    }
  }
}
</style>