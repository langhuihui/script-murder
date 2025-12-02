/**
 * 端口配置工具函数
 * 现在 WebSocket 和 HTTP 共用同一个端口
 */
export function getPortConfig() {
  const PORT = parseInt(process.env.PORT || process.env.WS_PORT || process.env.HTTP_PORT || '4000', 10);
  return { PORT };
}

