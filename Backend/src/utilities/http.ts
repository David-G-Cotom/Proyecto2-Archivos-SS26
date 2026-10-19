/**
 * Valor de la cabecera Content-Disposition para forzar la descarga con el nombre original
 * Se envian dos versiones del nombre: una ASCII simple (navegadores viejos) y otra codificada en UTF-8
 */
export function disposicionAdjunto(nombre: string): string {
    const alternativo = nombre.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
    const codificado = encodeURIComponent(nombre).replace(
        /['()*]/g,
        (caracter) => `%${caracter.charCodeAt(0).toString(16).toUpperCase()}`,
    );
    return `attachment; filename="${alternativo}"; filename*=UTF-8''${codificado}`;
}