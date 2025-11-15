import { Component } from "@angular/core";
import { Route, Routes } from "@angular/router";
import { Busqueda } from "./busqueda";
import { Herramientas } from "../Herramientas/Herramientas";
import { SearchTicketsPorFecha } from "./search-ticketsPorFecha/search-ticketsPorFecha";
import { SearchVehiculos } from "./search-vehiculos/search-vehiculos";
import { SearchTodos } from "./search-todos/search-todos";

export const BusquedaRoutes: Routes =
    [
        {
            path: '',
            component: Busqueda,
            children: [
                {
                    path: '',
                    component: SearchTodos,
                },
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