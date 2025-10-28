import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Authentication | Odis AI",
  description: "Sign in or sign up to Odis AI",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-emerald-50 via-emerald-100/40 to-emerald-50/30 px-4 py-4 sm:py-8 lg:py-12 sm:px-6 lg:px-8">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0">
        <div
          style={{
            background:
              "radial-gradient(circle at 30% 40%, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.06) 40%, transparent 70%)",
          }}
          className="animate-gradient-move absolute inset-0 opacity-70 blur-sm"
        />
        <div
          style={{
            background:
              "radial-gradient(circle at 70% 60%, rgba(16, 185, 129, 0.10) 0%, rgba(16, 185, 129, 0.05) 50%, transparent 80%)",
          }}
          className="animate-gradient-move-reverse absolute inset-0 opacity-50 blur-sm"
        />
        <div
          style={{
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 60%)",
          }}
          className="animate-float-slow absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full opacity-40 blur-3xl transition-opacity duration-1000 hover:opacity-60"
        />
        <div
          style={{
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 60%)",
          }}
          className="animate-float-slow-reverse absolute right-1/3 bottom-1/3 h-[300px] w-[300px] rounded-full opacity-35 blur-3xl transition-opacity duration-1000 hover:opacity-50"
        />
      </div>

      {/* Dotted Background */}
      <div
        style={{
          backgroundImage:
            "radial-gradient(circle, #31aba3 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
        className="pointer-events-none absolute inset-0 opacity-15"
      />

      <div className="relative w-full max-w-md space-y-3 sm:space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg">
            <svg
              className="h-6 w-6 sm:h-8 sm:w-8 text-white"
              fill="currentColor"
              viewBox="0 0 419.14 403.6"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g transform="translate(-119 -256.27)">
                <path
                  d="m281.78 0c-0.88 0.011256-1.79 0.054519-2.69 0.125-35.82 6.1835-55.52 44.064-58.37 77.469-4.17 30.316 9.19 69.266 42.47 76.066 4.83 0.92 9.84 0.5 14.56-0.78 40.08-13.44 58.01-60.908 52.22-100.22-1.69-25.396-20.83-53.009-48.19-52.66zm-151.87 1.625c-22.28 0.5468-39.63 23.138-43.16 44.375-7.441 42.074 11.698 94.35 55.53 107.66 4.11 0.89 8.35 0.98 12.5 0.34 29.63-4.94 42.18-38.15 40.94-64.969-0.89-35.372-19.27-76.273-56-86.218-3.36-0.8909-6.63-1.2661-9.81-1.188zm248.93 119.5c-38.53 2.31-64.95 40.76-68.72 76.66-5.09 25.89 8.71 60.53 38.26 62.6 41.19-0.51 69.3-44.53 70.46-82.41 2.61-25.05-12.15-55.46-40-56.85zm-337.28 8.54c-16.394-0.14-32.517 9.68-37.874 26.34-14.293 44.58 14.408 101.04 61.624 110.41 19.706 3.37 37.018-11.76 41.908-29.97 10.35-38.95-10.915-84.17-46.908-101.85-5.863-3.29-12.334-4.88-18.75-4.93zm172.75 79.93c-32.14 0.07-64.78 16.38-85.59 40.66-22.48 28.3-40.892 61.23-48.095 96.94-8.751 25.7 11.083 55.29 38.565 55.47 33.06 0.91 61.47-21.79 94.34-23.47 27.89-4.25 52.86 10.25 77.94 19.75 21.35 9.13 50.85 5.63 61.75-17.35 8.57-23.41-4.05-48.39-14.5-69.18-21.32-33.76-44.17-69.24-79.13-90.32-14.01-8.68-29.58-12.53-45.28-12.5z"
                  transform="translate(119 256.27)"
                ></path>
              </g>
            </svg>
          </div>
          <h2 className="font-display mt-3 sm:mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Welcome to Odis AI
          </h2>
          <p className="mt-1 sm:mt-2 text-sm text-slate-600 dark:text-slate-400">
            Streamline your veterinary practice with AI
          </p>
        </div>
        {children}
        <div className="text-center">
          <Link
            href="/"
            className="font-medium text-teal-600 transition-colors duration-200 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
