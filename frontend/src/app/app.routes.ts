import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./landingpage/routes').then((m) => m.MODULE_ROUTES),
  },
  {
    path: 'room',
    loadChildren: () => import('./room/routes').then((m) => m.MODULE_ROUTES),
  },
];
