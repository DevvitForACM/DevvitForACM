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
  return (
    <AuthGuard>
      <RoutingController routes={appRoutes} />
    </AuthGuard>
  );
}
