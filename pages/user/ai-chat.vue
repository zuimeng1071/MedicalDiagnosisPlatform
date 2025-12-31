<template>
	<view class="ai-chat-container">
		<!-- 移动端侧边栏遮罩 -->
		<view 
			v-if="showMobileMask" 
			class="mobile-mask" 
			@click="toggleSidebar"
		></view>
		
		<!-- 侧边栏历史记录 -->
		<view 
			class="sidebar" 
			:class="{ 
				'sidebar-collapsed': isSidebarCollapsed,
				'mobile-sidebar': isMobile
			}"
		>
			<view class="sidebar-header">
				<text class="sidebar-title">对话历史</text>
				<view class="sidebar-toggle" @click="toggleSidebar">
					<text class="icon">{{ isSidebarCollapsed ? '›' : '‹' }}</text>
				</view>
			</view>
			
			<view class="new-chat-btn" @click="createNewChat">
				<text class="icon">+</text>
				<text class="btn-text">新建对话</text>
			</view>
			
			<scroll-view class="history-list" scroll-y="true">
				<view 
					v-for="record in chatRecords" 
					:key="record.chatRecodeId"
					class="history-item"
					:class="{ active: currentMemoryId === record.memoryId }"
					@click="loadChatHistory(record.memoryId)"
				>
					<text class="history-question">{{ record.firstQuestion || '新对话' }}</text>
					<text class="history-time">{{ formatTime(record.createTime) }}</text>
				</view>
				
				<view v-if="chatRecords.length === 0" class="empty-history">
					<text class="empty-text">暂无历史对话</text>
					<text class="empty-tip">开始新的对话吧</text>
				</view>
			</scroll-view>
		</view>
		
		<!-- 主对话区域 -->
		<view class="chat-main" :class="{ 'expanded': isSidebarCollapsed }">
			<!-- 顶部栏 -->
			<view class="chat-header">
				<view class="header-left">
					<view 
						class="menu-toggle" 
						@click="toggleSidebar"
						v-if="isMobile"
					>
						<text class="menu-icon">☰</text>
					</view>
					<view class="header-title">
						<text class="chat-title">AI皮肤科医生</text>
						<text class="chat-subtitle">为您解答皮肤健康问题</text>
					</view>
				</view>
				<view class="header-actions">
					<view class="new-chat-mini" @click="createNewChat">
						<text class="icon">+</text>
					</view>
				</view>
			</view>
			
			<!-- 对话容器 -->
			<scroll-view 
				class="chat-container" 
				scroll-y="true" 
				:scroll-top="scrollTop"
				scroll-with-animation
				@scroll="onScroll"
				:scroll-into-view="scrollToId"
			>
				<view class="message-list">
					<view 
						v-for="(message, index) in messages" 
						:key="index" 
						:class="['message', message.type === 'user' ? 'user-message' : 'ai-message']"
						:id="'msg-' + index"
					>
						<view class="message-avatar">
							<view class="avatar" :class="message.type === 'user' ? 'user-avatar' : 'ai-avatar'">
								<text class="avatar-text">{{ message.type === 'user' ? '用' : 'AI' }}</text>
							</view>
						</view>
						<view class="message-content">
							<!-- 用户消息保持纯文本 -->
							<text v-if="message.type === 'user'" class="message-text">{{ message.content }}</text>
							
							<!-- AI 消息使用 Markdown 渲染 -->
							<markdown-renderer 
								v-else
								:content="message.content"
								class="ai-markdown-content"
							/>
							
							<view v-if="message.type === 'ai' && message.streaming" class="typing-indicator">
								<view class="dot"></view>
								<view class="dot"></view>
								<view class="dot"></view>
							</view>
						</view>
					</view>
					
					<!-- 空状态 -->
					<view v-if="messages.length === 0" class="welcome-message">
						<view class="welcome-content">
							<view class="welcome-avatar">
								<text class="avatar-text">AI</text>
							</view>
							<view class="welcome-text">
								<text class="welcome-title">您好！我是AI皮肤科医生</text>
								<text class="welcome-desc">我可以帮您解答关于皮肤健康、痣的变化、黑色素瘤预防等问题。请随时向我提问！</text>
							</view>
						</view>
					</view>
				</view>
				<view class="empty-box" id="bottom-anchor"></view>
			</scroll-view>
			
			<!-- 输入区域 -->
			<view class="input-area">
				<view class="input-container">
					<textarea 
						v-model="inputMessage" 
						class="message-input" 
						placeholder="输入您的问题..." 
						:maxlength="500"
						:show-confirm-bar="false"
						@confirm="sendMessage"
						@linechange="onInputLineChange"
						:disabled="isSending"
						:focus="autoFocus"
						confirm-type="send"
					></textarea>
					<button 
						class="send-btn" 
						:disabled="!inputMessage.trim() || isSending" 
						@click="sendMessage"
						:class="{ 'sending': isSending }"
					>
						<text class="send-icon" v-if="!isSending">⬆</text>
						<view class="loading-spinner-mini" v-else></view>
					</button>
				</view>
				<view class="input-tips">
					<text>AI医生将为您解答皮肤健康相关问题</text>
				</view>
			</view>
		</view>
		
		<!-- 加载状态 -->
		<view v-if="isLoading" class="loading-mask">
			<view class="loading-content">
				<view class="loading-spinner"></view>
				<text class="loading-text">加载中...</text>
			</view>
		</view>
	</view>
