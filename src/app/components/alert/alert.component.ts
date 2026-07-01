<<<<<<< HEAD
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA , MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css']
})
export class AlertComponent implements OnInit {

  constructor(public DRef: MatDialogRef<AlertComponent>,   @Inject(MAT_DIALOG_DATA) public data: any) { 
    
  }

  ngOnInit(): void {
  }

}
=======
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA , MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css']
})
export class AlertComponent implements OnInit {

  constructor(public DRef: MatDialogRef<AlertComponent>,   @Inject(MAT_DIALOG_DATA) public data: any) { 
    
  }

  ngOnInit(): void {
  }

}
>>>>>>> 5207b82f409ea4dcb09404b90ab7324a99cbff87
