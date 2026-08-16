import { FormEvent, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useUser } from "@/lib/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FIREBASE_ERRORS: Record<string, string> = {
  "auth/email-already-in-use": "An account with this email already exists. Try signing in instead.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect password. Try again.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/too-many-requests": "Too many attempts. Wait a few minutes and try again.",
  "auth/account-exists-with-different-credential":
    "An account already exists with this email. Sign in with your password instead.",
  "auth/popup-blocked": "The popup was blocked. Allow popups for this site and try again.",
  "auth/popup-closed-by-user": "The sign-in popup was closed before finishing. Try again.",
  "auth/invalid-continue-uri":
    "This site's address isn't allowed for email links. Add it in Firebase console > Authentication > Authorized domains.",
};

const errorMessage = (code?: string) =>
  (code && FIREBASE_ERRORS[code]) || "Something went wrong. Please try again.";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.27 14.29a7.19 7.19 0 0 1 0-4.58V6.62H1.29a12.03 12.03 0 0 0 0 10.76l3.98-3.09z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
    />
  </svg>
);

const SignInDialog = ({ isopen, onclose }: { isopen: boolean; onclose: () => void }) => {
  const {
    handlegooglesignin,
    signinwithemail,
    signupwithemail,
    sendpasswordreset,
    signingIn,
  } = useUser();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (next: "signin" | "signup") => {
    setMode(next);
    setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "signin") {
        await signinwithemail(email.trim(), password);
        toast("Welcome back!");
      } else {
        const result = await signupwithemail(
          name.trim() || "New User",
          email.trim(),
          password
        );
        if (result.emailSent) {
          toast(
            "Account created! We sent a verification link to your email. Verify it to upload videos and comment."
          );
        } else {
          toast(
            "Account created, but the verification email couldn't be sent right now. Use \"Resend email\" in a few minutes."
          );
        }
      }
      setName("");
      setEmail("");
      setPassword("");
      onclose();
    } catch (err: any) {
      setError(errorMessage(err?.code));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setSubmitting(true);
    const result = await handlegooglesignin();
    setSubmitting(false);
    if (result.success) {
      setName("");
      setEmail("");
      setPassword("");
      onclose();
    } else if (result.code) {
      setError(errorMessage(result.code));
    }
  };

  const handleForgot = async () => {
    if (!email.trim()) {
      setError("Enter your email above first.");
      return;
    }
    setError("");
    try {
      await sendpasswordreset(email.trim());
      toast("Password reset link sent. Check your inbox.");
    } catch (err: any) {
      setError(errorMessage(err?.code));
    }
  };

  return (
    <Dialog open={isopen} onOpenChange={(open) => (open ? null : onclose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center sm:text-center text-xl">
            {mode === "signin" ? "Sign in" : "Create your account"}
          </DialogTitle>
          <DialogDescription className="text-center sm:text-center">
            {mode === "signin"
              ? "Welcome back! Sign in to continue."
              : "Join YourTube to like, comment and upload."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className={cn(
              "rounded-md py-2 text-sm font-medium transition-colors",
              mode === "signin" ? "bg-background shadow-sm" : "text-muted-foreground"
            )}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={cn(
              "rounded-md py-2 text-sm font-medium transition-colors",
              mode === "signup" ? "bg-background shadow-sm" : "text-muted-foreground"
            )}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="signup-name">Name</Label>
              <Input
                id="signup-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="auth-password">Password</Label>
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={handleForgot}
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <Input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting
              ? "Please wait..."
              : mode === "signin"
              ? "Sign in"
              : "Create account"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs text-muted-foreground">
            <span className="bg-background px-2">or</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogle}
          disabled={submitting || signingIn}
        >
          <GoogleIcon />
          Continue with Google
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default SignInDialog;
