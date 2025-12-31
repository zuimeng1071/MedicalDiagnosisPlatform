<template>
  <view class="profile-container">
    <view class="profile-header">
      <image :src="userInfo.avatarUrl || '/static/default-avatar.png'" class="avatar" />
      <text class="username">{{ userInfo.username }}</text>
    </view>
    
    <view class="profile-form">
      <view class="form-item">
        <text class="label">用户名</text>
        <input v-model="editForm.username" placeholder="请输入用户名" class="input" />
      </view>
      
      <view class="form-item">
        <text class="label">邮箱</text>
        <input v-model="editForm.email" placeholder="请输入邮箱" type="email" class="input" />
      </view>
      
      <view class="form-item">
        <text class="label">手机号</text>
        <input v-model="editForm.phone" placeholder="请输入手机号" type="tel" class="input" />
      </view>
      
      <view class="form-item">
        <text class="label">头像</text>
        <view class="avatar-upload" @click="chooseAvatar">
          <image :src="editForm.avatarUrl || userInfo.avatarUrl || '/static/default-avatar.png'" class="avatar-preview" />
          <text class="upload-text">点击更换头像</text>
          <text v-if="uploading" class="upload-status">上传中...</text>
        </view>
      </view>
      
      <view class="form-actions">
        <button class="save-btn" @click="saveProfile" :disabled="uploading">保存修改</button>
        <button class="logout-btn" @click="logout">退出登录</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../../stores/userStore'
import { userApi } from '../../api/user'

const userStore = useUserStore()
const userInfo = ref({})
const editForm = ref({
  username: '',
  email: '',
  phone: '',
  avatarUrl: ''
})
const uploading = ref(false)

// 加载用户信息
const loadUserInfo = async () => {
  await userStore.getUserInfo()
  userInfo.value = userStore.userInfo || {}
  editForm.value = {
    username: userInfo.value.username || '',
    email: userInfo.value.email || '',
    phone: userInfo.value.phone || '',
    avatarUrl: userInfo.value.avatarUrl || ''
  }
}

// 选择头像并上传
const chooseAvatar = async () => {
  if (uploading.value) return
  
  try {
    const res = await new Promise((resolve, reject) => {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: resolve,
        fail: reject
      })
    })
    
    const tempFilePath = res.tempFilePaths[0]
    
    // 显示预览
    editForm.value.avatarUrl = tempFilePath
    
    // 上传到服务器
    await uploadAvatar(tempFilePath)
    
  } catch (error) {
    console.error('选择图片失败:', error)
    uni.showToast({
      title: '选择图片失败',
      icon: 'none'
    })
  }
}

// 上传头像到服务器
const uploadAvatar = async (filePath) => {
  uploading.value = true
  
  try {
    uni.showLoading({
      title: '上传中...',
      mask: true
    })
    
    const result = await userApi.uploadImage(filePath)
    
    if (result.code === '1') {
      // 上传成功，保存返回的URL
      editForm.value.avatarUrl = result.data
      uni.showToast({
        title: '头像上传成功',
        icon: 'success'
      })
    } else {
      throw new Error(result.message || '上传失败')
    }
    
  } catch (error) {
    console.error('头像上传失败:', error)
    uni.showToast({
      title: error.message || '头像上传失败',
      icon: 'none',
      duration: 3000
    })
    // 上传失败，清除预览
    editForm.value.avatarUrl = userInfo.value.avatarUrl || ''
  } finally {
    uploading.value = false
    uni.hideLoading()
  }
}

// 保存个人信息
const saveProfile = async () => {
  if (uploading.value) {
    uni.showToast({
      title: '请等待头像上传完成',
      icon: 'none'
    })
    return
  }
  
  if (!editForm.value.username) {
    uni.showToast({ title: '请输入用户名', icon: 'none' })
    return
  }
  
  uni.showLoading({ title: '保存中...' })
  const result = await userStore.updateUserInfo({
    userId: userInfo.value.userId,
    ...editForm.value
  })
  uni.hideLoading()
  
  if (result.success) {
    uni.showToast({ title: '保存成功', icon: 'success' })
    loadUserInfo()
  } else {
    uni.showToast({ title: result.message || '保存失败', icon: 'none' })
  }
}

// 退出登录
const logout = async () => {
  await userStore.logout()
  uni.reLaunch({ url: '/pages/user/login' })
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped lang="scss">
// 设计变量
$primary-color: #1a9372;
$primary-light: #34c759;
$gray-bg: #f5f5f5;
$gray-border: #e0e0e0;
$text-primary: #333333;
$text-secondary: #666666;
$text-disabled: #999999;
$white: #ffffff;
$error-color: #dc3545;

$spacing-xs: 8px;
$spacing-sm: 16px;
$spacing-md: 24px;
$spacing-lg: 32px;
$spacing-xl: 40px;

$border-radius-sm: 8px;
$border-radius-md: 12px;
$border-radius-lg: 16px;

$font-size-xs: 24rpx;
$font-size-sm: 26rpx;
$font-size-md: 28rpx;
$font-size-lg: 32rpx;
$font-size-xl: 36rpx;

$transition-fast: 0.2s;
$transition-normal: 0.3s;
$transition-slow: 0.5s;

// 响应式断点
$tablet: 768px;
$desktop: 1024px;

.profile-container {
  padding: $spacing-md;
  min-height: 100vh;
  background: linear-gradient(135deg, $gray-bg 0%, $white 100%);
  
  @media (min-width: $tablet) {
    padding: $spacing-xl;
    max-width: 600px;
    margin: 0 auto;
  }
  
  @media (min-width: $desktop) {
    max-width: 800px;
    padding: $spacing-xl $spacing-lg;
  }
}

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: $spacing-xl;
  padding: $spacing-lg;
  background: $white;
  border-radius: $border-radius-lg;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: transform $transition-normal ease;
  
  &:active {
    transform: scale(0.98);
  }
  
  @media (min-width: $tablet) {
    flex-direction: row;
    text-align: left;
    gap: $spacing-md;
  }
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  margin-bottom: $spacing-sm;
  border: 3px solid $primary-color;
  transition: all $transition-normal ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 16px rgba($primary-color, 0.3);
  }
  
  @media (min-width: $tablet) {
    width: 140rpx;
    height: 140rpx;
    margin-bottom: 0;
  }
  
  @media (min-width: $desktop) {
    width: 160rpx;
    height: 160rpx;
  }
}

