import { useRouting } from '@/components/routing';

export default function Test() {
  const { navigate, goBack } = useRouting();

  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Test Page</h1>
      <div className="flex justify-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Go to Home Page
        </button>
        <button
          onClick={() => goBack()}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}