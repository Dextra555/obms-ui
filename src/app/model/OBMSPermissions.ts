<<<<<<< HEAD
export class OBMSPermissions {
    ID: number;
    Name: string;
    ScreenName: string;
    Create: boolean;
    Read: boolean;
    Update: boolean;
    Delete: boolean;
    LastUpdatedBy: string;

    constructor(data: Partial<OBMSPermissions> = {}) {
        this.ID = data.ID || 0;
        this.Name = data.Name || '';
        this.ScreenName = data.ScreenName || '';
        this.Create = data.Create || false;   
        this.Read = data.Read || false;   
        this.Update = data.Update || false;   
        this.Delete = data.Delete || false;       
        this.LastUpdatedBy = data.LastUpdatedBy || '';
      }
=======
export class OBMSPermissions {
    ID: number;
    Name: string;
    ScreenName: string;
    Create: boolean;
    Read: boolean;
    Update: boolean;
    Delete: boolean;
    LastUpdatedBy: string;

    constructor(data: Partial<OBMSPermissions> = {}) {
        this.ID = data.ID || 0;
        this.Name = data.Name || '';
        this.ScreenName = data.ScreenName || '';
        this.Create = data.Create || false;   
        this.Read = data.Read || false;   
        this.Update = data.Update || false;   
        this.Delete = data.Delete || false;       
        this.LastUpdatedBy = data.LastUpdatedBy || '';
      }
>>>>>>> 5207b82f409ea4dcb09404b90ab7324a99cbff87
}