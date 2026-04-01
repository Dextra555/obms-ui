import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class IndianValidators {
  // Aadhaar Number Validator (12 digits)
  static aadhaarNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const aadhaarRegex = /^[2-9][0-9]{11}$/;
      return aadhaarRegex.test(control.value) ? null : { invalidAadhaar: true };
    };
  }

  // PAN Number Validator (ABCDE1234F format)
  static panNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      return panRegex.test(control.value) ? null : { invalidPAN: true };
    };
  }

  // GSTIN Validator (15 characters)
  static gstin(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[A-Z]{1}[0-9]{1}$/;
      return gstinRegex.test(control.value) ? null : { invalidGSTIN: true };
    };
  }

  // PIN Code Validator (6 digits)
  static pinCode(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const pinRegex = /^[1-9][0-9]{5}$/;
      return pinRegex.test(control.value) ? null : { invalidPinCode: true };
    };
  }

  // Indian Phone Number Validator (+91 followed by 10 digits)
  static phoneNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const phoneRegex = /^\+91[6-9][0-9]{9}$/;
      return phoneRegex.test(control.value) ? null : { invalidPhoneNumber: true };
    };
  }

  // TAN Number Validator
  static tanNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const tanRegex = /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/;
      return tanRegex.test(control.value) ? null : { invalidTAN: true };
    };
  }

  // CIN Number Validator (21 digits)
  static cinNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const cinRegex = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
      return cinRegex.test(control.value) ? null : { invalidCIN: true };
    };
  }

  // IFSC Code Validator
  static ifscCode(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const ifscRegex = /^[A-Z]{4}[0][A-Z0-9]{6}$/;
      return ifscRegex.test(control.value) ? null : { invalidIFSC: true };
    };
  }

  // UPI ID Validator
  static upiId(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const upiRegex = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;
      return upiRegex.test(control.value) ? null : { invalidUPI: true };
    };
  }

  // Email Validator with Indian domain consideration
  static email(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(control.value) ? null : { invalidEmail: true };
    };
  }

  // Amount Validator (positive decimal with 2 decimal places)
  static amount(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const amountRegex = /^\d+(\.\d{1,2})?$/;
      return amountRegex.test(control.value) ? null : { invalidAmount: true };
    };
  }

  // HSN Code Validator (6-8 digits)
  static hsnCode(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const hsnRegex = /^[0-9]{6,8}$/;
      return hsnRegex.test(control.value) ? null : { invalidHSN: true };
    };
  }
}

// Error messages
export const VALIDATION_MESSAGES = {
  invalidAadhaar: 'Aadhaar number must be 12 digits starting with 2-9',
  invalidPAN: 'PAN must be in format ABCDE1234F',
  invalidGSTIN: 'GSTIN must be 15 characters in valid format',
  invalidPinCode: 'PIN code must be 6 digits',
  invalidPhoneNumber: 'Phone number must be in format +91XXXXXXXXXX',
  invalidTAN: 'TAN must be in format ABCD12345E',
  invalidCIN: 'CIN must be 21 characters in valid format',
  invalidIFSC: 'IFSC code must be in format ABCD0XXXXXX',
  invalidUPI: 'UPI ID must be in format username@bank',
  invalidEmail: 'Please enter a valid email address',
  invalidAmount: 'Please enter a valid amount',
  invalidHSN: 'HSN code must be 6-8 digits'
};
