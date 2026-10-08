import bcrypt from "bcryptjs";

const RONDAS = 10;

export function hashearPassword(password: string): Promise<string> {
    return bcrypt.hash(password, RONDAS);
}

export function compararPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}