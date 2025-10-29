import { RoutingController, AppRoute } from '@/components/routing';
import { AuthGuard } from './components/auth-guard';
import Home from '@/pages/home/index';
import Play from '@/pages/play/index';
import Create from '@/pages/create/index';

const appRoutes: AppRoute[] = [
  { path: '/', element: <Home /> },
  { path: '/play', element: <Play /> },
  { path: '/create', element: <Create /> },
];

export default function App() {
  // Derive initial route from hash (e.g., #/play?level=abc)
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  const initialPath = hash && hash.startsWith('#') ? hash.slice(1) : '/';
  return (
    <AuthGuard>
      <RoutingController routes={appRoutes} initialPath={initialPath} />
    </AuthGuard>
  );
}
