import { ServiceType } from "./service-type.model";

export interface IQuotationDetail {
  ID?: number;
  QuotationID?: number;
  QuotationDate?: Date;
  Client?: string;
  Branch?: string;
  Description?: string;
  NoOfGuards?: number;
  PerDay: number;
  PerMonth: number;
  Rate?: number;
  NoOfHours?: number;
  NoOfDays?: number;
  FollowCalender?: boolean;
  HasDiscount?: boolean;
  DiscountAmount?: number;
  DiscountHour?: number;
  IsTaxable?: boolean;
  TaxAmount?: number;
  MonthTotal?: number;
  LASTUPDATE?: Date;
  LastUpdatedBy?: string;
  Category?: string;
  Reason?: string;
  Basic?: number;
  DA?: number;
  Leaves?: number;
  Allowance?: number;
  Bonus?: number;
  NFH?: number;
  PF?: number;
  ESI?: number;
  Uniform?: number;
  ServiceFee?: number;
  YearTotal?: number;
  total?: number;
  index?: string;
  ServiceTypeID?: number;
  ServiceType?: ServiceType;
  CommercialBreakdown?: any; // For storing commercial breakdown data separately
}
