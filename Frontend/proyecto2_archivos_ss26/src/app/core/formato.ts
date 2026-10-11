export function formatearBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const unidades = ['KB', 'MB', 'GB', 'TB'];
    let valor = bytes / 1024;
    let indice = 0;
    while (valor >= 1024 && indice < unidades.length - 1) {
        valor /= 1024;
        indice++;
    }
    return `${valor.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unidades[indice]}`;
}