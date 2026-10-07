export const entorno = {
    puerto: 4000,
    mongoUri: 'mongodb://127.0.0.1:27017/gestion_documental',
    origenCliente: 'http://localhost:4200',
    jwtSecreto: 'clave-secreta-para-generar-token-jwt', // minimo 32 caracteres para aplicar HS256
    jwtExpiracionHoras: 2
};