export interface ServiceType {
  Id: number;
  ServiceName: string;
  ServiceCode: string;
  Description?: string;
  HSNCode: string;
  IsActive: boolean;
  CreatedDate: Date;
  CreatedBy: string;
  LastUpdatedDate?: Date;
  LastUpdatedBy?: string;
}

export interface ServiceTypeCreate {
  ServiceName: string;
  ServiceCode: string;
  Description?: string;
  HSNCode: string;
}

export interface ServiceTypeUpdate {
  Id: number;
  ServiceName: string;
  Description?: string;
  HSNCode: string;
  IsActive: boolean;
}
