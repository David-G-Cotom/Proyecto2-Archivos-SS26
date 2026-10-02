import { crearApp } from "./app.js";
import { conectarBaseDatos, desconectarBaseDatos } from "./config/baseDatos.js";
import { entorno } from "./config/entorno.js";

async function iniciar(): Promise<void> {
    await conectarBaseDatos();
    // inicializar Indices en BD

    const servidor = crearApp().listen(entorno.puerto, () => {
        console.log(`[SERVIDOR] API lista en http://localhost:${entorno.puerto}/api`);
    });

    const apagar = (signal: string): void => {
        console.log(`[SERVIDOR] ${signal} recibida, cerrando...`);
        servidor.close(() => {
            void desconectarBaseDatos().finally(() => process.exit(0));
        });
    };
    process.on('SIGINT', () => apagar('SIGINT'));
    process.on('SIGTERM', () => apagar('SIGTERM'));
}

iniciar().catch((err) => {
    console.error('[SERVIDOR] No se pudo iniciar:', err);
    process.exit(1);
});