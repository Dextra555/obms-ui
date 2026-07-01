export class IndianClientModel {
    Id: number;
    Code: string;
    Name: string;
    Address1: string;
    Address2: string;
    PostCode: string; // Changed to string for PIN code
    City: string;
    State: string; // Malaysian state
    IndianState: string; // Indian state
    Phone: string; // Changed to string for +91 prefix
    Fax: string;
    Email: string;
    PersonIncharge: string;
    Branch: string;
    CreatedDate: Date | null = null;
    LastUpdatedBy: string;
    Shortname: string;
    Status: string;
    SuperClientCode: string;
    IsClientHeadQuarters: boolean;   
    LastUpdatedDate: Date | null = null;
    AgreementStart: Date | null = null;
    AgreementEnd: Date | null = null;
    
    // Indian Compliance Fields
    GSTIN: string | null = null;
    PANNumber: string | null = null;
    TANNumber: string | null = null;
    CINNumber: string | null = null;
    GSTRegistrationStatus: string = 'unregistered'; // Changed from boolean to string
    PINCode: string | null = null; // 6-digit Indian PIN code
    
    // Compliance Status Tracking
    IsGSTCompliant: boolean = false;
    IsPANCompliant: boolean = false;
    IsTANCompliant: boolean = false;
    IsCINCompliant: boolean = false;
    ComplianceCheckDate: Date | null = null;
    ComplianceRemarks: string | null = null;
    
    constructor(data: Partial<IndianClientModel> = {}) {
        this.Id = data.Id || 0;
        this.Code = data.Code || '';
        this.Name = data.Name || '';
        this.Address1 = data.Address1 || '';
        this.Address2 = data.Address2 || '';
        this.PostCode = data.PostCode || '';
        this.City = data.City || '';
        this.State = data.State || '';
        this.IndianState = data.IndianState || '';
        this.Phone = data.Phone || '';
        this.Fax = data.Fax || '';
        this.Email = data.Email || '';
        this.PersonIncharge = data.PersonIncharge || '';
        this.Branch = data.Branch || '';
        this.CreatedDate = data.CreatedDate || null;
        this.LastUpdatedBy = data.LastUpdatedBy || '';
        this.Shortname = data.Shortname || '';
        this.Status = data.Status || '';
        this.SuperClientCode = data.SuperClientCode || '';
        this.IsClientHeadQuarters = data.IsClientHeadQuarters || false;
        this.LastUpdatedDate = data.LastUpdatedDate || null;
        this.AgreementStart = data.AgreementStart || null;
        this.AgreementEnd = data.AgreementEnd || null;
        this.GSTIN = data.GSTIN || null;
        this.PANNumber = data.PANNumber || null;
        this.TANNumber = data.TANNumber || null;
        this.CINNumber = data.CINNumber || null;
        this.GSTRegistrationStatus = data.GSTRegistrationStatus || 'unregistered';
        this.PINCode = data.PINCode || null;
        
        // Compliance Status Tracking
        this.IsGSTCompliant = data.IsGSTCompliant || false;
        this.IsPANCompliant = data.IsPANCompliant || false;
        this.IsTANCompliant = data.IsTANCompliant || false;
        this.IsCINCompliant = data.IsCINCompliant || false;
        this.ComplianceCheckDate = data.ComplianceCheckDate || null;
        this.ComplianceRemarks = data.ComplianceRemarks || null;
    }
}

// Indian States List
export const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
    'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
    'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
    'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir',
    'Ladakh', 'Lakshadweep', 'Puducherry'
];

// GST Validation Patterns
export const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$/;
export const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const PIN_CODE_PATTERN = /^[0-9]{6}$/;
export const TAN_PATTERN = /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/;
export const CIN_PATTERN = /^[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
