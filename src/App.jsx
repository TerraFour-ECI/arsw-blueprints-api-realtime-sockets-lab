import { useEffect, useMemo, useRef, useState } from 'react'
import { createStompClient, subscribeBlueprint } from './lib/stompClient.js'
import { createSocket } from './lib/socketIoClient.js'
import { createBlueprintsApi, summarizePoints } from './services/blueprintsApi.js'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080'
const IO_BASE = import.meta.env.VITE_IO_BASE ?? 'http://localhost:3001'
const STOMP_BASE = import.meta.env.VITE_STOMP_BASE ?? 'http://localhost:8081'

const CANVAS_WIDTH = 920
const CANVAS_HEIGHT = 520

const BLUEPRINT_TECH = {
  none: 'none',
  socketio: 'socketio',
  stomp: 'stomp',
}

const pointKey = (point) => `${point.x}:${point.y}`

const mergePoints = (current, incoming) => {
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return current
  }

  const known = new Set(current.map(pointKey))
  const fresh = incoming.filter((point) => !known.has(pointKey(point)))

  if (fresh.length === 0) {
    return current
  }

  return [...current, ...fresh]
}

const drawBlueprint = (canvas, points) => {
  const ctx = canvas?.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  ctx.fillStyle = '#fdfcf8'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  ctx.save()
  ctx.strokeStyle = '#d4cdc0'
  ctx.lineWidth = 1
  for (let x = 0; x <= CANVAS_WIDTH; x += 40) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, CANVAS_HEIGHT)
    ctx.stroke()
  }
  for (let y = 0; y <= CANVAS_HEIGHT; y += 40) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(CANVAS_WIDTH, y)
    ctx.stroke()
  }
  ctx.restore()

  if (!points.length) return

  ctx.save()
  ctx.strokeStyle = '#0f766e'
  ctx.lineWidth = 2.5
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.beginPath()
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y)
    } else {
      ctx.lineTo(point.x, point.y)
    }
  })
  ctx.stroke()

  ctx.fillStyle = '#dc2626'
  points.forEach((point) => {
    ctx.beginPath()
    ctx.arc(point.x, point.y, 3.2, 0, 2 * Math.PI)
    ctx.fill()
  })
  ctx.restore()
}