</template>

<script>
	import { aiApi } from '@/api/ai.js'
	import MarkdownRenderer from '@/components/markdown-renderer.vue'
	
	export default {
		components: {
			MarkdownRenderer
		},
		data() {
			return {
				// 侧边栏状态
				isSidebarCollapsed: false,
				showMobileMask: false,
				isMobile: false,
				
				// 聊天数据
				currentMemoryId: '',  // 确保初始化为空字符串而不是null
				inputMessage: '',
				messages: [],
				isSending: false,
				scrollTop: 0,
				scrollToId: '',
				autoScroll: true,
				autoFocus: false,
				
				// 历史记录
				chatRecords: [],
				isLoading: false,
				
				// 打字机效果相关
				typingInterval: null,
				currentTypingIndex: 0,
				currentTypingText: ''
			}
		},
		
		onLoad() {
			this.checkDeviceType()
			this.loadChatRecords()
			this.createNewChat()
		},
		
		onShow() {
			// 页面显示时自动聚焦输入框
			this.autoFocus = true
		},
		
		onUnload() {
			// 清理定时器
			if (this.typingInterval) {
				clearInterval(this.typingInterval)
			}
		},
		
		methods: {
			// 检测设备类型
			checkDeviceType() {
				const systemInfo = uni.getSystemInfoSync()
				this.isMobile = systemInfo.windowWidth <= 768
			},
			
			// 切换侧边栏状态
			toggleSidebar() {
				this.isSidebarCollapsed = !this.isSidebarCollapsed
				
				// 移动端显示遮罩
				if (this.isMobile) {
					this.showMobileMask = !this.isSidebarCollapsed
				}
			},
			
			// 创建新对话
			createNewChat() {
				// 生成基于时间戳的memoryId
				const now = new Date()
				this.currentMemoryId = now.getFullYear().toString() + 
					(now.getMonth() + 1).toString().padStart(2, '0') + 
					now.getDate().toString().padStart(2, '0') + 
					now.getHours().toString().padStart(2, '0') + 
					now.getMinutes().toString().padStart(2, '0') + 
					now.getSeconds().toString().padStart(2, '0') + 
					now.getMilliseconds().toString().padStart(3, '0')
								
				this.messages = []
				this.inputMessage = ''
				
				// 移动端自动收起侧边栏
				if (this.isMobile) {
					this.isSidebarCollapsed = true
					this.showMobileMask = false
				}
			},
			
			// 加载历史记录列表
			async loadChatRecords() {
				try {
					this.isLoading = true
					const params = {
						page: 1,
						pageSize: 20
					}
					const res = await aiApi.chatRecodePageQuery(params)
					
					if (res.code === '1') {
						this.chatRecords = res.data.records || []
					} else {
						uni.showToast({
							title: '加载历史记录失败',
							icon: 'none'
						})
					}
				} catch (error) {
					console.error('加载历史记录失败:', error)
					uni.showToast({
						title: '加载历史记录失败',
						icon: 'none'
					})
				} finally {
					this.isLoading = false
				}
			},
			
			// 加载特定历史对话
			async loadChatHistory(memoryId) {
				try {
					this.isLoading = true
					this.currentMemoryId = memoryId
					
					console.log('加载历史对话，memoryId:', memoryId)
					
					const res = await aiApi.chatRecodeDetail(memoryId)
					
					if (res.code === '1') {
						// 解析历史消息
						const historyData = JSON.parse(res.data)
						console.log('历史对话数据:', historyData) // 调试日志
						
						this.messages = []
						
						// 过滤掉SYSTEM类型的消息，并转换为前端格式
						historyData.forEach(item => {
							console.log('处理消息项:', item) // 调试日志
							if (item.type === 'USER') {
								this.messages.push({
									type: 'user',
									content: item.contents?.[0]?.text || '用户消息',
									streaming: false
								})
							} else if (item.type === 'AI') {
								this.messages.push({
									type: 'ai',
									content: item.text || 'AI回复',
									streaming: false
								})
							}
							// 跳过SYSTEM类型
						})
						
						console.log('处理后的消息列表:', this.messages) // 调试日志
						
						this.$nextTick(() => {
							this.scrollToBottom()
						})
						
						// 移动端自动收起侧边栏
						if (this.isMobile) {
							this.isSidebarCollapsed = true
							this.showMobileMask = false
						}
					} else {
						uni.showToast({
							title: '加载对话失败',
							icon: 'none'
						})
					}
				} catch (error) {
					console.error('加载对话失败:', error)
					uni.showToast({
						title: '加载对话失败',
						icon: 'none'
					})
				} finally {
					this.isLoading = false
				}
			},
			
			// 发送消息
			async sendMessage() {
				if (!this.inputMessage.trim() || this.isSending) return
				
				const question = this.inputMessage.trim()
				this.inputMessage = ''
				this.autoFocus = false // 防止键盘遮挡
				
				// 确保有有效的memoryId
				if (!this.currentMemoryId) {
					this.createNewChat()
				}
								
				// 添加用户消息
				this.messages.push({
					type: 'user',
					content: question,
					streaming: false
				})
				
				this.isSending = true
				
				try {
					// 滚动到底部
					this.$nextTick(() => {
						this.scrollToBottom()
					})
					
					// 调用聊天API
					const response = await aiApi.chat(this.currentMemoryId, question)
					
					console.log('AI回复原始数据:', response) // 调试日志
					
					if (response.code === '1') {
						// 添加AI消息
						const aiMessageIndex = this.messages.length
						this.messages.push({
							type: 'ai',
							content: '',
							streaming: true
						})
						
						// 使用打字机效果显示回复
						this.typeMessage(response.data, aiMessageIndex)
						
						// 如果是新对话，重新加载历史记录列表
						if (this.chatRecords.findIndex(record => record.memoryId === this.currentMemoryId) === -1) {
							this.loadChatRecords()
						}
					} else {
						throw new Error(response.message || '请求失败')
					}
					
				} catch (error) {
					console.error('发送消息失败:', error)
					
					// 添加错误消息
					this.messages.push({
						type: 'ai',
						content: '抱歉，出现了错误，请稍后重试。',
						streaming: false
					})
					
					uni.showToast({
						title: '发送失败: ' + error.message,
						icon: 'none',
						duration: 3000
					})
				} finally {
					this.isSending = false
					this.autoFocus = true
				}
			},
			
			// 打字机效果显示消息
			typeMessage(text, messageIndex) {
				this.currentTypingIndex = 0
				this.currentTypingText = text
				
				// 清除之前的定时器
				if (this.typingInterval) {
					clearInterval(this.typingInterval)
				}
				
				this.typingInterval = setInterval(() => {
					if (this.currentTypingIndex < this.currentTypingText.length) {
						this.messages[messageIndex].content = this.currentTypingText.substring(0, this.currentTypingIndex + 1)
						this.currentTypingIndex++
						
						// 滚动到底部
						this.$nextTick(() => {
							if (this.autoScroll) {
								this.scrollToBottom()
							}
						})
					} else {
						// 完成打字效果
						this.messages[messageIndex].streaming = false
						clearInterval(this.typingInterval)
						this.typingInterval = null
					}
				}, 30) // 控制打字速度
			},
			
			// 滚动处理
			onScroll(e) {
				this.oldScrollTop = e.detail.scrollTop
				
				// 判断是否接近底部
				const scrollHeight = e.detail.scrollHeight
				const clientHeight = e.detail.clientHeight
				const scrollTop = e.detail.scrollTop
				
				// 距离底部50px内认为是自动滚动
				this.autoScroll = (scrollHeight - clientHeight - scrollTop) < 50
			},
			
			// 滚动到底部
			scrollToBottom() {
				this.$nextTick(() => {
					this.scrollToId = 'bottom-anchor'
					setTimeout(() => {
						this.scrollToId = ''
					}, 100)
				})
			},
			
			// 输入框行数变化
			onInputLineChange(e) {
				// 可以在这里处理输入框高度变化
			},
			
			// 格式化时间
			formatTime(timeStr) {
				if (!timeStr) return ''
				
				const date = new Date(timeStr)
				const now = new Date()
				const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
				
				if (diffDays === 0) {
					// 今天
					return date.getHours().toString().padStart(2, '0') + ':' + 
						   date.getMinutes().toString().padStart(2, '0')
				} else if (diffDays === 1) {
					// 昨天
					return '昨天'
				} else if (diffDays < 7) {
					// 一周内
					return diffDays + '天前'
				} else {
					// 更早
					return date.getMonth() + 1 + '/' + date.getDate()
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
.ai-chat-container {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 移动端遮罩 */
.mobile-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 998;
  animation: fadeIn 0.3s ease;
}

/* 侧边栏样式 */
.sidebar {
  width: 280px;
  flex: 0 0 auto;
  background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.08);
  z-index: 999;
  position: relative;
  
  &.sidebar-collapsed {
    transform: translateX(-100%);
    opacity: 0;
    visibility: hidden;
  }
  
  // 移动端样式
  &.mobile-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 85%;
    max-width: 280px;
    transform: translateX(0);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &.sidebar-collapsed {
      transform: translateX(-100%);
    }
  }
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #1a9372 0%, #2dcc9e 100%);
  color: white;
  flex-shrink: 0;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.sidebar-toggle {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.95);
    background: rgba(255, 255, 255, 0.3);
  }
  
  .icon {
    font-size: 16px;
    font-weight: bold;
    color: white;
  }
}

.new-chat-btn {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin: 16px;
  background: linear-gradient(135deg, #34c759 0%, #2dcc9e 100%);
  color: white;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3);
  flex-shrink: 0;
  
  &:active {
    transform: translateY(2px);
    box-shadow: 0 2px 8px rgba(52, 199, 89, 0.4);
  }
  
  .icon {
    margin-right: 8px;
    font-size: 18px;
    font-weight: 300;
  }
  
  .btn-text {
    font-size: 14px;
    font-weight: 500;
  }
}

.history-list {
  flex: 1;
  padding: 0 8px 16px;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
}

.history-item {
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  width: calc(100% - 16px); /* 减去左右padding */
  box-sizing: border-box;
  overflow: hidden;
  
  &:active {
    transform: scale(0.98);
  }
  
  &.active {
    background: linear-gradient(135deg, #e6f7f2 0%, #f0fdf9 100%);
    border-color: #1a9372;
    box-shadow: 0 2px 8px rgba(26, 147, 114, 0.15);
  }
}

.history-question {
  display: block;
  font-size: 14px;
  color: #1e293b;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  line-height: 1.4;
  width: 100%;
}

.history-time {
  font-size: 12px;
  color: #64748b;
  display: block;
  width: 100%;
}

.empty-history {
  text-align: center;
  padding: 40px 16px;
  color: #94a3b8;
  width: 100%;
  box-sizing: border-box;
  
  .empty-text {
    display: block;
    font-size: 14px;
    margin-bottom: 8px;
    font-weight: 500;
  }
  
  .empty-tip {
    font-size: 12px;
    color: #cbd5e1;
    display: block;
  }
}

/* 主对话区域样式 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  min-width: 0;
  background: white;
  
  &.expanded {
    margin-left: 0;
  }
}

.chat-header {
  padding: 12px 16px;
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  width: 100%;
  box-sizing: border-box;
}

.header-left {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.menu-toggle {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #e2e8f0;
  
  &:active {
    background: #f1f5f9;
    transform: scale(0.95);
  }
  
  .menu-icon {
    font-size: 16px;
    color: #475569;
  }
}

.header-title {
  flex: 1;
  min-width: 0;
}

.chat-title {
  display: block;
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #1a9372 0%, #34c759 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 4px;
  letter-spacing: -0.5px;
}

.chat-subtitle {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
}

.new-chat-mini {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #34c759 0%, #2dcc9e 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(52, 199, 89, 0.3);
  
  &:active {
    transform: scale(0.95);
    box-shadow: 0 1px 4px rgba(52, 199, 89, 0.4);
  }
  
  .icon {
    font-size: 18px;
    font-weight: 300;
  }
}

.chat-container {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column-reverse;
  background: #f8fafc;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
}

.empty-box {
  flex-grow: 1;
}

.message-list {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.message {
  display: flex;
  margin-bottom: 16px;
  animation: messageSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  max-width: 100%;
  box-sizing: border-box;
  width: 100%;
}

@keyframes messageSlideIn {
  from { 
    opacity: 0; 
    transform: translateY(20px) scale(0.95); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0) scale(1); 
  }
}

.user-message {
  flex-direction: row-reverse;
  
  .message-content {
    background: linear-gradient(135deg, #1a9372 0%, #2dcc9e 100%);
    color: white;
    border-bottom-right-radius: 4px;
    box-shadow: 0 4px 12px rgba(26, 147, 114, 0.3);
  }
}

.ai-message {
  .message-content {
    background: white;
    color: #1e293b;
    border-bottom-left-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    border: 1px solid #f1f5f9;
  }
}

.message-avatar {
  width: 40px;
  height: 40px;
  margin: 0 12px;
  flex-shrink: 0;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  
  &.user-avatar {
    background: linear-gradient(135deg, #34c759 0%, #2dcc9e 100%);
    color: white;
  }
  
  &.ai-avatar {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    color: #475569;
    border: 1px solid #e2e8f0;
  }
}

.avatar-text {
  font-size: 14px;
  font-weight: 600;
}

.message-content {
  max-width: calc(100% - 80px);
  padding: 12px 16px;
  border-radius: 16px;
  position: relative;
  word-break: break-word;
  line-height: 1.5;
  box-sizing: border-box;
  width: calc(100% - 80px);
}

.message-text {
  font-size: 15px;
  line-height: 1.5;
  width: 100%;
}

/* Markdown 内容样式 */
.ai-markdown-content {
  font-size: 15px;
  line-height: 1.6;
  width: 100%;
  
  /* 标题样式 */
  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
    margin: 8px 0 6px 0;
    font-weight: 600;
    color: inherit;
  }
  
  :deep(h1) { font-size: 18px; }
  :deep(h2) { font-size: 17px; }
  :deep(h3) { font-size: 16px; }
  :deep(h4) { font-size: 15px; }
  :deep(h5) { font-size: 14px; }
  :deep(h6) { font-size: 13px; }
  
  /* 段落和文字 */
  :deep(p) {
    margin: 6px 0;
    line-height: 1.6;
  }
  
  :deep(strong), :deep(b) {
    font-weight: 600;
    color: inherit;
  }
  
  :deep(em), :deep(i) {
    font-style: italic;
  }
  
  /* 列表样式 */
  :deep(ul), :deep(ol) {
    margin: 6px 0;
    padding-left: 24px;
  }
  
  :deep(li) {
    margin: 4px 0;
    line-height: 1.5;
  }
  
  /* 表格样式 */
  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;
    font-size: 14px;
    background: white;
    border-radius: 8px;
    overflow: hidden;
  }
  
  :deep(th), :deep(td) {
    border: 1px solid #e2e8f0;
    padding: 8px 12px;
    text-align: left;
  }
  
  :deep(th) {
    background-color: #f8fafc;
    font-weight: 600;
    color: #475569;
  }
  
  :deep(td) {
    background-color: white;
    color: #64748b;
  }
  
  /* 代码样式 */
  :deep(code) {
    background-color: #f1f5f9;
    padding: 2px 4px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 14px;
  }
  
  :deep(pre) {
    background-color: #1e293b;
    border-radius: 8px;
    padding: 12px;
    margin: 8px 0;
    overflow-x: auto;
    
    code {
      background-color: transparent;
      color: #e2e8f0;
      padding: 0;
    }
  }
  
  /* 引用样式 */
  :deep(blockquote) {
    border-left: 4px solid #1a9372;
    background-color: #f0fdf9;
    margin: 8px 0;
    padding: 12px 16px;
    border-radius: 0 8px 8px 0;
    
    p {
      margin: 0;
      color: #1a9372;
      font-weight: 500;
    }
  }
  
  /* 链接样式 */
  :deep(a) {
    color: #1a9372;
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  /* 水平线 */
  :deep(hr) {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 16px 0;
  }
}

.typing-indicator {
  display: flex;
  align-items: center;
  margin-top: 8px;
  
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.7);
    margin-right: 4px;
    animation: typingBounce 1.4s infinite both;
    
    &:nth-child(1) { animation-delay: 0s; }
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

.ai-message .typing-indicator .dot {
  background: #94a3b8;
}

@keyframes typingBounce {
  0%, 60%, 100% { 
    transform: translateY(0); 
    opacity: 0.6; 
  }
  30% { 
    transform: translateY(-4px); 
    opacity: 1; 
  }
}

/* 欢迎消息 */
.welcome-message {
  display: flex;
  justify-content: center;
  margin: 40px 0;
  width: 100%;
}

.welcome-content {
  display: flex;
  align-items: flex-start;
  max-width: 80%;
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f1f5f9;
  width: 100%;
  box-sizing: border-box;
}

.welcome-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #1a9372 0%, #2dcc9e 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(26, 147, 114, 0.3);
}

