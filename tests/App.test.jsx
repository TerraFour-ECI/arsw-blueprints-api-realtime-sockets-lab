import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import * as stompLib from '../src/lib/stompClient.js'
import * as socketLib from '../src/lib/socketIoClient.js'

const mockUnsubscribe = vi.fn()
const mockSubscribeBlueprint = vi.fn(() => mockUnsubscribe)

const mockStompClient = {
  activate: vi.fn(function activate() {
    this.connected = true
    this.onConnect?.()
  }),
  deactivate: vi.fn(),
  publish: vi.fn(),
  subscribe: vi.fn(),
  connected: true,
  onConnect: undefined,
  onWebSocketClose: undefined,
  onStompError: undefined,
}

const socketHandlers = {}
const mockSocketClient = {
  on: vi.fn((event, cb) => {
    socketHandlers[event] = cb
  }),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connected: true,
}

vi.mock('../src/lib/stompClient.js', () => ({
  createStompClient: vi.fn(() => mockStompClient),
  subscribeBlueprint: vi.fn((...args) => mockSubscribeBlueprint(...args)),
}))

vi.mock('../src/lib/socketIoClient.js', () => ({
  createSocket: vi.fn(() => mockSocketClient),
}))

const asTextResponse = (payload, ok = true, status = 200) => ({
  ok,
  status,
  text: async () => JSON.stringify(payload),
})

describe('App component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('rt.jwt', 'fake-jwt-token')

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, init = {}) => {
        const method = init.method || 'GET'
        const urlStr = String(url)

        if (
          method === 'GET' &&
          (urlStr.includes('/api/blueprints/john/mybp') || urlStr.includes('/api/blueprints/juan/mybp'))
        ) {
          return asTextResponse({ author: 'john', name: 'mybp', points: [{ x: 10, y: 10 }] })
        }

        if (method === 'GET' && (urlStr.includes('/api/blueprints/john') || urlStr.includes('/api/blueprints/juan'))) {
          return asTextResponse([{ author: 'john', name: 'mybp', points: [] }])
        }

        if (method === 'POST' && urlStr.includes('/api/blueprints')) {
          const body = JSON.parse(init.body)
          return asTextResponse(body)
        }

        if (method === 'PUT' && urlStr.includes('/points')) {
          return asTextResponse({ ok: true })
        }

        if (method === 'DELETE' && urlStr.includes('/api/blueprints/')) {
          return asTextResponse({ ok: true })
        }

        return asTextResponse([])
      }),
    )
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  test('renders app and loads author blueprint list', async () => {
    render(<App />)

    expect(screen.getByText(/Blueprints Real-Time Collaboration Studio/i)).toBeTruthy()

    await waitFor(() => {
      expect(screen.getAllByText('mybp').length).toBeGreaterThan(0)
    })
  })

  test('refresh list for another author', async () => {
    render(<App />)

    fireEvent.change(screen.getByPlaceholderText('author'), { target: { value: 'john' } })
    fireEvent.click(screen.getByRole('button', { name: /Refresh/i }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/blueprints/john'), expect.any(Object))
    })
  })

  test('open blueprint and draw with STOMP', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getAllByText('mybp').length).toBeGreaterThan(0)
    })

    fireEvent.click(screen.getAllByRole('button', { name: /Open/i })[0])
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'stomp' } })

    expect(stompLib.createStompClient).toHaveBeenCalled()
    expect(mockStompClient.activate).toHaveBeenCalled()

    await waitFor(() => {
      expect(stompLib.subscribeBlueprint).toHaveBeenCalled()
    })

    const canvas = document.querySelector('canvas')
    fireEvent.click(canvas, { clientX: 100, clientY: 100 })

    await waitFor(() => {
      expect(mockStompClient.publish).toHaveBeenCalled()
    })
  })

  test('open blueprint and draw with Socket.IO', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getAllByText('mybp').length).toBeGreaterThan(0)
    })

    fireEvent.click(screen.getAllByRole('button', { name: /Open/i })[0])
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'socketio' } })

    expect(socketLib.createSocket).toHaveBeenCalled()

    socketHandlers.connect?.()

    const canvas = document.querySelector('canvas')
    fireEvent.click(canvas, { clientX: 150, clientY: 160 })

    await waitFor(() => {
      expect(mockSocketClient.emit).toHaveBeenCalledWith(
        'draw-event',
        expect.objectContaining({
          author: expect.any(String),
          name: expect.any(String),
          point: expect.any(Object),
        }),
      )
    })
  })

  test('create, save and delete actions call API endpoints', async () => {
    render(<App />)

    fireEvent.change(screen.getByPlaceholderText('author'), { target: { value: 'john' } })
    fireEvent.change(screen.getByPlaceholderText('blueprint-1'), { target: { value: 'mybp' } })

    fireEvent.click(screen.getByRole('button', { name: /^Create$/i }))
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/blueprints'),
        expect.objectContaining({ method: 'POST' }),
      )
    })

    fireEvent.click(screen.getByRole('button', { name: /Save\/Update/i }))

    fireEvent.click(screen.getByRole('button', { name: /^Delete$/i }))
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/blueprints/john/mybp'),
        expect.objectContaining({ method: 'DELETE' }),
      )
    })
  })
})
