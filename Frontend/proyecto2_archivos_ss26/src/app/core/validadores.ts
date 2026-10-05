import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

// Misma política que el servidor: mínimo 8 caracteres, al menos una letra y un número
export const strongPassword: ValidatorFn = (control) => {
    const valor = String(control.value ?? '');
    if (valor === '') return null; // vacío lo valida Validators.required
    return /[A-Za-z]/.test(valor) && /[0-9]/.test(valor) ? null : { weakPassword: true };
};

export function camposCoinciden(campo: string, campoConfirmacion: string): ValidatorFn {
    return (grupo: AbstractControl): ValidationErrors | null => {
        const valor = grupo.get(campo)?.value as unknown;
        const confirmacion = grupo.get(campoConfirmacion)?.value as unknown;
        return valor === confirmacion ? null : { noCoinciden: true };
    };
}

export function mensajeValidacion(
    control: AbstractControl | null,
    etiqueta: string,
    mensajePatron = 'tiene un formato no válido.',
): string | null {
    if (!control || !(control.touched || control.dirty) || !control.errors) return null;
    const errores = control.errors;

    if (typeof errores['servidor'] === 'string') return errores['servidor'];
    if (errores['required']) return `${etiqueta} es obligatorio.`;
    if (errores['minlength']) return `${etiqueta} debe tener al menos ${errores['minlength'].requiredLength} caracteres.`;
    if (errores['maxlength']) return `${etiqueta} no puede superar los ${errores['maxlength'].requiredLength} caracteres.`;
    if (errores['email']) return 'Ingresa un correo válido.';
    if (errores['pattern']) return `${etiqueta} ${mensajePatron}`;
    if (errores['weakPassword']) return 'Mínimo 8 caracteres, con al menos una letra y un número.';
    return 'El valor ingresado no es válido.';
}