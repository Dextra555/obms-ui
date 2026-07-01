<<<<<<< HEAD
export class ProfitAndLoss {
    Month: string = ''; 
    TotalCN: number = 0;   
    TotalIncome: number = 0;
    TotalDiscount: number = 0;
    TotalExpenses: number = 0;
    TotalProfit: number = 0;
    // Method to allow partial initialization
    setEmployeeData(data: Partial<ProfitAndLoss>): void {
      Object.assign(this, data);
    }
=======
export class ProfitAndLoss {
    Month: string = ''; 
    TotalCN: number = 0;   
    TotalIncome: number = 0;
    TotalDiscount: number = 0;
    TotalExpenses: number = 0;
    TotalProfit: number = 0;
    // Method to allow partial initialization
    setEmployeeData(data: Partial<ProfitAndLoss>): void {
      Object.assign(this, data);
    }
>>>>>>> 5207b82f409ea4dcb09404b90ab7324a99cbff87
  }