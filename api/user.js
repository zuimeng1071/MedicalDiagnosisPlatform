import { request, uploadFile } from '../utils/request'

export const userApi = {
  // 用户登录
  login: (data) => request({
    url: '/user/user/login',
    method: 'POST',
    data
  }),
  
  // 用户注册
  register: (data) => request({
    url: '/user/user/register',
    method: 'POST',
    data
  }),
  
  // 获取用户信息
  getUserInfo: () => request({
    url: '/user/user/getUserInfo',
    method: 'GET'
  }),
  
  // 更新用户信息
  updateUser: (data) => request({
    url: '/user/user/updateUser',
    method: 'POST',
    data
  }),
  
  // 退出登录
  logout: () => request({
    url: '/user/user/logout',
    method: 'GET'
  }),
  
  // 上传图片
  uploadImage: (filePath) => uploadFile('/user/common/upload/image', filePath)
}