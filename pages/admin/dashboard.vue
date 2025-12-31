<template>
  <view class="dashboard-page">
    <view class="page-header">
      <text class="title">数据统计</text>
      <view class="date-picker-container">
        <view class="date-picker-trigger" @click="showDatePicker = true">
          <text class="date-text">{{ dateRangeText }}</text>
        </view>
        
        <!-- 日期选择器弹窗 -->
        <view v-if="showDatePicker" class="date-picker-modal" @click="showDatePicker = false">
          <view class="date-picker-content" @click.stop>
            <view class="date-picker-header">
              <text class="date-picker-title">选择日期范围</text>
              <text class="close-btn" @click="showDatePicker = false">×</text>
            </view>
            
            <view class="date-picker-body">
              <view class="date-inputs">
                <view class="date-input-group">
                  <text class="date-label">开始日期</text>
                  <input 
                    v-model="tempStartTime" 
                    type="date" 
                    class="date-input" 
                    :max="tempEndTime || endTime"
                  />
                </view>
                
                <view class="date-input-group">
                  <text class="date-label">结束日期</text>
                  <input 
                    v-model="tempEndTime" 
                    type="date" 
                    class="date-input" 
                    :min="tempStartTime || startTime"
                  />
                </view>
              </view>
              
              <!-- 快捷选择 -->
              <view class="quick-selection">
                <text class="quick-title">快捷选择</text>
                <view class="quick-buttons">
                  <button 
                    v-for="option in quickOptions" 
                    :key="option.value"
                    class="quick-btn" 
                    :class="{ active: quickActive === option.value }"
                    @click="selectQuickRange(option.value)"
                  >
                    {{ option.label }}
                  </button>
                </view>
              </view>
            </view>
            
            <view class="date-picker-footer">
              <button class="btn-cancel" @click="cancelDateSelection">取消</button>
              <button class="btn-confirm" @click="confirmDateSelection">确定</button>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <view class="stats-cards">
      <view class="stat-card diagnosis-card">
        <text class="stat-value">{{ totalDiagnosis }}</text>
        <text class="stat-label">总诊断次数</text>
      </view>
      
      <view class="stat-card chat-card">
        <text class="stat-value">{{ totalChats }}</text>
        <text class="stat-label">总对话次数</text>
      </view>
    </view>
    
    <view class="charts-section">
      <!-- 诊断趋势图 -->
      <view class="chart-container">
        <text class="chart-title">诊断趋势</text>
        <view class="chart-wrapper">
          <canvas
            canvas-id="diagnosisChart"
            id="diagnosisChart"
            class="charts"
            @touchstart="touchStart('diagnosisChart', $event)"
            @touchmove="touchMove('diagnosisChart', $event)"
            @touchend="touchEnd('diagnosisChart', $event)"
          />
        </view>
      </view>
      
      <!-- 疾病分类统计 -->
      <view class="chart-container">
        <text class="chart-title">疾病分类统计</text>
        <view class="chart-wrapper">
          <canvas
            canvas-id="classifyChart"
            id="classifyChart"
            class="charts"
            @touchstart="touchStart('classifyChart', $event)"
            @touchmove="touchMove('classifyChart', $event)"
            @touchend="touchEnd('classifyChart', $event)"
          />
        </view>
      </view>
      
      <!-- 对话趋势图 -->
      <view class="chart-container">
        <text class="chart-title">对话趋势</text>
        <view class="chart-wrapper">
          <canvas
            canvas-id="chatChart"
            id="chatChart"
            class="charts"
            @touchstart="touchStart('chatChart', $event)"
            @touchmove="touchMove('chatChart', $event)"
            @touchend="touchEnd('chatChart', $event)"
          />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { adminApi } from '@/api/admin'

// uCharts 实例
let uCharts = null

// 动态引入 uCharts
const initUCharts = async () => {
  try {
    const uChartsModule = await import('@qiun/ucharts')
    uCharts = uChartsModule.default
    console.log('uCharts H5 引入成功')
  } catch (error) {
    console.error('uCharts H5 引入失败:', error)
  }
}

// 日期选择相关
const showDatePicker = ref(false)
const startTime = ref('')
const endTime = ref('')
const tempStartTime = ref('')
const tempEndTime = ref('')
const quickActive = ref('week')

// 快捷选择选项
const quickOptions = ref([
  { label: '最近7天', value: 'week' },
  { label: '最近30天', value: 'month' },
  { label: '最近3个月', value: 'quarter' }
])

// 日期范围显示文本
const dateRangeText = computed(() => {
  if (!startTime.value || !endTime.value) return '选择日期范围'
  
  const start = formatDisplayDate(startTime.value)
  const end = formatDisplayDate(endTime.value)
  
  return `${start} 至 ${end}`
})

