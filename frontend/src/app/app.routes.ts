import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AuthCallbackComponent } from './auth/auth-callback.component';
import { HomepageComponent } from './homepage/homepage.component';
import { AdminComponent } from './admin/admin.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { HomeGuard } from './guards/home.guard';
import { AdminGuard } from './guards/admin.guard';
import { WelcomeGuard } from './guards/welcome.guard';

export const routes: Routes = [
  { 
    path: 'login', 
    component: LoginComponent 
  },
  { 
    path: 'auth-success', 
    component: AuthCallbackComponent 
  },
  { 
    path: 'welcome', 
    component: WelcomeComponent,
    canActivate: [WelcomeGuard]
  },
  { 
    path: 'home', 
    component: HomepageComponent,
    canActivate: [HomeGuard]
  },
  { 
    path: 'admin', 
    component: AdminComponent,
    canActivate: [AdminGuard]
  },
  { 
    path: '', 
    redirectTo: 'login', 
    pathMatch: 'full' 
  },
  { 
    path: '**', 
    redirectTo: 'login' 
  }
];