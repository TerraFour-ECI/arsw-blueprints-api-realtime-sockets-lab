import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import App from '../src/App.jsx'

vi.mock('../src/lib/stompClient.js', () => ({
  createStompClient: () => ({
    activate: vi.fn(),
    deactivate: vi.fn(),
    publish: vi.fn(),
    connected: false,
  }),
  subscribeBlueprint: () => () => {},
}))

vi.mock('../src/lib/socketIoClient.js', () => ({
  createSocket: () => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
  }),
}))

vi.stubGlobal(
  'fetch',
  vi.fn(async (url) => {
    if (String(url).includes('/api/blueprints?author=')) {
      return {
        ok: true,
        text: async () => JSON.stringify([{ author: 'juan', name: 'blueprint-1', points: [] }]),
      }
    }

    return {
      ok: true,
      text: async () => JSON.stringify({ author: 'juan', name: 'blueprint-1', points: [] }),
    }
  }),
)

describe('App', () => {
  test('renders collaboration studio heading', async () => {
    render(React.createElement(App))
    expect(await screen.findByText(/Real-Time Collaboration Studio/i)).toBeDefined()
  })
})
