import { Routes } from '@angular/router';

export const routes: Routes = [
  // ---------- Tam ekran sayfalar (alt menü görünmez) ----------
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

  // ---------- Sekmeler (alt menü görünür) ----------
  {
    path: '',
    loadComponent: () => import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'map',
        loadComponent: () => import('./pages/map/map.page').then((m) => m.MapPage),
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },

  // Bilinmeyen adresler ana sayfaya
  {
    path: '**',
    redirectTo: 'home',
  },
];