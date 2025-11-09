const API_BASE = `${Cypress.env('API_URL') || ''}/api/tareas`

const visitarApp = () => {
  cy.visit('/', {
    timeout: 240000,
    failOnStatusCode: false,
  })

  cy.get('[data-cy="app-loaded"]', { timeout: 60000 }).should('exist')
}

const limpiarTareas = () => {
  cy.request(API_BASE).then(({ body }) => {
    body.forEach((tarea) => {
      cy.request('DELETE', `${API_BASE}/${tarea.id}`)
    })
  })
}

const crearTareaApi = (overrides = {}) => {
  const basePayload = {
    titulo: `Tarea ${Math.random().toString(16).slice(2)}`,
    descripcion: '',
    prioridad: 'media',
    categoria: 'General',
    fecha_vencimiento: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    favorita: false,
  }
  return cy.request('POST', API_BASE, { ...basePayload, ...overrides })
}

const actualizarTareaApi = (id, overrides = {}) =>
  cy.request('PUT', `${API_BASE}/${id}`, overrides)

describe('Gestión de Tareas - E2E', () => {
  beforeEach(() => {
    limpiarTareas()
    visitarApp()
  })

  afterEach(() => {
    limpiarTareas()
  })

  it('permite crear, marcar como favorita y completar una tarea desde la UI', () => {
    cy.contains('No hay tareas aún', { timeout: 2000 }).should('exist')

    cy.get('input[placeholder="Título de la tarea..."]').type('Configurar Cypress')
    cy.get('textarea[placeholder="Descripción (opcional)..."]').type('Revisión end-to-end')
    cy.get('#prioridad').select('alta')
    cy.get('#categoria').type('Automatización')
    cy.get('#favorita').check()

    cy.contains('button', '+ Agregar Tarea').click()

    cy.contains('.tarea-card', 'Configurar Cypress').within(() => {
      cy.contains('Prioridad alta').should('exist')
      cy.contains('Automatización').should('exist')
      cy.contains('★ Favorita').should('exist')

      cy.contains('○ Pendiente').click()
      cy.contains('✔ Completada').should('exist')

      cy.contains('★ Favorita').click()
    })

    cy.contains('.tarea-card', 'Configurar Cypress')
      .within(() => {
        cy.contains('☆ Favorita', { timeout: 4000 }).should('exist')
      })

    cy.contains('.stat-card', 'Completadas').find('.stat-number').should('have.text', '1')
  })

  it('filtra por búsqueda y solo favoritas', () => {
    limpiarTareas()

    const crear = (payload) =>
      cy.request('POST', API_BASE, {
        titulo: `Tarea ${payload.titulo}`,
        descripcion: payload.descripcion || '',
        prioridad: payload.prioridad || 'media',
        categoria: payload.categoria || null,
        favorita: !!payload.favorita,
      })

    crear({ titulo: 'frontend', descripcion: 'Actualizar estilos', favorita: true, categoria: 'UI' })
    crear({ titulo: 'backend', descripcion: 'Ajustar API' })

    visitarApp()

    cy.get('#filtroBusqueda').type('front')
    cy.contains('button', 'Aplicar búsqueda').click()

    cy.contains('.tarea-card', 'Tarea frontend').should('exist')
    cy.contains('.tarea-card', 'Tarea backend').should('not.exist')

    cy.get('#filtroBusqueda').clear()
    cy.contains('button', 'Aplicar búsqueda').click()
    cy.contains('.tarea-card', 'Tarea backend').should('exist')

    cy.get('label.toggle-favoritas input').check()
    cy.contains('.tarea-card', 'Tarea frontend').should('exist')
    cy.contains('.tarea-card', 'Tarea backend').should('not.exist')
  })

  it('elimina una tarea desde la interfaz y actualiza las métricas', () => {
    const titulo = 'Eliminar E2E'

    crearTareaApi({ titulo, categoria: 'QA' })

    cy.reload()

    cy.contains('.tarea-card', titulo).should('exist')
    cy.contains('.stat-card', 'Total').find('.stat-number').should('have.text', '1')

    cy.window().then((win) => cy.stub(win, 'confirm').returns(true))

    cy.contains('.tarea-card', titulo)
      .closest('.tarea-card')
      .find('button[title="Eliminar tarea"]')
      .click()

    cy.contains('.tarea-card', titulo).should('not.exist')
    cy.contains('.stat-card', 'Total').find('.stat-number').should('have.text', '0')
    cy.contains('.empty-state', 'No hay tareas aún').should('exist')
  })

  it('muestra el resumen con próximas tareas y top de categorías', () => {
    limpiarTareas()

    const ahora = Date.now()

    crearTareaApi({
      titulo: 'Reunión semanal',
      categoria: 'Trabajo',
      favorita: true,
      fecha_vencimiento: new Date(ahora + 4 * 3600 * 1000).toISOString(),
    })

    crearTareaApi({
      titulo: 'Pagar servicios',
      categoria: 'Finanzas',
      fecha_vencimiento: new Date(ahora + 8 * 3600 * 1000).toISOString(),
    }).then(({ body }) => {
      actualizarTareaApi(body.id, {
        titulo: body.titulo,
        descripcion: body.descripcion,
        completada: true,
        prioridad: body.prioridad,
        fecha_vencimiento: body.fecha_vencimiento,
        categoria: body.categoria,
        favorita: body.favorita,
      })
    })

    crearTareaApi({
      titulo: 'Preparar informe',
      categoria: 'Trabajo',
      fecha_vencimiento: new Date(ahora + 6 * 3600 * 1000).toISOString(),
    })

    cy.reload()

    cy.contains('.resumen-card h3', 'Resumen general').parent().within(() => {
      cy.contains('.dato', '3').should('exist')
      cy.contains('.etiqueta', 'Favoritas').prev('.dato').should('have.text', '1')
      cy.contains('.etiqueta', 'Completadas').prev('.dato').should('have.text', '1')
      cy.contains('.etiqueta', 'Pendientes').prev('.dato').should('have.text', '2')
    })

    cy.contains('.resumen-card h3', 'Próximos vencimientos')
      .parent()
      .within(() => {
        cy.contains('Reunión semanal').should('exist')
        cy.contains('Preparar informe').should('exist')
      })

    cy.contains('.resumen-card h3', 'Top categorías')
      .parent()
      .within(() => {
        cy.contains('Trabajo').should('exist')
        cy.contains('Finanzas').should('exist')
      })
  })
})

