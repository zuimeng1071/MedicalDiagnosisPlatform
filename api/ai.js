import { uploadFile, request } from '../utils/request'

export const aiApi = {
  // 图像分类
  classify: (filePath) => uploadFile('/user/ai/classify', filePath),
  
  // 图像分割
  segment: (filePath) => uploadFile('/user/ai/segment', filePath),
  
  // AI诊断
  diagnosis: (filePath) => uploadFile('/user/ai/diagnosis', filePath),
  
  // 获取检测记录
  getDetectionRecords: (data) => request({
    url: '/user/ai/detectionRecodePageQuery',
    method: 'POST',
    data
  }),
  
  // 获取检测记录详情
  getDetectionRecordDetail: (id) => request({
    url: `/user/ai/detectionRecodeDetail/${id}`,
    method: 'GET'
  }),

  // 聊天
  chat(memoryId, question) {
    return request({
      url: '/user/ai/chat',
      method: 'POST',
      data: {
            memoryId: memoryId,
            question: question
          },
		headers: {
            'Content-Type': 'application/json'
          }
    })
  },

  // 获取聊天记录列表
  chatRecodePageQuery(params) {
    return request({
      url: '/user/ai/chatRecodePageQuery',
      method: 'POST',
      data: params
    })
  },

  // 获取聊天记录详情
  chatRecodeDetail(memoryId) {
    return request({
      url: `/user/ai/chatRecodeDetail/${memoryId}`,
      method: 'GET'
    })
  }
}