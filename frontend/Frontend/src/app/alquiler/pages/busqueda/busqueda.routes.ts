import { Component } from "@angular/core";
import { Route, Routes } from "@angular/router";
import { Busqueda } from "./busqueda";
import { Herramientas } from "../Herramientas/Herramientas";
import { SearchTicketsPorFecha } from "./search-ticketsPorFecha/search-ticketsPorFecha";
import { SearchVehiculos } from "./search-vehiculos/search-vehiculos";

export const BusquedaRoutes: Routes =
    [
        {
            path: '',
            component: Busqueda,
            children: [
                
                {   
                    path: 'vehiculos',
                    component: SearchVehiculos,
                },
                {
                    path: 'fechas',
                    component: SearchTicketsPorFecha,
                },

            ]
        }
    ]