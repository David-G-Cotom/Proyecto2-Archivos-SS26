export function obtenerExpiracionMs(token: string): number | null {
    try {
        const carga = token.split('.')[1];
        if (!carga) return null;

        // Un JWT usa base64url se convierte a base64 antes de decodificar
        const base64 = carga.replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
                .join(''),
        );
        const datos = JSON.parse(json) as { exp?: number };
        return typeof datos.exp === 'number' ? datos.exp * 1000 : null;
    } catch {
        return null; // token mal formado
    }
}

export function tokenExpirado(token: string): boolean {
    const expiracion = obtenerExpiracionMs(token);
    return expiracion !== null && expiracion <= Date.now();
}