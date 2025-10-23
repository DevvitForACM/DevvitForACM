import '@/global/index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RoutingController, AppRoute } from '@/components/routing';
import Home from '@/pages/home';
import Play from '@/pages/play';
import Create from '@/pages/create';

const appRoutes: AppRoute[] = [
  { path: '/', element: <Home /> },
  { path: '/play', element: <Play /> },
  { path: '/create', element: <Create /> },
];

function App() {
  return <RoutingController routes={appRoutes} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
