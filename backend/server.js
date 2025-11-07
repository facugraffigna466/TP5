const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Base de datos SQLite
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Crear tabla de tareas si no existe
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS tareas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      completada INTEGER DEFAULT 0,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      prioridad TEXT DEFAULT 'media',
      fecha_vencimiento DATETIME,
      categoria TEXT
    )
  `);

  // Migraciones simples para entornos existentes
  const safeAddColumn = (columnName, definition) => {
    db.run(`ALTER TABLE tareas ADD COLUMN ${columnName} ${definition}`, (err) => {
      if (err && !/duplicate column name/i.test(err.message)) {
        console.error(`Error agregando columna ${columnName}:`, err.message);
      }
    });
  };

  safeAddColumn('prioridad', "TEXT DEFAULT 'media'");
  safeAddColumn('fecha_vencimiento', 'DATETIME');
  safeAddColumn('categoria', 'TEXT');
});

const PRIORIDADES_VALIDAS = ['alta', 'media', 'baja'];
const MAX_DESCRIPCION = 200;
const MAX_CATEGORIA = 30;
const MAX_TAREAS_ALTA_PENDIENTES = 5;

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

const validarPayloadTarea = ({ titulo, descripcion, prioridad, fecha_vencimiento, categoria }) => {
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

  return {
    data: {
      titulo: titulo.trim(),
      descripcion: descripcion ? descripcion.trim() : '',
      prioridad: prioridadNormalizada,
      fecha_vencimiento: fechaNormalizada?.value || null,
      categoria: categoria ? categoria.trim() : null,
    },
  };
};

const mapearRow = (row) => ({
  ...row,
  completada: Number(row.completada),
});

const verificarTituloDuplicado = ({ titulo, excluirId }, callback) => {
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

const contarTareasPrioridadAltaPendientes = ({ excluirId }, callback) => {
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

// Rutas API

// Obtener todas las tareas
app.get('/api/tareas', (req, res) => {
  const { prioridad, estado, vencidas, orden } = req.query;

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

// Obtener una tarea por ID
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

// Crear una nueva tarea
app.post('/api/tareas', (req, res) => {
  const { titulo, descripcion, prioridad, fecha_vencimiento, categoria } = req.body;
  const validacion = validarPayloadTarea({ titulo, descripcion, prioridad, fecha_vencimiento, categoria });

  if (validacion.error) {
    return res.status(400).json({ error: validacion.error });
  }

  const { data } = validacion;

  verificarTituloDuplicado({ titulo: data.titulo }, (errDuplicado, existe) => {
    if (errDuplicado) {
      return res.status(500).json({ error: errDuplicado.message });
    }
    if (existe) {
      return res.status(409).json({ error: 'Ya existe una tarea con este título' });
    }

    const continuarInsercion = () => {
      db.run(
        'INSERT INTO tareas (titulo, descripcion, prioridad, fecha_vencimiento, categoria) VALUES (?, ?, ?, ?, ?)',
        [data.titulo, data.descripcion, data.prioridad, data.fecha_vencimiento, data.categoria],
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
            categoria: data.categoria
          });
        }
      );
    };

    if (data.prioridad === 'alta') {
      contarTareasPrioridadAltaPendientes({}, (errConteo, total) => {
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

// Actualizar una tarea
app.put('/api/tareas/:id', (req, res) => {
  const id = req.params.id;
  const { titulo, descripcion, completada, prioridad, fecha_vencimiento, categoria } = req.body;

  const validacion = validarPayloadTarea({ titulo, descripcion, prioridad, fecha_vencimiento, categoria });

  if (validacion.error) {
    return res.status(400).json({ error: validacion.error });
  }

  verificarTituloDuplicado({ titulo: validacion.data.titulo, excluirId: id }, (errDuplicado, existe) => {
    if (errDuplicado) {
      return res.status(500).json({ error: errDuplicado.message });
    }
    if (existe) {
      return res.status(409).json({ error: 'Ya existe una tarea con este título' });
    }

    const ejecutarActualizacion = () => {
      db.run(
        'UPDATE tareas SET titulo = ?, descripcion = ?, completada = ?, prioridad = ?, fecha_vencimiento = ?, categoria = ? WHERE id = ?',
        [validacion.data.titulo, validacion.data.descripcion, completada ? 1 : 0, validacion.data.prioridad, validacion.data.fecha_vencimiento, validacion.data.categoria, id],
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
      contarTareasPrioridadAltaPendientes({ excluirId: id }, (errConteo, total) => {
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

// Eliminar una tarea
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando correctamente' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Base de datos: ${dbPath}`);
});

// Cerrar conexión a la base de datos al cerrar la aplicación
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('📦 Conexión a la base de datos cerrada.');
    process.exit(0);
  });
});


