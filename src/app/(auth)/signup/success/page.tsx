import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";

export default function SignupSuccessPage() {
  return (
    <Card className="relative overflow-hidden border-0 bg-white/80 shadow-xl backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-emerald-50/30" />
      <CardHeader className="relative">
        <CardTitle className="font-display text-2xl font-bold text-slate-800">
          Check your email
        </CardTitle>
        <CardDescription className="text-slate-600">
          We've sent you a confirmation link to verify your email address.
        </CardDescription>
      </CardHeader>
      <CardContent className="relative space-y-6">
        <p className="text-sm text-slate-600">
          Please check your email and click the confirmation link to complete
          your account setup.
        </p>
        <div className="space-y-3">
          <Button
            asChild
            className="w-full bg-gradient-to-r from-[#31aba3] to-[#2a9a92] text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-[#2a9a92] hover:to-[#31aba3] hover:shadow-lg hover:shadow-[#31aba3]/30"
          >
            <Link href="/login">Go to sign in</Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="w-full border-slate-200 bg-white/50 backdrop-blur-sm transition-all duration-200 hover:border-teal-300 hover:bg-emerald-50/50"
          >
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
