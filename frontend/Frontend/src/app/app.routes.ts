import { Routes } from '@angular/router';
import { HomePage } from './shared/pages/home-page/home-page';
import { Layout } from './alquiler/layouts/layout/layout';
import { authGuard, guestGuard, adminGuard, userGuard } from './core/auth/guards/auth.guards';

export const routes: Routes = [
    // =====================
    // Rutas públicas (Auth)
    // =====================
    {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () => import('./pages/auth/login/login').then(m => m.LoginPage)
    },
    {
        path: 'registro',
        canActivate: [guestGuard],
        loadComponent: () => import('./pages/auth/register/register').then(m => m.RegisterPage)
    },

    // =====================
    // Rutas de Admin/Operator (Dashboard completo)
    // =====================
    {
        path: 'admin',
        component: Layout,
        canActivate: [adminGuard],
        children: [
            {
                path: '',
                component: HomePage,
            },
            {
                path: 'estacionamiento',
                loadChildren: () => import('./alquiler/estacionamiento.route').then(m => m.alquilerRoute)
            }
        ]
    },

    // =====================
    // Rutas de Usuario Normal (Vista limitada)
    // =====================
    {
        path: 'usuario',
        canActivate: [userGuard],
        loadComponent: () => import('./layouts/user-layout/user-layout').then(m => m.UserLayout),
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/usuario/home/user-home').then(m => m.UserHomePage)
            },
            {
                path: 'mis-reservas',
                loadComponent: () => import('./pages/usuario/mis-reservas/mis-reservas').then(m => m.MisReservasPage)
            },
            {
                path: 'historial',
                loadComponent: () => import('./pages/usuario/mis-reservas/mis-reservas').then(m => m.MisReservasPage)
            },
            {
                path: 'perfil',
                loadComponent: () => import('./pages/usuario/home/user-home').then(m => m.UserHomePage) // TODO: Crear página de perfil
            }
        ]
    },

    // =====================
    // Página de acceso denegado
    // =====================
    {
        path: 'acceso-denegado',
        loadComponent: () => import('./pages/acceso-denegado/acceso-denegado').then(m => m.AccesoDenegadoPage)
    },

    // =====================
    // Ruta raíz - Redirige según autenticación
    // =====================
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login'
    },

    // =====================
    // Catch-all - Redirige a login
    // =====================
    {
        path: '**',
        redirectTo: 'login'
    }
];
