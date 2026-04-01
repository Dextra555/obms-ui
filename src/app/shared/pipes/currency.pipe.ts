import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currency'
})
export class CurrencyPipe implements PipeTransform {
  transform(value: number, currencyCode: string = 'INR'): string {
    if (value === null || value === undefined) {
      return '';
    }

    switch (currencyCode.toUpperCase()) {
      case 'INR':
        return `₹${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
      case 'MYR':
        return `RM${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
      case 'USD':
        return `$${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
      default:
        return `${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} ${currencyCode}`;
    }
  }
}
