// 一键拨号封装（负责人：C）
// 用法：dial('120')；真机/手机模拟下触发系统拨号盘
export function dial(phoneNumber) {
  if (typeof phoneNumber !== 'string' || !phoneNumber.trim()) {
    throw new Error('紧急求助电话尚未配置')
  }

  const phone = phoneNumber.trim()
  if (!/^\+?[0-9\s()-]{3,20}$/.test(phone)) {
    throw new Error('紧急求助电话号码格式不正确')
  }

  const normalizedPhone = phone.replace(/[\s()-]/g, '')
  window.location.href = `tel:${normalizedPhone}`
}