.welcome-text {
  flex: 1;
  width: calc(100% - 64px);
}

.welcome-title {
  display: block;
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #1a9372 0%, #34c759 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
  width: 100%;
}

.welcome-desc {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  font-weight: 500;
  width: 100%;
}

/* 输入区域样式 */
.input-area {
  padding: 16px;
  background: white;
  border-top: 1px solid #f1f5f9;
  flex-shrink: 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.03);
  width: 100%;
  box-sizing: border-box;
}

.input-container {
  display: flex;
  align-items: flex-end;
  background: #f8fafc;
  border-radius: 16px;
  padding: 8px 12px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  width: 100%;
  box-sizing: border-box;
  
  &:focus-within {
    background: white;
    border-color: #1a9372;
    box-shadow: 0 0 0 3px rgba(26, 147, 114, 0.1);
  }
}

.message-input {
  flex: 1;
  min-height: 20px;
  max-height: 100px;
  padding: 6px 8px;
  font-size: 15px;
  line-height: 1.5;
  background: transparent;
  border: none;
  outline: none;
  color: #1e293b;
  font-weight: 500;
  width: 100%;
  box-sizing: border-box;
  
  &::placeholder {
    color: #94a3b8;
    font-weight: normal;
  }
}

.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #34c759 0%, #2dcc9e 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(52, 199, 89, 0.3);
  flex-shrink: 0;
  
  &:disabled {
    background: #cbd5e1;
    box-shadow: none;
    cursor: not-allowed;
    transform: none !important;
  }
  
  &:active:not(:disabled) {
    transform: scale(0.95);
    box-shadow: 0 1px 4px rgba(52, 199, 89, 0.4);
  }
  
  &.sending {
    background: linear-gradient(135deg, #34c759 0%, #2dcc9e 100%);
  }
  
	.send-icon {
	  font-size: 18px;
	  font-weight: 900; /* 最大加粗程度 */
	  display: inline-block;
	  transform: translateY(1px); /* 微调垂直位置 */
	}
}

