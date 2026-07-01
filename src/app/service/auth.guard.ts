<<<<<<< HEAD
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {     
    if (this.authService.isAuthenticated()) {      
      return true;
    } else {     
      this.router.navigate(['/login']);
      return false;
    }
  }
}
=======
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {     
    if (this.authService.isAuthenticated()) {      
      return true;
    } else {     
      this.router.navigate(['/login']);
      return false;
    }
  }
}
>>>>>>> 5207b82f409ea4dcb09404b90ab7324a99cbff87
