import Link from "next/link";
import OnboardingContainer from "~/components/onboarding/OnboardingContainer";

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <OnboardingContainer />
      <div className="text-center text-sm text-slate-600 dark:text-slate-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-teal-600 transition-colors duration-200 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
