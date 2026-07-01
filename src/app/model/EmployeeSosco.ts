<<<<<<< HEAD
export class EmployeeSosco {
  EmployeeName: string = "";
  EMPICNO: string = "";
  SOCSONO: string = "";
  Salary: string = "";
  EMPJoinDate: Date = new Date();
  SOCSOEmployee: string = "";
  SOCSOEmployer: string = "";
  

  // Method to allow partial initialization
  setEmployeeData(data: Partial<EmployeeSosco>): void {
    Object.assign(this, data);
  }
  }
=======
export class EmployeeSosco {
  EmployeeName: string = "";
  EMPICNO: string = "";
  SOCSONO: string = "";
  Salary: string = "";
  EMPJoinDate: Date = new Date();
  SOCSOEmployee: string = "";
  SOCSOEmployer: string = "";
  

  // Method to allow partial initialization
  setEmployeeData(data: Partial<EmployeeSosco>): void {
    Object.assign(this, data);
  }
  }
>>>>>>> 5207b82f409ea4dcb09404b90ab7324a99cbff87
  