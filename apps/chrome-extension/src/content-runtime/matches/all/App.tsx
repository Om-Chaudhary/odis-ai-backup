import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    // All runtime content view loaded
  }, []);

  return (
    <div className="ceb-all-runtime-content-view-text">
      All runtime content view
    </div>
  );
}
