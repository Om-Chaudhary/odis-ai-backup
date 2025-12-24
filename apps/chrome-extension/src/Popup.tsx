import { SupabaseAuthProvider, useAuth } from '@odis-ai/extension/shared';

function PopupContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-80 p-4 text-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-80 p-4">
        <h1 className="text-lg font-semibold mb-2">ODIS AI Extension</h1>
        <p className="text-sm text-gray-600 mb-4">
          Sign in to access ODIS features.
        </p>
        <a
          href="https://odisai.net/login"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-2 px-4 bg-blue-500 text-white text-center rounded hover:bg-blue-600"
        >
          Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="w-80 p-4">
      <h1 className="text-lg font-semibold mb-2">ODIS AI Extension</h1>
      <p className="text-sm text-gray-600 mb-2">
        Signed in as {user.email}
      </p>
      <a
        href="https://odisai.net/dashboard"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full py-2 px-4 bg-blue-500 text-white text-center rounded hover:bg-blue-600"
      >
        Open Dashboard
      </a>
    </div>
  );
}

export default function Popup() {
  return (
    <SupabaseAuthProvider>
      <PopupContent />
    </SupabaseAuthProvider>
  );
}
