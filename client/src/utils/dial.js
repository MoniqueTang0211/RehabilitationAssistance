// 一键拨号封装（负责人：C）
// 用法：dial('120')；真机/手机模拟下触发系统拨号盘
export function dial(phoneNumber) {
  if (!phoneNumber) return
  window.location.href = `tel:${phoneNumber}`
}
