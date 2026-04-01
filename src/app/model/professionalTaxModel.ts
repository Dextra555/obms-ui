export interface ProfessionalTaxModel {
    id?: number;
    state: string;
    minSalary: number;
    maxSalary?: number;
    taxAmount: number;
    effectiveDate: string;
    isActive: boolean;
    createdDate?: string;
    createdBy?: string;
    lastUpdatedDate?: string;
    lastUpdatedBy?: string;
}

export interface ProfessionalTaxCalculationRequest {
    grossSalary: number;
    state: string;
    calculationDate?: string;
}

export interface ProfessionalTaxCalculationResponse {
    grossSalary: number;
    state: string;
    taxAmount: number;
    isApplicable: boolean;
    calculationDate: string;
    taxSlab: string;
}
