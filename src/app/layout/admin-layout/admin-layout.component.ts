<<<<<<< HEAD
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit {
  isLoading=false;
  constructor() { }

  ngOnInit(): void {
    setTimeout( () => this.isLoading = false, 5000 );
  }

}
=======
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit {
  isLoading=false;
  constructor() { }

  ngOnInit(): void {
    setTimeout( () => this.isLoading = false, 5000 );
  }

}
>>>>>>> 5207b82f409ea4dcb09404b90ab7324a99cbff87
