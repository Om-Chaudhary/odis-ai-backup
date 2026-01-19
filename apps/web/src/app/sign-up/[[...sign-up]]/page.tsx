import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-950 via-teal-900 to-teal-950">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-teal-950/80 backdrop-blur-sm border border-teal-800/50 shadow-2xl",
          },
        }}
      />
    </div>
  );
}
