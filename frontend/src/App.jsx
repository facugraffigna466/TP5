import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function App() {
  const [tareas, setTareas] = useState([])
  const [nuevaTarea, setNuevaTarea] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'media',
    fecha_vencimiento: '',
    categoria: '',
    favorita: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filtros, setFiltros] = useState({
    estado: 'todas',
    prioridad: 'todas',
    mostrarVencidas: false,
    orden: 'recientes',
    q: '',
    soloFavoritas: false,
    categoria: 'todas'
  })

  const [resumen, setResumen] = useState({
    total: 0,
    pendientes: 0,
    completadas: 0,
    favoritas: 0,
    vencidas: 0,
    proximas: [],
    categorias: []
  })
  const [busqueda, setBusqueda] = useState('')

  const construirQuery = useCallback(() => {
    const params = new URLSearchParams()
    if (filtros.prioridad !== 'todas') {
      params.append('prioridad', filtros.prioridad)
    }
    if (filtros.estado !== 'todas') {
      params.append('estado', filtros.estado)
    }
    if (filtros.mostrarVencidas) {
      params.append('vencidas', 'true')
    }
    if (filtros.orden === 'vencimiento_asc') {
      params.append('orden', 'vencimiento_asc')
    } else if (filtros.orden === 'vencimiento_desc') {
      params.append('orden', 'vencimiento_desc')
    }
    if (filtros.q.trim()) {
      params.append('q', filtros.q.trim())
    }
    if (filtros.soloFavoritas) {
      params.append('favoritas', 'true')
    }
    if (filtros.categoria && filtros.categoria !== 'todas') {
      params.append('categoria', filtros.categoria)
    }

    const query = params.toString()
    return query ? `?${query}` : ''
  }, [filtros])

  const cargarTareas = useCallback(async () => {
    try {
      setLoading(true)
      const query = construirQuery()
      const response = await axios.get(`${API_URL}/api/tareas${query}`)
      setTareas(response.data || [])
      setError(null)
    } catch (err) {
      setError('Error al cargar las tareas')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [construirQuery])

  const cargarResumen = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/tareas/resumen`)
      const data = response.data || {}
      setResumen({
        total: data.total || 0,
        pendientes: data.pendientes || 0,
        completadas: data.completadas || 0,
        favoritas: data.favoritas || 0,
        vencidas: data.vencidas || 0,
        proximas: data.proximas || [],
        categorias: data.categorias || []
      })
    } catch (err) {
      console.error('Error al cargar el resumen', err)
    }
  }, [])

  const cargarTodo = useCallback(async () => {
    await Promise.all([cargarTareas(), cargarResumen()])
  }, [cargarTareas, cargarResumen])

  // Cargar tareas y resumen al iniciar o al cambiar filtros
  useEffect(() => {
    cargarTodo()
  }, [cargarTodo])

  const agregarTarea = async (e) => {
    e.preventDefault()
    if (!nuevaTarea.titulo.trim()) return

    try {
      setLoading(true)
      const payload = {
        titulo: nuevaTarea.titulo.trim(),
        descripcion: nuevaTarea.descripcion.trim(),
        prioridad: nuevaTarea.prioridad,
        categoria: nuevaTarea.categoria.trim() || null,
        fecha_vencimiento: nuevaTarea.fecha_vencimiento
          ? new Date(nuevaTarea.fecha_vencimiento).toISOString()
          : null,
        favorita: nuevaTarea.favorita
      }
      await axios.post(`${API_URL}/api/tareas`, payload)
      await cargarTodo()
      setNuevaTarea({
        titulo: '',
        descripcion: '',
        prioridad: 'media',
        fecha_vencimiento: '',
        categoria: '',
        favorita: false
      })
      setError(null)
    } catch (err) {
      setError('Error al crear la tarea')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleCompletada = async (id, completada) => {
    try {
      const tarea = tareas.find(t => t.id === id)
      await axios.put(`${API_URL}/api/tareas/${id}`, {
        titulo: tarea.titulo,
        descripcion: tarea.descripcion || '',
        completada: !completada,
        prioridad: tarea.prioridad,
        fecha_vencimiento: tarea.fecha_vencimiento,
        categoria: tarea.categoria,
        favorita: tarea.favorita === 1
      })
      await cargarTodo()
      setError(null)
    } catch (err) {
      setError('Error al actualizar la tarea')
      console.error(err)
    }
  }

  const eliminarTarea = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return

    try {
      await axios.delete(`${API_URL}/api/tareas/${id}`)
      setTareas(tareas.filter(t => t.id !== id))
      cargarResumen()
      setError(null)
    } catch (err) {
      setError('Error al eliminar la tarea')
      console.error(err)
    }
  }

  const toggleFavorita = async (id) => {
    try {
      const tarea = tareas.find(t => t.id === id)
      if (!tarea) return
      await axios.put(`${API_URL}/api/tareas/${id}`, {
        titulo: tarea.titulo,
        descripcion: tarea.descripcion || '',
        completada: tarea.completada === 1,
        prioridad: tarea.prioridad,
        fecha_vencimiento: tarea.fecha_vencimiento,
        categoria: tarea.categoria,
        favorita: tarea.favorita === 1 ? 0 : 1
      })
      await cargarTodo()
      setError(null)
    } catch (err) {
      setError('Error al actualizar la tarea')
      console.error(err)
    }
  }

  const tareasCompletadas = tareas.filter(t => t.completada === 1).length
  const tareasPendientes = tareas.filter(t => t.completada === 0).length
  const tareasVencidas = tareas.filter(t => {
    if (!t.fecha_vencimiento || t.completada === 1) return false
    const fecha = new Date(t.fecha_vencimiento)
    if (Number.isNaN(fecha.getTime())) return false
    return fecha < new Date()
  }).length

  const actualizarFiltro = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }))
  }

  const aplicarBusqueda = () => {
    actualizarFiltro('q', busqueda)
  }

  const limpiarBusqueda = () => {
    setBusqueda('')
    actualizarFiltro('q', '')
  }

  useEffect(() => {
    setBusqueda(filtros.q || '')
  }, [filtros.q])

  const prioridadBadge = (prioridad) => {
    switch (prioridad) {
      case 'alta':
        return 'badge-prioridad-alta'
      case 'baja':
        return 'badge-prioridad-baja'
      default:
        return 'badge-prioridad-media'
    }
  }

  const formatearFecha = (valor) => {
    if (!valor) return 'Sin vencimiento'
    const fecha = new Date(valor)
    if (Number.isNaN(fecha.getTime())) return 'Fecha desconocida'
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="app">
      <div className="container">
        <header>
          <h1>📋 Gestión de Tareas</h1>
          <p className="subtitle">Organiza tu día de forma eficiente</p>
        </header>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <div className="stats">
          <div className="stat-card">
            <span className="stat-number">{tareas.length}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{tareasPendientes}</span>
            <span className="stat-label">Pendientes</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{tareasCompletadas}</span>
            <span className="stat-label">Completadas</span>
          </div>
          <div className="stat-card stat-card-vencidas">
            <span className="stat-number">{tareasVencidas}</span>
            <span className="stat-label">Vencidas</span>
          </div>
        </div>

        <section className="resumen-dashboard">
          <div className="resumen-card">
            <h3>Resumen general</h3>
            <div className="resumen-grid">
              <div>
                <span className="dato">{resumen.total}</span>
                <span className="etiqueta">Registradas</span>
              </div>
              <div>
                <span className="dato">{resumen.pendientes}</span>
                <span className="etiqueta">Pendientes</span>
              </div>
              <div>
                <span className="dato">{resumen.completadas}</span>
                <span className="etiqueta">Completadas</span>
              </div>
              <div>
                <span className="dato">{resumen.favoritas}</span>
                <span className="etiqueta">Favoritas</span>
              </div>
              <div>
                <span className="dato">{resumen.vencidas}</span>
                <span className="etiqueta">Vencidas</span>
              </div>
            </div>
          </div>
          <div className="resumen-card">
            <h3>Próximos vencimientos</h3>
            {resumen.proximas.length === 0 ? (
              <p className="detalle">No hay vencimientos cercanos</p>
            ) : (
              <ul className="lista-compacta">
                {resumen.proximas.map((item) => (
                  <li key={item.id}>
                    <strong>{item.titulo}</strong>
                    <span>{formatearFecha(item.fecha_vencimiento)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="resumen-card">
            <h3>Top categorías</h3>
            {resumen.categorias.length === 0 ? (
              <p className="detalle">Sin categorías registradas</p>
            ) : (
              <ul className="lista-compacta">
                {resumen.categorias.map(({ categoria, cantidad }) => (
                  <li key={categoria}>
                    <strong>{categoria}</strong>
                    <span>{cantidad} tareas</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="filtros">
          <div className="filtro-group filtro-busqueda">
            <label htmlFor="filtroBusqueda">Buscar</label>
            <input
              id="filtroBusqueda"
              type="search"
              placeholder="Título o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  aplicarBusqueda()
                }
              }}
            />
          </div>

          <div className="filtro-group">
            <label htmlFor="filtroEstado">Estado</label>
            <select
              id="filtroEstado"
              value={filtros.estado}
              onChange={(e) => actualizarFiltro('estado', e.target.value)}
            >
              <option value="todas">Todas</option>
              <option value="pendientes">Pendientes</option>
              <option value="completadas">Completadas</option>
            </select>
          </div>

          <div className="filtro-group">
            <label htmlFor="filtroPrioridad">Prioridad</label>
            <select
              id="filtroPrioridad"
              value={filtros.prioridad}
              onChange={(e) => actualizarFiltro('prioridad', e.target.value)}
            >
              <option value="todas">Todas</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>

          <div className="filtro-group">
            <label htmlFor="filtroOrden">Orden</label>
            <select
              id="filtroOrden"
              value={filtros.orden}
              onChange={(e) => actualizarFiltro('orden', e.target.value)}
            >
              <option value="recientes">Más recientes</option>
              <option value="vencimiento_asc">Vencimiento ascendente</option>
              <option value="vencimiento_desc">Vencimiento descendente</option>
            </select>
          </div>

          <label className="toggle-vencidas">
            <input
              type="checkbox"
              checked={filtros.mostrarVencidas}
              onChange={(e) => actualizarFiltro('mostrarVencidas', e.target.checked)}
            />
            Mostrar solo vencidas
          </label>

          <label className="toggle-favoritas">
            <input
              type="checkbox"
              checked={filtros.soloFavoritas}
              onChange={(e) => actualizarFiltro('soloFavoritas', e.target.checked)}
            />
            Solo favoritas
          </label>

          <div className="filtro-group">
            <label htmlFor="filtroCategoria">Categoría</label>
            <input
              id="filtroCategoria"
              type="text"
              placeholder="Trabajo, Personal..."
              value={filtros.categoria === 'todas' ? '' : filtros.categoria}
              onChange={(e) => actualizarFiltro('categoria', e.target.value || 'todas')}
            />
          </div>
          <div className="filtro-acciones">
            <button type="button" className="btn-filtro" onClick={aplicarBusqueda}>
              Aplicar búsqueda
            </button>
            <button type="button" className="btn-filtro limpiar" onClick={limpiarBusqueda}>
              Limpiar
            </button>
          </div>
        </section>

        <form onSubmit={agregarTarea} className="form-nueva-tarea">
          <input
            type="text"
            placeholder="Título de la tarea..."
            value={nuevaTarea.titulo}
            onChange={(e) => setNuevaTarea({ ...nuevaTarea, titulo: e.target.value })}
            className="input-titulo"
          />
          <textarea
            placeholder="Descripción (opcional)..."
            value={nuevaTarea.descripcion}
            onChange={(e) => setNuevaTarea({ ...nuevaTarea, descripcion: e.target.value })}
            className="input-descripcion"
            rows="3"
          />
          <div className="form-grid">
            <div className="campo">
              <label htmlFor="prioridad">Prioridad</label>
              <select
                id="prioridad"
                value={nuevaTarea.prioridad}
                onChange={(e) => setNuevaTarea({ ...nuevaTarea, prioridad: e.target.value })}
              >
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
            <div className="campo">
              <label htmlFor="fechaVencimiento">Fecha de vencimiento</label>
              <input
                id="fechaVencimiento"
                type="date"
                value={nuevaTarea.fecha_vencimiento}
                onChange={(e) => setNuevaTarea({ ...nuevaTarea, fecha_vencimiento: e.target.value })}
              />
            </div>
            <div className="campo">
              <label htmlFor="categoria">Categoría</label>
              <input
                id="categoria"
                type="text"
                value={nuevaTarea.categoria}
                maxLength={30}
                placeholder="Trabajo, Personal..."
                onChange={(e) => setNuevaTarea({ ...nuevaTarea, categoria: e.target.value })}
              />
            </div>
            <div className="campo campo-favorita">
              <label htmlFor="favorita">
                <input
                  id="favorita"
                  type="checkbox"
                  checked={nuevaTarea.favorita}
                  onChange={(e) => setNuevaTarea({ ...nuevaTarea, favorita: e.target.checked })}
                />
                Marcar como favorita
              </label>
            </div>
          </div>
          <button type="submit" className="btn-agregar" disabled={loading}>
            {loading ? 'Agregando...' : '+ Agregar Tarea'}
          </button>
        </form>

        <div className="tareas-lista">
          {loading && tareas.length === 0 ? (
            <div className="loading">Cargando tareas...</div>
          ) : tareas.length === 0 ? (
            <div className="empty-state">
              <p>🎉 No hay tareas aún. ¡Agrega tu primera tarea!</p>
            </div>
          ) : (
            tareas.map(tarea => (
              <div
                key={tarea.id}
                className={`tarea-card ${tarea.completada === 1 ? 'completada' : ''}`}
              >
                <div className="tarea-content">
                  <input
                    type="checkbox"
                    checked={tarea.completada === 1}
                    onChange={() => toggleCompletada(tarea.id, tarea.completada)}
                    className="checkbox"
                  />
                  <div className="tarea-info">
                    <h3 className={tarea.completada === 1 ? 'tachado' : ''}>
                      {tarea.titulo}
                    </h3>
                    <div className="detalle-linea">
                      <button
                        type="button"
                        className={`badge badge-favorita ${tarea.favorita === 1 ? 'activa' : ''}`}
                        onClick={() => toggleFavorita(tarea.id)}
                        aria-label={tarea.favorita === 1 ? 'Quitar de favoritas' : 'Marcar como favorita'}
                      >
                        {tarea.favorita === 1 ? '★ Favorita' : '☆ Favorita'}
                      </button>
                      <button
                        type="button"
                        className={`badge badge-estado ${tarea.completada === 1 ? 'completa' : ''}`}
                        onClick={() => toggleCompletada(tarea.id, tarea.completada)}
                      >
                        {tarea.completada === 1 ? '✔ Completada' : '○ Pendiente'}
                      </button>
                      <span className={`badge ${prioridadBadge(tarea.prioridad)}`}>
                        Prioridad {tarea.prioridad}
                      </span>
                      <span className="badge badge-fecha">
                        {formatearFecha(tarea.fecha_vencimiento)}
                      </span>
                      {tarea.categoria && (
                        <span className="badge badge-categoria">
                          {tarea.categoria}
                        </span>
                      )}
                    </div>
                    {tarea.descripcion && (
                      <p className={tarea.completada === 1 ? 'tachado' : ''}>
                        {tarea.descripcion}
                      </p>
                    )}
                    <span className="fecha">
                      {new Date(tarea.fecha_creacion).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => eliminarTarea(tarea.id)}
                  className="btn-eliminar"
                  title="Eliminar tarea"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default App

