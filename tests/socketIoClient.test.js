import { describe, it, expect, vi } from 'vitest'
import { createSocket } from '../src/lib/socketIoClient'

vi.mock('socket.io-client', () => ({
  io: vi.fn((url, options) => ({ url, options })),
}))

import { io } from 'socket.io-client'

describe('socketIoClient', () => {
  it('creates an io instance with correct params', () => {
    createSocket('http://localhost', 'my-token')
    expect(io).toHaveBeenCalledWith('http://localhost', {
      transports: ['websocket'],
      auth: { token: 'Bearer my-token' },
    })
  })
})