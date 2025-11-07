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
    categoria: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filtros, setFiltros] = useState({
    estado: 'todas',
    prioridad: 'todas',
    mostrarVencidas: false,
    orden: 'recientes'
  })

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

  // Cargar tareas al iniciar o al cambiar filtros
  useEffect(() => {
    cargarTareas()
  }, [cargarTareas])

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
          : null
      }
      await axios.post(`${API_URL}/api/tareas`, payload)
      await cargarTareas()
      setNuevaTarea({
        titulo: '',
        descripcion: '',
        prioridad: 'media',
        fecha_vencimiento: '',
        categoria: ''
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
        categoria: tarea.categoria
      })
      cargarTareas()
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
      setError(null)
    } catch (err) {
      setError('Error al eliminar la tarea')
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

        <section className="filtros">
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

