export class ErrorApp extends Error {

    public readonly codigoHttp: number;
    public readonly codigo: string;
    public readonly detalles?: unknown;

    constructor(
        codigoHttp: number,
        mensaje: string,
        codigo: string = 'ERROR',
        detalles?: unknown,
    ) {
        super(mensaje);
        this.codigoHttp = codigoHttp;
        this.codigo = codigo;
        this.detalles = detalles;
        this.name = new.target.name;
    }
}

export class ErrorSolicitudInvalida extends ErrorApp {
    constructor(mensaje = 'La solicitud no es válida.', detalles?: unknown) {
        super(400, mensaje, 'SOLICITUD_INVALIDA', detalles);
    }
}

export class ErrorNoAutenticado extends ErrorApp {
    constructor(mensaje = 'Debes iniciar sesión para continuar.') {
        super(401, mensaje, 'NO_AUTENTICADO');
    }
}

export class ErrorProhibido extends ErrorApp {
    constructor(mensaje = 'No tienes permiso para realizar esta acción.') {
        super(403, mensaje, 'PROHIBIDO');
    }
}

export class ErrorNoEncontrado extends ErrorApp {
    constructor(mensaje = 'El recurso solicitado no existe.') {
        super(404, mensaje, 'NO_ENCONTRADO');
    }
}

export class ErrorConflicto extends ErrorApp {
    constructor(mensaje = 'La operación entra en conflicto con el estado actual.', detalles?: unknown) {
        super(409, mensaje, 'CONFLICTO', detalles);
    }
}