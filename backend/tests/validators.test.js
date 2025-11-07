const {
  validarPayloadTarea,
  normalizarPrioridad,
  parsearFechaVencimiento,
  constantes,
} = require('../server');

describe('Validaciones de tareas', () => {
  describe('normalizarPrioridad', () => {
    it('normaliza mayúsculas y retorna prioridad válida', () => {
      expect(normalizarPrioridad('ALTA')).toBe('alta');
      expect(normalizarPrioridad('Media')).toBe('media');
      expect(normalizarPrioridad('baja')).toBe('baja');
    });

    it('retorna prioridad por defecto cuando no se provee valor', () => {
      expect(normalizarPrioridad()).toBe('media');
    });

    it('retorna null cuando la prioridad es inválida', () => {
      expect(normalizarPrioridad('urgente')).toBeNull();
    });
  });

  describe('parsearFechaVencimiento', () => {
    it('retorna null cuando no se envía fecha', () => {
      expect(parsearFechaVencimiento(null)).toBeNull();
    });

    it('retorna error cuando el formato es inválido', () => {
      const resultado = parsearFechaVencimiento('fecha-invalida');
      expect(resultado).toEqual({ error: 'Fecha de vencimiento inválida' });
    });

    it('retorna error cuando la fecha está en el pasado', () => {
      const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const resultado = parsearFechaVencimiento(ayer);
      expect(resultado).toEqual({ error: 'La fecha de vencimiento no puede estar en el pasado' });
    });

    it('normaliza la fecha a ISO cuando es válida', () => {
      const futuro = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const resultado = parsearFechaVencimiento(futuro.toISOString());
      expect(resultado.value).toBe(futuro.toISOString());
    });
  });

  describe('validarPayloadTarea', () => {
    const crearPayloadBase = () => ({
      titulo: '   Nueva tarea   ',
      descripcion: 'Descripción válida',
      prioridad: 'ALTA',
      fecha_vencimiento: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      categoria: 'Trabajo',
      favorita: true,
    });

    it('normaliza correctamente los valores válidos', () => {
      const payload = crearPayloadBase();
      const { data, error } = validarPayloadTarea(payload);
      expect(error).toBeUndefined();
      expect(data).toEqual({
        titulo: 'Nueva tarea',
        descripcion: 'Descripción válida',
        prioridad: 'alta',
        fecha_vencimiento: payload.fecha_vencimiento,
        categoria: 'Trabajo',
        favorita: 1,
      });
    });

    it('retorna error cuando el título está vacío', () => {
      const { error } = validarPayloadTarea({ ...crearPayloadBase(), titulo: '   ' });
      expect(error).toBe('El título es requerido');
    });

    it('retorna error cuando la descripción excede el máximo', () => {
      const descripcionLarga = 'a'.repeat(constantes.MAX_DESCRIPCION + 1);
      const { error } = validarPayloadTarea({ ...crearPayloadBase(), descripcion: descripcionLarga });
      expect(error).toBe(`La descripción no puede superar ${constantes.MAX_DESCRIPCION} caracteres`);
    });

    it('retorna error cuando la categoría excede el máximo', () => {
      const categoriaLarga = 'x'.repeat(constantes.MAX_CATEGORIA + 1);
      const { error } = validarPayloadTarea({ ...crearPayloadBase(), categoria: categoriaLarga });
      expect(error).toBe(`La categoría no puede superar ${constantes.MAX_CATEGORIA} caracteres`);
    });

    it('retorna error cuando la prioridad es inválida', () => {
      const { error } = validarPayloadTarea({ ...crearPayloadBase(), prioridad: 'urgente' });
      expect(error).toBe(`La prioridad debe ser una de: ${constantes.PRIORIDADES_VALIDAS.join(', ')}`);
    });

    it('retorna error cuando la fecha de vencimiento es inválida', () => {
      const { error } = validarPayloadTarea({ ...crearPayloadBase(), fecha_vencimiento: 'hoy' });
      expect(error).toBe('Fecha de vencimiento inválida');
    });

    it('permite valores opcionales vacíos', () => {
      const { data, error } = validarPayloadTarea({
        titulo: 'Tarea sin descripción',
        descripcion: '',
        prioridad: undefined,
        fecha_vencimiento: null,
        categoria: '',
        favorita: false,
      });
      expect(error).toBeUndefined();
      expect(data).toEqual({
        titulo: 'Tarea sin descripción',
        descripcion: '',
        prioridad: 'media',
        fecha_vencimiento: null,
        categoria: null,
        favorita: 0,
      });
    });
  });
});