// 统计数据
const totalDiagnosis = ref(0)
const totalChats = ref(0)
const diagnosisData = ref([])
const classifyData = ref([])
const chatData = ref([])

// 图表实例存储
const chartInstances = ref({})

// 🔥 修正：正确的 uCharts v2.0+ 配置格式 - 使用医疗蓝绿色系
const lineChartOpts = {
  color: ["#1a9372","#34c759","#2ecc71","#27ae60","#16a085","#1abc9c","#1a9372","#34c759","#2ecc71"],
  padding: [15, 15, 0, 15],
  enableScroll: false,
  legend: {},
  xAxis: {
    disableGrid: true,
    boundaryGap: 'justify'
  },
  yAxis: {
    gridType: 'solid',
    splitNumber: 5,
    min: 0,
    gridColor: '#e0e0e0'
  },
  extra: {
    line: {
      type: 'curve', // 曲线圆滑模式
      width: 3,
      activeType: 'none', // 不启用激活指示点
      linearType: 'none', // 关闭渐变色
      onShadow: false // 关闭折线阴影
    }
  }
}

const pieChartOpts = {
  color: ["#1a9372","#34c759","#2ecc71","#27ae60","#16a085","#1abc9c","#1a9372","#34c759","#2ecc71"],
  padding: [15, 15, 15, 15],
  enableScroll: false,
  legend: {},
  extra: {
    pie: {
      activeOpacity: 0.5,
      activeRadius: 10,
      offsetAngle: 0,
      labelWidth: 15,
      border: true,
      borderWidth: 2,
      borderColor: "#FFFFFF",
      linearType: 'none'
    }
  }
}

// 🔥 修正：图表数据计算 - 符合 uCharts v2.0+ 格式
const diagnosisChartData = computed(() => {
  if (!diagnosisData.value?.length) {
    return { 
      categories: [], 
      series: [] 
    }
  }

  const categories = diagnosisData.value.map(item => {
    const date = new Date(item.date)
    return `${date.getMonth() + 1}/${date.getDate()}`
  })
  
  const series = [{
    name: "诊断次数",
    data: diagnosisData.value.map(item => item.count),
    color: "#1a9372" // 使用医疗蓝绿色
  }]
  
  return JSON.parse(JSON.stringify({ 
    categories, 
    series 
  }))
})

const chatChartData = computed(() => {
  if (!chatData.value?.length) {
    return { 
      categories: [], 
      series: [] 
    }
  }

  const categories = chatData.value.map(item => {
    const date = new Date(item.date)
    return `${date.getMonth() + 1}/${date.getDate()}`
  })
  
  const series = [{
    name: "对话次数",
    data: chatData.value.map(item => item.count),
    color: "#34c759" // 使用医疗辅助绿色
  }]
  
  return JSON.parse(JSON.stringify({ 
    categories, 
    series 
  }))
})

const classifyChartData = computed(() => {
  if (!classifyData.value?.length) {
    return { 
      series: [] 
    }
  }

  const series = [{
    name: "疾病分类",
    data: classifyData.value.map(item => ({
      name: item.classify || '未知',
      value: item.count
    }))
  }]
  
  return JSON.parse(JSON.stringify({ 
    series 
  }))
})

// 获取 canvas 上下文
const getCanvasContext = (canvasId) => {
  return new Promise((resolve, reject) => {
    const query = uni.createSelectorQuery()
    query.select('#' + canvasId).fields({
      node: true,
      size: true
    }).exec((res) => {
      if (!res[0] || !res[0].node) {
        reject(new Error(`未找到 canvas 元素: ${canvasId}`))
        return
      }

      const { node, width, height } = res[0]
      
      // 获取 2D 上下文
      const context = node.getContext('2d')
      
      if (!context) {
        reject(new Error(`无法获取 canvas 上下文: ${canvasId}`))
        return
      }

      resolve({
        canvas: node,
        context: context,
        width: width,
        height: height
      })
    })
  })
}