export default function App() {
  const queryParams = new URLSearchParams(window.location.search)
  const initialAuthor = queryParams.get('author') || 'juan'
  const initialBlueprint = queryParams.get('name') || 'blueprint-1'
  const initialTech = queryParams.get('tech')
  const initialToken = queryParams.get('token')

  const [tech, setTech] = useState(BLUEPRINT_TECH.none)
  const [author, setAuthor] = useState(initialAuthor)
  const [nameInput, setNameInput] = useState(initialBlueprint)
  const [selectedName, setSelectedName] = useState('')
  const [points, setPoints] = useState([])
  const [persistedPointCount, setPersistedPointCount] = useState(0)
  const [blueprints, setBlueprints] = useState([])
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [isMutating, setIsMutating] = useState(false)
  const [isLoadingCanvas, setIsLoadingCanvas] = useState(false)
  const [message, setMessage] = useState('Ready to collaborate.')
  const [error, setError] = useState('')
  const [rtStatus, setRtStatus] = useState('Real-time disabled')

  const canvasRef = useRef(null)

  const stompRef = useRef(null)
  const unsubRef = useRef(null)
  const socketRef = useRef(null)
  const api = useMemo(() => createBlueprintsApi({ apiBase: API_BASE }), [])

  useEffect(() => {
    if (initialToken) {
      api.setToken(initialToken)
      setMessage('JWT token received from login app. Authenticated CRUD enabled.')
    }
  }, [api, initialToken])

  const activeBlueprintName = selectedName || nameInput.trim()
  const totalPointsByAuthor = summarizePoints(blueprints)

  const resetRealtime = () => {
    unsubRef.current?.()
    unsubRef.current = null
    stompRef.current?.deactivate?.()
    stompRef.current = null
    socketRef.current?.disconnect?.()
    socketRef.current = null
  }

  const loadBlueprintList = async () => {
    if (!author.trim()) return

    setIsLoadingList(true)
    setError('')
    try {
      const list = await api.listByAuthor(author.trim())
      setBlueprints(list)
    } catch (err) {
      const detail = err?.message || 'unknown error'
      const authHint = detail.includes('401')
        ? ' Open the app from 5173 after login so the JWT is passed to 5174.'
        : ''
      setError(`Could not load blueprints: ${detail}.${authHint}`)
      setBlueprints([])
    } finally {
      setIsLoadingList(false)
    }
  }

  const loadBlueprint = async (blueprintName) => {
    if (!author.trim() || !blueprintName.trim()) return

    setIsLoadingCanvas(true)
    setError('')
    try {
      const blueprint = await api.getByAuthorAndName(author.trim(), blueprintName.trim())
      setPoints(blueprint.points)
      setPersistedPointCount(blueprint.points.length)
      setSelectedName(blueprint.name)
      setNameInput(blueprint.name)
      setMessage(`Loaded ${blueprint.name} with ${blueprint.points.length} points.`)
    } catch (err) {
      setError(`Could not load blueprint: ${err.message}`)
      setPoints([])
    } finally {
      setIsLoadingCanvas(false)
    }
  }

  useEffect(() => {
    drawBlueprint(canvasRef.current, points)
  }, [points])

  useEffect(() => {
    drawBlueprint(canvasRef.current, [])
    if (!author.trim()) return

    setIsLoadingList(true)
    setError('')
    api
      .listByAuthor(author.trim())
      .then((list) => setBlueprints(list))
      .catch((err) => {
        setError(`Could not load blueprints: ${err.message}`)
        setBlueprints([])
      })
      .finally(() => setIsLoadingList(false))
  }, [author, api])

  useEffect(() => {
    resetRealtime()

    if (tech === BLUEPRINT_TECH.none) {
      setRtStatus('Real-time disabled')
      return undefined
    }

    if (!author.trim() || !activeBlueprintName) {
      setRtStatus('Select an author and blueprint to connect')
      return undefined
    }

    if (tech === BLUEPRINT_TECH.stomp) {
      const client = createStompClient(STOMP_BASE)
      stompRef.current = client
      setRtStatus('Connecting to STOMP...')

      client.onConnect = () => {
        setRtStatus(`Connected via STOMP to ${activeBlueprintName}`)
        unsubRef.current = subscribeBlueprint(client, author.trim(), activeBlueprintName, (update) => {
          setPoints((prev) => mergePoints(prev, update.points ?? []))
        })
      }

      client.onWebSocketClose = () => {
        setRtStatus('STOMP connection closed')
      }

      client.onStompError = (frame) => {
        setError(`STOMP error: ${frame.headers?.message ?? 'unknown error'}`)
      }

      client.activate()
    }

    if (tech === BLUEPRINT_TECH.socketio) {
      const socket = createSocket(IO_BASE)
      socketRef.current = socket
      const room = `blueprints.${author.trim()}.${activeBlueprintName}`
      setRtStatus('Connecting to Socket.IO...')

      socket.on('connect', () => {
        socket.emit('join-room', room)
        setRtStatus(`Connected via Socket.IO to ${activeBlueprintName}`)
      })

      socket.on('blueprint-update', (update) => {
        setPoints((prev) => mergePoints(prev, update.points ?? []))
      })

      socket.on('connect_error', (err) => {
        setError(`Socket.IO error: ${err.message}`)
      })
    }

    return () => {
      resetRealtime()
    }
  }, [tech, author, activeBlueprintName])

  const emitRealtimePoint = (point) => {
    if (!author.trim() || !activeBlueprintName) return

    if (tech === BLUEPRINT_TECH.stomp && stompRef.current?.connected) {
      stompRef.current.publish({
        destination: '/app/draw',
        body: JSON.stringify({ author: author.trim(), name: activeBlueprintName, point }),
      })
    }

    if (tech === BLUEPRINT_TECH.socketio && socketRef.current?.connected) {
      const room = `blueprints.${author.trim()}.${activeBlueprintName}`
      socketRef.current.emit('draw-event', { room, author: author.trim(), name: activeBlueprintName, point })
    }
  }

  const handleCanvasClick = (event) => {
    if (!activeBlueprintName) {
      setError('Select or create a blueprint before drawing.')
      return
    }

    setError('')
    const rect = event.target.getBoundingClientRect()
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height
    const point = {
      x: Math.round((event.clientX - rect.left) * scaleX),
      y: Math.round((event.clientY - rect.top) * scaleY),
    }

    setPoints((prev) => [...prev, point])
    emitRealtimePoint(point)
  }

  const handleCreate = async () => {
    const nextName = nameInput.trim()
    if (!author.trim() || !nextName) {
      setError('Author and blueprint name are required.')
      return
    }

    setIsMutating(true)
    setError('')
    try {
      await api.create({ author: author.trim(), name: nextName, points })
      setSelectedName(nextName)
      setPersistedPointCount(points.length)
      setMessage(`Blueprint ${nextName} created.`)
      await loadBlueprintList()
    } catch (err) {
      setError(`Create failed: ${err.message}`)
    } finally {
      setIsMutating(false)
    }
  }

  const handleSave = async () => {
    const targetName = activeBlueprintName
    if (!author.trim() || !targetName) {
      setError('Select a blueprint to save changes.')
      return
    }

    setIsMutating(true)
    setError('')
    try {
      const pendingPoints = points.slice(persistedPointCount)
      if (!pendingPoints.length) {
        setMessage('No new points to persist.')
        return
      }

      for (const point of pendingPoints) {
        await api.addPoint(author.trim(), targetName, point)
      }

      setPersistedPointCount(points.length)
      setMessage(`Blueprint ${targetName} updated with ${points.length} points.`)
      await loadBlueprintList()
    } catch (err) {
      setError(`Update failed: ${err.message}`)
    } finally {
      setIsMutating(false)
    }
  }

  const handleDelete = async () => {
    const targetName = activeBlueprintName
    if (!author.trim() || !targetName) {
      setError('Select a blueprint to delete.')
      return
    }

    setIsMutating(true)
    setError('')
    try {
      await api.remove(author.trim(), targetName)
      setPoints([])
      setSelectedName('')
      setMessage(`Blueprint ${targetName} deleted.`)
      await loadBlueprintList()
    } catch (err) {
      setError(`Delete failed: ${err.message}`)
    } finally {
      setIsMutating(false)
    }
  }

  const clearCanvas = () => {
    setPoints([])
    setMessage('Canvas cleared locally. Save to persist.')
  }

  const onNameInputBlur = () => {
    const normalizedName = nameInput.trim()
    if (normalizedName && normalizedName !== selectedName) {
      setSelectedName('')
    }
  }

  useEffect(() => {
    if (!initialTech) return

    if (Object.values(BLUEPRINT_TECH).includes(initialTech)) {
      setTech(initialTech)
      setMessage(`Initialized from login flow with ${initialTech} transport.`)
    }
  }, [initialTech])

  return (
    <div className="layout-shell">
      <header className="hero-card">
        <div>
          <p className="hero-kicker">Lab P4</p>
          <h1>Blueprints Real-Time Collaboration Studio</h1>
          <p className="hero-copy">
            One front-end for both transports: REST CRUD + Socket.IO + STOMP synchronization.
          </p>
        </div>
        <div className="status-wrap">
          <span className={`status-chip ${tech === BLUEPRINT_TECH.none ? 'muted' : 'live'}`}>{rtStatus}</span>
          <span className="status-chip neutral">{`Author total points: ${totalPointsByAuthor}`}</span>
        </div>
      </header>

      <section className="workspace-grid">
        <article className="panel control-panel">
          <h2>Control center</h2>

          <div className="field-grid two">
            <label>
              Author
              <input
                className="input"
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                placeholder="author"
              />
            </label>
            <label>
              Real-time transport
              <select
                className="input"
                value={tech}
                onChange={(event) => setTech(event.target.value)}
              >
                <option value={BLUEPRINT_TECH.none}>None (local editing)</option>
                <option value={BLUEPRINT_TECH.socketio}>Socket.IO (Node)</option>
                <option value={BLUEPRINT_TECH.stomp}>STOMP (Spring)</option>
              </select>
            </label>
          </div>

          <div className="field-grid two">
            <label>
              Blueprint name
              <input
                className="input"
                value={nameInput}
                onBlur={onNameInputBlur}
                onChange={(event) => setNameInput(event.target.value)}
                placeholder="blueprint-1"
              />
            </label>
            <label>
              Active blueprint
              <input className="input" readOnly value={activeBlueprintName || 'No blueprint selected'} />
            </label>
          </div>

          <div className="button-row">
            <button type="button" className="btn primary" onClick={loadBlueprintList} disabled={isLoadingList}>
              {isLoadingList ? 'Refreshing...' : 'Refresh list'}
            </button>
            <button type="button" className="btn" onClick={handleCreate} disabled={isMutating}>
              Create
            </button>
            <button type="button" className="btn" onClick={handleSave} disabled={isMutating}>
              Save/Update
            </button>
            <button type="button" className="btn danger" onClick={handleDelete} disabled={isMutating}>
              Delete
            </button>
            <button type="button" className="btn ghost" onClick={clearCanvas}>
              Clear canvas
            </button>
          </div>

          <div className="feedback-stack">
            {error ? <p className="feedback error">{error}</p> : <p className="feedback info">{message}</p>}
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Points</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {blueprints.length === 0 && (
                  <tr>
                    <td colSpan={3} className="empty-cell">
                      No blueprints found for this author.
                    </td>
                  </tr>
                )}
                {blueprints.map((blueprint) => {
                  const selected = blueprint.name === activeBlueprintName
                  return (
                    <tr key={blueprint.name} className={selected ? 'row-active' : ''}>
                      <td>{blueprint.name}</td>
                      <td>{blueprint.pointCount}</td>
                      <td>
                        <button
                          type="button"
                          className="btn tiny"
                          onClick={() => loadBlueprint(blueprint.name)}
                          disabled={isLoadingCanvas}
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel canvas-panel">
          <h2>Collaborative canvas</h2>
          <p className="canvas-helper">
            Click to draw points. Open the same author and blueprint in two tabs to verify live sync.
          </p>

          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="blueprint-canvas"
            onClick={handleCanvasClick}
          />

          <div className="canvas-stats">
            <span>{`Current points: ${points.length}`}</span>
            <span>{`Mode: ${tech === BLUEPRINT_TECH.none ? 'Local only' : 'Live collaboration'}`}</span>
          </div>
        </article>
      </section>
    </div>
  )
}
