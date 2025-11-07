const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const PRIORIDADES_VALIDAS = ['alta', 'media', 'baja'];
const MAX_DESCRIPCION = 200;
const MAX_CATEGORIA = 30;
const MAX_TAREAS_ALTA_PENDIENTES = 5;
const MAX_PROXIMAS_VENCIMIENTOS = 5;

const normalizarPrioridad = (valor) => {
  if (!valor) return 'media';
  const prioridad = valor.toLowerCase();
  return PRIORIDADES_VALIDAS.includes(prioridad) ? prioridad : null;
};

const parsearFechaVencimiento = (valor) => {
  if (!valor) return null;
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) {
    return { error: 'Fecha de vencimiento inválida' };
  }
  const ahora = new Date();
  // Normalizar a inicio de minuto para comparaciones consistentes
  if (fecha < new Date(ahora.getTime() - 60 * 1000)) {
    return { error: 'La fecha de vencimiento no puede estar en el pasado' };
  }
  return { value: fecha.toISOString() };
};

const validarPayloadTarea = ({ titulo, descripcion, prioridad, fecha_vencimiento, categoria, favorita }) => {
  if (!titulo || !titulo.trim()) {
    return { error: 'El título es requerido' };
  }

  if (descripcion && descripcion.length > MAX_DESCRIPCION) {
    return { error: `La descripción no puede superar ${MAX_DESCRIPCION} caracteres` };
  }

  if (categoria && categoria.length > MAX_CATEGORIA) {
    return { error: `La categoría no puede superar ${MAX_CATEGORIA} caracteres` };
  }

  const prioridadNormalizada = normalizarPrioridad(prioridad);
  if (prioridadNormalizada === null) {
    return { error: `La prioridad debe ser una de: ${PRIORIDADES_VALIDAS.join(', ')}` };
  }

  const fechaNormalizada = parsearFechaVencimiento(fecha_vencimiento);
  if (fechaNormalizada?.error) {
    return { error: fechaNormalizada.error };
  }

  const favoritaNormalizada = favorita ? 1 : 0;

  return {
    data: {
      titulo: titulo.trim(),
      descripcion: descripcion ? descripcion.trim() : '',
      prioridad: prioridadNormalizada,
      fecha_vencimiento: fechaNormalizada?.value || null,
      categoria: categoria ? categoria.trim() : null,
      favorita: favoritaNormalizada,
    },
  };
};

const mapearRow = (row) => ({
  ...row,
  completada: Number(row.completada),
  favorita: Number(row.favorita),
});

const verificarTituloDuplicado = (db, { titulo, excluirId }, callback) => {
  const params = [titulo];
  let query = 'SELECT id FROM tareas WHERE lower(titulo) = lower(?)';
  if (excluirId) {
    query += ' AND id != ?';
    params.push(excluirId);
  }
  db.get(query, params, (err, row) => {
    if (err) return callback(err);
    if (row) return callback(null, true);
    callback(null, false);
  });
};

const contarTareasPrioridadAltaPendientes = (db, { excluirId }, callback) => {
  const params = ['alta'];
  let query = 'SELECT COUNT(*) as total FROM tareas WHERE prioridad = ? AND completada = 0';
  if (excluirId) {
    query += ' AND id != ?';
    params.push(excluirId);
  }
  db.get(query, params, (err, row) => {
    if (err) return callback(err);
    callback(null, row.total);
  });
};

const initializeDatabase = (db) => new Promise((resolve, reject) => {
  db.serialize(() => {
    db.run(
      `
        CREATE TABLE IF NOT EXISTS tareas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          titulo TEXT NOT NULL,
          descripcion TEXT,
          completada INTEGER DEFAULT 0,
          fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
          prioridad TEXT DEFAULT 'media',
          fecha_vencimiento DATETIME,
          categoria TEXT,
          favorita INTEGER DEFAULT 0
        )
      `,
      (err) => {
        if (err) {
          return reject(err);
        }

        const columns = [
          ['prioridad', "TEXT DEFAULT 'media'"],
          ['fecha_vencimiento', 'DATETIME'],
          ['categoria', 'TEXT'],
          ['favorita', 'INTEGER DEFAULT 0'],
        ];

        if (columns.length === 0) {
          return resolve();
        }

        let pendientes = columns.length;
        columns.forEach(([columnName, definition]) => {
          db.run(`ALTER TABLE tareas ADD COLUMN ${columnName} ${definition}`, (alterErr) => {
            if (alterErr && !/duplicate column name/i.test(alterErr.message)) {
              console.error(`Error agregando columna ${columnName}:`, alterErr.message);
              return reject(alterErr);
            }

            pendientes -= 1;
            if (pendientes === 0) {
              resolve();
            }
          });
        });
      }
    );
  });
});

