import { Routes } from '@angular/router';
import { HomePage } from './shared/pages/home-page/home-page';

export const routes: Routes = [
    {
        path: '',
        component: HomePage,
    },
    {
        path:'estacionamiento',
        loadChildren: () => import('./alquiler/estacionamiento.route').then(m => m.alquilerRoute)

    }
];
