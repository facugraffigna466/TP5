import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

// Importar después de configurar el mock
// eslint-disable-next-line import/first
import App from '../App'
// eslint-disable-next-line import/first
import axios from 'axios'

const mockAxios = axios
let consoleErrorSpy
const resumenVacio = {
  total: 0,
  pendientes: 0,
  completadas: 0,
  favoritas: 0,
  vencidas: 0,
  proximas: [],
  categorias: []
}

const prepararGet = ({ tareasSecuencia = [], resumenSecuencia = [] } = {}) => {
  const colaTareas = [...tareasSecuencia]
  const colaResumen = [...resumenSecuencia]

  mockAxios.get.mockImplementation((url) => {
    if (typeof url === 'string' && url.includes('/resumen')) {
      if (colaResumen.length > 0) {
        const siguienteResumen = colaResumen.shift()
        return Promise.resolve({ data: siguienteResumen })
      }
      return Promise.resolve({ data: resumenVacio })
    }

    if (colaTareas.length > 0) {
      const siguiente = colaTareas.shift()
      return Promise.resolve({ data: siguiente })
    }

    return Promise.resolve({ data: [] })
  })
}

const obtenerUltimaLlamadaListado = () => {
  const llamadasTareas = mockAxios.get.mock.calls
    .map(([url]) => url)
    .filter((url) => typeof url === 'string' && url.includes('/api/tareas') && !url.includes('/resumen'))
  return llamadasTareas[llamadasTareas.length - 1] || ''
}

