import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createBlueprintsApi, summarizePoints } from '../src/services/blueprintsApi'

describe('blueprintsApi', () => {
  let api
  
  beforeEach(() => {
    global.fetch = vi.fn()
    localStorage.clear()
    api = createBlueprintsApi({ apiBase: 'http://localhost:8080/' })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('setToken saves token', () => {
    api.setToken('test-token')
    expect(localStorage.getItem('rt.jwt')).toBe('test-token')
    api.setToken(null) // should do nothing
  })

  it('listByAuthor fetches and normalizes list', async () => {
    api.setToken('my-token')
    fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify([{ author: 'john', name: 'bp1', points: [{x:1, y:2}] }])
    })
    
    const result = await api.listByAuthor('john')
    expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/blueprints/john', expect.objectContaining({
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer my-token' }
    }))
    expect(result).toHaveLength(1)
    expect(result[0].author).toBe('john')
    expect(result[0].pointCount).toBe(1)
  })

  it('listByAuthor falls back to query param on error', async () => {
    api.setToken('my-token')
    // First call fails
    fetch.mockResolvedValueOnce({ ok: false, status: 404, text: async () => '{"message": "Not found"}' })
    // Second call succeeds
    fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify([{ author: 'john', name: 'bp2', points: [] }])
    })

    const result = await api.listByAuthor('john')
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch).toHaveBeenLastCalledWith('http://localhost:8080/api/blueprints?author=john', expect.any(Object))
    expect(result[0].name).toBe('bp2')
  })

  it('getByAuthorAndName normalizes blueprint details', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ author: 'A', name: 'N', points: [{ x: 10, y: 20 }] })
    })
    const bp = await api.getByAuthorAndName('A', 'N')
    expect(bp.author).toBe('A')
    expect(bp.points[0].x).toBe(10)
  })

  it('create sends POST request with body', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ code: 201, data: { author: 'X', name: 'Y', points: [] } })
    })
    const created = await api.create({ author: 'X', name: 'Y', points: null })
    expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/blueprints', expect.objectContaining({ method: 'POST' }))
    expect(created.author).toBe('X')
  })

  it('update removes point from list and calls addPoint', async () => {
    fetch.mockResolvedValueOnce({ ok: true, text: async () => '{}' }) // for addPoint
    const updated = await api.update('A', 'N', { author: 'A', name: 'N', points: [{x:1, y:2}] })
    expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/blueprints/A/N/points', expect.objectContaining({ method: 'PUT' }))
    expect(updated.points).toHaveLength(1)
  })
  
  it('update without points just returns blueprint', async () => {
    const updated = await api.update('A', 'N', { author: 'A', name: 'N', points: [] })
    expect(fetch).not.toHaveBeenCalled()
    expect(updated.points).toHaveLength(0)
  })

  it('remove sends DELETE request', async () => {
    fetch.mockResolvedValueOnce({ ok: true, text: async () => '{}' })
    await api.remove('A', 'N')
    expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/blueprints/A/N', expect.objectContaining({ method: 'DELETE' }))
  })

  it('requestJson throws on HTTP error', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 500, text: async () => '{"error": "Server error"}' })
    await expect(api.getByAuthorAndName('X', 'Y')).rejects.toThrow('Server error')
  })

  it('requestJson throws basic HTTP error if no detailed message', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 403, text: async () => '' })
    await expect(api.getByAuthorAndName('X', 'Y')).rejects.toThrow('HTTP 403')
  })
})

describe('summarizePoints', () => {
  it('adds up points', () => {
    expect(summarizePoints([
      { pointCount: 5 },
      { points: [1, 2] },
      { }
    ])).toBe(7)
  })
})