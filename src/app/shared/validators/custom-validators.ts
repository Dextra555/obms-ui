<<<<<<< HEAD
// src/app/shared/validators/custom-validators.ts
import { AbstractControl, ValidatorFn } from '@angular/forms';

export function twoDecimalPlacesValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const valid = /^\d+(\.\d{1,2})?$/.test(control.value);
    return valid ? null : { invalidDecimal: { value: control.value } };
  };
}
=======
// src/app/shared/validators/custom-validators.ts
import { AbstractControl, ValidatorFn } from '@angular/forms';

export function twoDecimalPlacesValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const valid = /^\d+(\.\d{1,2})?$/.test(control.value);
    return valid ? null : { invalidDecimal: { value: control.value } };
  };
}
>>>>>>> 5207b82f409ea4dcb09404b90ab7324a99cbff87
