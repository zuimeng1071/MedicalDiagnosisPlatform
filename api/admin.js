import { request } from '../utils/request'

export const adminApi = {
  // 管理员登录
  login: (data) => request({
    url: '/admin/admin/login',
    method: 'POST',
    data
  }),
  
  // 管理员注册
  register: (data) => request({
    url: '/admin/admin/register',
    method: 'POST',
    data
  }),
  
  // 退出登录
  logout: () => request({
    url: '/admin/admin/logout',
    method: 'GET'
  }),
  
  // 查询用户
  queryUser: (data) => request({
    url: '/admin/admin/queryUser',
    method: 'POST',
    data
  }),
  
  // 删除用户
  deleteUser: (id) => request({
    url: `/admin/admin/deleteUser/${id}`,
    method: 'GET'
  }),
  
  // 诊断统计
  diagnosisStatistics: (startTime, endTime) => request({
    url: `/admin/statistics/diagnosisStatistics?startTime=${startTime}&endTime=${endTime}`,
    method: 'GET'
  }),
  
  // 分类统计
  classifyStatistics: (startTime, endTime) => request({
    url: `/admin/statistics/classifyStatistics?startTime=${startTime}&endTime=${endTime}`,
    method: 'GET'
  }),
  
  // 聊天统计
  chatStatistics: (startTime, endTime) => request({
    url: `/admin/statistics/chatStatistics?startTime=${startTime}&endTime=${endTime}`,
    method: 'GET'
  })
}