const createServer = (options = {}) => {
  const app = express();
  const dbPath = options.dbPath || path.join(__dirname, 'database.sqlite');
  const db = options.db || new sqlite3.Database(dbPath);

  app.use(cors());
  app.use(express.json());

  const ready = initializeDatabase(db).catch((err) => {
    console.error('Error inicializando la base de datos:', err);
    throw err;
  });

  // Rutas API
  app.get('/api/tareas', (req, res) => {
    const { prioridad, estado, vencidas, orden, q, categoria, favoritas } = req.query;

    const condiciones = [];
    const params = [];

    if (prioridad) {
      const prioridadNormalizada = normalizarPrioridad(prioridad);
      if (prioridadNormalizada === null) {
        return res.status(400).json({ error: `Prioridad inválida. Valores permitidos: ${PRIORIDADES_VALIDAS.join(', ')}` });
      }
      condiciones.push('prioridad = ?');
      params.push(prioridadNormalizada);
    }

    if (estado) {
      if (!['pendientes', 'completadas'].includes(estado)) {
        return res.status(400).json({ error: 'Estado inválido. Use "pendientes" o "completadas"' });
      }
      condiciones.push('completada = ?');
      params.push(estado === 'completadas' ? 1 : 0);
    }

    if (vencidas === 'true') {
      condiciones.push("fecha_vencimiento IS NOT NULL AND fecha_vencimiento < datetime('now')");
      condiciones.push('completada = 0');
    }

    if (categoria) {
      condiciones.push('LOWER(categoria) = LOWER(?)');
      params.push(categoria);
    }

    if (favoritas === 'true') {
      condiciones.push('favorita = 1');
    }

    if (q) {
      condiciones.push('(LOWER(titulo) LIKE LOWER(?) OR LOWER(descripcion) LIKE LOWER(?))');
      params.push(`%${q}%`, `%${q}%`);
    }

    const whereClause = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    let orderClause = 'ORDER BY fecha_creacion DESC';

    if (orden === 'vencimiento_asc') {
      orderClause = 'ORDER BY fecha_vencimiento IS NULL, fecha_vencimiento ASC';
    } else if (orden === 'vencimiento_desc') {
      orderClause = 'ORDER BY fecha_vencimiento IS NULL, fecha_vencimiento DESC';
    }

    db.all(`SELECT * FROM tareas ${whereClause} ${orderClause}`, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows.map(mapearRow));
    });
  });

  app.get('/api/tareas/resumen', (req, res) => {
    const query = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN completada = 0 THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN completada = 1 THEN 1 ELSE 0 END) as completadas,
        SUM(CASE WHEN favorita = 1 THEN 1 ELSE 0 END) as favoritas,
        SUM(CASE WHEN fecha_vencimiento IS NOT NULL AND completada = 0 AND fecha_vencimiento < datetime('now') THEN 1 ELSE 0 END) as vencidas
      FROM tareas
    `;

    db.get(query, [], (err, resumen) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.all(
        `
          SELECT id, titulo, fecha_vencimiento, prioridad, categoria
          FROM tareas
          WHERE fecha_vencimiento IS NOT NULL
            AND completada = 0
            AND fecha_vencimiento >= datetime('now')
          ORDER BY fecha_vencimiento ASC
          LIMIT ?
        `,
        [MAX_PROXIMAS_VENCIMIENTOS],
        (errProximas, proximas) => {
          if (errProximas) {
            return res.status(500).json({ error: errProximas.message });
          }

          db.all(
            `
              SELECT categoria, COUNT(*) as cantidad
              FROM tareas
              WHERE categoria IS NOT NULL AND categoria != ''
              GROUP BY categoria
              ORDER BY cantidad DESC
            `,
            [],
            (errCategorias, categorias) => {
              if (errCategorias) {
                return res.status(500).json({ error: errCategorias.message });
              }

              res.json({
                ...resumen,
                proximas,
                categorias,
              });
            }
          );
        }
      );
    });
  });

  app.get('/api/tareas/:id', (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM tareas WHERE id = ?', [id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }
      res.json(mapearRow(row));
    });
  });

  app.post('/api/tareas', (req, res) => {
    const { titulo, descripcion, prioridad, fecha_vencimiento, categoria, favorita } = req.body;
    const validacion = validarPayloadTarea({ titulo, descripcion, prioridad, fecha_vencimiento, categoria, favorita });

    if (validacion.error) {
      return res.status(400).json({ error: validacion.error });
    }

    const { data } = validacion;

    verificarTituloDuplicado(db, { titulo: data.titulo }, (errDuplicado, existe) => {
      if (errDuplicado) {
        return res.status(500).json({ error: errDuplicado.message });
      }
      if (existe) {
        return res.status(409).json({ error: 'Ya existe una tarea con este título' });
      }

      const continuarInsercion = () => {
        db.run(
          'INSERT INTO tareas (titulo, descripcion, prioridad, fecha_vencimiento, categoria, favorita) VALUES (?, ?, ?, ?, ?, ?)',
          [data.titulo, data.descripcion, data.prioridad, data.fecha_vencimiento, data.categoria, data.favorita],
          function(err) {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            res.status(201).json({
              id: this.lastID,
              titulo: data.titulo,
              descripcion: data.descripcion,
              completada: 0,
              fecha_creacion: new Date().toISOString(),
              prioridad: data.prioridad,
              fecha_vencimiento: data.fecha_vencimiento,
              categoria: data.categoria,
              favorita: data.favorita,
            });
          }
        );
      };

      if (data.prioridad === 'alta') {
        contarTareasPrioridadAltaPendientes(db, {}, (errConteo, total) => {
          if (errConteo) {
            return res.status(500).json({ error: errConteo.message });
          }
          if (total >= MAX_TAREAS_ALTA_PENDIENTES) {
            return res.status(422).json({ error: `No puedes tener más de ${MAX_TAREAS_ALTA_PENDIENTES} tareas de prioridad alta pendientes` });
          }
          continuarInsercion();
        });
      } else {
        continuarInsercion();
      }
    });
  });

  app.put('/api/tareas/:id', (req, res) => {
    const id = req.params.id;
    const { titulo, descripcion, completada, prioridad, fecha_vencimiento, categoria, favorita } = req.body;

    const validacion = validarPayloadTarea({ titulo, descripcion, prioridad, fecha_vencimiento, categoria, favorita });

    if (validacion.error) {
      return res.status(400).json({ error: validacion.error });
    }

    verificarTituloDuplicado(db, { titulo: validacion.data.titulo, excluirId: id }, (errDuplicado, existe) => {
      if (errDuplicado) {
        return res.status(500).json({ error: errDuplicado.message });
      }
      if (existe) {
        return res.status(409).json({ error: 'Ya existe una tarea con este título' });
      }

      const ejecutarActualizacion = () => {
        db.run(
          'UPDATE tareas SET titulo = ?, descripcion = ?, completada = ?, prioridad = ?, fecha_vencimiento = ?, categoria = ?, favorita = ? WHERE id = ?',
          [validacion.data.titulo, validacion.data.descripcion, completada ? 1 : 0, validacion.data.prioridad, validacion.data.fecha_vencimiento, validacion.data.categoria, validacion.data.favorita, id],
          function(err) {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) {
              return res.status(404).json({ error: 'Tarea no encontrada' });
            }
            res.json({ message: 'Tarea actualizada exitosamente' });
          }
        );
      };

      if (validacion.data.prioridad === 'alta' && !completada) {
        contarTareasPrioridadAltaPendientes(db, { excluirId: id }, (errConteo, total) => {
          if (errConteo) {
            return res.status(500).json({ error: errConteo.message });
          }
          if (total >= MAX_TAREAS_ALTA_PENDIENTES) {
            return res.status(422).json({ error: `No puedes tener más de ${MAX_TAREAS_ALTA_PENDIENTES} tareas de prioridad alta pendientes` });
          }
          ejecutarActualizacion();
        });
      } else {
        ejecutarActualizacion();
      }
    });
  });

  app.delete('/api/tareas/:id', (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM tareas WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }
      res.json({ message: 'Tarea eliminada exitosamente' });
    });
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor funcionando correctamente' });
  });

  const close = () => new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });

  return {
    app,
    db,
    ready,
    close,
    config: { dbPath },
  };
};

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  const { app, ready, db, config } = createServer({
    dbPath: process.env.DB_PATH || path.join(__dirname, 'database.sqlite'),
  });

  ready
    .then(() => {
      const server = app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        console.log(`📊 Base de datos: ${config.dbPath}`);
      });

      const shutdown = () => {
        console.log('🚦 Cerrando servidor...');
        server.close(() => {
          db.close((err) => {
            if (err) {
              console.error(err.message);
            }
            console.log('📦 Conexión a la base de datos cerrada.');
            process.exit(0);
          });
        });
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    })
    .catch((err) => {
      console.error('No se pudo iniciar el servidor:', err);
      process.exit(1);
    });
}

module.exports = {
  createServer,
  validarPayloadTarea,
  normalizarPrioridad,
  parsearFechaVencimiento,
  constantes: {
    PRIORIDADES_VALIDAS,
    MAX_DESCRIPCION,
    MAX_CATEGORIA,
    MAX_TAREAS_ALTA_PENDIENTES,
    MAX_PROXIMAS_VENCIMIENTOS,
  },
};