.username {
  font-size: $font-size-xl;
  font-weight: 600;
  color: $text-primary;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  
  @media (min-width: $tablet) {
    font-size: $font-size-xl + 2rpx;
  }
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  padding: $spacing-md;
  background: $white;
  border-radius: $border-radius-md;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
  transition: all $transition-fast ease;
  
  &:focus-within {
    box-shadow: 0 2px 12px rgba($primary-color, 0.15);
    border-color: $primary-color;
  }
  
  @media (min-width: $tablet) {
    padding: $spacing-lg;
  }
}

.form-item .label {
  font-size: $font-size-md;
  font-weight: 500;
  color: $text-primary;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}

.form-item .input {
  border: 1px solid $gray-border;
  border-radius: $border-radius-sm;
  padding: $spacing-sm;
  font-size: $font-size-md;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  transition: all $transition-fast ease;
  background: $gray-bg;
  
  &:focus {
    border-color: $primary-color;
    background: $white;
    box-shadow: 0 0 0 2px rgba($primary-color, 0.1);
  }
  
  &::placeholder {
    color: $text-disabled;
  }
  
  @media (min-width: $tablet) {
    padding: $spacing-md;
  }
}

.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-md;
  border: 2px dashed $gray-border;
  border-radius: $border-radius-md;
  background-color: $gray-bg;
  transition: all $transition-normal ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba($primary-color, 0.1), transparent);
    transition: left $transition-slow ease;
  }
  
  &:active {
    border-color: $primary-color;
    background-color: rgba($primary-color, 0.05);
    
    &::before {
      left: 100%;
    }
  }
  
  @media (min-width: $tablet) {
    flex-direction: row;
    justify-content: flex-start;
    text-align: left;
  }
}

.avatar-preview {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  border: 2px solid $white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all $transition-normal ease;
  
  .avatar-upload:active & {
    transform: scale(1.1);
  }
  
  @media (min-width: $tablet) {
    width: 120rpx;
    height: 120rpx;
  }
}

.upload-text {
  font-size: $font-size-sm;
  color: $primary-color;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  transition: color $transition-fast ease;
  
  .avatar-upload:active & {
    color: $primary-light;
  }
}

.upload-status {
  font-size: $font-size-xs;
  color: $text-secondary;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.form-actions {
  margin-top: $spacing-xl;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  
  @media (min-width: $tablet) {
    flex-direction: row;
    gap: $spacing-md;
  }
}

.save-btn {
  background: linear-gradient(135deg, $primary-color 0%, $primary-light 100%);
  color: $white;
  border: none;
  border-radius: $border-radius-md;
  padding: $spacing-md;
  font-size: $font-size-lg;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  transition: all $transition-normal ease;
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba($white, 0.3);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.3s ease, height 0.3s ease;
  }
  
  &:active::after {
    width: 100px;
    height: 100px;
  }
  
  &:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba($primary-color, 0.3);
  }
  
  &:disabled {
    background: $gray-border;
    color: $text-disabled;
    transform: none;
    box-shadow: none;
  }
  
  @media (min-width: $tablet) {
    flex: 1;
  }
}

.logout-btn {
  background: $white;
  color: $error-color;
  border: 1px solid $error-color;
  border-radius: $border-radius-md;
  padding: $spacing-md;
  font-size: $font-size-lg;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  transition: all $transition-normal ease;
  
  &:active {
    background: $error-color;
    color: $white;
    transform: scale(0.98);
  }
  
  @media (min-width: $tablet) {
    flex: 1;
    
    &:hover {
      background: $error-color;
      color: $white;
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba($error-color, 0.3);
    }
  }
}

// 加载状态动画
.loading-dots {
  display: inline-block;
  
  &::after {
    content: '...';
    animation: dots 1.5s steps(4, end) infinite;
  }
}

@keyframes dots {
  0%, 20% { content: '.'; }
  40% { content: '..'; }
  60%, 100% { content: '...'; }
}

// 错误状态样式
.error-shake {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

// 响应式优化
@media (max-width: 767px) {
  .profile-container {
    padding: $spacing-sm;
  }
  
  .profile-header {
    margin-bottom: $spacing-lg;
    padding: $spacing-md;
  }
  
  .form-item {
    padding: $spacing-sm;
  }
}
</style>