.loading-spinner-mini {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.input-tips {
  text-align: center;
  margin-top: 8px;
  width: 100%;
  
  text {
    font-size: 12px;
    color: #94a3b8;
    font-weight: 500;
  }
}

/* 加载状态 */
.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  animation: fadeIn 0.3s ease;
  width: 100%;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.loading-content {
  background: white;
  padding: 24px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid #f1f5f9;
  width: 80%;
  max-width: 300px;
  box-sizing: border-box;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #f1f5f9;
  border-top: 3px solid #1a9372;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 14px;
  color: #475569;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-main {
    width: 100%;
  }
  
  .message-content {
    max-width: calc(100% - 64px);
  }
  
  .chat-header {
    padding: 12px;
  }
  
  .chat-container {
    padding: 12px;
  }
  
  .input-area {
    padding: 12px;
  }
  
  .welcome-content {
    max-width: 90%;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 16px;
  }
  
  .welcome-avatar {
    margin-right: 0;
    margin-bottom: 12px;
  }
  
  .message-avatar {
    width: 36px;
    height: 36px;
    margin: 0 8px;
  }
  
  .avatar {
    border-radius: 8px;
  }
  
  /* 移动端 Markdown 样式调整 */
  .ai-markdown-content {
    font-size: 14px;
    
    :deep(table) {
      font-size: 12px;
    }
    
    :deep(th), :deep(td) {
      padding: 6px 8px;
    }
    
    :deep(pre) {
      padding: 8px;
    }
  }
}

@media (max-width: 1024px) {
  .sidebar {
    width: 240px;
  }
  
  .history-item {
    width: calc(100% - 16px);
  }
}

/* 平板端优化 */
@media (min-width: 769px) and (max-width: 1024px) {
  .chat-container {
    padding: 16px;
  }
  
  .message-content {
    max-width: calc(100% - 72px);
  }
}
</style>