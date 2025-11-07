import { Component } from "@angular/core";
import { Route, Routes } from "@angular/router";
import { TipoVehiculo } from "./tipo-vehiculo/tipo-vehiculo";
import { TipoMulta } from "./tipo-multa/tipo-multa";
import { Tarifa } from "./tarifa/tarifa";
import { Busqueda } from "../../busqueda/busqueda";
import { Herramientas } from "../Herramientas";

export const HerramientasRoutes: Routes =
    [
        {
            path: '',
            component: Herramientas,
        },

        {
            path: 'tarifa',
            component:Tarifa,
            children: [
                {
                    path: 'register-tarifa',
                    loadComponent: () => import('./tarifa/register-tarifa/register-tarifa').then(m => m.RegisterTarifa)
                }

            ]
        },
        {
            path: 'multas',
            component: TipoMulta,
            children: [
                {
                    path: 'register-multa',
                    loadComponent: () => import('./tipo-multa/register-multa/register-multa').then(m => m.RegisterMulta)
                }

            ]
        },
        {
            path: 'tipos-vehiculo',
            component: TipoVehiculo,
            children: [
                {
                    path: 'register-tipoVehiculo',
                    loadComponent: () => import('./tipo-vehiculo/register-tipoVehiculo/register-tipoVehiculo').then(m => m.RegisterTipoVehiculo)
                }

            ]
        }
    ]