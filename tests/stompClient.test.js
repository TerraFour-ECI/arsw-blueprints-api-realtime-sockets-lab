import { describe, it, expect, vi } from 'vitest'
import { createStompClient } from '../src/lib/stompClient'
import { Client } from '@stomp/stompjs'

vi.mock('@stomp/stompjs', () => {
  const ClientMock = vi.fn().mockImplementation(function (config) {
    this.brokerURL = config.brokerURL
    this.connectHeaders = config.connectHeaders
    this.reconnectDelay = config.reconnectDelay
    this.heartbeatIncoming = config.heartbeatIncoming
    this.heartbeatOutgoing = config.heartbeatOutgoing
    this.onConnect = config.onConnect
    this.onStompError = config.onStompError
    this.activate = vi.fn()
  })
  return { Client: ClientMock }
})

describe('stompClient', () => {
  it('creates stomp client with expected config', () => {
    const client = createStompClient('ws://localhost', 'my-token')
    
    expect(Client).toHaveBeenCalled()
    expect(client.connectHeaders).toEqual({ Authorization: 'Bearer my-token' })
    expect(client.brokerURL).toBe('ws://localhost/ws-blueprints')
    expect(client.reconnectDelay).toBe(1000)
  })
})