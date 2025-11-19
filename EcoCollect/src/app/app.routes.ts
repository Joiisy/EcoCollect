import { Routes } from '@angular/router';
import { RoleGuard } from './guards/role.guard';
export const routes: Routes = [
  


    {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.page').then( m => m.LoginPage)
  },

  
  {
    path: 'home-administrador',
    loadComponent: () => import('./administrador/home-administrador/home-administrador.page').then( m => m.HomeAdministradorPage)
  },
  {
    path: 'home-conductores',
    loadComponent: () => import('./conductor/home-conductores/home-conductores.page').then( m => m.HomeConductoresPage)
  },
  {
    path: 'admin-conductores',
    loadComponent: () => import('./administrador/home-administrador/admin-conductores/admin-conductores.page').then( m => m.AdminConductoresPage)
  },
  {
    path: 'vehiculos',
    loadComponent: () => import('./administrador/vehiculos/vehiculos.page').then( m => m.VehiculosPage)
  },
  
];