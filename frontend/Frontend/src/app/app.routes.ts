import { Routes } from '@angular/router';
import { HomePage } from './shared/pages/home-page/home-page';
import { Layout } from './alquiler/layouts/layout/layout';

export const routes: Routes = [
    {
        path: '',
        component: Layout,
        children: [
            {
                path: '',
                component: HomePage,
            },
            {
                path:'estacionamiento',
                loadChildren: () => import('./alquiler/estacionamiento.route').then(m => m.alquilerRoute)
            }
        ]
    }
];