// 🔥 修正：图表初始化函数 - 符合 uCharts v2.0+ API
const initChart = async (canvasId, type, opts, data) => {
  if (!uCharts) {
    console.warn('uCharts 未初始化，跳过图表渲染')
    return
  }

  try {
    // 获取 canvas 上下文
    const { canvas, context, width, height } = await getCanvasContext(canvasId)
    
    // 销毁旧的图表实例
    if (chartInstances.value[canvasId]) {
      try {
        chartInstances.value[canvasId].destroy()
      } catch (e) {
        // 忽略销毁错误
      }
      chartInstances.value[canvasId] = null
    }

    // 🔥 修正：创建符合 uCharts v2.0+ 的配置对象
    const chartConfig = {
      canvas: canvas,
      canvasId: canvasId,
      type: type,
      context: context,
      width: width,
      height: height,
      // 🔥 关键：将配置和数据合并
      ...opts, // 基础配置
      ...data  // 动态数据
    }

    console.log(`初始化图表 ${canvasId} 配置:`, {
      type,
      categories: data.categories?.length || 0,
      series: data.series?.length || 0,
      optsKeys: Object.keys(opts)
    })

    // 创建新的图表实例
    chartInstances.value[canvasId] = new uCharts(chartConfig)
    
    console.log(`图表 ${canvasId} 初始化成功`)
    
  } catch (error) {
    console.error(`图表 ${canvasId} 初始化失败:`, error.message)
    console.error('详细错误:', error)
  }
}

// 触摸事件处理
const touchStart = (canvasId, e) => {
  if (chartInstances.value[canvasId]) {
    chartInstances.value[canvasId].touchStart(e)
  }
}

const touchMove = (canvasId, e) => {
  if (chartInstances.value[canvasId]) {
    chartInstances.value[canvasId].touchMove(e)
  }
}

const touchEnd = (canvasId, e) => {
  if (chartInstances.value[canvasId]) {
    chartInstances.value[canvasId].touchEnd(e)
  }
}

// 更新图表数据
const updateCharts = async () => {
  await nextTick()
  
  // 延迟确保 DOM 更新完成
  setTimeout(() => {
    console.log('开始更新图表...')
    
    // 初始化或更新诊断图表
    if (diagnosisChartData.value.categories.length > 0) {
      console.log('诊断图表数据:', diagnosisChartData.value)
      initChart('diagnosisChart', 'line', lineChartOpts, diagnosisChartData.value)
    } else {
      console.log('诊断图表数据为空')
    }
    
    // 初始化或更新分类图表
    if (classifyChartData.value.series.length > 0 && classifyChartData.value.series[0].data.length > 0) {
      console.log('分类图表数据:', classifyChartData.value)
      initChart('classifyChart', 'pie', pieChartOpts, classifyChartData.value)
    } else {
      console.log('分类图表数据为空')
    }
    
    // 初始化或更新聊天图表
    if (chatChartData.value.categories.length > 0) {
      console.log('聊天图表数据:', chatChartData.value)
      initChart('chatChart', 'line', lineChartOpts, chatChartData.value)
    } else {
      console.log('聊天图表数据为空')
    }
  }, 1000)
}

// 日期选择相关方法
const selectQuickRange = (range) => {
  quickActive.value = range
  
  const end = new Date()
  const start = new Date()
  
  switch (range) {
    case 'week':
      start.setDate(start.getDate() - 7)
      break
    case 'month':
      start.setMonth(start.getMonth() - 1)
      break
    case 'quarter':
      start.setMonth(start.getMonth() - 3)
      break
  }
  
  tempStartTime.value = formatDate(start)
  tempEndTime.value = formatDate(end)
}

const confirmDateSelection = () => {
  if (tempStartTime.value && tempEndTime.value) {
    startTime.value = tempStartTime.value
    endTime.value = tempEndTime.value
    showDatePicker.value = false
    loadStatistics()
  } else {
    uni.showToast({
      title: '请选择完整的日期范围',
      icon: 'none'
    })
  }
}

const cancelDateSelection = () => {
  tempStartTime.value = startTime.value
  tempEndTime.value = endTime.value
  showDatePicker.value = false
}

const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDisplayDate = (dateString) => {
  const date = new Date(dateString)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}

onMounted(async () => {
  // 初始化 uCharts
  await initUCharts()
  
  // 设置默认时间范围（最近7天）
  selectQuickRange('week')
  
  await nextTick()
  loadStatistics()
})

const loadStatistics = async () => {
  try {
    uni.showLoading({ title: '加载中...' })
    
    console.log('开始加载统计数据，时间范围:', startTime.value, '至', endTime.value)
    
    const [diagnosisRes, classifyRes, chatRes] = await Promise.all([
      adminApi.diagnosisStatistics(startTime.value, endTime.value),
      adminApi.classifyStatistics(startTime.value, endTime.value),
      adminApi.chatStatistics(startTime.value, endTime.value)
    ])
    
    console.log('原始诊断数据:', diagnosisRes.data)
    console.log('原始分类数据:', classifyRes.data)
    console.log('原始聊天数据:', chatRes.data)
    
    // 处理诊断数据
    if (diagnosisRes.code === '1') {
      diagnosisData.value = diagnosisRes.data || []
      totalDiagnosis.value = diagnosisData.value.reduce((sum, item) => sum + (item.count || 0), 0)
      console.log('诊断总数:', totalDiagnosis.value)
    } else {
      diagnosisData.value = []
      totalDiagnosis.value = 0
    }
    
    // 处理分类数据
    if (classifyRes.code === '1') {
      classifyData.value = classifyRes.data || []
      console.log('分类数据条数:', classifyData.value.length)
    } else {
      classifyData.value = []
    }
    
    // 处理聊天数据
    if (chatRes.code === '1') {
      chatData.value = chatRes.data || []
      totalChats.value = chatData.value.reduce((sum, item) => sum + (item.count || 0), 0)
      console.log('聊天总数:', totalChats.value)
    } else {
      chatData.value = []
      totalChats.value = 0
    }
    
    // 更新图表
    await updateCharts()
    
  } catch (error) {
    console.error('加载统计数据失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'error'
    })
    diagnosisData.value = []
    classifyData.value = []
    chatData.value = []
    totalDiagnosis.value = 0
    totalChats.value = 0
  } finally {
    uni.hideLoading()
  }
}
</script>

