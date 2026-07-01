<<<<<<< HEAD
export class OBMSBanksModel {
    ID: number;
    Name: string;
    BankID: number;
    IsAllowed: boolean | null;
    LastUpdatedDate: Date;
    LastUpdatedBy: string;

    constructor(data: Partial<OBMSBanksModel> = {}) {
        this.ID = data.ID || 0;
        this.Name = data.Name || '';
        this.BankID = data.BankID || 0;
        this.IsAllowed = data.IsAllowed || false;
        this.LastUpdatedDate = data.LastUpdatedDate || new Date();
        this.LastUpdatedBy = data.LastUpdatedBy || '';
      }
=======
export class OBMSBanksModel {
    ID: number;
    Name: string;
    BankID: number;
    IsAllowed: boolean | null;
    LastUpdatedDate: Date;
    LastUpdatedBy: string;

    constructor(data: Partial<OBMSBanksModel> = {}) {
        this.ID = data.ID || 0;
        this.Name = data.Name || '';
        this.BankID = data.BankID || 0;
        this.IsAllowed = data.IsAllowed || false;
        this.LastUpdatedDate = data.LastUpdatedDate || new Date();
        this.LastUpdatedBy = data.LastUpdatedBy || '';
      }
>>>>>>> 5207b82f409ea4dcb09404b90ab7324a99cbff87
}