beforeAll(() => {
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

beforeEach(() => {
  vi.clearAllMocks()
  consoleErrorSpy.mockClear()
})

afterAll(() => {
  consoleErrorSpy.mockRestore()
})

describe('App - Gestión de Tareas', () => {
  beforeEach(() => {
    mockAxios.get.mockReset()
    mockAxios.post.mockReset()
    mockAxios.put.mockReset()
    mockAxios.delete.mockReset()
    prepararGet()
  })

  const renderApp = () => render(<App />)

  it('muestra tareas y métricas luego de cargar datos', async () => {
    const tareas = [
      {
        id: 1,
        titulo: 'Tarea pendiente',
        descripcion: 'Descripción 1',
        completada: 0,
        prioridad: 'alta',
        categoria: 'Trabajo',
        fecha_creacion: new Date().toISOString(),
        fecha_vencimiento: new Date(Date.now() + 3600 * 1000).toISOString()
      },
      {
        id: 2,
        titulo: 'Tarea hecha',
        descripcion: 'Descripción 2',
        completada: 1,
        prioridad: 'baja',
        categoria: null,
        fecha_creacion: new Date().toISOString(),
        fecha_vencimiento: null
      }
    ]

    prepararGet({ tareasSecuencia: [tareas] })

    renderApp()

    expect(await screen.findByText('Tarea pendiente')).toBeInTheDocument()
    expect(screen.getByText('Tarea hecha')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getAllByText('2')[0]).toBeInTheDocument()
    expect(screen.getByText('Pendientes', { selector: 'span.stat-label' })).toBeInTheDocument()
    expect(screen.getAllByText('1')[0]).toBeInTheDocument()
    expect(screen.getByText('Completadas', { selector: 'span.stat-label' })).toBeInTheDocument()
    expect(screen.getAllByText('1')[1]).toBeInTheDocument()
  })

  it('muestra mensaje de error cuando falla la carga inicial', async () => {
    mockAxios.get.mockRejectedValueOnce(new Error('Falla de red'))

    renderApp()

    expect(await screen.findByText(/Error al cargar las tareas/)).toBeInTheDocument()
  })

  it('permite crear una tarea y refresca la lista', async () => {
    const user = userEvent.setup({ delay: null })

    prepararGet({
      tareasSecuencia: [
        [],
        [
          {
            id: 3,
            titulo: 'Nueva tarea',
            descripcion: 'Algo',
            completada: 0,
            prioridad: 'media',
            categoria: null,
            fecha_creacion: new Date().toISOString(),
            fecha_vencimiento: null,
            favorita: 0
          }
        ]
      ]
    })

    mockAxios.post.mockResolvedValueOnce({ data: {} })

    renderApp()

    await waitFor(() => expect(mockAxios.get).toHaveBeenCalledTimes(2))

    await user.type(screen.getByPlaceholderText('Título de la tarea...'), 'Nueva tarea')
    await user.type(screen.getByPlaceholderText('Descripción (opcional)...'), 'Algo')
    await user.selectOptions(screen.getByLabelText('Prioridad', { selector: '#prioridad' }), 'media')
    const botonAgregar = await screen.findByRole('button', { name: /\+ Agregar Tarea/i })
    await user.click(botonAgregar)

    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledTimes(1)
      expect(mockAxios.get).toHaveBeenCalledTimes(4)
    })

    expect(await screen.findByText('Nueva tarea')).toBeInTheDocument()
  })

  it('notifica error cuando la creación falla', async () => {
    const user = userEvent.setup({ delay: null })

    mockAxios.post.mockRejectedValueOnce(new Error('Error creación'))

    renderApp()

    await waitFor(() => expect(mockAxios.get).toHaveBeenCalled())

    await user.type(screen.getByPlaceholderText('Título de la tarea...'), 'Fallida')
    const botonAgregar = await screen.findByRole('button', { name: /\+ Agregar Tarea/i })
    await user.click(botonAgregar)

    expect(await screen.findByText(/Error al crear la tarea/)).toBeInTheDocument()
  })

  it('aplica filtros solicitando nuevamente los datos con query params', async () => {
    const user = userEvent.setup({ delay: null })

    renderApp()

    await waitFor(() => expect(obtenerUltimaLlamadaListado()).toContain('/api/tareas'))

    await user.selectOptions(screen.getByLabelText('Prioridad', { selector: '#filtroPrioridad' }), 'alta')

    await waitFor(() => expect(obtenerUltimaLlamadaListado()).toContain('prioridad=alta'))

    await user.selectOptions(screen.getByLabelText('Estado', { selector: '#filtroEstado' }), 'completadas')
    await waitFor(() => expect(obtenerUltimaLlamadaListado()).toContain('estado=completadas'))

    await user.click(screen.getByLabelText('Mostrar solo vencidas'))
    await waitFor(() => expect(obtenerUltimaLlamadaListado()).toContain('vencidas=true'))

    await user.click(screen.getByLabelText('Solo favoritas'))
    await waitFor(() => expect(obtenerUltimaLlamadaListado()).toContain('favoritas=true'))
  })

  it('actualiza una tarea al alternar el checkbox de completada', async () => {
    const user = userEvent.setup({ delay: null })

    const tarea = {
      id: 99,
      titulo: 'Completar',
      descripcion: '',
      completada: 0,
      prioridad: 'alta',
      categoria: null,
      fecha_creacion: new Date().toISOString(),
      fecha_vencimiento: new Date(Date.now() + 3600 * 1000).toISOString(),
      favorita: 0
    }

    prepararGet({
      tareasSecuencia: [
        [tarea],
        [{ ...tarea, completada: 1 }]
      ]
    })

    mockAxios.put.mockResolvedValue({ data: { message: 'ok' } })

    renderApp()

    const tarjeta = (await screen.findByText('Completar')).closest('.tarea-card')
    expect(tarjeta).not.toBeNull()
    const checkbox = within(tarjeta).getByRole('checkbox')
    await user.click(checkbox)

    await waitFor(() => expect(mockAxios.put).toHaveBeenCalled())
    await waitFor(() => expect(mockAxios.get).toHaveBeenCalledTimes(4))

    const [, payload] = mockAxios.put.mock.calls.at(-1)
    expect(payload.completada).toBe(true)
    expect(payload.prioridad).toBe('alta')
    expect(payload.favorita).toBe(tarea.favorita === 1)
  })

  it('elimina una tarea después de confirmarlo', async () => {
    const user = userEvent.setup({ delay: null })
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    const tarea = {
      id: 55,
      titulo: 'Eliminar',
      descripcion: '',
      completada: 0,
      prioridad: 'media',
      categoria: null,
      fecha_creacion: new Date().toISOString(),
      fecha_vencimiento: null,
      favorita: 0
    }

    prepararGet({ tareasSecuencia: [[tarea]] })
    mockAxios.delete.mockResolvedValueOnce({ data: { message: 'ok' } })

    renderApp()

    const eliminarBtn = await screen.findByTitle('Eliminar tarea')
    expect(eliminarBtn).toBeInTheDocument()

    await user.click(eliminarBtn)

    await waitFor(() => {
      expect(mockAxios.delete).toHaveBeenCalled()
      const [url] = mockAxios.delete.mock.calls.at(-1)
      expect(url).toContain(`/api/tareas/${tarea.id}`)
    })

    expect(screen.queryByTitle('Eliminar tarea')).not.toBeInTheDocument()
    confirmSpy.mockRestore()
  })

  it('no envía el formulario si el título está vacío', async () => {
    const user = userEvent.setup({ delay: null })

    renderApp()

    await waitFor(() => expect(mockAxios.get).toHaveBeenCalledTimes(2))

    const botonAgregar = await screen.findByRole('button', { name: /\+ Agregar Tarea/i })
    await user.click(botonAgregar)

    expect(mockAxios.post).not.toHaveBeenCalled()
  })

  it('restablece el formulario tras crear una tarea', async () => {
    const user = userEvent.setup({ delay: null })

    prepararGet({
      tareasSecuencia: [
        [],
        []
      ]
    })

    mockAxios.post.mockResolvedValueOnce({ data: {} })

    renderApp()

    const tituloInput = screen.getByPlaceholderText('Título de la tarea...')
    const descripcionInput = screen.getByPlaceholderText('Descripción (opcional)...')
    const categoriaInput = screen.getAllByLabelText('Categoría').find((node) => node.id === 'categoria')
    const favoritaCheckbox = screen.getByLabelText(/Marcar como favorita/i)

    await user.type(tituloInput, 'Reset')
    await user.type(descripcionInput, 'Contenido')
    await user.type(categoriaInput, 'Trabajo')
    await user.selectOptions(screen.getByLabelText('Prioridad', { selector: '#prioridad' }), 'alta')
    await user.click(favoritaCheckbox)

    const botonAgregar = await screen.findByRole('button', { name: /\+ Agregar Tarea/i })
    await user.click(botonAgregar)

    await waitFor(() => expect(mockAxios.post).toHaveBeenCalled())

    expect(tituloInput).toHaveValue('')
    expect(descripcionInput).toHaveValue('')
    expect(categoriaInput).toHaveValue('')
    expect(screen.getByLabelText('Prioridad', { selector: '#prioridad' })).toHaveValue('media')
    expect(screen.getByLabelText(/Marcar como favorita/i)).not.toBeChecked()
  })

  it('muestra badges de prioridad, vencimiento y categoría en la tarjeta', async () => {
    const tareas = [
      {
        id: 10,
        titulo: 'Con badge',
        descripcion: 'Detalle',
        completada: 0,
        prioridad: 'alta',
        categoria: 'Estudios',
        fecha_creacion: new Date().toISOString(),
        fecha_vencimiento: null,
        favorita: 1
      }
    ]

    prepararGet({ tareasSecuencia: [tareas] })

    renderApp()

    const tarjeta = await screen.findByText('Con badge')
    const contenedor = tarjeta.closest('.tarea-card')
    expect(contenedor).not.toBeNull()
    expect(within(contenedor).getByText(/Prioridad\s+alta/i)).toBeInTheDocument()
    expect(within(contenedor).getByText('Estudios')).toBeInTheDocument()
    expect(within(contenedor).getByText('Sin vencimiento')).toBeInTheDocument()
    expect(within(contenedor).getByText('★ Favorita')).toBeInTheDocument()
  })

  it('no elimina la tarea si el usuario cancela la confirmación', async () => {
    const user = userEvent.setup({ delay: null })
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

    const tarea = {
      id: 77,
      titulo: 'Cancelar eliminación',
      descripcion: '',
      completada: 0,
      prioridad: 'baja',
      categoria: null,
      fecha_creacion: new Date().toISOString(),
      fecha_vencimiento: null,
      favorita: 0
    }

    prepararGet({ tareasSecuencia: [[tarea]] })

    renderApp()

    const eliminarBtn = await screen.findByTitle('Eliminar tarea')
    await user.click(eliminarBtn)

    expect(mockAxios.delete).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })

  it('muestra un mensaje de error cuando falla el toggle de completada', async () => {
    const user = userEvent.setup({ delay: null })
    const tarea = {
      id: 300,
      titulo: 'Toggle falla',
      descripcion: '',
      completada: 0,
      prioridad: 'media',
      categoria: null,
      fecha_creacion: new Date().toISOString(),
      fecha_vencimiento: new Date(Date.now() + 3600 * 1000).toISOString(),
      favorita: 0
    }

    prepararGet({
      tareasSecuencia: [
        [tarea],
        [tarea]
      ]
    })

    mockAxios.put.mockRejectedValueOnce(new Error('fallo toggle'))

    renderApp()

    const tarjeta = (await screen.findByText('Toggle falla')).closest('.tarea-card')
    expect(tarjeta).not.toBeNull()
    const checkbox = within(tarjeta).getByRole('checkbox')
    await user.click(checkbox)

    await waitFor(() => expect(mockAxios.put).toHaveBeenCalled())
    expect(await screen.findByText(/Error al actualizar la tarea/)).toBeInTheDocument()
  })

  it('deshabilita el botón mientras se envía una nueva tarea', async () => {
    const user = userEvent.setup({ delay: null })
    let resolver

    prepararGet({ tareasSecuencia: [[]] })
    mockAxios.post.mockImplementation(() => new Promise((resolve) => {
      resolver = resolve
    }))

    renderApp()

    await waitFor(() => expect(mockAxios.get).toHaveBeenCalled())

    const boton = await screen.findByRole('button', { name: /\+ Agregar Tarea/i })
    await user.type(screen.getByPlaceholderText('Título de la tarea...'), 'Loading test')
    await user.click(boton)

    expect(boton).toBeDisabled()

    resolver({ data: {} })

    await waitFor(() => expect(boton).not.toBeDisabled())
  })

  it('renderiza datos del resumen incluyendo próximas tareas y categorías', async () => {
    const resumenData = {
      total: 4,
      pendientes: 2,
      completadas: 2,
      favoritas: 1,
      vencidas: 1,
      proximas: [
        { id: 1, titulo: 'Revisión final', fecha_vencimiento: new Date(Date.now() + 7200 * 1000).toISOString(), prioridad: 'alta', categoria: 'Trabajo' }
      ],
      categorias: [
        { categoria: 'Trabajo', cantidad: 3 },
        { categoria: 'Personal', cantidad: 1 }
      ]
    }

    prepararGet({
      tareasSecuencia: [[]],
      resumenSecuencia: [resumenData]
    })

    renderApp()

    expect(await screen.findByText('Revisión final')).toBeInTheDocument()
    expect(screen.getByText('Trabajo')).toBeInTheDocument()
    expect(screen.getByText('3 tareas')).toBeInTheDocument()
    expect(screen.getByText(resumenData.total.toString())).toBeInTheDocument()
  })

  it('permite buscar y filtrar por favoritas', async () => {
    const user = userEvent.setup({ delay: null })
    const tareas = [
      { id: 1, titulo: 'Reunión semanal', descripcion: 'Preparar reportes', completada: 0, prioridad: 'media', categoria: 'Trabajo', fecha_creacion: new Date().toISOString(), fecha_vencimiento: null, favorita: 1 },
      { id: 2, titulo: 'Compra supermercado', descripcion: 'Frutas y verduras', completada: 0, prioridad: 'baja', categoria: 'Personal', fecha_creacion: new Date().toISOString(), fecha_vencimiento: null, favorita: 0 }
    ]

    prepararGet({
      tareasSecuencia: [tareas, tareas, tareas, tareas, tareas]
    })

    renderApp()

    await user.type(screen.getByLabelText('Buscar'), 'reunión')
    await user.click(screen.getByText('Aplicar búsqueda'))

    await waitFor(() => expect(obtenerUltimaLlamadaListado()).toContain('q=reuni%C3%B3n'))

    await user.click(screen.getByLabelText('Solo favoritas'))

    await waitFor(() => expect(obtenerUltimaLlamadaListado()).toContain('favoritas=true'))
  })

  it('limpia la búsqueda y restablece los filtros', async () => {
    const user = userEvent.setup({ delay: null })
    prepararGet({ tareasSecuencia: [[], [], []] })

    renderApp()

    const input = screen.getByLabelText('Buscar')
    await user.type(input, 'proyecto')
    await user.click(screen.getByText('Aplicar búsqueda'))

    await waitFor(() => expect(obtenerUltimaLlamadaListado()).toContain('q=proyecto'))

    await user.click(screen.getByText('Limpiar'))

    await waitFor(() => expect(obtenerUltimaLlamadaListado()).not.toContain('q='))
    expect(input).toHaveValue('')
  })

  it('permite marcar una tarea como favorita', async () => {
    const user = userEvent.setup({ delay: null })
    const tareas = [
      { id: 1, titulo: 'Idea de producto', descripcion: '', completada: 0, prioridad: 'alta', categoria: 'Trabajo', fecha_creacion: new Date().toISOString(), fecha_vencimiento: null, favorita: 0 }
    ]

    prepararGet({
      tareasSecuencia: [
        tareas,
        [{ ...tareas[0], favorita: 1 }]
      ]
    })

    mockAxios.put.mockResolvedValue({ data: { message: 'ok' } })

    renderApp()

    const tarjeta = await screen.findByText('Idea de producto')
    const botonFavorita = within(tarjeta.closest('.tarea-card')).getByText('☆ Favorita')
    await user.click(botonFavorita)

    await waitFor(() => expect(mockAxios.put).toHaveBeenCalled())

    const [, payload] = mockAxios.put.mock.calls.at(-1)
    expect(payload.favorita).toBe(1)
    expect(await screen.findByText('★ Favorita')).toBeInTheDocument()
  })

  it('permite alternar el estado usando el botón de estado', async () => {
    const user = userEvent.setup({ delay: null })
    const tareas = [
      { id: 9, titulo: 'Checklist diaria', descripcion: '', completada: 0, prioridad: 'media', categoria: 'Trabajo', fecha_creacion: new Date().toISOString(), fecha_vencimiento: null, favorita: 0 }
    ]

    prepararGet({
      tareasSecuencia: [
        tareas,
        [{ ...tareas[0], completada: 1 }]
      ]
    })

    mockAxios.put.mockResolvedValue({ data: { message: 'ok' } })

    renderApp()

    const tarjeta = await screen.findByText('Checklist diaria')
    const botonEstado = within(tarjeta.closest('.tarea-card')).getByText('○ Pendiente')
    await user.click(botonEstado)

    await waitFor(() => expect(mockAxios.put).toHaveBeenCalled())
    expect(await screen.findByText('✔ Completada')).toBeInTheDocument()
  })
})

