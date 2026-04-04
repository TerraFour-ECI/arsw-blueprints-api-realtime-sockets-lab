import { vi } from 'vitest'

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    set lineWidth(_) {},
    set lineJoin(_) {},
    set lineCap(_) {},
    set strokeStyle(_) {},
    set fillStyle(_) {},
  })),
})
