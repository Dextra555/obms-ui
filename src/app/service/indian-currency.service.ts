import { Injectable } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IndianCurrencyService {
  private decimalPipe: DecimalPipe;

  constructor() {
    this.decimalPipe = new DecimalPipe('en-IN');
  }

  // Currency Conversion
  convertMYRToINR(amount: number): number {
    return amount * 18; // 1 MYR = 18 INR (approximate rate)
  }

  convertINRToMYR(amount: number): number {
    return amount / 18; // 1 INR = 0.055 MYR (approximate rate)
  }

  // Currency Formatting
  formatIndianCurrency(amount: number): string {
    return this.decimalPipe.transform(amount, '1.2-2', 'en-IN') || '0.00';
  }

  formatIndianCurrencyWithSymbol(amount: number): string {
    const formattedAmount = this.formatIndianCurrency(amount);
    return `₹${formattedAmount}`;
  }

  formatIndianCurrencyInWords(amount: number): string {
    return this.numberToWords(amount) + ' Rupees Only';
  }

  // Currency Display
  getCurrencySymbol(): string {
    return '₹';
  }

  getCurrencyCode(): string {
    return 'INR';
  }

  getCurrencyName(): string {
    return 'Indian Rupee';
  }

  // Currency Validation
  validateIndianCurrency(amount: string): boolean {
    const num = parseFloat(amount);
    return !isNaN(num) && num >= 0 && num <= 9999999999;
  }

  // Currency Calculations
  calculateGST(amount: number, rate: number): number {
    return Math.round((amount * rate / 100) * 100) / 100;
  }

  calculateDiscount(amount: number, discount: number): number {
    return Math.round((amount * discount / 100) * 100) / 100;
  }

  calculateNetAmount(amount: number, gst: number, discount: number): number {
    const discountedAmount = amount - this.calculateDiscount(amount, discount);
    return discountedAmount + this.calculateGST(discountedAmount, gst);
  }

  // Currency Utilities
  roundToTwoDecimals(amount: number): number {
    return Math.round(amount * 100) / 100;
  }

  roundToNearest(amount: number, nearest: number): number {
    return Math.round(amount / nearest) * nearest;
  }

  // Number to Words Conversion (Indian System)
  numberToWords(num: number): string {
    if (num === 0) return 'Zero';
    
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const thousands = ['', 'Thousand', 'Lakh', 'Crore'];

    const convertLessThanOneThousand = (n: number): string => {
      let result = '';
      
      if (n >= 100) {
        result += units[Math.floor(n / 100)] + ' Hundred';
        n %= 100;
        if (n > 0) result += ' ';
      }
      
      if (n >= 20) {
        result += tens[Math.floor(n / 10)];
        n %= 10;
        if (n > 0) result += ' ' + units[n];
      } else if (n >= 10) {
        result += teens[n - 10];
      } else if (n > 0) {
        result += units[n];
      }
      
      return result;
    };

    let result = '';
    let thousandIndex = 0;

    while (num > 0) {
      const chunk = num % 1000;
      if (chunk > 0) {
        const chunkWords = convertLessThanOneThousand(chunk);
        if (thousandIndex > 0) {
          result = chunkWords + ' ' + thousands[thousandIndex] + (result ? ' ' + result : '');
        } else {
          result = chunkWords + (result ? ' ' + result : '');
        }
      }
      num = Math.floor(num / 1000);
      thousandIndex++;
    }

    return result;
  }

  // Currency Display Components
  getCurrencyDisplayConfig(): any {
    return {
      symbol: '₹',
      code: 'INR',
      name: 'Indian Rupee',
      decimalDigits: 2,
      thousandsSeparator: ',',
      decimalSeparator: '.',
      symbolPosition: 'prefix',
      symbolSpacing: 'narrow'
    };
  }

  // Currency Input Formatting
  formatCurrencyInput(value: string): string {
    // Remove non-numeric characters except decimal point
    let cleaned = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      cleaned = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    return cleaned;
  }

  // Currency Comparison
  compareAmounts(amount1: number, amount2: number): number {
    return Math.round((amount1 - amount2) * 100) / 100;
  }

  // Currency Rounding Rules (Indian)
  roundIndianCurrency(amount: number): number {
    // Indian rounding: round to nearest 0.05
    return Math.round(amount * 20) / 20;
  }

  // Currency Display for Different Contexts
  formatForDisplay(amount: number, context: 'table' | 'form' | 'report' | 'dialog' = 'table'): string {
    switch (context) {
      case 'table':
        return this.formatIndianCurrencyWithSymbol(amount);
      case 'form':
        return this.formatIndianCurrency(amount);
      case 'report':
        return this.formatIndianCurrencyInWords(amount);
      case 'dialog':
        return `₹${this.formatIndianCurrency(amount)}`;
      default:
        return this.formatIndianCurrencyWithSymbol(amount);
    }
  }

  // Currency Validation Messages
  getCurrencyValidationMessage(): string {
    return 'Please enter a valid amount (0-9999999999)';
  }

  // Currency Help Text
  getCurrencyHelpText(): string {
    return 'Amount in Indian Rupees (₹)';
  }

  // Currency Placeholder
  getCurrencyPlaceholder(): string {
    return '0.00';
  }

  // Currency Examples
  getCurrencyExamples(): string[] {
    return [
      '₹1,000.00',
      '₹10,000.00', 
      '₹1,00,000.00',
      '₹10,00,000.00'
    ];
  }

  // Currency Range Validation
  validateCurrencyRange(amount: number, min: number, max: number): { isValid: boolean; message: string } {
    if (amount < min) {
      return {
        isValid: false,
        message: `Amount must be at least ₹${this.formatIndianCurrency(min)}`
      };
    }
    
    if (amount > max) {
      return {
        isValid: false,
        message: `Amount cannot exceed ₹${this.formatIndianCurrency(max)}`
      };
    }
    
    return {
      isValid: true,
      message: ''
    };
  }

  // Currency Localization
  getLocalizedCurrency(): any {
    return {
      locale: 'en-IN',
      currency: 'INR',
      options: {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    };
  }

  // Currency Analytics
  getCurrencyAnalytics(amounts: number[]): any {
    const total = amounts.reduce((sum, amount) => sum + amount, 0);
    const average = amounts.length > 0 ? total / amounts.length : 0;
    const max = Math.max(...amounts);
    const min = Math.min(...amounts);

    return {
      total: this.formatIndianCurrencyWithSymbol(total),
      average: this.formatIndianCurrencyWithSymbol(average),
      max: this.formatIndianCurrencyWithSymbol(max),
      min: this.formatIndianCurrencyWithSymbol(min),
      count: amounts.length
    };
  }

  // Currency Export/Import
  exportCurrencyData(data: any[]): any[] {
    return data.map(item => ({
      ...item,
      amount: this.formatIndianCurrency(item.amount || 0),
      amountInWords: this.formatIndianCurrencyInWords(item.amount || 0)
    }));
  }

  // Currency API Integration
  getExchangeRate(fromCurrency: string, toCurrency: string): Observable<number> {
    // This would integrate with a real exchange rate API
    // For now, return fixed rates
    const rates: { [key: string]: number } = {
      'MYR-INR': 18,
      'USD-INR': 83,
      'EUR-INR': 89,
      'GBP-INR': 105
    };
    
    const rate = rates[`${fromCurrency}-${toCurrency}`] || 1;
    return new Observable(observer => {
      observer.next(rate);
      observer.complete();
    });
  }
}
