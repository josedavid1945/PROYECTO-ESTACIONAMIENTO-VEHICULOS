import { Component } from "@angular/core";
import { Route, Routes } from "@angular/router";
import { HomePage } from "../shared/pages/home-page/home-page";
import { Busqueda } from "./pages/busqueda/busqueda";
import { Registro } from "./pages/registro/registro";
import { VistaSecciones } from "./pages/vista-secciones/vista-secciones";
import { Herramientas } from "./pages/Herramientas/Herramientas";

export const alquilerRoute: Routes =
    [
        {
            path: 'busqueda',
            loadChildren: () => import('./pages/busqueda/busqueda.routes').then(m => m.BusquedaRoutes),
        },
        {   
            path: 'registro',
            component: Registro,
        },
        {
            path: 'vista-secciones',
            component: VistaSecciones,

        },
        {
            path: 'herramientas',
            children: [
                {
                    path: '',
                    component: Herramientas,
                },
                {
                    path: 'config',
                    children: [
                        {
                            path: 'tarifa',
                            loadComponent: () => import('./pages/Herramientas/config-registers/tarifa/tarifa').then(m => m.TarifaComponent)
                        },
                        {
                            path: 'registrar-tarifa',
                            loadComponent: () => import('./pages/Herramientas/config-registers/tarifa/register-tarifa/register-tarifa').then(m => m.RegisterTarifaComponent)
                        },
                        {
                            path: 'multas',
                            loadComponent: () => import('./pages/Herramientas/config-registers/tipo-multa/tipo-multa').then(m => m.TipoMulta)
                        },
                        {
                            path: 'registrar-multa',
                            loadComponent: () => import('./pages/Herramientas/config-registers/tipo-multa/register-multa/register-multa').then(m => m.RegisterMulta)
                        },
                        {
                            path: 'tipos-vehiculo',
                            loadComponent: () => import('./pages/Herramientas/config-registers/tipo-vehiculo/tipo-vehiculo').then(m => m.TipoVehiculo)
                        },
                        {
                            path: 'registrar-tipoVehiculo',
                            loadComponent: () => import('./pages/Herramientas/config-registers/tipo-vehiculo/register-tipoVehiculo/register-tipoVehiculo').then(m => m.RegisterTipoVehiculo)
                        }
                    ]
                }
            ]
        },
        {
            path: 'b2b-assistant',
            loadComponent: () => import('./pages/b2b-assistant/b2b-assistant.page').then(m => m.B2bAssistantPage),
        }
    ]