import { Link } from 'react-router-dom';

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <h1 className="text-4xl font-bold text-slate-700 mb-4">404</h1>
      <p className="text-slate-500 mb-6">Page Not Found</p>
      <Link to="/" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Go to Home
      </Link>
    </div>
  );
}
