import { Routes } from '@angular/router';
import { HomePage } from './shared/pages/home-page/home-page';

export const routes: Routes = [
    {
        path: '',
        component: HomePage,
    },
    {
        path:'alquiler',
        loadChildren: () => import('../app/alquiler/alquiler.route').then(m => m.alquilerRoute)

    }
];
