export interface Notificacion {
    id: number;
    tipo: TipoNotificacion;
    mensaje: string;
    titulo?: string;
}

export type TipoNotificacion = 'exito' | 'error' | 'info' | 'advertencia';
