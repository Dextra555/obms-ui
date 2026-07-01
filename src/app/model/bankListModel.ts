<<<<<<< HEAD
export class BankListModel {
    ID: number;
    BankCode: string;
    BankName: string;
    LastUpdate: Date;
    LastUpdatedBy?: string;
  
    constructor(data: Partial<BankListModel> = {}) {
      this.ID = data.ID || 0;
      this.BankCode = data.BankCode || '';
      this.BankName = data.BankName || '';
      this.LastUpdate = data.LastUpdate || new Date();
      this.LastUpdatedBy = data.LastUpdatedBy || '';
    }
=======
export class BankListModel {
    ID: number;
    BankCode: string;
    BankName: string;
    LastUpdate: Date;
    LastUpdatedBy?: string;
  
    constructor(data: Partial<BankListModel> = {}) {
      this.ID = data.ID || 0;
      this.BankCode = data.BankCode || '';
      this.BankName = data.BankName || '';
      this.LastUpdate = data.LastUpdate || new Date();
      this.LastUpdatedBy = data.LastUpdatedBy || '';
    }
>>>>>>> 5207b82f409ea4dcb09404b90ab7324a99cbff87
}