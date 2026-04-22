export interface ServiceType {
  Id: number;
  ServiceName: string;
  ServiceCode?: string;
  HSNCode: string;
  PricingModel?: string;
  IsActive: boolean;
  CreatedDate: Date;
  CreatedBy: string;
  LastUpdatedDate?: Date;
  LastUpdatedBy?: string;
}

export interface ServiceTypeCreate {
  ServiceName: string;
  ServiceCode?: string;
  HSNCode: string;
  PricingModel?: string;
}

export interface ServiceTypeUpdate {
  Id: number;
  ServiceName: string;
  HSNCode: string;
  PricingModel?: string;
  IsActive: boolean;
}
