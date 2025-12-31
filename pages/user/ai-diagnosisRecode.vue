<template>
  <view class="diagnosis-recode-page">
    <!-- 页面头部 -->
    <view class="page-header">
      <text class="title">诊断记录</text>
      <text class="subtitle">查看历史诊断结果</text>
    </view>

    <!-- 筛选条件 -->
    <view class="filter-section">
      <view class="filter-row">
        <picker 
          class="filter-picker" 
          @change="onClassifyChange" 
          :value="classifyIndex" 
          :range="classifyOptions"
        >
          <view class="picker-content">
            <text>{{ classifyOptions[classifyIndex] }}</text>
            <text class="icon">▼</text>
          </view>
        </picker>
        
        <picker 
          class="filter-picker" 
          @change="onDiagnosisChange" 
          :value="diagnosisIndex" 
          :range="diagnosisOptions"
        >
          <view class="picker-content">
            <text>{{ diagnosisOptions[diagnosisIndex] }}</text>
            <text class="icon">▼</text>
          </view>
        </picker>
      </view>
      
      <view class="date-filter">
        <view class="date-input">
          <text class="label">开始时间:</text>
          <picker mode="date" @change="onStartDateChange">
            <view class="date-value">{{ filters.startTime || '选择日期' }}</view>
          </picker>
        </view>
        
        <view class="date-input">
          <text class="label">结束时间:</text>
          <picker mode="date" @change="onEndDateChange">
            <view class="date-value">{{ filters.endTime || '选择日期' }}</view>
          </picker>
        </view>
        
        <button class="filter-btn" @click="handleSearch">搜索</button>
      </view>
    </view>

    <!-- 记录列表 -->
    <scroll-view 
      class="record-list" 
      scroll-y 
      @scrolltolower="loadMore"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view v-if="loading && records.length === 0" class="loading-section">
        <text class="loading-text">加载中...</text>
      </view>
      
      <view v-else-if="records.length === 0" class="empty-section">
        <text class="empty-text">暂无诊断记录</text>
        <text class="empty-tip">开始您的第一次AI诊断吧</text>
      </view>
      
      <view v-else>
        <view 
          v-for="record in records" 
          :key="record.detectionRecordId" 
          class="record-card"
          @click="viewDetail(record.detectionRecordId)"
        >
          <view class="card-header">
            <text class="record-id">记录ID: {{ record.detectionRecordId }}</text>
            <text class="record-time">{{ formatTime(record.createTime) }}</text>
          </view>
          
          <view class="card-content">
            <view class="info-item">
              <text class="label">分类结果:</text>
              <text class="value classify-tag" :class="getClassifyClass(record.classify)">
                {{ record.classify || '未分类' }}
              </text>
            </view>
            
            <view class="info-item">
              <text class="label">诊断结果:</text>
              <text class="value diagnosis-tag" :class="getDiagnosisClass(record.diagnosis)">
                {{ record.diagnosis || '待诊断' }}
              </text>
            </view>
          </view>
          
          <view class="card-footer">
            <text class="view-detail">查看详情 →</text>
          </view>
        </view>
        
        <!-- 加载更多 -->
        <view v-if="hasMore" class="load-more">
          <text class="load-more-text" @click="loadMore">{{ loadingMore ? '加载中...' : '加载更多' }}</text>
        </view>
        
        <view v-else-if="records.length > 0" class="no-more">
          <text class="no-more-text">没有更多数据了</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { aiApi } from '@/api/ai'
import { useUserStore } from '@/stores/userStore'

// 状态管理
const userStore = useUserStore()
const records = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const refreshing = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)
const pageSize = 10

// 筛选条件
const classifyIndex = ref(0)
const diagnosisIndex = ref(0)
const filters = ref({
  classify: '',
  diagnosis: '',
  startTime: '',
  endTime: ''
})

// 筛选选项
const classifyOptions = ref(['全部分类', '黑色素瘤', '基底细胞癌', '皮肤纤维瘤', '良性角化病', '血管性病变', '痣（黑素细胞痣）', '日光性角化病/原位癌'])
const diagnosisOptions = ref(['全部诊断', '良性', '恶性', '待诊断'])

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 获取分类样式类
const getClassifyClass = (classify) => {
  if (!classify) return 'default'
  const classifyMap = {
    '黑色素瘤': 'danger',
    '基底细胞癌': 'warning',
    '皮肤纤维瘤': 'info',
    '良性角化病': 'success',
    '血管性病变': 'primary',
    '痣（黑素细胞痣）': 'success',
    '日光性角化病/原位癌': 'warning'
  }
  return classifyMap[classify] || 'default'
}

