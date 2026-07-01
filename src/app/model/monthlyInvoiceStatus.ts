<<<<<<< HEAD
export class MonthlyInvoiceStatus {
    Name: string = '';
    InvoiceNo: string = '';
    ServiceCharges: string = '';
    InvoiceDate: Date = new Date();
    Discount: number = 0;
    TaxAmount: number = 0;
    InvoiceAmount: number = 0;
    PaymentReceived: string = '';
    // Method to allow partial initialization
    setEmployeeData(data: Partial<MonthlyInvoiceStatus>): void {
      Object.assign(this, data);
    }
=======
export class MonthlyInvoiceStatus {
    Name: string = '';
    InvoiceNo: string = '';
    ServiceCharges: string = '';
    InvoiceDate: Date = new Date();
    Discount: number = 0;
    TaxAmount: number = 0;
    InvoiceAmount: number = 0;
    PaymentReceived: string = '';
    // Method to allow partial initialization
    setEmployeeData(data: Partial<MonthlyInvoiceStatus>): void {
      Object.assign(this, data);
    }
>>>>>>> 5207b82f409ea4dcb09404b90ab7324a99cbff87
  }