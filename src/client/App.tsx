import { RoutingController, AppRoute } from '@/components/routing';
import Home from '@/pages/home/index';
import Play from '@/pages/play/index';

const appRoutes: AppRoute[] = [
  { path: '/', element: <Home /> },
  { path: '/play', element: <Play /> },
];

export default function App() {
  return <RoutingController routes={appRoutes} />;
<<<<<<< HEAD
}
=======
}
>>>>>>> origin/main
