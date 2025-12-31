<template>
  <view class="user-management-page">
    <view class="page-header">
      <text class="title">用户管理</text>
      <view class="search-section">
        <input v-model="searchForm.username" class="search-input" placeholder="搜索用户名" />
        <input v-model="searchForm.email" class="search-input" placeholder="搜索邮箱" />
        <input v-model="searchForm.phone" class="search-input" placeholder="搜索手机号" />
        <button class="btn-search" @click="loadUsers">搜索</button>
      </view>
    </view>
    
    <view class="user-list">
      <view v-for="user in userList" :key="user.userId" class="user-card">
        <image :src="user.avatarUrl || '/static/default-avatar.png'" class="user-avatar"></image>
        
        <view class="user-info">
          <text class="username">{{ user.username }}</text>
          <text class="email">{{ user.email }}</text>
          <text class="phone">{{ user.phone }}</text>
        </view>
        
        <view class="user-actions">
          <button class="btn-delete" @click="deleteUser(user.userId)">删除</button>
        </view>
      </view>
    </view>
    
    <view class="pagination">
      <button class="btn-prev" @click="prevPage" :disabled="currentPage === 1">上一页</button>
      <text class="page-info">第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</text>
      <button class="btn-next" @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
    </view>
    
    <view v-if="loading" class="loading">
      <view class="loading-spinner"></view>
      <text>加载中...</text>
    </view>
    <view v-if="userList.length === 0 && !loading" class="empty">
      <text>暂无用户数据</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { adminApi } from '@/api/admin'

const searchForm = ref({
  username: '',
  email: '',
  phone: ''
})
const userList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)

// 添加最小加载时间确保用户体验
const MIN_LOADING_TIME = 500
let loadingStartTime = 0

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

onMounted(() => {
  loadUsers()
})

const loadUsers = async () => {
  loading.value = true
  loadingStartTime = Date.now()
  
  try {
    const result = await adminApi.queryUser({
      page: currentPage.value,
      pageSize: pageSize.value,
      ...searchForm.value
    })
    
    // 确保最小加载时间
    const elapsed = Date.now() - loadingStartTime
    if (elapsed < MIN_LOADING_TIME) {
      await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME - elapsed))
    }
    
    if (result.code === '1') {
      userList.value = result.data.records || []
      total.value = result.data.total || 0
    } else {
      throw new Error(result.message || '请求失败')
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
    uni.showToast({ 
      title: '加载失败', 
      icon: 'none',
      duration: 3000 // 错误提示显示3秒
    })
  } finally {
    loading.value = false
  }
}

const deleteUser = (userId) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个用户吗？此操作不可恢复。',
    success: async (res) => {
      if (res.confirm) {
        try {
          const result = await adminApi.deleteUser(userId)
          if (result.code === '1') {
            uni.showToast({ 
              title: '删除成功', 
              icon: 'success',
              duration: 2000
            })
            loadUsers()
          }
        } catch (error) {
          console.error('删除用户失败:', error)
          uni.showToast({ 
            title: '删除失败', 
            icon: 'none',
            duration: 3000
          })
        }
      }
    }
  })
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    loadUsers()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    loadUsers()
  }
}
</script>

<style scoped>
.user-management-page {
  padding: 32rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 4rpx 12rpx rgba(26, 147, 114, 0.08);
  transition: all 0.3s ease;
}

.page-header:hover {
  box-shadow: 0 8rpx 24rpx rgba(26, 147, 114, 0.12);
}

.title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1a9372;
  display: block;
  margin-bottom: 24rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.search-section {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  background-color: #fafafa;
  transition: all 0.3s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.search-input:focus {
  border-color: #1a9372;
  background-color: white;
  box-shadow: 0 0 0 4rpx rgba(26, 147, 114, 0.1);
  outline: none;
}

.search-input::placeholder {
  color: #999;
}

.btn-search {
  background: linear-gradient(135deg, #1a9372, #34c759);
  color: white;
  border: none;
  border-radius: 12rpx;
  padding: 20rpx 32rpx;
  font-size: 28rpx;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4rpx 12rpx rgba(26, 147, 114, 0.3);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.btn-search:hover {
  transform: translateY(-2rpx);
  box-shadow: 0 6rpx 16rpx rgba(26, 147, 114, 0.4);
}

.btn-search:active {
  transform: translateY(0);
  box-shadow: 0 2rpx 8rpx rgba(26, 147, 114, 0.4);
}

.user-list {
  margin: 32rpx 0;
}

.user-card {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border-left: 8rpx solid transparent;
}

.user-card:hover {
  transform: translateY(-4rpx);
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
  border-left-color: #1a9372;
}

.user-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  margin-right: 32rpx;
  border: 3rpx solid #e0e0e0;
  transition: all 0.3s ease;
}

.user-card:hover .user-avatar {
  border-color: #1a9372;
}

.user-info {
  flex: 1;
}

.username {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.email, .phone {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 4rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.btn-delete {
  background: linear-gradient(135deg, #ff3b30, #ff9500);
  color: white;
  border: none;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
  font-size: 26rpx;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4rpx 12rpx rgba(255, 59, 48, 0.3);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.btn-delete:hover {
  transform: translateY(-2rpx);
  box-shadow: 0 6rpx 16rpx rgba(255, 59, 48, 0.4);
}

.btn-delete:active {
  transform: translateY(0);
  box-shadow: 0 2rpx 8rpx rgba(255, 59, 48, 0.4);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32rpx;
  margin-top: 48rpx;
  flex-wrap: wrap;
}

.btn-prev, .btn-next {
  background: linear-gradient(135deg, #1a9372, #34c759);
  color: white;
  border: none;
  border-radius: 12rpx;
  padding: 20rpx 32rpx;
  font-size: 28rpx;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4rpx 12rpx rgba(26, 147, 114, 0.3);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.btn-prev:hover, .btn-next:hover {
  transform: translateY(-2rpx);
  box-shadow: 0 6rpx 16rpx rgba(26, 147, 114, 0.4);
}

.btn-prev:active, .btn-next:active {
  transform: translateY(0);
  box-shadow: 0 2rpx 8rpx rgba(26, 147, 114, 0.4);
}

.btn-prev:disabled, .btn-next:disabled {
  background: #ccc;
  box-shadow: none;
  cursor: not-allowed;
  transform: none;
}

.btn-prev:disabled:hover, .btn-next:disabled:hover {
  transform: none;
  box-shadow: none;
}

.page-info {
  font-size: 28rpx;
  color: #666;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.loading, .empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  margin: 120rpx 0;
  font-size: 30rpx;
  gap: 24rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #e0e0e0;
  border-top: 4rpx solid #1a9372;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-management-page {
    padding: 24rpx;
  }
  
  .search-section {
    flex-direction: column;
    gap: 16rpx;
  }
  
  .search-input {
    min-width: 100%;
  }
  
  .user-card {
    flex-direction: column;
    text-align: center;
    gap: 24rpx;
  }
  
  .user-avatar {
    margin-right: 0;
  }
  
  .pagination {
    flex-direction: column;
    gap: 24rpx;
  }
  
  .btn-prev, .btn-next {
    width: 100%;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .user-management-page {
    padding: 32rpx 48rpx;
  }
  
  .search-section {
    gap: 20rpx;
  }
}

@media (min-width: 1025px) {
  .user-management-page {
    padding: 40rpx 80rpx;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .search-section {
    gap: 24rpx;
  }
}
</style>