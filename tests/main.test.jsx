import { describe, test, expect, vi, beforeEach } from 'vitest'

const renderMock = vi.fn()
const createRootMock = vi.fn(() => ({ render: renderMock }))

vi.mock('react-dom/client', () => ({
  createRoot: createRootMock,
}))

vi.mock('../src/App.jsx', () => ({
  default: () => null,
}))

describe('main entrypoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = '<div id="root"></div>'
  })

  test('creates react root and renders app', async () => {
    await import('../src/main.jsx')

    expect(createRootMock).toHaveBeenCalledWith(document.getElementById('root'))
    expect(renderMock).toHaveBeenCalledTimes(1)
  })
})
