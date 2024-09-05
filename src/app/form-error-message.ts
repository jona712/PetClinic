export class ErrorMessage {
    constructor(
      public forControl: string,
      public forValidator: string,
      public text: string
    ) { }
  }
//Mensajes de errores de validación
export const FormErrorMessage = [
  new ErrorMessage('nombre', 'required', 'El nombre es requerido'),
  new ErrorMessage('nombre', 'minlength', 'El nombre debe tener 3 carácteres mínimo'),
  new ErrorMessage('descripcion', 'required', 'La descripción es requerida'),
  new ErrorMessage('precio', 'required', 'El precio es requerido'),
  new ErrorMessage('precio', 'pattern', 'El precio solo acepta números con tres decimales'),
  new ErrorMessage('publicar', 'required', 'Publicar es requerido'),
  new ErrorMessage('generos', 'required', 'Es requerido que seleccione un género'),
  new ErrorMessage('email', 'required', 'El email es requerido'),
  new ErrorMessage('password', 'required', 'Es password es requerido'),
  new ErrorMessage('rol', 'required', 'El rol es requerido'),

  new ErrorMessage('duracion', 'required', 'La duración es requeria'),
  new ErrorMessage('duracion', 'pattern', 'La duración debe tener formato hh:mm'),
  new ErrorMessage('requerimiento', 'required', 'El requerimiento es requerido'),
  new ErrorMessage('beneficio', 'required', 'El beneficio es requerido'),

  new ErrorMessage('nacimiento', 'required', 'La fecha de nacimiento es requerida'),

  new ErrorMessage('ingrediente', 'required', 'Los ingredientes son requeridos'),
  new ErrorMessage('precio_producto', 'required', 'El precio es requerido'),
  new ErrorMessage('especificacion', 'required', 'La especificiones son requeridas'),
  new ErrorMessage('categoriaId', 'required', 'La categoría es requerida'),
  new ErrorMessage('imagen', 'required', 'La imagen es requerida'),

  new ErrorMessage('telefono', 'required', 'El teléfono es requerido'),
  new ErrorMessage('direccion', 'required', 'La dirección es requerida'),
  new ErrorMessage('correo', 'required', 'El correo electrónico es requerido'),
  
    // Nuevos mensajes de error para el formulario horarioForm
    new ErrorMessage('dias', 'required', 'Los días son requeridos'),
    new ErrorMessage('sucursal', 'required', 'La sucursal es requerida'),
    new ErrorMessage('horaInicio', 'required', 'La hora de inicio es requerida'),
    new ErrorMessage('horaInicio', 'pattern', 'La hora de inicio debe tener formato válido'),
    new ErrorMessage('horaInicio', 'horaInicioInvalid', 'La hora no está dentro de un rango permitido o pertenece a bloqueo'),
    new ErrorMessage('horaFin', 'required', 'La hora de fin es requerida'),
    new ErrorMessage('horaFin', 'pattern', 'La hora de fin debe tener formato válido'),
    new ErrorMessage('estado', 'required', 'El estado es requerido'),

    //Mensajes para reserva form
    new ErrorMessage('fecha', 'required', 'La fecha de la reserva es requerida'),
    new ErrorMessage('fecha.start', 'required', 'Fecha de inicio es requerida'),
    new ErrorMessage('fecha.end', 'required', 'Fecha de fin es requerida'),
    new ErrorMessage('cliente', 'required', 'La selección del cliente es requerida'),
    new ErrorMessage('servicio', 'required', 'La selección de un servicio es requerido'),
    new ErrorMessage('producto', 'required', 'La selección de un producto es requerido'),
    new ErrorMessage('habitos', 'required', 'Los hábitos de la mascota son requeridos'),
    new ErrorMessage('historial', 'required', 'El historial de la mascota es requerido'),
    new ErrorMessage('razon', 'required', 'La razón de la reserva es requerida'),
]; 