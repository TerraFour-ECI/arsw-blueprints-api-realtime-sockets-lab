import { io } from 'socket.io-client'

export function createSocket(baseUrl, token) {
  const socket = io(baseUrl, {
    transports: ['websocket'],
    auth: token ? { token: `Bearer ${token}` } : undefined,
  })
  return socket
}
