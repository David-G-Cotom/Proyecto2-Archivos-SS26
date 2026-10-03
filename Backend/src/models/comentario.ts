import { model, Schema, Types } from "mongoose";

export interface IComentario {
    archivoId: Types.ObjectId;
    autorId: Types.ObjectId;
    texto: string;
    createdAt: Date;
}

// Solo se registra la fecha de creación (los comentarios no se editan)
const esquemaComentario = new Schema<IComentario>(
    {
        archivoId: { type: Schema.Types.ObjectId, ref: 'Archivo', required: true },
        autorId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
        texto: { type: String, required: true, trim: true, minlength: 1, maxlength: 1000 },
        createdAt: { type: Date, required: true, default: Date.now }
    },
    { collection: 'comentarios', versionKey: false },
);

export const Comentario = model<IComentario>('Comentario', esquemaComentario);