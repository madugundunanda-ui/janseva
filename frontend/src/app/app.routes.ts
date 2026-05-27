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
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'analytics',
        loadComponent: () => import('./dashboard/analytics/analytics.component').then(m => m.AnalyticsComponent),
        title: 'System Analytics'
      },
      {
        path: 'ai-insights',
        loadComponent: () => import('./dashboard/ai-insights/ai-insights.component').then(m => m.AiInsightsComponent),
        title: 'AI Predictive Insights'
      },
      {
        path: 'complaints',
        loadComponent: () => import('./dashboard/complaints/complaints.component').then(m => m.ComplaintsComponent),
        title: 'Grievance Core'
      },
      {
        path: 'officers',
        loadComponent: () => import('./dashboard/officers/officers.component').then(m => m.OfficersComponent),
        canActivate: [authGuard],
        title: 'Officer Workloads',
        data: { roles: ['admin', 'supervisor', 'officer'] }
      },
      {
        path: 'citizens',
        loadComponent: () => import('./dashboard/citizens/citizens.component').then(m => m.CitizensComponent),
        canActivate: [authGuard],
        title: 'Citizen Directory',
        data: { roles: ['admin', 'supervisor'] }
      },
      {
        path: 'reports',
        loadComponent: () => import('./dashboard/reports/reports.component').then(m => m.ReportsComponent),
        canActivate: [authGuard],
        title: 'Intelligence Reports',
        data: { roles: ['admin', 'supervisor'] }
      },
      {
        path: 'maps',
        loadComponent: () => import('./dashboard/maps/maps.component').then(m => m.MapsComponent),
        title: 'Hotspot Mapping'
      },
      {
        path: 'settings',
        loadComponent: () => import('./dashboard/settings/settings.component').then(m => m.SettingsComponent),
        title: 'Console Settings'
      },
      {
        path: 'citizen',
        loadComponent: () => import('./dashboard/citizen/citizen.component').then(m => m.CitizenComponent),
        canActivate: [authGuard],
        title: 'Citizen Dashboard',
        data: { roles: ['citizen', 'admin'] }
      },
      {
        path: 'officer',
        loadComponent: () => import('./dashboard/officer/officer.component').then(m => m.OfficerComponent),
        canActivate: [authGuard],
        title: 'Officer Operations Dashboard',
        data: { roles: ['officer', 'admin'] }
      },
      {
        path: 'supervisor',
        loadComponent: () => import('./dashboard/supervisor/supervisor.component').then(m => m.SupervisorComponent),
        canActivate: [authGuard],
        title: 'Governance Management Dashboard',
        data: { roles: ['supervisor', 'admin'] }
      },
      {
        path: 'admin',
        loadComponent: () => import('./dashboard/admin/admin.component').then(m => m.AdminComponent),
        canActivate: [authGuard],
        title: 'State Intelligence Control Center',
        data: { roles: ['admin'] }
      },
      {
        path: '',
        redirectTo: 'complaints',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
