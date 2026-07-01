<<<<<<< HEAD
import { Component, OnInit, Inject  } from '@angular/core';
import {
  MatSnackBarRef,
  MAT_SNACK_BAR_DATA
} from "@angular/material/snack-bar";

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.css']
})
export class MessageComponent implements OnInit {

  constructor(public sbRef: MatSnackBarRef<MessageComponent>,
    @Inject(MAT_SNACK_BAR_DATA) public data: any) { }

  ngOnInit(): void {
  }

}
=======
import { Component, OnInit, Inject  } from '@angular/core';
import {
  MatSnackBarRef,
  MAT_SNACK_BAR_DATA
} from "@angular/material/snack-bar";

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.css']
})
export class MessageComponent implements OnInit {

  constructor(public sbRef: MatSnackBarRef<MessageComponent>,
    @Inject(MAT_SNACK_BAR_DATA) public data: any) { }

  ngOnInit(): void {
  }

}
>>>>>>> 5207b82f409ea4dcb09404b90ab7324a99cbff87
