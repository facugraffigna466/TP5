const request = require('supertest');
const sqlite3 = require('sqlite3').verbose();
const { createServer, constantes } = require('../server');

const crearTarea = (app, overrides = {}) => {
  const basePayload = {
    titulo: `Tarea ${Math.random().toString(16).slice(2)}`,
    descripcion: 'Descripción de prueba',
    prioridad: 'media',
    categoria: 'General',
    fecha_vencimiento: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    favorita: false,
  };
  return request(app).post('/api/tareas').send({ ...basePayload, ...overrides });
};

describe('Rutas /api/tareas', () => {
  let db;
  let app;
  let readyPromise;
  const runQuery = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function callback(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });

  beforeAll(async () => {
    db = new sqlite3.Database(':memory:');
    const server = createServer({ db });
    app = server.app;
    readyPromise = server.ready;
    await readyPromise;
  });

  afterEach((done) => {
    db.run('DELETE FROM tareas', done);
  });

  afterAll(async () => {
    await new Promise((resolve, reject) => {
      db.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('devuelve lista vacía inicialmente', async () => {
    const response = await request(app).get('/api/tareas');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('crea una tarea válida', async () => {
    const payload = {
      titulo: 'Integración 1',
      descripcion: 'Descripción',
      prioridad: 'alta',
      categoria: 'Trabajo',
      fecha_vencimiento: new Date(Date.now() + 3600 * 1000).toISOString(),
      favorita: true,
    };

    const response = await request(app).post('/api/tareas').send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      titulo: payload.titulo,
      descripcion: payload.descripcion,
      prioridad: payload.prioridad,
      categoria: payload.categoria,
      completada: 0,
      favorita: 1,
    });
  });

  it('rechaza creación sin título', async () => {
    const response = await crearTarea(app, { titulo: ' ' });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'El título es requerido' });
  });

  it('rechaza creación con prioridad inválida', async () => {
    const response = await crearTarea(app, { prioridad: 'urgente' });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('La prioridad debe ser una de: alta, media, baja');
  });

  it('impide duplicados de título', async () => {
    const titulo = 'Título único';
    await crearTarea(app, { titulo });
    const response = await crearTarea(app, { titulo });
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Ya existe una tarea con este título');
  });

  it('rechaza creación cuando la descripción supera el máximo permitido', async () => {
    const descripcion = 'a'.repeat(201);
    const response = await crearTarea(app, { descripcion });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('La descripción no puede superar 200 caracteres');
  });

  it('rechaza creación cuando la fecha de vencimiento está en el pasado', async () => {
    const response = await crearTarea(app, {
      fecha_vencimiento: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('La fecha de vencimiento no puede estar en el pasado');
  });

  it('retorna 400 cuando el estado es inválido', async () => {
    const response = await request(app)
      .get('/api/tareas')
      .query({ estado: 'en-progreso' });
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Estado inválido/);
  });

  it('limita la cantidad de tareas alta pendientes', async () => {
    const crearAlta = () => crearTarea(app, { prioridad: 'alta' });
    // Crear el máximo permitido
    for (let i = 0; i < 5; i += 1) {
      const res = await crearAlta();
      expect(res.status).toBe(201);
    }
    // Intentar crear una más
    const excedente = await crearAlta();
    expect(excedente.status).toBe(422);
    expect(excedente.body.error).toMatch(/No puedes tener más de/);
  });

  it('lista tareas aplicando filtros y orden', async () => {
    const ahora = Date.now();
    await crearTarea(app, {
      titulo: 'Pendiente alta',
      prioridad: 'alta',
      fecha_vencimiento: new Date(ahora + 3 * 3600 * 1000).toISOString(),
    });
    const completada = await crearTarea(app, {
      titulo: 'Completada baja',
      prioridad: 'baja',
      fecha_vencimiento: new Date(ahora + 5 * 3600 * 1000).toISOString(),
    });
    await request(app)
      .put(`/api/tareas/${completada.body.id}`)
      .send({
        titulo: completada.body.titulo,
        descripcion: completada.body.descripcion,
        prioridad: completada.body.prioridad,
        categoria: completada.body.categoria,
        fecha_vencimiento: completada.body.fecha_vencimiento,
        completada: true,
      });

    const filtradas = await request(app)
      .get('/api/tareas')
      .query({ prioridad: 'alta', estado: 'pendientes' });

    expect(filtradas.status).toBe(200);
    expect(filtradas.body).toHaveLength(1);
    expect(filtradas.body[0].prioridad).toBe('alta');
    expect(filtradas.body[0].completada).toBe(0);

    const ordenadas = await request(app)
      .get('/api/tareas')
      .query({ orden: 'vencimiento_desc' });

    expect(ordenadas.status).toBe(200);
    expect(ordenadas.body[0].fecha_vencimiento >= ordenadas.body[1].fecha_vencimiento).toBe(true);
  });

  it('filtra solamente tareas vencidas pendientes', async () => {
    const futura = await crearTarea(app, {
      titulo: 'Futura',
      prioridad: 'media',
      fecha_vencimiento: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      favorita: true,
    });
    const vencida = await crearTarea(app, {
      titulo: 'Vencida',
      prioridad: 'media',
      fecha_vencimiento: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    });

    await runQuery(
      'UPDATE tareas SET fecha_vencimiento = datetime("now", "-2 hours") WHERE id = ?',
      [vencida.body.id],
    );
    await runQuery(
      'UPDATE tareas SET completada = 1 WHERE id = ?',
      [futura.body.id],
    );

    const response = await request(app)
      .get('/api/tareas')
      .query({ vencidas: 'true' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].titulo).toBe('Vencida');
    expect(response.body[0].completada).toBe(0);
  });

  it('realiza búsqueda por descripción sin importar mayúsculas/minúsculas', async () => {
    await crearTarea(app, {
      titulo: 'Plan semanal',
      descripcion: 'Preparar agenda semanal',
    });
    await crearTarea(app, {
      titulo: 'Otra cosa',
      descripcion: 'Nada que ver',
    });

    const response = await request(app)
      .get('/api/tareas')
      .query({ q: 'AGENDA' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].titulo).toBe('Plan semanal');
  });

  it('filtra por texto, categoría y favoritas', async () => {
    await crearTarea(app, {
      titulo: 'Reunión de proyecto',
      descripcion: 'Preparar agenda',
      categoria: 'Trabajo',
      favorita: true,
    });

    await crearTarea(app, {
      titulo: 'Comprar víveres',
      descripcion: 'Verduras y frutas',
      categoria: 'Personal',
      favorita: false,
    });

    const busqueda = await request(app)
      .get('/api/tareas')
      .query({ q: 'reunión' });
    expect(busqueda.status).toBe(200);
    expect(busqueda.body).toHaveLength(1);
    expect(busqueda.body[0].titulo).toMatch(/Reunión/i);

    const filtroCategoria = await request(app)
      .get('/api/tareas')
      .query({ categoria: 'Trabajo' });
    expect(filtroCategoria.status).toBe(200);
    expect(filtroCategoria.body).toHaveLength(1);
    expect(filtroCategoria.body[0].categoria).toBe('Trabajo');

    const favoritas = await request(app)
      .get('/api/tareas')
      .query({ favoritas: 'true' });
    expect(favoritas.status).toBe(200);
    expect(favoritas.body).toHaveLength(1);
    expect(favoritas.body[0].favorita).toBe(1);
  });

  it('permite obtener, actualizar y eliminar una tarea existente', async () => {
    const creada = await crearTarea(app, { titulo: 'CRUD test' });
    const id = creada.body.id;

    const fetched = await request(app).get(`/api/tareas/${id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.id).toBe(id);

    const update = await request(app)
      .put(`/api/tareas/${id}`)
      .send({
        titulo: 'CRUD test actualizado',
        descripcion: 'Act',
        completada: true,
        prioridad: 'media',
        fecha_vencimiento: creada.body.fecha_vencimiento,
        categoria: creada.body.categoria,
        favorita: true,
      });
    expect(update.status).toBe(200);

    const removed = await request(app).delete(`/api/tareas/${id}`);
    expect(removed.status).toBe(200);
    expect(removed.body).toEqual({ message: 'Tarea eliminada exitosamente' });

    const getAfterDelete = await request(app).get(`/api/tareas/${id}`);
    expect(getAfterDelete.status).toBe(404);
  });

  it('devuelve 404 cuando se intenta actualizar una tarea inexistente', async () => {
    const response = await request(app)
      .put('/api/tareas/999')
      .send({
        titulo: 'No existe',
        descripcion: '',
        completada: false,
        prioridad: 'media',
        fecha_vencimiento: new Date(Date.now() + 3600 * 1000).toISOString(),
        categoria: null,
      });
    expect(response.status).toBe(404);
  });

  it('rechaza actualización cuando el título ya está en uso por otra tarea', async () => {
    const primera = await crearTarea(app, { titulo: 'Titulo 1' });
    const segunda = await crearTarea(app, { titulo: 'Titulo 2' });

    const response = await request(app)
      .put(`/api/tareas/${segunda.body.id}`)
      .send({
        titulo: 'Titulo 1',
        descripcion: segunda.body.descripcion,
        completada: false,
        prioridad: 'media',
        fecha_vencimiento: segunda.body.fecha_vencimiento,
        categoria: segunda.body.categoria,
        favorita: false,
      });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Ya existe una tarea con este título');

    const persisted = await request(app).get(`/api/tareas/${segunda.body.id}`);
    expect(persisted.body.titulo).toBe('Titulo 2');
  });

  it('impide actualizar una tarea a prioridad alta cuando ya se alcanzó el límite', async () => {
    const ids = [];
    for (let i = 0; i < 5; i += 1) {
      const alta = await crearTarea(app, { prioridad: 'alta', titulo: `Alta ${i}` });
      ids.push(alta.body.id);
    }

    const objetivo = await crearTarea(app, { prioridad: 'media', titulo: 'Objetivo' });

    const response = await request(app)
      .put(`/api/tareas/${objetivo.body.id}`)
      .send({
        titulo: 'Objetivo',
        descripcion: objetivo.body.descripcion,
        completada: false,
        prioridad: 'alta',
        fecha_vencimiento: objetivo.body.fecha_vencimiento,
        categoria: objetivo.body.categoria,
        favorita: false,
      })
      .expect(422);

    expect(response.body.error).toMatch(/No puedes tener más de/);

    const objetivoPersistente = await request(app).get(`/api/tareas/${objetivo.body.id}`);
    expect(objetivoPersistente.body.prioridad).toBe('media');
  });

  it('devuelve error 500 ante fallos inesperados de base de datos', async () => {
    const spy = jest.spyOn(db, 'run').mockImplementation(function mockRun(sql, params, callback) {
      const cb = typeof params === 'function' ? params : callback;
      if (cb) {
        cb.call(this, new Error('Fallo DB'));
      }
      return this;
    });

    const response = await crearTarea(app, { titulo: 'DB fail' });
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Fallo DB');

    spy.mockRestore();
  });

  it('exponer health check operativo', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('asegura que la tabla tareas contiene las columnas esperadas', async () => {
    const columns = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info('tareas')", (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    const nombres = columns.map((col) => col.name);
    expect(nombres).toEqual(expect.arrayContaining([
      'id',
      'titulo',
      'descripcion',
      'completada',
      'fecha_creacion',
      'prioridad',
      'fecha_vencimiento',
      'categoria',
      'favorita',
    ]));
  });

  it('provee un resumen con métricas agregadas', async () => {
    const ahora = Date.now();
    const vencida = await crearTarea(app, {
      titulo: 'Pendiente vencida',
      fecha_vencimiento: new Date(ahora + 3600 * 1000).toISOString(),
      favorita: true,
    });

    await runQuery(
      'UPDATE tareas SET fecha_vencimiento = datetime("now", "-1 hour") WHERE id = ?',
      [vencida.body.id]
    );

    await crearTarea(app, {
      titulo: 'Próxima 1',
      fecha_vencimiento: new Date(ahora + 3600 * 1000).toISOString(),
      categoria: 'Trabajo',
    });

    const completada = await crearTarea(app, {
      titulo: 'Terminada',
      categoria: 'Trabajo',
      favorita: false,
    });

    const update = await request(app)
      .put(`/api/tareas/${completada.body.id}`)
      .send({
        titulo: completada.body.titulo,
        descripcion: completada.body.descripcion,
        completada: true,
        prioridad: completada.body.prioridad,
        fecha_vencimiento: completada.body.fecha_vencimiento,
        categoria: completada.body.categoria,
        favorita: false,
      });
    expect(update.status).toBe(200);

    const resumen = await request(app).get('/api/tareas/resumen');

    expect(resumen.status).toBe(200);
    expect(resumen.body.total).toBeGreaterThanOrEqual(3);
    expect(resumen.body.pendientes).toBeGreaterThanOrEqual(2);
    expect(resumen.body.completadas).toBeGreaterThanOrEqual(1);
    expect(resumen.body.favoritas).toBeGreaterThanOrEqual(1);
    expect(resumen.body.vencidas).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(resumen.body.proximas)).toBe(true);
    expect(Array.isArray(resumen.body.categorias)).toBe(true);
  });

  it('limita la cantidad de próximos vencimientos devueltos en el resumen', async () => {
    const total = constantes.MAX_PROXIMAS_VENCIMIENTOS + 3;
    for (let i = 0; i < total; i += 1) {
      await crearTarea(app, {
        titulo: `Próxima ${i}`,
        fecha_vencimiento: new Date(Date.now() + (i + 1) * 3600 * 1000).toISOString(),
      });
    }

    const resumen = await request(app).get('/api/tareas/resumen');

    expect(resumen.status).toBe(200);
    expect(resumen.body.proximas.length).toBeLessThanOrEqual(constantes.MAX_PROXIMAS_VENCIMIENTOS);
    const fechas = resumen.body.proximas.map((item) => item.fecha_vencimiento);
    const ordenado = [...fechas].sort();
    expect(fechas).toEqual(ordenado);
  });
});

