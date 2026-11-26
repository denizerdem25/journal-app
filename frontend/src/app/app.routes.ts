import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'entry/new',
    loadComponent: () =>
      import('./pages/entry-form/entry-form.page').then((m) => m.EntryFormPage),
  },
  {
    path: 'entry/:id',
    loadComponent: () =>
      import('./pages/entry-detail/entry-detail.page').then((m) => m.EntryDetailPage),
  },
  {
    path: 'entry/:id/edit',
    loadComponent: () =>
      import('./pages/entry-form/entry-form.page').then((m) => m.EntryFormPage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];