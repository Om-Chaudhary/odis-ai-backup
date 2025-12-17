export const LoadingMenuBar = () => (
  <div className="px-4 py-4 text-center text-sm text-white">
    <div className="flex items-center justify-center gap-2">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
      <span>Checking authentication...</span>
    </div>
  </div>
);
