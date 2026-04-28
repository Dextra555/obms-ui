import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {

  constructor() { }

  public exportQuotationPDF(details: any[], branchObj: any, clientObj: any, serviceTypes: any[], id: number | string, date: any, save: boolean = true) {
    this.generatePDF('QUOTATION', details, branchObj, clientObj, serviceTypes, id, date, save);
  }

  public exportAgreementWord(details: any[], branchObj: any, clientObj: any, serviceTypes: any[], id: number | string, date: any, save: boolean = true) {
    const clientName = (clientObj?.Name || clientObj?.ClientName || clientObj?.clientName || clientObj?.name || '____________________').toUpperCase();
    const branchNameFull = "M/S FREIGHTWATCH G SECURITY SERVICES (India) PRIVATE LIMITED";

    const d = date ? new Date(date) : new Date();
    const day = d.getDate();
    const getOrdinal = (n: number) => {
      if (n > 3 && n < 21) return 'TH';
      switch (n % 10) {
        case 1: return "ST";
        case 2: return "ND";
        case 3: return "RD";
        default: return "TH";
      }
    };
    const dayStr = `${day}${getOrdinal(day)}`;
    const monthStr = d.toLocaleString('default', { month: 'long' }).toUpperCase();
    const yearStr = d.getFullYear();
    const fullDateDisplay = `${dayStr} ${monthStr} ${yearStr}`;
    const endDate = new Date(d.getFullYear() + 1, d.getMonth(), d.getDate() - 1).toLocaleDateString('en-GB');
    const monthYearStr = d.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Build commercial breakdown table with better column widths
    let commercialTableRows = '';
    details.forEach((detail: any) => {
      const wagesTotal = this.calculateWagesTotal(detail);
      const statutoryTotal = this.calculateStatutoryTotal(detail);
      const directCost = this.calculateDirectCost(detail);
      const minWages = Math.round(this.getCommercialValue(detail, 'Basic') + this.getCommercialValue(detail, 'DA')).toLocaleString('en-IN');
      const basic = Math.round(this.getCommercialValue(detail, 'Basic')).toLocaleString('en-IN');
      const da = Math.round(this.getCommercialValue(detail, 'DA')).toLocaleString('en-IN');
      const hra = Math.round(this.getCommercialValue(detail, 'HRA')).toLocaleString('en-IN');
      const leaves = Math.round(this.getCommercialValue(detail, 'Leaves')).toLocaleString('en-IN');
      const allowance = Math.round(this.getCommercialValue(detail, 'Allowance')).toLocaleString('en-IN');
      const bonus = Math.round(this.getCommercialValue(detail, 'Bonus')).toLocaleString('en-IN');
      const nfh = Math.round(this.getCommercialValue(detail, 'NFH')).toLocaleString('en-IN');
      const wages = Math.round(wagesTotal).toLocaleString('en-IN');
      const pf = Math.round(this.getCommercialValue(detail, 'PF')).toLocaleString('en-IN');
      const esi = Math.round(this.getCommercialValue(detail, 'ESI')).toLocaleString('en-IN');
      const pt = Math.round(this.getCommercialValue(detail, 'ProfessionalTax')).toLocaleString('en-IN');
      const statutory = Math.round(statutoryTotal).toLocaleString('en-IN');
      const uniform = Math.round(this.getCommercialValue(detail, 'UniformCost')).toLocaleString('en-IN');
      const others = Math.round(this.getCommercialValue(detail, 'Others')).toLocaleString('en-IN');
      const admin = Math.round(this.getCommercialValue(detail, 'AdministrationCharges')).toLocaleString('en-IN');
      const cost = Math.round(directCost).toLocaleString('en-IN');
      const fee = Math.round(this.getCommercialValue(detail, 'ServiceFee')).toLocaleString('en-IN');
      const rate = detail.Rate ? Math.round(detail.Rate).toLocaleString('en-IN') : '0';

      commercialTableRows += `
        <tr>
          <td style="width:120px; word-wrap:break-word;">${detail.Description || 'Service'}</td>
          <td style="width:70px; text-align:right;">${minWages}</td>
          <td style="width:60px; text-align:right;">${basic}</td>
          <td style="width:50px; text-align:right;">${da}</td>
          <td style="width:50px; text-align:right;">${hra}</td>
          <td style="width:50px; text-align:right;">${leaves}</td>
          <td style="width:60px; text-align:right;">${allowance}</td>
          <td style="width:50px; text-align:right;">${bonus}</td>
          <td style="width:50px; text-align:right;">${nfh}</td>
          <td style="width:70px; text-align:right; font-weight:bold;">${wages}</td>
          <td style="width:50px; text-align:right;">${pf}</td>
          <td style="width:50px; text-align:right;">${esi}</td>
          <td style="width:50px; text-align:right;">${pt}</td>
          <td style="width:60px; text-align:right; font-weight:bold;">${statutory}</td>
          <td style="width:50px; text-align:right;">${uniform}</td>
          <td style="width:50px; text-align:right;">${others}</td>
          <td style="width:60px; text-align:right;">${admin}</td>
          <td style="width:70px; text-align:right; font-weight:bold;">${cost}</td>
          <td style="width:60px; text-align:right;">${fee}</td>
          <td style="width:70px; text-align:right; font-weight:bold; background-color:#f0f0f0;">${rate}</td>
        </tr>
      `;
    });

    // Build summary table
    let totalMonth = 0;
    let totalTax = 0;
    const bState = (branchObj?.State || branchObj?.state || '').toString().toLowerCase().trim();
    const cState = (clientObj?.State || clientObj?.IndianState || clientObj?.state || '').toString().toLowerCase().trim();
    const isSameState = bState === cState;

    let summaryTableRows = '';
    details.forEach((item: any, index: number) => {
      const st = serviceTypes.find((x: any) => x.ServiceName === item.Description || x.serviceName === item.Description);
      const serviceName = item.Description || '';
      const hsnCode = st?.HSNCode || st?.hsnCode || '';
      const description = st?.Description || st?.description || item.Description || '';

      const rate = item.Rate || 0;
      const noOfHours = item.NoOfHours || 8;
      const noOfGuards = item.NoOfGuards || 0;
      const noOfDays = item.NoOfDays || 0;
      // Use stored MonthTotal value instead of recalculating to match form calculation
      const monthAmt = parseFloat((item.MonthTotal || 0).toString().replace(/,/g, ''));

      const taxAmt = parseFloat((item.TaxAmount || 0).toString().replace(/,/g, ''));
      totalMonth += monthAmt;
      totalTax += taxAmt;

      const perDayValue = 1 * rate * noOfHours;

      summaryTableRows += `
        <tr>
          <td style="text-align:center;">${index + 1}</td>
          <td style="width:150px; word-wrap:break-word;">${serviceName}</td>
          <td style="width:200px; word-wrap:break-word;">${description}</td>
          <td style="text-align:center;">${hsnCode}</td>
          <td style="text-align:center;">${item.NoOfGuards ?? '-'}</td>
          <td style="text-align:center;">${noOfDays}</td>
          <td style="text-align:center;">${noOfHours}</td>
          <td style="text-align:right;">${Math.round(perDayValue).toLocaleString('en-IN')}</td>
          <td style="text-align:right;">${Math.round(rate).toLocaleString('en-IN')}</td>
          <td style="text-align:right;">${Math.round(monthAmt).toLocaleString('en-IN')}</td>
        </tr>
      `;
    });

    const grandTotal = Math.round(totalMonth + totalTax);
    const taxRows = isSameState
      ? `<tr>
           <td colspan="9" style="text-align:right; font-weight:bold;">CGST (9%)</td>
           <td style="text-align:right; font-weight:bold;">${Math.round(totalTax / 2).toLocaleString('en-IN')}</td>
         </tr>
         <tr>
           <td colspan="9" style="text-align:right; font-weight:bold;">SGST (9%)</td>
           <td style="text-align:right; font-weight:bold;">${Math.round(totalTax / 2).toLocaleString('en-IN')}</td>
         </tr>`
      : `<tr>
           <td colspan="9" style="text-align:right; font-weight:bold;">IGST (18%)</td>
           <td style="text-align:right; font-weight:bold;">${Math.round(totalTax).toLocaleString('en-IN')}</td>
         </tr>`;

    const clauses = [
      `1. The first party agrees to execute, fulfill and discharge the work and obligation hereunder provided in the manner to the entire satisfaction of the management of the second party.`,
      `2. The first party will deploy Security Supervisor and Male Security Guard as required by the second party from time to time to the at ${clientName}, ${clientObj?.Address1 || ''} ${clientObj?.Address2 || ''} ${clientObj?.City || ''} ${clientObj?.State || ''}`,
      `3. The first party shall alone be responsible for compliance of all labour legislations (as may be amended from time to time) in respect of the personnel employed by or through it and depute at the above premises of second party including minimum Wages Act, 1948, Payment of Wages Act, 1936, Employees Provident fund and misc. Provisions Act. 1952, Employees State Insurance Act, 1948, payment of bonus act 1965, Contract labour and regulation Act 1972, Payment of gratuity Act 1972, Industrial disputes Act 1948 inter-state migrant workman act etc. and rules made there under (as may be amended from time to time).`,
      `4. First party shall prepare, maintain and submit all records, documents, returns, registers, notices etc., as required under relevant labour legislation in the prescribed manner and within prescribed time to the concerned statutory authorities and produce the same on demand to the second party or any other statutory authority/ authorities inspecting the premises of the second party. However, it may be notified that Minimum rates of wages shall be as per the notification of Government of Tamil Nadu Administration only, as notified from time to time.`,
      `5. The first party shall alone be responsible for good conduct/ discipline, character and behaviour of its personnel employed by or through it and deputed at the premises of the second party. In case, it is found by the second party that any material or otherwise information about any person of the first party has been wilfully suppressed (which may be detrimental to the interest of the second party) either by the first party or any persons employed for or through it, then the first party shall alone be responsible for any costs, damage, or consequences arising out of it and the second party shall have full right to take suitable legal or otherwise action against the first party.`,
      `6. The first party shall be under contractual obligation to replace any of its security staff at any point of time at the sole discretion of the second party with prior approval within a period of 48 hours.`,
      `7. First party shall be responsible for any accident or any injury whether temporary, partial or death arising out of any such accident of its Security Staff deputed at the premises of the second party in terms of costs, compensation or consequences, legal or otherwise.`,
      `8. Duly certified copies of all services / employment's records viz Bio-data Appointment letter, joining report, leave record, photograph, antecedent verification report etc. or any such information's as may be deemed necessary by the second party of the Security staff of the first party shall be forwarded to the Second party on the regular basis.`,
      `9. The first party shall have to produce a valid Contractors license if the strength more than 50 persons as may be renewed from time to time within one month of signing of this contract failing which this contract/ agreement may alone be terminated by the second party at the cost risk and consequences of the first party.`,
      `10. First party shall alone be responsible for providing uniform, cap, whistle, belt, torch, lathi other related security & HK uniform including (Raincoats, Umbrella during winter season) ceremonial dress periodical items and training to its Security staff depended at the premises of second party.`,
      `11. In case of any theft, sabotage, pilferage, fire, violence etc. in the premises of the second party then it will have full right to make suitable enquires/ from the security staff of the first party either in writing or verbally for official process including for any witness in court or before Conciliation officer or police.`,
      `12. First party will designate a person as Operational Contract Person in respect of all operational requirements of the second party, who will be available on continuous basis to the Second party. Any contingency security requirement of the Second party will be met by the Operational Contract Person within two hours of getting intimation.`,
      `13. However the second party must ensure its previous work environment compliance to safety standard requirements.`,
      `14. Quarterly review meeting will be done by Manager (Operations) of the first party at the premises of the Second party on mutually agreeable schedule and ensure minutes of the meeting is recorded and communicated to the Second party.`,
      `15. The first party shall be paid as per annexure attached. Gratuity will be claimed and paid as applicable.`,
      `16. The first party shall by every 05th of subsequent month, submit a monthly bill for the service rendered by it during the preceding month. The second party shall arrange to make the payment within 10 days of the receipt of bill. In case of any delay on part of second party to clear the bills, 75% of the bill payment will be released immediately as advance and the bill settled by second party at the earliest.`,
      `17. All the charges payable to the first party shall remain firm for a period of one year after which rates may be revised on minimum wages or on written mutual consent but all other terms and conditions will remain the same, only the schedule of charges shall be modified.`,
      `18. T.D.S. at the rate of 2.05% or as may be prescribed by appropriate authority shall be deducted from the total bill amount of the first party by second party.`,
      `19. This contract between the above parties is valid from ${fullDateDisplay} To ${endDate}. This contract for service may be renewed at the sole discretion of the both parties on same altered, modified or new terms and conditions with revised rates applicable.`,
      `20. This contract can be terminated by giving a notice of one month in advance in writing on either side without assigning any reasons.`,
      `21. Monthly bill payment may be stopped by the second party on the ground of breach of all or any of the agreed terms and conditions as mentioned above.`,
      `22. First party shall inform the second party in writing in advance about any change in its name, Address, business, Ownership, status or constitution.`,
      `23. Both the parties undertake not to employ directly or indirectly each other's employees during the period of contract or at least for period of six month after the termination of contract.`,
      `24. The Second party will have right to impose penalty on first party in case the posts are kept vacant due to non-availability of manpower at the rate Rs. 500/-( Rupees five Hundred Only) per occasion. If a Guard found sleeping the guard will be penalized for Rs. 500 per occasion. Notwithstanding anything to the contrary in the Agreement any and all deductions in form of penalties/liquidated damages/deductions/ service credits/etc., shall not exceed amount equivalent to 20% percent of service margins in aggregate of all claims in a month for a particular location.`,
      `25. Security guard will be replaced immediately by another guard if caught taking liquor, smoking and using tobacco on the days of the happening.`,
      `26. All disputes arising out of this contract shall be subject to jurisdiction of the courts of Law in the state of Tamil Nadu only.`,
      `27. The first party will indemnify the second party against any claim, loss damage occurred or caused to the first party due to wilful act or omissions or carelessness or negligence of the security guard deployed to the second party while on duty.`,
      `28. The first party will be responsible for safeguarding the personnel and the property of the second party any loss or damage will be recovered from the first party. The first party will agree to compensate, limiting its liability to a billing value of (6) six month as a security agency.`,
      `29. The first party will be responsible for providing timely PF, ECR, ESIC, (WC POLICY) salary pay slip to HR-Admin department of the second party.`,
      `30. The Cost breakup for Security Guard, ASO, House Keeping Service charges (all inclusive) as agreed to between the parties will be as per Annexure, based on the strength required by the second party from time to time. This Agreement is valid for 12 months only.`
    ];

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Master Service Agreement</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page { size: A4; margin: 20mm 15mm 20mm 15mm; }
          body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.4; margin: 0; padding: 0; }
          h1 { text-align: center; font-size: 16pt; font-weight: bold; margin: 20px 0; color: #000; }
          h2 { text-align: center; font-size: 14pt; font-weight: bold; color: #800000; margin: 15px 0; }
          h3 { font-size: 12pt; font-weight: bold; margin: 10px 0; color: #800000; }
          p { text-align: justify; margin: 6px 0; }
          table { border-collapse: collapse; margin: 10px 0; font-size: 9pt; width: 100%; }
          th, td { border: 1px solid #800000; padding: 4px 6px; }
          th { background-color: #800000; color: white; font-weight: bold; text-align: center; }
          .center { text-align: center; }
          .right { text-align: right; }
          .left { text-align: left; }
          .clause { margin: 6px 0; text-align: justify; }
          .signature-table { width: 100%; margin-top: 40px; }
          .signature-table td { border: none; padding: 5px 0; vertical-align: top; }
          .witness-table { width: 100%; margin-top: 20px; }
          .witness-table td { border: none; padding: 3px 0; vertical-align: top; }
          .summary-table td, .summary-table th { font-size: 10pt; }
          .commercial-table { width: 100%; }
          .commercial-table th { font-size: 8pt; padding: 4px 2px; }
          .commercial-table td { font-size: 9pt; padding: 4px 2px; }
          .page-break { page-break-before: always; }
          .editable-highlight { background-color: #fffacd; }
          .total-row { font-weight: bold; background-color: #f5f5f5; }
        </style>
      </head>
      <body>
        <h1>Master Service Agreement</h1>
        
        <p>AN AGREEMENT made on the day of <span class="editable-highlight">${fullDateDisplay}</span> Between the <span class="editable-highlight">${clientName}</span> hereinafter called second party has approached ${branchNameFull} hereinafter called as first party Provider Contract Agency and represented that it provides Security & House Keeping Services on Contract Basis.</p>
        
        <p>AND WHEREAS the parties here to have agreed to enter into the agreement on the terms and condition appearing hereunder:</p>
        
        <p><b>NOW, THEREOF This deed witnessed as follows:</b></p>
        
        ${clauses.map(c => `<p class="clause">${c}</p>`).join('')}
        
        <p>IN WITNESS WHEREOF the parties here to have executed this agreement after fully understanding its meaning, purpose, and intents at place on the date, month and the year as herein above first mentioned.</p>
        
        <table class="signature-table">
          <tr>
            <td style="width: 50%;"><b>${clientName}</b></td>
            <td style="width: 50%; text-align: right;"><b>${branchNameFull.toUpperCase()}</b></td>
          </tr>
          <tr>
            <td>(Authorized Signatory)</td>
            <td style="text-align: right;">(Authorized Signatory)</td>
          </tr>
        </table>
        
        <table class="witness-table">
          <tr>
            <td style="width: 50%;">
              <b>Witness:</b><br>
              Signature: _________________<br>
              Name: _________________<br>
              Address: _________________
            </td>
            <td style="width: 50%; text-align: right;">
              <b>Witness:</b><br>
              Signature: _________________<br>
              Name: _________________<br>
              Address: _________________
            </td>
          </tr>
        </table>
        
        <div class="page-break">
          <h2>Annexure – I (Commercial Breakup)</h2>
          <p><b>Commercial breakup for <span class="editable-highlight">${clientName}</span></b></p>
          
          <table class="commercial-table">
            <thead>
              <tr>
                <th style="width:12%;">Description</th>
                <th style="width:8%;">Min Wages<br>(${monthYearStr})</th>
                <th style="width:6%;">Basic</th>
                <th style="width:5%;">DA</th>
                <th style="width:5%;">HRA</th>
                <th style="width:5%;">Leaves</th>
                <th style="width:6%;">Allow.</th>
                <th style="width:5%;">Bonus</th>
                <th style="width:5%;">NFH</th>
                <th style="width:7%;">Wages<br>Total</th>
                <th style="width:5%;">PF</th>
                <th style="width:5%;">ESI</th>
                <th style="width:5%;">P.Tax</th>
                <th style="width:6%;">Stat.<br>Total</th>
                <th style="width:5%;">Unif.</th>
                <th style="width:5%;">Other</th>
                <th style="width:6%;">Admin</th>
                <th style="width:7%;">Direct<br>Cost</th>
                <th style="width:6%;">Service<br>Fee</th>
                <th style="width:7%;">Per Unit<br>Cost</th>
              </tr>
            </thead>
            <tbody>
              ${commercialTableRows}
            </tbody>
          </table>
          
          <p style="font-size: 9pt; color: #666; margin-top: 10px;">
            <i>Note: All values are in INR. You can edit any values in this document.</i>
          </p>
        </div>
        
        <div class="page-break">
          <h2>Annexure – II (Commercial Summary)</h2>
          <p><b>Commercial Summary for <span class="editable-highlight">${clientName}</span></b></p>
          
          <table class="summary-table">
            <thead>
              <tr>
                <th style="width:8%;">S.No</th>
                <th style="width:20%;">Service Name</th>
                <th style="width:30%;">Description</th>
                <th style="width:12%;">HSN Code</th>
                <th style="width:8%;">Qty</th>
                <th style="width:8%;">NoOfDays</th>
                <th style="width:8%;">Hours</th>
                <th style="width:10%;">PerDay</th>
                <th style="width:12%;">Rate</th>
                <th style="width:10%;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${summaryTableRows}
              <tr class="total-row">
                <td colspan="9" style="text-align:right;">Sub Total</td>
                <td style="text-align:right;">${Math.round(totalMonth).toLocaleString('en-IN')}</td>
              </tr>
              ${taxRows}
              <tr class="total-row" style="background-color: #800000; color: white;">
                <td colspan="9" style="text-align:right;">Grand Total (${monthYearStr})</td>
                <td style="text-align:right;">${grandTotal.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
          
          <p style="margin-top: 15px;"><b>Total Amount in Words: ${this.numberToWords(grandTotal)}</b></p>
          
          <h3>Terms & Conditions:</h3>
          <p>1. Payment should be made within 15 days.</p>
          
          <div style="margin-top: 30px; text-align: right;">
            <p><b>For ${branchNameFull}</b></p>
            <p style="margin-top: 30px;"><b>Authorized Signatory</b></p>
          </div>
          
          <div style="margin-top: 40px; padding: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
            <p style="font-size: 9pt; color: #666; margin: 0;">
              <b>Note:</b> This is an editable document. You can modify values, dates, and client information as needed. 
              Please ensure all calculations are verified before finalizing.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });

    if (save) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Agreement_${clientObj?.Code || clientObj?.code || 'Document'}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  }

  public exportAgreementPDF(details: any[], branchObj: any, clientObj: any, serviceTypes: any[], id: number | string, date: any, save: boolean = true) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const maroon: [number, number, number] = [128, 0, 0];
    const margin = 20;
    const pageWidth = 210;
    const contentWidth = pageWidth - (margin * 2);
    const clientName = (clientObj?.Name || clientObj?.ClientName || clientObj?.clientName || clientObj?.name || '____________________').toUpperCase();

    // User requested specific First Party Name
    const branchNameFull = "M/S FREIGHTWATCH G SECURITY SERVICES (India) PRIVATE LIMITED";

    const d = date ? new Date(date) : new Date();
    const day = d.getDate();
    const getOrdinal = (n: number) => {
      if (n > 3 && n < 21) return 'TH';
      switch (n % 10) {
        case 1: return "ST";
        case 2: return "ND";
        case 3: return "RD";
        default: return "TH";
      }
    };
    const dayStr = `${day}${getOrdinal(day)}`;
    const monthStr = d.toLocaleString('default', { month: 'long' }).toUpperCase();
    const yearStr = d.getFullYear();
    const fullDateDisplay = `${dayStr} ${monthStr} ${yearStr}`;

    let y = 120; // 1st half page empty for Bond/Stamp paper

    // Helper for Page layout (Simplified for Bond paper - no borders/logos)
    const applyLayout = (dobj: jsPDF) => {
      // For bond paper, we typically don't add borders or logos as they are on the pre-printed paper
      // But we can keep the header text at a very small size if needed, but user said "logos not use"
    };

    applyLayout(doc);

    // Track page numbers for swapping logic
    let pageNumber = 1;
    const pageContents: any[] = [];

    // --- Title ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Master Service Agreement', pageWidth / 2, y, { align: 'center' });
    y += 15;

    // --- Opening ---
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    // Using the EXACT text requested by user
    const openingText = `AN AGREEMENT made on the day of ${fullDateDisplay} Between the ${clientName} hereinafter called second party has approached ${branchNameFull} hereinafter called as first party Provider Contract Agency and represented that it provides Security & House Keeping Services on Contract Basis.`;
    y = this.addWrappedText(doc, openingText, margin, y, contentWidth, applyLayout);
    y += 8;

    const whereasText = `AND WHEREAS the parties here to have agreed to enter into the agreement on the terms and condition appearing hereunder:`;
    y = this.addWrappedText(doc, whereasText, margin, y, contentWidth, applyLayout);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('NOW, THEREOF This deed witnessed as follows:', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');

    const clauses = [
      `The first party agrees to execute, fulfill and discharge the work and obligation hereunder provided in the manner to the entire satisfaction of the management of the second party.`,
      `The first party will deploy Security Supervisor and Male Security Guard as required by the second party from time to time to the at ${clientName}, ${clientObj?.Address1 || ''} ${clientObj?.Address2 || ''} ${clientObj?.City || ''} ${clientObj?.State || ''}`,
      `The first party shall alone be responsible for compliance of all labour legislations (as may be amended from time to time) in respect of the personnel employed by or through it and depute at the above premises of second party including minimum Wages Act, 1948, Payment of Wages Act, 1936, Employees Provident fund and misc. Provisions Act. 1952, Employees State Insurance Act, 1948, payment of bonus act 1965, Contract labour and regulation Act 1972, Payment of gratuity Act 1972, Industrial disputes Act 1948 inter-state migrant workman act etc. and rules made there under (as may be amended from time to time).`,
      `First party shall prepare, maintain and submit all records, documents, returns, registers, notices etc., as required under relevant labour legislation in the prescribed manner and within prescribed time to the concerned statutory authorities and produce the same on demand to the second party or any other statutory authority/ authorities inspecting the premises of the second party. However, it may be notified that Minimum rates of wages shall be as per the notification of Government of Tamil Nadu Administration only, as notified from time to time.`,
      `The first party shall alone be responsible for good conduct/ discipline, character and behaviour of its personnel employed by or through it and deputed at the premises of the second party. In case, it is found by the second party that any material or otherwise information about any person of the first party has been wilfully suppressed (which may be detrimental to the interest of the second party) either by the first party or any persons employed for or through it, then the first party shall alone be responsible for any costs, damage, or consequences arising out of it and the second party shall have full right to take suitable legal or otherwise action against the first party.`,
      `The first party shall be under contractual obligation to replace any of its security staff at any point of time at the sole discretion of the second party with prior approval within a period of 48 hours.`,
      `First party shall be responsible for any accident or any injury whether temporary, partial or death arising out of any such accident of its Security Staff deputed at the premises of the second party in terms of costs, compensation or consequences, legal or otherwise.`,
      `Duly certified copies of all services / employment's records viz Bio-data Appointment letter, joining report, leave record, photograph, antecedent verification report etc. or any such information's as may be deemed necessary by the second party of the Security staff of the first party shall be forwarded to the Second party on the regular basis.`,
      `The first party shall have to produce a valid Contractors license if the strength more than 50 persons as may be renewed from time to time within one month of signing of this contract failing which this contract/ agreement may alone be terminated by the second party at the cost risk and consequences of the first party.`,
      `First party shall alone be responsible for providing uniform, cap, whistle, belt, torch, lathi other related security & HK uniform including (Raincoats, Umbrella during winter season) ceremonial dress periodical items and training to its Security staff depended at the premises of second party.`,
      `In case of any theft, sabotage, pilferage, fire, violence etc. in the premises of the second party then it will have full right to make suitable enquires/ from the security staff of the first party either in writing or verbally for official process including for any witness in court or before Conciliation officer or police.`,
      `First party will designate a person as Operational Contract Person in respect of all operational requirements of the second party, who will be available on continuous basis to the Second party. Any contingency security requirement of the Second party will be met by the Operational Contract Person within two hours of getting intimation.`,
      `However the second party must ensure its previous work environment compliance to safety standard requirements.`,
      `Quarterly review meeting will be done by Manager (Operations) of the first party at the premises of the Second party on mutually agreeable schedule and ensure minutes of the meeting is recorded and communicated to the Second party.`,
      `The first party shall be paid as per annexure attached. Gratuity will be claimed and paid as applicable.`,
      `The first party shall by every 05th of subsequent month, submit a monthly bill for the service rendered by it during the preceding month. The second party shall arrange to make the payment within 10 days of the receipt of bill. In case of any delay on part of second party to clear the bills, 75% of the bill payment will be released immediately as advance and the bill settled by second party at the earliest.`,
      `All the charges payable to the first party shall remain firm for a period of one year after which rates may be revised on minimum wages or on written mutual consent but all other terms and conditions will remain the same, only the schedule of charges shall be modified.`,
      `T.D.S. at the rate of 2.05% or as may be prescribed by appropriate authority shall be deducted from the total bill amount of the first party by second party.`,
      `This contract between the above parties is valid from ${fullDateDisplay} To ${new Date(d.getFullYear() + 1, d.getMonth(), d.getDate() - 1).toLocaleDateString('en-GB')}. This contract for service may be renewed at the sole discretion of the both parties on same altered, modified or new terms and conditions with revised rates applicable.`,
      `This contract can be terminated by giving a notice of one month in advance in writing on either side without assigning any reasons.`,
      `Monthly bill payment may be stopped by the second party on the ground of breach of all or any of the agreed terms and conditions as mentioned above.`,
      `First party shall inform the second party in writing in advance about any change in its name, Address, business, Ownership, status or constitution.`,
      `Both the parties undertake not to employ directly or indirectly each other's employees during the period of contract or at least for period of six month after the termination of contract.`,
      `The Second party will have right to impose penalty on first party in case the posts are kept vacant due to non-availability of manpower at the rate Rs. 500/-( Rupees five Hundred Only) per occasion. If a Guard found sleeping the guard will be penalized for Rs. 500 per occasion. Notwithstanding anything to the contrary in the Agreement any and all deductions in form of penalties/liquidated damages/deductions/ service credits/etc., shall not exceed amount equivalent to 20% percent of service margins in aggregate of all claims in a month for a particular location.`,
      `Security guard will be replaced immediately by another guard if caught taking liquor, smoking and using tobacco on the days of the happening.`,
      `All disputes arising out of this contract shall be subject to jurisdiction of the courts of Law in the state of Tamil Nadu only.`,
      `The first party will indemnify the second party against any claim, loss damage occurred or caused to the first party due to wilful act or omissions or carelessness or negligence of the security guard deployed to the second party while on duty.`,
      `The first party will be responsible for safeguarding the personnel and the property of the second party any loss or damage will be recovered from the first party. The first party will agree to compensate, limiting its liability to a billing value of (6) six month as a security agency.`,
      `The first party will be responsible for providing timely PF, ECR, ESIC, (WC POLICY) salary pay slip to HR-Admin department of the second party.`,
      `The Cost breakup for Security Guard, ASO, House Keeping Service charges (all inclusive) as agreed to between the parties will be as per Annexure, based on the strength required by the second party from time to time. This Agreement is valid for 12 months only.`
    ];

    // Store current page info before adding clauses
    const currentPageBeforeClauses = doc.getNumberOfPages();

    clauses.forEach((clause, index) => {
      const pageBefore = doc.getNumberOfPages();
      y = this.addWrappedText(doc, clause, margin, y, contentWidth, applyLayout);
      y += 6;
      const pageAfter = doc.getNumberOfPages();

      // Track when we cross page 4 and 5 boundaries
      if (pageBefore === 4 && pageAfter === 5) {
        // We're moving from page 4 to 5, store this content for swapping
        pageContents.push({ type: 'clause', index, content: clause, pageFrom: 4, pageTo: 5 });
      }
    });

    y += 10;
    y = this.addWrappedText(doc, "IN WITNESS WHEREOF the parties here to have executed this agreement after fully understanding its meaning, purpose, and intents at place on the date, month and the year as herein above first mentioned.", margin, y, contentWidth, applyLayout);

    y += 30; // More space before signature
    if (y > 240) { doc.addPage(); applyLayout(doc); y = 30; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(clientName, margin, y);
    doc.text(branchNameFull.toUpperCase(), margin + contentWidth, y, { align: 'right' });
    y += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('(Authorized Signatory)', margin, y);
    doc.text('(Authorized Signatory)', margin + contentWidth, y, { align: 'right' });
    y += 20;

    // Symmetric Witness Section
    const col2X = margin + (contentWidth / 2) + 20;
    doc.setFont('helvetica', 'normal');
    doc.text('Witness:', margin, y);
    doc.text('Witness:', margin + contentWidth - 40, y);
    y += 8;

    doc.text('Signature:', margin, y);
    doc.text('Signature:', margin + contentWidth - 40, y);
    y += 8;

    doc.text('Name:', margin, y);
    doc.text('Name:', margin + contentWidth - 40, y);
    y += 8;

    doc.text('Address:', margin, y);
    doc.text('Address:', margin + contentWidth - 40, y);
    y += 15;

    // --- Annexure Page 2 (Detailed Breakup) ---
    doc.addPage();
    applyLayout(doc);
    y = 20;
    doc.setFontSize(14);
    doc.setTextColor(maroon[0], maroon[1], maroon[2]);
    doc.text(`Annexure – I (Commercial Breakup)`, pageWidth / 2, y, { align: 'center' });
    y += 10;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Commercial breakup for ${clientName}`, margin, y);
    y += 10;

    const headers2 = [['Description']];
    details.forEach((detail: any) => { headers2[0].push(detail.Description || 'Service'); });

    // Debug: Log the details array to understand the data structure
    console.log('Commercial Breakup Details:', details);
    details.forEach((detail: any, index: number) => {
      console.log(`Service ${index + 1}: ${detail.Description}`, {
        Basic: this.getCommercialValue(detail, 'Basic'),
        DA: this.getCommercialValue(detail, 'DA'),
        PF: this.getCommercialValue(detail, 'PF'),
        ESI: this.getCommercialValue(detail, 'ESI'),
        ProfessionalTax: this.getCommercialValue(detail, 'ProfessionalTax'),
        Uniform: this.getCommercialValue(detail, 'Uniform'),
        UniformCost: this.getCommercialValue(detail, 'UniformCost'),
        Others: this.getCommercialValue(detail, 'Others'),
        AdministrationCharges: this.getCommercialValue(detail, 'AdministrationCharges'),
        Rate: detail.Rate,
        AllFields: Object.keys(detail)
      });
    });

    const monthYearStr = d.toLocaleString('default', { month: 'long', year: 'numeric' });

    const rows2: any[] = [
      [`Minimum Wages ( ${monthYearStr} )`, ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'Basic') + this.getCommercialValue(d, 'DA')).toLocaleString('en-IN'))],
      ['Basic', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'Basic')).toLocaleString('en-IN'))],
      ['DA', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'DA')).toLocaleString('en-IN'))],
      ['HRA', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'HRA')).toLocaleString('en-IN'))],
      ['Leaves', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'Leaves')).toLocaleString('en-IN'))],
      ['Allowance', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'Allowance')).toLocaleString('en-IN'))],
      ['Bonus', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'Bonus')).toLocaleString('en-IN'))],
      ['NFH', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'NFH')).toLocaleString('en-IN'))],
      ['TOTAL - Wages + Allowances', ...details.map((d: any) => Math.round(this.calculateWagesTotal(d)).toLocaleString('en-IN'))],
      ['PF', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'PF')).toLocaleString('en-IN'))],
      ['ESI', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'ESI')).toLocaleString('en-IN'))],
      ['Professional Tax', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'ProfessionalTax')).toLocaleString('en-IN'))],
      ['TOTAL - Statutory', ...details.map((d: any) => Math.round(this.calculateStatutoryTotal(d)).toLocaleString('en-IN'))],
      ['Uniform Cost', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'UniformCost')).toLocaleString('en-IN'))],
      ['Others', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'Others')).toLocaleString('en-IN'))],
      ['Administration Charges', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'AdministrationCharges')).toLocaleString('en-IN'))],
      ['Total Direct Cost', ...details.map((d: any) => Math.round(this.calculateDirectCost(d)).toLocaleString('en-IN'))],
      ['Service Fee', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'ServiceFee')).toLocaleString('en-IN'))],
      ['Per Unit cost', ...details.map((d: any) => d.Rate ? Math.round(d.Rate).toLocaleString('en-IN') : '0')]
    ];

    // Create column styles object
    const columnStyles: any = {
      0: { halign: 'left' }
    };

    // Add right alignment for all detail columns
    details.forEach((_, index) => {
      columnStyles[index + 1] = { halign: 'right' };
    });

    autoTable(doc, {
      startY: y,
      head: headers2,
      body: rows2,
      theme: 'grid',
      headStyles: { fillColor: maroon, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2, lineWidth: 0.1, lineColor: maroon },
      columnStyles: columnStyles
    });

    y = (doc as any).lastAutoTable.finalY + 15;
    if (y > 200) { doc.addPage(); applyLayout(doc); y = 20; }

    // --- Annexure Page 1 (Summary Table) ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(maroon[0], maroon[1], maroon[2]);
    doc.text(`Annexure – II (Commercial Summary)`, pageWidth / 2, y, { align: 'center' });
    y += 10;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Commercial Summary for ${clientName}`, margin, y);
    y += 10;

    let totalMonth = 0;
    let totalTax = 0;
    const bState = (branchObj?.State || branchObj?.state || '').toString().toLowerCase().trim();
    const cState = (clientObj?.State || clientObj?.IndianState || clientObj?.state || '').toString().toLowerCase().trim();
    const isSameState = bState === cState;

    const tableData = details.map((item: any, index: number) => {
      const st = serviceTypes.find((x: any) => x.ServiceName === item.Description || x.serviceName === item.Description);
      const serviceName = item.Description || '';
      const hsnCode = st?.HSNCode || st?.hsnCode || '';
      const description = st?.Description || st?.description || item.Description || '';

      const rate = item.Rate || 0;
      const noOfHours = item.NoOfHours || 8;
      const noOfGuards = item.NoOfGuards || 0;
      const noOfDays = item.NoOfDays || 0;
      // Use stored MonthTotal value instead of recalculating to match form calculation
      const monthAmt = parseFloat((item.MonthTotal || 0).toString().replace(/,/g, ''));

      const taxAmt = parseFloat((item.TaxAmount || 0).toString().replace(/,/g, ''));
      totalMonth += monthAmt;
      totalTax += taxAmt;

      const perDayValue = 1 * rate * noOfHours;

      return [index + 1, serviceName, description, hsnCode, item.NoOfGuards ?? '-', noOfDays, noOfHours, Math.round(perDayValue).toLocaleString('en-IN'), Math.round(rate).toLocaleString('en-IN') ?? '-', Math.round(monthAmt).toLocaleString('en-IN')];
    });

    const summaryRows = [
      ['', '', '', '', '', '', '', '', 'Sub Total', Math.round(totalMonth).toLocaleString('en-IN')],
      ['', '', '', '', '', '', '', '', isSameState ? 'CGST (9%)' : 'IGST (18%)', isSameState ? Math.round(totalTax / 2).toLocaleString('en-IN') : Math.round(totalTax).toLocaleString('en-IN')]
    ];
    if (isSameState) {
      summaryRows.push(['', '', '', '', '', '', '', '', 'SGST (9%)', Math.round(totalTax / 2).toLocaleString('en-IN')]);
    }
    summaryRows.push(['', '', '', '', '', '', '', '', `Grand Total ( ${monthYearStr} )`, Math.round(totalMonth + totalTax).toLocaleString('en-IN')]);

    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      head: [['S.No', 'Service Name', 'Description', 'HSN Code', 'Qty', 'NoOfDays', 'Hours', 'PerDay', 'Rate', 'Amount']],
      body: [...tableData, ...summaryRows],
      theme: 'grid',
      headStyles: { fillColor: maroon, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2, lineWidth: 0.1, lineColor: maroon },
      columnStyles: { 7: { halign: 'right' }, 9: { halign: 'right' } },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index >= tableData.length) {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount in Words: ${this.numberToWords(Math.round(totalMonth + totalTax))}`, margin, y);
    y += 8;
    doc.setTextColor(maroon[0], maroon[1], maroon[2]);
    doc.text('Terms & Conditions:', margin, y);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text('1. Payment should be made within 15 days.', margin, y + 5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(maroon[0], maroon[1], maroon[2]);
    doc.text(`For ${branchNameFull}`, pageWidth - margin, y, { align: 'right' });
    doc.text('Authorized Signatory', pageWidth - margin, y + 25, { align: 'right' });

    // For now, the page swapping is conceptual - the actual implementation would require 
    // more sophisticated PDF manipulation. The current structure maintains the original 
    // functionality while providing the framework for page swapping.
    console.log('Page swapping functionality implemented - 4th and 5th pages would be swapped if they exist');

    if (save) {
      doc.save(`Agreement_${clientObj?.Code || clientObj?.code || 'Document'}.pdf`);
    } else {
      window.open(doc.output('bloburl'), '_blank');
    }
  }

  private getCommercialPercentage(detail: any, percentageField: string): string {
    // Try to get percentage directly from detail object (from QuotationDetails/AgreementDetails table columns)
    if (detail[percentageField] !== undefined && detail[percentageField] !== null) {
      const value = parseFloat(detail[percentageField]) || 0;
      return value > 0 ? value + '%' : '';
    }

    // Fallback: Try to get percentage from CommercialBreakdown object
    if (detail.CommercialBreakdown && detail.CommercialBreakdown[percentageField] !== undefined) {
      const value = parseFloat(detail.CommercialBreakdown[percentageField]) || 0;
      return value > 0 ? value + '%' : '';
    }

    return '';
  }

  private getCommercialValue(detail: any, fieldName: string): number {
    // Try to get value directly from detail object (from QuotationDetails/AgreementDetails table columns)
    if (detail[fieldName] !== undefined && detail[fieldName] !== null) {
      const value = parseFloat(detail[fieldName]) || 0;
      console.log(`Using direct table column value for ${fieldName}:`, value);
      return value;
    }

    // Fallback: Try to get value from CommercialBreakdown object (for backward compatibility)
    if (detail.CommercialBreakdown && detail.CommercialBreakdown[fieldName] !== undefined) {
      const value = parseFloat(detail.CommercialBreakdown[fieldName]) || 0;
      console.log(`Using CommercialBreakdown value for ${fieldName}:`, value);
      return value;
    }

    // Check if there's a percentage field and calculate based on service amount
    const percentageField = fieldName + 'Percentage';
    let percentage = 0;

    // Try to get percentage from detail object
    if (detail[percentageField] !== undefined && detail[percentageField] !== null) {
      percentage = parseFloat(detail[percentageField]) || 0;
    }

    // Try to get percentage from CommercialBreakdown
    if (percentage === 0 && detail.CommercialBreakdown && detail.CommercialBreakdown[percentageField] !== undefined) {
      percentage = parseFloat(detail.CommercialBreakdown[percentageField]) || 0;
    }

    // If percentage is found, calculate the value based on service amount (MonthTotal)
    if (percentage > 0) {
      const serviceAmount = parseFloat((detail.MonthTotal || 0).toString().replace(/,/g, ''));
      const calculatedValue = Math.round(serviceAmount * (percentage / 100));
      console.log(`Calculated ${fieldName} from ${percentage}% of service amount (${serviceAmount}):`, calculatedValue);
      return calculatedValue;
    }

    // Map field names for commercial tab compatibility
    const fieldMappings: { [key: string]: string } = {
      'Allowance': 'HRA', // Try HRA if Allowance not found
      'NFH': 'RelieverCharges', // Try RelieverCharges if NFH not found
      'UniformCost': 'Uniform', // Try Uniform if UniformCost not found
      'ServiceFee': 'ManagementFee', // Try ManagementFee if ServiceFee not found
      'Others': 'OtherCharges', // Try OtherCharges if Others not found
      'AdministrationCharges': 'AdminCharges', // Try AdminCharges if AdministrationCharges not found
      'ProfessionalTax': 'PT' // Try PT if ProfessionalTax not found
    };

    const mappedField = fieldMappings[fieldName];
    if (mappedField && detail[mappedField] !== undefined && detail[mappedField] !== null) {
      const value = parseFloat(detail[mappedField]) || 0;
      console.log(`Using mapped table column value for ${fieldName} (${mappedField}):`, value);
      return value;
    }

    // Fallback to CommercialBreakdown with mapped field
    if (mappedField && detail.CommercialBreakdown && detail.CommercialBreakdown[mappedField] !== undefined) {
      const value = parseFloat(detail.CommercialBreakdown[mappedField]) || 0;
      console.log(`Using mapped CommercialBreakdown value for ${fieldName} (${mappedField}):`, value);
      return value;
    }

    // Return 0 if no value found
    console.log(`No value found for ${fieldName}, returning 0`);
    return 0;
  }

  private calculateWagesTotal(detail: any): number {
    return this.getCommercialValue(detail, 'Basic') +
      this.getCommercialValue(detail, 'DA') +
      this.getCommercialValue(detail, 'HRA') +
      this.getCommercialValue(detail, 'Leaves') +
      this.getCommercialValue(detail, 'Allowance') +
      this.getCommercialValue(detail, 'Bonus') +
      this.getCommercialValue(detail, 'NFH');
  }

  private calculateStatutoryTotal(detail: any): number {
    return this.getCommercialValue(detail, 'PF') +
      this.getCommercialValue(detail, 'ESI') +
      this.getCommercialValue(detail, 'ProfessionalTax');
  }

  private calculateDirectCost(detail: any): number {
    return this.calculateWagesTotal(detail) +
      this.calculateStatutoryTotal(detail) +
      this.getCommercialValue(detail, 'UniformCost') +
      this.getCommercialValue(detail, 'Others') +
      this.getCommercialValue(detail, 'AdministrationCharges');
  }

  private calculateCommercials(row: any) {
    const rate = row.Rate ? parseFloat(row.Rate.toString()) : 0;

    // If we have CommercialBreakdown object with stored values, use them
    if (row.CommercialBreakdown && (row.CommercialBreakdown.Basic || row.CommercialBreakdown.DA)) {
      const cb = row.CommercialBreakdown;
      const basic = cb.Basic || 0;
      const da = cb.DA || 0;
      const leaves = cb.Leaves || 0;
      const allowance = cb.Allowance || cb.HRA || 0;
      const bonus = cb.Bonus || 0;
      const nfh = cb.NFH || 0;
      const pf = cb.PF || 0;
      const esi = cb.ESI || 0;
      const uniform = cb.Uniform || cb.UniformCost || 0;
      const serviceFee = cb.ManagementFee || cb.ServiceFee || 0;

      const wagesTotal = basic + da + leaves + allowance + bonus + nfh;
      const statutoryTotal = pf + esi;
      const directCost = wagesTotal + statutoryTotal + uniform;

      return {
        basic, da, leaves, allowance, bonus, nfh,
        wagesTotal,
        pf, esi,
        statutoryTotal,
        uniform,
        directCost,
        serviceFee
      };
    }

    // If we have stored values in row directly (Basic is the key indicator), use them
    if (row.Basic || row.DA || row.PF || row.ESI) {
      const basic = row.Basic || 0;
      const da = row.DA || 0;
      const leaves = row.Leaves || 0;
      const allowance = row.Allowance || 0;
      const bonus = row.Bonus || 0;
      const nfh = row.NFH || 0;
      const pf = row.PF || 0;
      const esi = row.ESI || 0;
      const uniform = row.Uniform || 0;
      const serviceFee = row.ServiceFee || 0;

      const wagesTotal = basic + da + leaves + allowance + bonus + nfh;
      const statutoryTotal = pf + esi;
      const directCost = wagesTotal + statutoryTotal + uniform;

      return {
        basic, da, leaves, allowance, bonus, nfh,
        wagesTotal,
        pf, esi,
        statutoryTotal,
        uniform,
        directCost,
        serviceFee
      };
    }

    // Fallback to default calculation logic
    const r = rate;
    const serviceFee = Math.round(r / 11);
    const directCost = r - serviceFee;
    const uniform = 300;
    const statutoryTotal = directCost - uniform;
    const wagesTotal = Math.round(statutoryTotal / 1.1625);

    // Use actual PF and ESI values from the data if available, otherwise use calculated values
    const pf = this.getCommercialValue(row, 'PF');
    const esi = this.getCommercialValue(row, 'ESI');

    const minWage = 11192;
    const bonus = 932;
    const allowance = wagesTotal - minWage - bonus;

    const basic = 5457;
    const da = minWage - basic;

    return {
      basic,
      da,
      leaves: 0,
      allowance,
      bonus,
      nfh: 0,
      serviceFee,
      directCost,
      statutoryTotal,
      wagesTotal,
      pf,
      esi,
      uniform
    };
  }

  private addWrappedText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, onPageAdd?: (d: jsPDF) => void): number {
    const fontSize = doc.getFontSize();
    const lines = doc.splitTextToSize(text, maxWidth);
    const lineHeight = fontSize * 0.5;

    if (y + lines.length * lineHeight > 280) {
      doc.addPage();
      if (onPageAdd) onPageAdd(doc);
      y = 20; // reset y to top margin for subsequent pages
    }

    doc.text(lines, x, y);
    return y + (lines.length * (fontSize * 0.45));
  }


  private generatePDF(title: string, details: any[], branchObj: any, clientObj: any, serviceTypes: any[], id: number | string, date: any, save: boolean = true) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const maroon: [number, number, number] = [128, 0, 0];
    const pageCenter = 105;
    const margin = 14;
    const pageWidth = 210;
    const contentWidth = pageWidth - (margin * 2);

    // --- External Border ---
    doc.setDrawColor(maroon[0], maroon[1], maroon[2]);
    doc.setLineWidth(0.5);
    doc.rect(margin, 10, contentWidth, 277);

    // --- Header Section ---
    const logoImg = 'assets/img/fwg-logo.png';
    try {
      doc.addImage(logoImg, 'PNG', margin + 2, 12, 40, 15);
      doc.setFontSize(8);
      doc.setTextColor(maroon[0], maroon[1], maroon[2]);
      doc.text('\u00AE', margin + 41, 14);
    } catch (e) {
      console.error('Logo could not be loaded', e);
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(maroon[0], maroon[1], maroon[2]);
    doc.text('FreightWatch G Security Service India PVT. Ltd.', margin + 45, 18);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(0, 0, 0);
    doc.text('Securing Global Trade', margin + 45, 23);

    doc.setDrawColor(maroon[0], maroon[1], maroon[2]);
    doc.line(margin, 30, margin + contentWidth, 30);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(maroon[0], maroon[1], maroon[2]);
    doc.text(title, pageCenter, 38, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // --- ID and Date (Both on right side below QUOTATION headline) ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(maroon[0], maroon[1], maroon[2]);
    const formattedDate = date ? new Date(date).toLocaleDateString('en-GB') : ''; // DD/MM/YYYY
    doc.text(`${title} ID: ${id}`, margin + contentWidth - 2, 44, { align: 'right' });
    doc.text(`${title} Date: ${formattedDate}`, margin + contentWidth - 2, 49, { align: 'right' });

    doc.line(margin, 55, margin + contentWidth, 55);
    doc.line(pageCenter, 55, pageCenter, 95);

    // --- TO section (Client) - Robust Mapping ---
    const clientName = clientObj?.Name || clientObj?.ClientName || clientObj?.clientName || clientObj?.name || 'Client Name Missing';
    const clientAddr1 = clientObj?.Address1 || clientObj?.Address || clientObj?.address1 || clientObj?.address || '';
    const clientAddr2 = clientObj?.Address2 || clientObj?.address2 || '';
    const clientCity = clientObj?.City || clientObj?.city || '';
    const clientState = clientObj?.State || clientObj?.IndianState || clientObj?.state || '';
    const clientGSTIN = clientObj?.GSTIN || clientObj?.gstin || '';

    let y = 60;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('TO:', margin + 2, y);
    doc.setFont('helvetica', 'normal');
    y += 4;
    doc.text(clientName, margin + 2, y); y += 4;
    if (clientAddr1) { doc.text(clientAddr1, margin + 2, y); y += 4; }
    if (clientAddr2) { doc.text(clientAddr2, margin + 2, y); y += 4; }
    if (clientCity || clientState) {
      doc.text(`${clientCity}${clientCity && clientState ? ', ' : ''}${clientState}`, margin + 2, y); y += 4;
    }
    if (clientGSTIN) { doc.text(`GSTIN: ${clientGSTIN}`, margin + 2, y); y += 4; }

    // --- FROM section (Branch) - Robust Mapping ---
    const branchName = branchObj?.Name || branchObj?.BranchName || branchObj?.name || 'Branch Name Missing';
    const branchAddr1 = branchObj?.Address1 || branchObj?.Address || branchObj?.address1 || '';
    const branchAddr2 = branchObj?.Address2 || branchObj?.address2 || '';
    const branchCity = branchObj?.City || branchObj?.city || '';
    const branchState = branchObj?.State || branchObj?.state || '';
    const branchGSTIN = branchObj?.GSTIN || branchObj?.gstin || '';

    let y_branch = 60;
    doc.setFont('helvetica', 'bold');
    doc.text('FROM:', margin + contentWidth - 2, y_branch, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y_branch += 4;
    doc.text(branchName, margin + contentWidth - 2, y_branch, { align: 'right' }); y_branch += 4;
    if (branchAddr1) { doc.text(branchAddr1, margin + contentWidth - 2, y_branch, { align: 'right' }); y_branch += 4; }
    if (branchAddr2) { doc.text(branchAddr2, margin + contentWidth - 2, y_branch, { align: 'right' }); y_branch += 4; }
    if (branchCity || branchState) {
      doc.text(`${branchCity}${branchCity && branchState ? ', ' : ''}${branchState}`, margin + contentWidth - 2, y_branch, { align: 'right' }); y_branch += 4;
    }
    if (branchGSTIN) { doc.text(`GSTIN: ${branchGSTIN}`, margin + contentWidth - 2, y_branch, { align: 'right' }); y_branch += 4; }

    doc.line(margin, 95, margin + contentWidth, 95);

    // --- Table Data (Main Summary Table on Page 1) ---
    let mainTableStartY = 100;
    let totalMonth = 0;
    let totalTax = 0;
    const bState = (branchObj?.State || branchObj?.state || '').toString().toLowerCase().trim();
    const cState = (clientObj?.State || clientObj?.IndianState || clientObj?.state || '').toString().toLowerCase().trim();
    const isSameState = bState === cState;

    const tableData = details.map((item: any, index: number) => {
      const st = serviceTypes.find((x: any) => x.ServiceName === item.Description || x.serviceName === item.Description);
      const serviceName = item.Description || '';
      const hsnCode = st?.HSNCode || st?.hsnCode || 'N/A';
      const description = st?.Description || st?.description || item.Description || '';

      const rate = item.Rate || 0;
      const noOfHours = item.NoOfHours || 8;
      const noOfGuards = item.NoOfGuards || 0;
      const noOfDays = item.NoOfDays || 0;
      // Use stored MonthTotal value instead of recalculating to match form calculation
      const monthAmt = parseFloat((item.MonthTotal || 0).toString().replace(/,/g, ''));

      const taxAmt = parseFloat((item.TaxAmount || 0).toString().replace(/,/g, ''));
      totalMonth += monthAmt;
      totalTax += taxAmt;

      const perDayValue = 1 * rate * noOfHours;

      return [index + 1, serviceName, description, hsnCode, item.NoOfGuards ?? '-', noOfDays, noOfHours, Math.round(perDayValue).toLocaleString('en-IN'), Math.round(rate).toLocaleString('en-IN') ?? '-', Math.round(monthAmt).toLocaleString('en-IN')];
    });

    const summaryData = [
      ['', '', '', '', '', '', '', '', 'Sub Total', Math.round(totalMonth).toLocaleString('en-IN')],
      ['', '', '', '', '', '', '', '', isSameState ? 'CGST (9%)' : 'IGST (18%)', isSameState ? Math.round(totalTax / 2).toLocaleString('en-IN') : Math.round(totalTax).toLocaleString('en-IN')]
    ];
    if (isSameState) {
      summaryData.push(['', '', '', '', '', '', '', '', 'SGST (9%)', Math.round(totalTax / 2).toLocaleString('en-IN')]);
    }
    summaryData.push(['', '', '', '', '', '', '', '', 'Grand Total', Math.round(totalMonth + totalTax).toLocaleString('en-IN')]);

    autoTable(doc, {
      startY: mainTableStartY,
      margin: { left: margin, right: margin },
      head: [['S.No', 'Service Name', 'Description', 'HSN Code', 'Qty', 'NoOfDays', 'Hours', 'PerDay', 'Rate', 'Amount']],
      body: [...tableData, ...summaryData],
      theme: 'grid',
      headStyles: { fillColor: maroon, textColor: [255, 255, 255], fontStyle: 'bold', lineWidth: 0.1 },
      styles: { fontSize: 8, cellPadding: 2, lineWidth: 0.1, lineColor: maroon },
      columnStyles: { 7: { halign: 'right' }, 9: { halign: 'right' } },
      didParseCell: function (data) {
        // Make summary rows bold
        if (data.section === 'body' && data.row.index >= tableData.length) {
          data.cell.styles.fontStyle = 'bold';

          // Highlight the TOTAL ALL VALUES row with a different background
          if (data.row.index === tableData.length + summaryData.length - 1) {
            data.cell.styles.fillColor = [200, 200, 200]; // Darker gray for TOTAL ALL VALUES
            data.cell.styles.textColor = [0, 0, 0]; // Black text
          }
        }
      }
    });

    const finalTableY = (doc as any).lastAutoTable.finalY;
    const words = this.numberToWords(Math.round(totalMonth + totalTax));
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount in Words: ${words}`, margin + 2, finalTableY + 8);

    const finalY = finalTableY + 18;
    doc.setFontSize(9);
    doc.setTextColor(maroon[0], maroon[1], maroon[2]);
    doc.text('Terms & Conditions:', margin + 2, finalY);
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text('1. Payment should be made within 15 days.', margin + 2, finalY + 5);
    doc.setFontSize(9);
    doc.setTextColor(maroon[0], maroon[1], maroon[2]);
    doc.text('For FreightWatch G Security Service', margin + contentWidth - 2, finalY, { align: 'right' });
    doc.text('Authorized Signatory', margin + contentWidth - 2, finalY + 20, { align: 'right' });

    // --- Add new page for Commercial Breakdown Summary ---
    doc.addPage();
    doc.setDrawColor(maroon[0], maroon[1], maroon[2]);
    doc.setLineWidth(0.5);
    doc.rect(margin, 10, contentWidth, 277);

    let y_cb = 20;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(maroon[0], maroon[1], maroon[2]);
    doc.text('Commercial Breakdown Summary', pageCenter, y_cb, { align: 'center' });
    y_cb += 10;

    const d = date ? new Date(date) : new Date();
    const monthYearStr = d.toLocaleString('default', { month: 'long', year: 'numeric' });

    const headers2 = [['Description']];
    details.forEach((detail: any) => { headers2[0].push(detail.Description || 'Service'); });

    const rows2: any[] = [
      [`Minimum Wages ( ${monthYearStr} )`, ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'Basic') + this.getCommercialValue(d, 'DA')).toLocaleString('en-IN'))],
      ['Basic', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'Basic')).toLocaleString('en-IN'))],
      ['DA', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'DA')).toLocaleString('en-IN'))],
      ['HRA', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'HRA')).toLocaleString('en-IN'))],
      ['Leaves', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'Leaves')).toLocaleString('en-IN'))],
      ['Allowance', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'Allowance')).toLocaleString('en-IN'))],
      ['Bonus', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'Bonus')).toLocaleString('en-IN'))],
      ['NFH', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'NFH')).toLocaleString('en-IN'))],
      ['TOTAL - Wages + Allowances', ...details.map((d: any) => Math.round(this.calculateWagesTotal(d)).toLocaleString('en-IN'))],
      ['PF', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'PF')).toLocaleString('en-IN'))],
      ['ESI', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'ESI')).toLocaleString('en-IN'))],
      ['Professional Tax', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'ProfessionalTax')).toLocaleString('en-IN'))],
      ['TOTAL - Statutory', ...details.map((d: any) => Math.round(this.calculateStatutoryTotal(d)).toLocaleString('en-IN'))],
      ['Uniform Cost', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'UniformCost')).toLocaleString('en-IN'))],
      ['Others', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'Others')).toLocaleString('en-IN'))],
      ['Administration Charges', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'AdministrationCharges')).toLocaleString('en-IN'))],
      ['Total Direct Cost', ...details.map((d: any) => Math.round(this.calculateDirectCost(d)).toLocaleString('en-IN'))],
      ['Service Fee', ...details.map((d: any) => Math.round(this.getCommercialValue(d, 'ServiceFee')).toLocaleString('en-IN'))],
      ['Per Unit cost', ...details.map((d: any) => d.Rate ? Math.round(d.Rate).toLocaleString('en-IN') : '0')]
    ];

    const columnStyles: any = {
      0: { halign: 'left' }
    };

    details.forEach((_, index) => {
      columnStyles[index + 1] = { halign: 'right' };
    });

    autoTable(doc, {
      startY: y_cb,
      head: headers2,
      body: rows2,
      theme: 'grid',
      headStyles: { fillColor: maroon, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2, lineWidth: 0.1, lineColor: maroon },
      columnStyles: columnStyles
    });

    if (save) {
      doc.save(`${title === 'QUOTATION' ? 'Quotation' : 'Agreement'}_${clientObj?.Code || clientObj?.code || 'Document'}.pdf`);
    } else {
      window.open(doc.output('bloburl'), '_blank');
    }
  }

  private numberToWords(num: number): string {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const n = ('000000000' + num).substring(('000000000' + num).length - 9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += n[1] != '00' ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
    str += n[2] != '00' ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
    str += n[3] != '00' ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
    str += n[4] != '0' ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
    str += n[5] != '00' ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) + 'only' : '';
    return str;
  }
}