// 获取诊断样式类
const getDiagnosisClass = (diagnosis) => {
  if (!diagnosis) return 'default'
  const diagnosisMap = {
    '良性': 'success',
    '恶性': 'danger',
    '待诊断': 'warning'
  }
  return diagnosisMap[diagnosis] || 'default'
}

// 分类筛选变化
const onClassifyChange = (e) => {
  const index = parseInt(e.detail.value)
  classifyIndex.value = index
  filters.value.classify = index === 0 ? '' : classifyOptions.value[index]
}

// 诊断筛选变化
const onDiagnosisChange = (e) => {
  const index = parseInt(e.detail.value)
  diagnosisIndex.value = index
  const diagnosisMap = { 1: '良性', 2: '恶性', 3: '待诊断' }
  filters.value.diagnosis = index === 0 ? '' : diagnosisMap[index] || ''
}

// 开始时间变化
import dayjs from 'dayjs' // 推荐使用 dayjs 或 moment

const onStartDateChange = (e) => {
  const date = e.detail.value // "2025-09-25"
  // 补全为当天 00:00:00，用于查询 >= startTime
  filters.value.startTime = dayjs(date).startOf('day').format('YYYY-MM-DD HH:mm:ss')
}

const onEndDateChange = (e) => {
  const date = e.detail.value
  // 补全为当天 23:59:59，用于查询 <= endTime
  filters.value.endTime = dayjs(date).endOf('day').format('YYYY-MM-DD HH:mm:ss')
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  records.value = []
  hasMore.value = true
  loadRecords()
}

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  currentPage.value = 1
  records.value = []
  hasMore.value = true
  loadRecords().finally(() => {
    refreshing.value = false
  })
}

// 加载更多
const loadMore = () => {
  if (loadingMore.value || !hasMore.value) return
  currentPage.value++
  loadRecords(true)
}

