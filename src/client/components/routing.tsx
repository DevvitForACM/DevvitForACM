import React, { createContext, useContext } from 'react';
import { MemoryRouter, Routes, Route, useNavigate, useLocation, Location } from 'react-router-dom';

export interface AppRoute {
  path: string;
  element: React.ReactElement;
}

interface RoutingContextType {
  navigate: (path: string) => void;
  goBack: () => void;
  location: Location;
}

const RoutingContext = createContext<RoutingContextType | null>(null);

function RoutingProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const goBack = () => {
    navigate(-1);
  };

  const value = { navigate, goBack, location };

  return <RoutingContext.Provider value={value}>{children}</RoutingContext.Provider>;
}

export function RoutingController({
  routes,
  initialPath = '/',
}: {
  routes: AppRoute[];
  initialPath?: string;
}) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <RoutingProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {routes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
          </Routes>
        </div>
      </RoutingProvider>
    </MemoryRouter>
  );
}

export function useRouting() {
  const context = useContext(RoutingContext);
  if (!context) {
    throw new Error('useRouting must be used within a RoutingProvider');
  }
  return context;
}