import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./landing/landing.component').then(m => m.LandingComponent),
    title: 'Citizen Grievance Resolution Platform | Home'
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
        title: 'Sign In'
      },
      {
        path: 'register',
        loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent),
        title: 'Sign Up'
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'admin',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
    title: 'Admin Login',
    data: { role: 'admin' }
  },
  {
    path: 'officer',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
    title: 'Officer Login',
    data: { role: 'officer' }
  },
  {
    path: 'supervisor',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
    title: 'Supervisor Login',
    data: { role: 'supervisor' }
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'citizen',
        loadComponent: () => import('./shared/layouts/citizen-layout/citizen-layout.component').then(m => m.CitizenLayoutComponent),
        canActivate: [authGuard],
        data: { roles: ['citizen', 'admin'] },
        children: [
          {
            path: '',
            loadComponent: () => import('./features/citizen/citizen-home.component').then(m => m.CitizenHomeComponent),
            title: 'Citizen Dashboard'
          },
          {
            path: 'complaints',
            loadComponent: () => import('./features/citizen/citizen-complaints.component').then(m => m.CitizenComplaintsComponent),
            title: 'My Complaints'
          },
          {
            path: 'settings',
            loadComponent: () => import('./shared/components/profile-settings/profile-settings.component').then(m => m.ProfileSettingsComponent),
            title: 'My Profile'
          }
        ]
      },
      {
        path: 'officer',
        loadComponent: () => import('./shared/layouts/officer-layout/officer-layout.component').then(m => m.OfficerLayoutComponent),
        canActivate: [authGuard],
        data: { roles: ['officer', 'admin'] },
        children: [
          {
            path: '',
            loadComponent: () => import('./features/officer/officer-home.component').then(m => m.OfficerHomeComponent),
            title: 'Officer Operations'
          },
          {
            path: 'complaints',
            loadComponent: () => import('./features/officer/officer-complaints.component').then(m => m.OfficerComplaintsComponent),
            title: 'Active Queue'
          },
          {
            path: 'maps',
            loadComponent: () => import('./shared/maps/map-view/map-view.component').then(m => m.MapViewComponent),
            title: 'Hotspot Map'
          },
          {
            path: 'settings',
            loadComponent: () => import('./shared/components/profile-settings/profile-settings.component').then(m => m.ProfileSettingsComponent),
            title: 'Console Settings'
          }
        ]
      },
      {
        path: 'supervisor',
        loadComponent: () => import('./shared/layouts/supervisor-layout/supervisor-layout.component').then(m => m.SupervisorLayoutComponent),
        canActivate: [authGuard],
        data: { roles: ['supervisor', 'admin'] },
        children: [
          {
            path: '',
            loadComponent: () => import('./features/supervisor/supervisor-home.component').then(m => m.SupervisorHomeComponent),
            title: 'Supervisor Dashboard'
          },
          {
            path: 'complaints',
            loadComponent: () => import('./features/supervisor/supervisor-complaints.component').then(m => m.SupervisorComplaintsComponent),
            title: 'Ward Workload'
          },
          {
            path: 'analytics',
            loadComponent: () => import('./shared/charts/analytics-charts/analytics-charts.component').then(m => m.AnalyticsChartsComponent),
            title: 'Performance'
          },
          {
            path: 'officers',
            loadComponent: () => import('./shared/tables/officers-table.component').then(m => m.OfficersTableComponent),
            title: 'Officers Roster'
          },
          {
            path: 'maps',
            loadComponent: () => import('./shared/maps/map-view/map-view.component').then(m => m.MapViewComponent),
            title: 'Hotspot Map'
          },
          {
            path: 'settings',
            loadComponent: () => import('./shared/components/profile-settings/profile-settings.component').then(m => m.ProfileSettingsComponent),
            title: 'Console Settings'
          }
        ]
      },
      {
        path: 'admin',
        loadComponent: () => import('./shared/layouts/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
        canActivate: [authGuard],
        data: { roles: ['admin'] },
        children: [
          {
            path: '',
            loadComponent: () => import('./features/admin/admin-home.component').then(m => m.AdminHomeComponent),
            title: 'Command Center'
          },
          {
            path: 'complaints',
            loadComponent: () => import('./features/admin/admin-complaints.component').then(m => m.AdminComplaintsComponent),
            title: 'Grievance Ledger'
          },
          {
            path: 'analytics',
            loadComponent: () => import('./shared/charts/analytics-charts/analytics-charts.component').then(m => m.AnalyticsChartsComponent),
            title: 'System Analytics'
          },
          {
            path: 'maps',
            loadComponent: () => import('./shared/maps/map-view/map-view.component').then(m => m.MapViewComponent),
            title: 'Hotspot Map'
          },
          {
            path: 'ai-diagnostics',
            loadComponent: () => import('./features/admin/ai-diagnostics.component').then(m => m.AiDiagnosticsComponent),
            title: 'AI Diagnostics'
          },
          {
            path: 'citizens',
            loadComponent: () => import('./shared/tables/citizens-table.component').then(m => m.CitizensTableComponent),
            title: 'Citizens Directory'
          },
          {
            path: 'officers',
            loadComponent: () => import('./shared/tables/officers-table.component').then(m => m.OfficersTableComponent),
            title: 'Officers Directory'
          },
          {
            path: 'reports',
            loadComponent: () => import('./shared/tables/reports-table.component').then(m => m.ReportsTableComponent),
            title: 'Audit Reports'
          },
          {
            path: 'settings',
            loadComponent: () => import('./shared/components/profile-settings/profile-settings.component').then(m => m.ProfileSettingsComponent),
            title: 'Console Settings'
          }
        ]
      },
      {
        path: '',
        redirectTo: 'citizen',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'transparency',
    loadComponent: () => import('./transparency/transparency-portal.component').then(m => m.TransparencyPortalComponent),
    title: 'Public Transparency Portal'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
