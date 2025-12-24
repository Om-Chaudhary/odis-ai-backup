import { SupabaseAuthProvider, useAuth } from "@odis-ai/extension/shared";

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
        <h1 className="mb-2 text-lg font-semibold">ODIS AI Extension</h1>
        <p className="mb-4 text-sm text-gray-600">
          Sign in to access ODIS features.
        </p>
        <a
          href="https://odisai.net/login"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded bg-blue-500 px-4 py-2 text-center text-white hover:bg-blue-600"
        >
          Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="w-80 p-4">
      <h1 className="mb-2 text-lg font-semibold">ODIS AI Extension</h1>
      <p className="mb-2 text-sm text-gray-600">Signed in as {user.email}</p>
      <a
        href="https://odisai.net/dashboard"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full rounded bg-blue-500 px-4 py-2 text-center text-white hover:bg-blue-600"
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
