<<<<<<< HEAD
export class UserAccessModel{
    readAccess?: boolean = false || undefined;
    deleteAccess?: boolean = false || undefined;
    updateAccess?: boolean = false || undefined;
    createAccess?: boolean = false || undefined;

    constructor(data: Partial<UserAccessModel> = {}) {
        this.readAccess = data.readAccess || false;
        this.deleteAccess = data.deleteAccess || false;
        this.updateAccess = data.updateAccess || false;
        this.createAccess = data.createAccess || false;
      }
=======
export class UserAccessModel{
    readAccess?: boolean = false || undefined;
    deleteAccess?: boolean = false || undefined;
    updateAccess?: boolean = false || undefined;
    createAccess?: boolean = false || undefined;

    constructor(data: Partial<UserAccessModel> = {}) {
        this.readAccess = data.readAccess || false;
        this.deleteAccess = data.deleteAccess || false;
        this.updateAccess = data.updateAccess || false;
        this.createAccess = data.createAccess || false;
      }
>>>>>>> 5207b82f409ea4dcb09404b90ab7324a99cbff87
}