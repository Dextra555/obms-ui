<<<<<<< HEAD
export class BankStatement {
  AccountNo: string = '';
  Salary: string = '';
  Name: string = '';
  Passport: string = '';
  BranchCode: string = '';

  // Method to allow partial initialization
  setEmployeeData(data: Partial<BankStatement>): void {
    Object.assign(this, data);
  }
}
=======
export class BankStatement {
  AccountNo: string = '';
  Salary: string = '';
  Name: string = '';
  Passport: string = '';
  BranchCode: string = '';

  // Method to allow partial initialization
  setEmployeeData(data: Partial<BankStatement>): void {
    Object.assign(this, data);
  }
}
>>>>>>> 5207b82f409ea4dcb09404b90ab7324a99cbff87
