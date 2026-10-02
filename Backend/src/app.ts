import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { entorno } from './config/entorno.js';

export function crearApp(): express.Express {
    const app = express();

    app.use(helmet()); // cabeceras de seguridad HTTP
    app.use(
        cors({
            origin: entorno.origenCliente, // solo el cliente Angular puede consumir la API desde el navegador
            exposedHeaders: ['Content-Disposition'], // El cliente necesita leer el nombre del archivo al descargar
        }),
    );
    app.use(express.json());

    // rutas Api
    // ruta No Encontrada
    // manejador Errores

    return app;
}