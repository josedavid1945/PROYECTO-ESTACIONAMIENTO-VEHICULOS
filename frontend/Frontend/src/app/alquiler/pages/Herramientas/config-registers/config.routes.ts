import { Routes } from "@angular/router";

export const HerramientasRoutes: Routes = [
    {
        path: 'config',
        children: [
            {
                path: 'tarifa',
                loadComponent: () => import('./tarifa/tarifa').then(m => m.TarifaComponent)
            },
            {
                path: 'registrar-tarifa',
                loadComponent: () => import('./tarifa/register-tarifa/register-tarifa').then(m => m.RegisterTarifaComponent)
            },
            {
                path: 'multas',
                loadComponent: () => import('./tipo-multa/tipo-multa').then(m => m.TipoMulta)
            },
            {
                path: 'registrar-multa',
                loadComponent: () => import('./tipo-multa/register-multa/register-multa').then(m => m.RegisterMulta)
            },
            {
                path: 'tipos-vehiculo',
                loadComponent: () => import('./tipo-vehiculo/tipo-vehiculo').then(m => m.TipoVehiculo)
            },
            {
                path: 'registrar-tipoVehiculo',
                loadComponent: () => import('./tipo-vehiculo/register-tipoVehiculo/register-tipoVehiculo').then(m => m.RegisterTipoVehiculo)
            }
        ]
    }
]