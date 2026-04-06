const normalizeEnvelope = (payload) => {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    ('code' in payload || 'status' in payload)
  ) {
    return payload.data
  }
  return payload
}

const ensurePoints = (value) => {
  if (!Array.isArray(value)) return []
  return value
    .map((p) => ({ x: Number(p?.x), y: Number(p?.y) }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
}

const normalizeBlueprint = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return { author: '', name: '', points: [] }
  }

  return {
    author: String(payload.author ?? ''),
    name: String(payload.name ?? payload.bpname ?? ''),
    points: ensurePoints(payload.points ?? payload.pts),
  }
}

const normalizeBlueprintList = (payload) => {
  const source = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.blueprints)
      ? payload.blueprints
      : Array.isArray(payload?.items)
        ? payload.items
        : []

  return source.map((item) => {
    const bp = normalizeBlueprint(item)
    return {
      author: bp.author,
      name: bp.name,
      points: bp.points,
      pointCount:
        Number(item?.pointCount ?? item?.pointsCount ?? item?.totalPoints) || bp.points.length,
    }
  })
}

const requestJson = async (url, init) => {
  const { headers: inputHeaders = {}, ...restInit } = init || {}

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...inputHeaders,
    },
    ...restInit,
  })

  const rawText = await response.text()
  const body = rawText ? JSON.parse(rawText) : null

  if (!response.ok) {
    const detail = body?.message || body?.error || `HTTP ${response.status}`
    throw new Error(detail)
  }

  return normalizeEnvelope(body)
}

const pathWithApi = (baseUrl, suffix) => `${baseUrl.replace(/\/$/, '')}/api${suffix}`

export const createBlueprintsApi = ({ apiBase }) => {
  const TOKEN_KEY = 'rt.jwt'
  const base = apiBase.replace(/\/$/, '')

  const getAuthHeaders = () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return {}
    return { Authorization: `Bearer ${token}` }
  }

  return {
    setToken(token) {
      if (!token) return
      localStorage.setItem(TOKEN_KEY, token)
    },

    async listByAuthor(author) {
      const encodedAuthor = encodeURIComponent(author)

      try {
        const payload = await requestJson(pathWithApi(base, `/blueprints/${encodedAuthor}`), {
          headers: getAuthHeaders(),
        })
        return normalizeBlueprintList(payload)
      } catch {
        const payload = await requestJson(pathWithApi(base, `/blueprints?author=${encodedAuthor}`), {
          headers: getAuthHeaders(),
        })
        return normalizeBlueprintList(payload)
      }
    },

    async getByAuthorAndName(author, name) {
      const payload = await requestJson(
        pathWithApi(base, `/blueprints/${encodeURIComponent(author)}/${encodeURIComponent(name)}`),
        { headers: getAuthHeaders() },
      )
      return normalizeBlueprint(payload)
    },

    async create(blueprint) {
      const payload = await requestJson(pathWithApi(base, '/blueprints'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          author: blueprint.author,
          name: blueprint.name,
          points: ensurePoints(blueprint.points),
        }),
      })
      return normalizeBlueprint(payload)
    },

    async update(author, name, blueprint) {
      const payload = await requestJson(
        pathWithApi(base, `/blueprints/${encodeURIComponent(author)}/${encodeURIComponent(name)}`),
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            author: blueprint.author,
            name: blueprint.name,
            points: ensurePoints(blueprint.points),
          }),
        },
      )
      return normalizeBlueprint(payload)
    },

    async remove(author, name) {
      await requestJson(
        pathWithApi(base, `/blueprints/${encodeURIComponent(author)}/${encodeURIComponent(name)}`),
        { method: 'DELETE', headers: getAuthHeaders() },
      )
    },
  }
}

export const summarizePoints = (blueprints) =>
  blueprints.reduce((total, bp) => total + Number(bp.pointCount ?? bp.points?.length ?? 0), 0)
