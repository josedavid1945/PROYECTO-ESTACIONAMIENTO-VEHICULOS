import { Component } from "@angular/core";
import { Route, Routes } from "@angular/router";
import { HomePage } from "../shared/pages/home-page/home-page";
import { Busqueda } from "./pages/busqueda/busqueda";
import { Registro } from "./pages/registro/registro";
import { VistaSecciones } from "./pages/vista-secciones/vista-secciones";
import { Herramientas } from "./pages/Herramientas/Herramientas";
import { Layout } from "./layouts/layout/layout";

export const alquilerRoute: Routes =
    [
        {
            path: '',
            component: Layout,
            children: [
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
                    component: Herramientas,
                },
                {
                    path: 'herramientas',
                    loadChildren: () => import('./pages/Herramientas/config-registers/config.routes').then(m => m.HerramientasRoutes),
                }

            ]
        }
    ]