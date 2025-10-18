import { useRouting } from '@/components/routing';
import { useEffect } from 'react';

export default function Home() {
  const { navigate, location } = useRouting();

  useEffect(() => {
    // Page loaded
  }, [location]);

  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Home Page</h1>
      <p className="mb-6">This is the initial page.</p>
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => navigate('/play')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Go to Play Page
        </button>
        <button
          onClick={() => navigate('/create')}
          className="bg-emerald-500 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded"
        >
          Go to Create Page
        </button>
      </div>
    </div>
  );
}
