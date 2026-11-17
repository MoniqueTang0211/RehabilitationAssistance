// 轻量提示封装（负责人：A）：全局单例 toast，jQuery 淡入淡出
// 用法：import { showToast } from '../utils/toast'
import $ from 'jquery'

let $toast = null
let timer = null

export function showToast(message, duration = 2000) {
  if (!$toast) {
    $toast = $('<div class="app-toast"></div>').appendTo('body')
  }
  $toast.text(message).stop().fadeIn(150)
  clearTimeout(timer)
  timer = setTimeout(() => $toast.stop().fadeOut(200), duration)
}
