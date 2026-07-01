<<<<<<< HEAD
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthLayoutComponent } from './auth-layout.component';
import { LoginComponent } from 'src/app/modules/user/login/login.component';
import { RegistrationComponent } from 'src/app/modules/user/rigistration/registration.component';
import { PasswordChangeComponent } from 'src/app/modules/user/password-change/password-change.component';


const routes: Routes = [

  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegistrationComponent },
  { path: 'changepassword', component: PasswordChangeComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthLayoutRoutingModule { }
=======
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthLayoutComponent } from './auth-layout.component';
import { LoginComponent } from 'src/app/modules/user/login/login.component';
import { RegistrationComponent } from 'src/app/modules/user/rigistration/registration.component';
import { PasswordChangeComponent } from 'src/app/modules/user/password-change/password-change.component';


const routes: Routes = [

  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegistrationComponent },
  { path: 'changepassword', component: PasswordChangeComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthLayoutRoutingModule { }
>>>>>>> 5207b82f409ea4dcb09404b90ab7324a99cbff87