<style scoped>
.dashboard-page {
  padding: 32rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
  flex-wrap: wrap;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

/* 日期选择器样式 */
.date-picker-container {
  position: relative;
}

.date-picker-trigger {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 24rpx;
  background: white;
  border: 1rpx solid #e0e0e0;
  border-radius: 8rpx;
  cursor: pointer;
  transition: all 0.3s;
}

.date-picker-trigger:hover {
  border-color: #1a9372;
}

.date-text {
  font-size: 28rpx;
  color: #333;
}

.icon-calendar {
  font-size: 32rpx;
}

/* 日期选择器弹窗 */
.date-picker-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.date-picker-content {
  background: white;
  border-radius: 16rpx;
  width: 90%;
  max-width: 600rpx;
  box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.date-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #e0e0e0;
}

.date-picker-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.close-btn {
  font-size: 40rpx;
  color: #999;
  cursor: pointer;
  padding: 8rpx;
}

.date-picker-body {
  padding: 32rpx;
}

.date-inputs {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-bottom: 32rpx;
}

.date-input-group {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.date-label {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.date-input {
  border: 1rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 28rpx;
  background: white;
}

.quick-selection {
  margin-top: 24rpx;
}

.quick-title {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.quick-buttons {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
}

.quick-btn {
  flex: 1;
  min-width: 120rpx;
  background: #f8f9fa;
  border: 1rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 16rpx 24rpx;
  font-size: 24rpx;
  color: #666;
  transition: all 0.3s;
}

.quick-btn.active {
  background: #1a9372;
  border-color: #1a9372;
  color: white;
}

.date-picker-footer {
  display: flex;
  gap: 16rpx;
  padding: 24rpx 32rpx;
  border-top: 1rpx solid #e0e0e0;
}

.btn-cancel, .btn-confirm {
  flex: 1;
  padding: 20rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel {
  background: #f8f9fa;
  color: #666;
  border: 1rpx solid #e0e0e0;
}

.btn-confirm {
  background: #1a9372;
  color: white;
}

.btn-confirm:active {
  background: #167a5f;
}

.stats-cards {
  display: flex;
  justify-content: space-between;
  margin-bottom: 32rpx;
  gap: 16rpx;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 280rpx;
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  text-align: center;
  color: white;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4rpx;
}

.diagnosis-card::before {
  background: linear-gradient(90deg, #1a9372, #34c759);
}

.chat-card::before {
  background: linear-gradient(90deg, #34c759, #2ecc71);
}

.stat-icon {
  font-size: 48rpx;
  margin-bottom: 16rpx;
  opacity: 0.9;
}

.stat-value {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
  color: #333;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
}

.charts-section {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.chart-container {
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.08);
}

.chart-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
  display: block;
}

.chart-wrapper {
  width: 100%;
  height: 500rpx;
  position: relative;
}

/* Canvas 样式 */
.charts {
  width: 100%;
  height: 100%;
}

/* 响应式调整 */
@media (max-width: 750rpx) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16rpx;
  }
  
  .date-picker-trigger {
    width: 100%;
    justify-content: space-between;
  }
  
  .stats-cards {
    flex-direction: column;
  }
  
  .stat-card {
    min-width: auto;
  }
  
  .date-inputs {
    flex-direction: column;
  }
  
  .quick-buttons {
    flex-direction: column;
  }
}

/* PC端适配 */
@media (min-width: 751rpx) {
  .date-picker-content {
    max-width: 700rpx;
  }
  
  .date-inputs {
    flex-direction: row;
    justify-content: space-between;
  }
  
  .date-input-group {
    flex: 1;
  }
  
  .quick-buttons {
    justify-content: center;
  }
  
  .quick-btn {
    flex: none;
    min-width: 140rpx;
  }
}
</style>