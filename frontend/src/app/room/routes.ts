import { Route } from '@angular/router';

import { Room } from './room';

export const MODULE_ROUTES: Route[] = [
  {
    path: '',
    redirectTo: '/',
    pathMatch: 'full',
  },
  {
    path: ':id',
    component: Room,
  },
];
