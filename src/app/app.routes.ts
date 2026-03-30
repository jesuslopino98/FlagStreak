import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'daily', pathMatch: 'full' },
  {
    path: 'daily',
    loadComponent: () => import('./features/daily/daily').then(m => m.DailyComponent),
  },
  {
    path: 'survival',
    loadComponent: () => import('./features/survival/survival').then(m => m.SurvivalComponent),
  },
  {
    path: 'training',
    loadComponent: () => import('./features/training/training').then(m => m.TrainingComponent),
  },
  { path: '**', redirectTo: 'daily' },
];
