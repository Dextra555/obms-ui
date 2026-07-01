export class RbiBankAdvanceExport {
  // RBI Specification Fields
  FieldType: string = '';  // 0-RTGS, 1-NEFT, 2-Fund Transfer, 3-Direct Debit
  TransactionType: string = '';
  BeneficiaryCode: string = '';
  BeneficiaryAccountNumber: string = '';
  TransactionAmount: string = '';
  BeneficiaryName: string = '';
  CustomerReferenceNumber: string = '';
  PayerAccountNo: string = '';
  PayerName: string = '';
  PayerAddress1: string = '';
  PayerAddress2: string = '';
  PayerAddress3: string = '';
  PayerAddress4: string = '';
  PayerAddress5: string = '';
  PayerAddress6: string = '';
  PayerAddress7: string = '';
  PayerAddress8: string = '';
  PayerAddress9: string = '';
  PayerAddress10: string = '';
  ChargeBearer: string = '';
  ValueDate: string = '';  // DD-MM-YYYY format
  IFSCCode: string = '';
  BeneficiaryBankName: string = '';
  BeneficiaryBankBranchName: string = '';
  BeneficiaryEmailId: string = '';

  // Legacy properties for backward compatibility
  FieldName: string = '';
  PaymentDetails1: string = '';
  PaymentDetails2: string = '';
  PaymentDetails3: string = '';
  PaymentDetails4: string = '';
  PaymentDetails5: string = '';
  PaymentDetails6: string = '';
  PaymentDetails7: string = '';
  PaymentDetails8: string = '';
  ChargeMaster: string = '';
  ChequeDate: string = '';
  MICRNumber: string = '';

  setExportData(data: Partial<RbiBankAdvanceExport>): void {
    Object.assign(this, data);
  }
}
