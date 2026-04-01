export interface IndianInvoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  
  // Client Information
  clientId: number;
  clientName: string;
  clientGSTIN: string;
  clientPAN: string;
  clientAddress: string;
  clientState: string;
  clientPINCode: string;
  clientPhone: string;
  
  // Invoice Items
  items: IndianInvoiceItem[];
  
  // Financial Summary
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  
  // Tax Details
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  totalGST: number;
  
  // Payment Information
  paymentMode: string;
  paymentStatus: string;
  paidAmount: number;
  balanceAmount: number;
  
  // Compliance
  hsnSacCode: string;
  taxType: string; // 'CGST', 'SGST', 'IGST'
  placeOfSupply: string;
  reverseCharge: boolean;
  
  // Metadata
  createdBy: string;
  createdDate: Date;
  lastUpdatedBy: string;
  lastUpdatedDate: Date;
  status: string;
}

export interface IndianInvoiceItem {
  id: number;
  description: string;
  hsnSacCode: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxableValue: number;
  
  // GST Rates
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  
  // Tax Amounts
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGSTAmount: number;
  
  // Item Totals
  totalAmount: number;
  
  // Item Details
  unit: string;
  serialNumber: string;
  batchNumber: string;
  expiryDate: Date | null;
}

export interface GSTTaxCalculation {
  taxableValue: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGST: number;
  totalAmount: number;
}

export interface GSTConfiguration {
  id: number;
  gstRate: number;
  hsnCode: string;
  description: string;
  effectiveDate: Date;
  isActive: boolean;
  createdDate: Date;
  createdBy: string;
  lastUpdatedBy: string;
  lastUpdatedDate: Date;
}

// GST Rates
export const GST_RATES = [
  { rate: 5, description: 'Essential goods', color: '#28a745' },
  { rate: 12, description: 'Standard goods', color: '#17a2b8' },
  { rate: 18, description: 'Standard services', color: '#ffc107' },
  { rate: 28, description: 'Luxury goods', color: '#dc3545' }
];

// HSN/SAC Code Categories
export const HSN_CATEGORIES: { [key: string]: string } = {
  'CHAPTER_99': 'Services',
  'CHAPTER_84': 'Petroleum Products',
  'CHAPTER_85': 'Electrical Machinery',
  'CHAPTER_87': 'Electronic Goods',
  'CHAPTER_90': 'Miscellaneous'
};

// Indian States with GST Codes
export const STATE_GST_CODES: { [key: string]: string } = {
  'Andhra Pradesh': '37',
  'Arunachal Pradesh': '12',
  'Assam': '18',
  'Bihar': '10',
  'Chhattisgarh': '22',
  'Goa': '30',
  'Gujarat': '24',
  'Haryana': '06',
  'Himachal Pradesh': '02',
  'Jharkhand': '20',
  'Karnataka': '29',
  'Kerala': '32',
  'Madhya Pradesh': '23',
  'Maharashtra': '27',
  'Manipur': '14',
  'Meghalaya': '17',
  'Mizoram': '15',
  'Nagaland': '13',
  'Odisha': '21',
  'Punjab': '03',
  'Rajasthan': '08',
  'Sikkim': '11',
  'Tamil Nadu': '33',
  'Telangana': '36',
  'Tripura': '16',
  'Uttar Pradesh': '09',
  'Uttarakhand': '05',
  'West Bengal': '19',
  'Andaman and Nicobar Islands': '35',
  'Chandigarh': '04',
  'Dadra and Nagar Haveli and Daman and Diu': '26',
  'Delhi': '07',
  'Jammu and Kashmir': '01',
  'Ladakh': '38',
  'Lakshadweep': '31',
  'Puducherry': '34'
};

// GST Validation Patterns
export const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$/;
export const HSN_PATTERN = /^[0-9]{8}$/;
export const SAC_PATTERN = /^[0-9]{9}$/;

// GST Helper Functions
export function calculateGST(invoiceItem: IndianInvoiceItem, clientState: string, supplyState: string): GSTTaxCalculation {
  const taxableValue = invoiceItem.taxableValue;
  let cgstRate = 0;
  let sgstRate = 0;
  let igstRate = 0;
  
  // Determine tax type based on location
  if (clientState === supplyState) {
    // Intra-state: CGST + SGST
    cgstRate = invoiceItem.cgstRate;
    sgstRate = invoiceItem.sgstRate;
    igstRate = 0;
  } else {
    // Inter-state: IGST
    igstRate = invoiceItem.igstRate || invoiceItem.cgstRate + invoiceItem.sgstRate;
    cgstRate = 0;
    sgstRate = 0;
  }
  
  const cgstAmount = taxableValue * (cgstRate / 100);
  const sgstAmount = taxableValue * (sgstRate / 100);
  const igstAmount = taxableValue * (igstRate / 100);
  const totalGST = cgstAmount + sgstAmount + igstAmount;
  const totalAmount = taxableValue + totalGST;
  
  return {
    taxableValue,
    cgstRate,
    sgstRate,
    igstRate,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalGST,
    totalAmount
  };
}

export function formatGSTAmount(amount: number): string {
  return amount.toFixed(2);
}

export function getGSTColor(rate: number): string {
  const rateObj = GST_RATES.find(r => r.rate === rate);
  return rateObj ? rateObj.color : '#6c757d';
}

export function validateGSTIN(gstin: string): boolean {
  return GSTIN_PATTERN.test(gstin);
}

export function validateHSNCode(hsn: string): boolean {
  return HSN_PATTERN.test(hsn);
}

export function validateSACCode(sac: string): boolean {
  return SAC_PATTERN.test(sac);
}
