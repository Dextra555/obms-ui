import { Component, OnInit, ViewChild } from '@angular/core';



@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  @ViewChild("chart")
  public reportServiceUrl: string;
  public reportPath: string;

  constructor() {

    this.reportServiceUrl = "http://localhost:5140/api/ReportViewer";
    this.reportPath = "product-list.rdlc";
   }

  ngOnInit(): void {
  }

  viewReportClick(event: any) {
    var reportParams = [];
    reportParams.push({ name: 'ReportParameter1', labels: ['SO50756'], values: ['SO50756'] });
    event.model.parameters = reportParams;
}

}