// 加载记录
const loadRecords = async (isLoadMore = false) => {
  if (!userStore.token) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
  }

  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize,
      ...filters.value
    }

    const response = await aiApi.getDetectionRecords(params)
    
    if (response.code === '1' && response.data) {
      const newRecords = response.data.records || []
      
      if (isLoadMore) {
        records.value = [...records.value, ...newRecords]
      } else {
        records.value = newRecords
      }
      
      // 判断是否还有更多数据
      hasMore.value = records.value.length < response.data.total
    } else {
      throw new Error(response.message || '获取记录失败')
    }
  } catch (error) {
    console.error('加载记录失败:', error)
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 查看详情
const viewDetail = (id) => {
  uni.navigateTo({
    url: `/pages/user/ai-diagnosisRecodeDetail?id=${id}`
  })
}

// 页面加载
onMounted(() => {
  loadRecords()
})
</script>

<style scoped lang="scss">
/* 诊断记录页面样式 */
/* 主题变量配置 */
$primary-color: #1a9372;
$primary-dark: #147a5f;
$primary-light: #2bb892;
$secondary-color: #34c759;
$secondary-dark: #2aa64a;
$accent-color: #2ecc71;
$danger-color: #e74c3c;
$warning-color: #f39c12;
$success-color: #27ae60;
$info-color: #3498db;
$text-dark: #333333;
$text-gray: #666666;
$text-light: #999999;
$bg-light: #f5f5f5;
$bg-lighter: #fafafa;
$border-color: #e0e0e0;
$border-radius: 16rpx;
$border-radius-sm: 8rpx;
$spacing-xs: 8rpx;
$spacing-sm: 16rpx;
$spacing-md: 24rpx;
$spacing-lg: 32rpx;
$spacing-xl: 40rpx;
$shadow-light: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
$shadow-medium: 0 4rpx 20rpx rgba(0, 0, 0, 0.12);
$shadow-hover: 0 6rpx 24rpx rgba(26, 147, 114, 0.15);

/* PC端专用变量 */
$pc-border-radius: 12px;
$pc-spacing-sm: 12px;
$pc-spacing-md: 20px;
$pc-spacing-lg: 28px;
$pc-spacing-xl: 36px;

/* 交互规范变量 */
$animation-duration: 0.3s;
$animation-timing: cubic-bezier(0.4, 0, 0.2, 1);

.diagnosis-recode-page {
  padding: $spacing-lg;
  min-height: 100vh;
  background: linear-gradient(135deg, $bg-lighter 0%, #ffffff 100%);
  box-sizing: border-box;
  
  /* PC端适配 */
  @media (min-width: 768px) {
    padding: $pc-spacing-xl;
    max-width: 1200px;
    margin: 0 auto;
  }
}

.page-header {
  margin-bottom: $spacing-xl;
  text-align: center;
  padding: $spacing-md 0;

  @media (min-width: 768px) {
    margin-bottom: $pc-spacing-xl;
    padding: $pc-spacing-lg 0;
    text-align: left;
    display: flex;
    align-items: flex-end;
    gap: $pc-spacing-md;
  }

  .title {
    font-size: 38rpx;
    font-weight: 700;
    color: $primary-color;
    display: block;
    letter-spacing: -0.5rpx;
    background: linear-gradient(135deg, $primary-color, $primary-light);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    @media (min-width: 768px) {
      font-size: 32px;
      margin-bottom: 0;
    }
  }

  .subtitle {
    font-size: 24rpx;
    color: $text-gray;
    
    @media (min-width: 768px) {
      font-size: 16px;
      margin-bottom: 4px;
    }
  }
}

.filter-section {
  background: rgba(255, 255, 255, 0.95);
  padding: $spacing-xl;
  border-radius: $border-radius;
  box-shadow: $shadow-light;
  border: 1rpx solid rgba(255, 255, 255, 0.8);
  margin-bottom: $spacing-xl;
  backdrop-filter: blur(10rpx);

  @media (min-width: 768px) {
    padding: $pc-spacing-lg;
    border-radius: $pc-border-radius;
    margin-bottom: $pc-spacing-xl;
    border-width: 1px;
  }

  @media (min-width: 768px) {
    &:hover {
      transform: translateY(-2px);
      box-shadow: $shadow-hover;
    }
  }
}

.filter-row {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
  flex-direction: column;

  @media (min-width: 768px) {
    flex-direction: row;
    gap: $pc-spacing-md;
    margin-bottom: $pc-spacing-md;
  }
}

.filter-picker {
  flex: 1;
  
  .picker-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24rpx;
    background: white;
    border-radius: $border-radius-sm;
    border: 2rpx solid $border-color;
    transition: all $animation-duration $animation-timing;
    cursor: pointer;

    @media (min-width: 768px) {
      padding: 16px;
      border-radius: 8px;
      border-width: 1px;
    }

    &:active {
      border-color: $primary-color;
      background: rgba($primary-color, 0.05);
    }

    @media (min-width: 768px) {
      &:hover {
        border-color: $primary-light;
        box-shadow: $shadow-light;
      }
    }
    
    .icon {
      font-size: 20rpx;
      color: $text-gray;
      transition: transform $animation-duration $animation-timing;

      @media (min-width: 768px) {
        font-size: 12px;
      }
    }
  }
}

.date-filter {
  display: flex;
  gap: 15rpx;
  align-items: center;
  flex-wrap: wrap;
  flex-direction: column;

  @media (min-width: 768px) {
    flex-direction: row;
    flex-wrap: nowrap;
    gap: $pc-spacing-sm;
  }
}

.date-input {
  display: flex;
  align-items: center;
  flex: 1;
  width: 100%;

  @media (min-width: 768px) {
    width: auto;
    min-width: 200px;
  }
  
  .label {
    font-size: 24rpx;
    color: $text-gray;
    margin-right: 10rpx;
    white-space: nowrap;
    min-width: 120rpx;

    @media (min-width: 768px) {
      font-size: 14px;
      min-width: 80px;
    }
  }
  
  .date-value {
    flex: 1;
    padding: 20rpx;
    background: white;
    border-radius: $border-radius-sm;
    border: 2rpx solid $border-color;
    font-size: 24rpx;
    text-align: center;
    transition: all $animation-duration $animation-timing;
    cursor: pointer;

    @media (min-width: 768px) {
      padding: 12px;
      font-size: 14px;
      border-radius: 6px;
      border-width: 1px;
      min-width: 140px;
    }

    &:active {
      border-color: $primary-color;
      background: rgba($primary-color, 0.05);
    }

    @media (min-width: 768px) {
      &:hover {
        border-color: $primary-light;
      }
    }
  }
}

.filter-btn {
  padding: 0 40rpx;
  height: 80rpx;
  line-height: 80rpx;
  background: linear-gradient(135deg, $primary-color, $primary-light);
  color: white;
  border-radius: $border-radius-sm;
  font-size: 26rpx;
  font-weight: 600;
  white-space: nowrap;
  border: none;
  transition: all $animation-duration $animation-timing;
  box-shadow: $shadow-light;
  cursor: pointer;
  width: 100%;
  margin-top: 10rpx;

  @media (min-width: 768px) {
    width: auto;
    margin-top: 0;
    height: 48px;
    line-height: 48px;
    font-size: 14px;
    border-radius: 8px;
    padding: 0 24px;
  }

  &:active {
    transform: translateY(2rpx);
    box-shadow: $shadow-light;
  }

  @media (min-width: 768px) {
    &:active {
      transform: translateY(1px);
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: $shadow-hover;
      background: linear-gradient(135deg, $primary-dark, $primary-color);
    }
  }
}

.record-list {
  height: calc(100vh - 400rpx);
  
  @media (min-width: 768px) {
    height: calc(100vh - 280px);
  }
}

.loading-section, .empty-section {
  text-align: center;
  padding: 100rpx 0;
  background: rgba(255, 255, 255, 0.9);
  border-radius: $border-radius;
  margin: 20rpx 0;

  @media (min-width: 768px) {
    padding: 80px 0;
    border-radius: $pc-border-radius;
    margin: $pc-spacing-md 0;
  }
}

.loading-text, .empty-text {
  font-size: 28rpx;
  color: $text-gray;
  display: block;
  margin-bottom: 10rpx;

  @media (min-width: 768px) {
    font-size: 18px;
  }
}

.empty-tip {
  font-size: 24rpx;
  color: #999;

  @media (min-width: 768px) {
    font-size: 14px;
  }
}

.record-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: $border-radius;
  padding: $spacing-xl;
  margin-bottom: $spacing-md;
  box-shadow: $shadow-light;
  border-left: 6rpx solid $primary-color;
  transition: all $animation-duration $animation-timing;
  backdrop-filter: blur(10rpx);
  border: 1rpx solid rgba(255, 255, 255, 0.8);
  cursor: pointer;

  @media (min-width: 768px) {
    padding: $pc-spacing-lg;
    border-radius: $pc-border-radius;
    margin-bottom: $pc-spacing-md;
    border-left-width: 6px;
  }

  &:active {
    transform: translateY(2rpx);
    box-shadow: $shadow-light;
  }

  @media (min-width: 768px) {
    &:active {
      transform: translateY(1px);
    }

    &:hover {
      transform: translateY(-4px);
      box-shadow: $shadow-hover;
      border-left-color: $primary-light;
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  flex-direction: column;
  gap: 10rpx;

  @media (min-width: 768px) {
    flex-direction: row;
    gap: 0;
  }
  
  .record-id {
    font-size: 24rpx;
    color: $text-gray;
    font-family: 'Courier New', monospace;

    @media (min-width: 768px) {
      font-size: 14px;
    }
  }
  
  .record-time {
    font-size: 22rpx;
    color: #999;

    @media (min-width: 768px) {
      font-size: 14px;
    }
  }
}

.card-content {
  .info-item {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
    flex-direction: column;
    gap: 10rpx;

    @media (min-width: 768px) {
      flex-direction: row;
      gap: 0;
    }
    
    .label {
      font-size: 26rpx;
      color: $text-dark;
      margin-right: 15rpx;
      min-width: 120rpx;
      font-weight: 600;

      @media (min-width: 768px) {
        font-size: 16px;
        min-width: 100px;
      }
    }
    
    .value {
      font-size: 26rpx;
      font-weight: 500;
      flex: 1;

      @media (min-width: 768px) {
        font-size: 16px;
      }
    }
  }
}

// 标签样式
.classify-tag, .diagnosis-tag {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 22rpx !important;
  font-weight: 600;
  transition: all $animation-duration $animation-timing;
  
  @media (min-width: 768px) {
    padding: 6px 16px;
    font-size: 14px !important;
    border-radius: 16px;
  }

  &.danger { 
    background: linear-gradient(135deg, #fee, #fdd); 
    color: $danger-color; 
    border: 1rpx solid #fcc; 
  }
  &.warning { 
    background: linear-gradient(135deg, #fef6e6, #fdebc6); 
    color: $warning-color; 
    border: 1rpx solid #fde3a7; 
  }
  &.success { 
    background: linear-gradient(135deg, #e8f6f0, #d1f0e0); 
    color: $success-color; 
    border: 1rpx solid #b8e6c9; 
  }
  &.info { 
    background: linear-gradient(135deg, #e6f3fb, #d4ebf7); 
    color: $info-color; 
    border: 1rpx solid #aed6f1; 
  }
  &.primary { 
    background: linear-gradient(135deg, #e8f4f1, #d4ece5); 
    color: $primary-color; 
    border: 1rpx solid #a3d9c7; 
  }
  &.default { 
    background: linear-gradient(135deg, #f5f5f5, #e8e8e8); 
    color: $text-gray; 
    border: 1rpx solid #ddd; 
  }

  @media (min-width: 768px) {
    &:hover {
      transform: scale(1.05);
      box-shadow: $shadow-light;
    }
  }
}

.card-footer {
  text-align: center;
  margin-top: 20rpx;
  
  @media (min-width: 768px) {
    text-align: right;
  }
  
  .view-detail {
    font-size: 24rpx;
    color: $primary-color;
    font-weight: 600;
    transition: all $animation-duration $animation-timing;

    @media (min-width: 768px) {
      font-size: 14px;
    }

    @media (min-width: 768px) {
      &:hover {
        color: $primary-light;
        transform: translateX(4px);
      }
    }
  }
}

.load-more, .no-more {
  text-align: center;
  padding: 30rpx;
  
  @media (min-width: 768px) {
    padding: $pc-spacing-lg;
  }
  
  .load-more-text, .no-more-text {
    font-size: 26rpx;
    color: $text-gray;

    @media (min-width: 768px) {
      font-size: 16px;
    }
  }
  
  .load-more-text {
    color: $primary-color;
    cursor: pointer;
    transition: color $animation-duration $animation-timing;

    @media (min-width: 768px) {
      &:hover {
        color: $primary-light;
      }
    }
  }
}

/* PC端网格布局优化 */
@media (min-width: 1024px) {
  .diagnosis-recode-page {
    display: grid;
    grid-template-columns: 300px 1fr;
    grid-template-rows: auto 1fr;
    gap: $pc-spacing-xl;
    grid-template-areas: 
      "header header"
      "filter list";
    align-items: start;
  }

  .page-header {
    grid-area: header;
    margin-bottom: 0;
  }

  .filter-section {
    grid-area: filter;
    margin: 0;
    height: fit-content;
    position: sticky;
    top: $pc-spacing-xl;
  }

  .record-list {
    grid-area: list;
    height: calc(100vh - 200px);
  }

  .filter-row {
    flex-direction: column;
  }

  .date-filter {
    flex-direction: column;
  }

  .filter-btn {
    width: 100%;
  }
}

/* 大屏幕PC优化 */
@media (min-width: 1440px) {
  .diagnosis-recode-page {
    gap: $pc-spacing-xl * 1.5;
    padding: $pc-spacing-xl * 1.5;
    max-width: 1400px;
  }
}

/* 平板端优化 */
@media (min-width: 768px) and (max-width: 1024px) {
  .diagnosis-recode-page {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .date-filter {
    flex-wrap: wrap;
  }
  
  .date-input {
    min-width: calc(50% - 10px);
  }
}

/* 动画定义 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(40rpx) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .diagnosis-recode-page {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  }
  
  .filter-section,
  .record-card {
    background: rgba(40, 40, 40, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .section-title,
  .card-content .label,
  .card-content .value {
    color: #ffffff;
  }
  
  .filter-picker .picker-content,
  .date-input .date-value {
    background: #2d2d2d;
    border-color: rgba(255, 255, 255, 0.2);
    color: #ffffff;
  }
  
  .loading-section,
  .empty-section {
    background: rgba(40, 40, 40, 0.9);
  }
}

/* 减少动画设置支持 */
@media (prefers-reduced-motion: reduce) {
  .diagnosis-recode-page * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>