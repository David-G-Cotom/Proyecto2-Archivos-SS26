import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { entorno } from './config/entorno.js';
import { rutaNoEncontrada } from './middlewares/rutaNoEncontrada.js';
import { manejadorErrores } from './middlewares/manejadorErrores.js';

export function crearApp(): express.Express {
    const app = express();

    app.use(helmet()); // cabeceras de seguridad HTTP
    app.use(
        cors({
            origin: entorno.origenCliente, // solo el cliente Angular puede consumir la API desde el navegador
            exposedHeaders: ['Content-Disposition'], // El cliente necesita leer el nombre del archivo al descargar
        }),
    );
    app.use(express.json({ limit: '5mb' }));

    // rutas Api
    app.use(rutaNoEncontrada);
    app.use(manejadorErrores);

    return app;
}