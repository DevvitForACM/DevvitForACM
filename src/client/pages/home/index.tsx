import { useRouting } from '@/components/routing';
import { useEffect } from 'react';

export default function Home() {
  const { navigate, location } = useRouting();

  useEffect(() => {
    console.log('Landed on Home page:', location.pathname);
  }, [location]);

  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Home Page</h1>
      <p className="mb-6">This is the initial page.</p>
      <button
        onClick={() => navigate('/play')}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Go to Play Page
      </button>
    </div>
  );
}