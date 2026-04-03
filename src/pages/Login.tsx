import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/useAuthStore";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();

  const from = location.state?.from?.pathname || "/dashboard";

  // Redirect when user becomes authenticated (from real login or bypass)
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, from]);


  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      if (isSignUp) {
        // Step 1: Check the whitelist via RPC (Bypasses RLS safely)
        const { data: whitelisted, error: rpcErr } = await supabase.rpc("is_email_whitelisted", { 
          check_email: email.trim().toLowerCase() 
        });

        if (rpcErr || !whitelisted) {
          throw new Error("Unauthorized Email. Please ask an Admin to pre-approve your account first.");
        }

        // Step 2: Proceed with Auth SignUp
        const { error: authError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
        });

        if (authError) {
          if (authError.message.includes("already registered")) {
            throw new Error("Email already registered. Please Sign In instead.");
          }
          throw authError;
        }

        setSuccess("Account security set up! You can now log in.");
        setIsSignUp(false); // Switch back to Sign In mode
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (authError) throw authError;

        // Verify profile existence just in case they were deleted from public.users
        const { data: profile } = await supabase
          .from("users")
          .select("id")
          .eq("email", email.trim().toLowerCase())
          .single();

        if (!profile) {
          await supabase.auth.signOut();
          throw new Error("Your account profile was removed by an Administrator.");
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      // Check for specific 'function not found' error to guide the user to run the SQL
      if (err.message?.includes("function") && err.message?.includes("not found")) {
        setError("Database setup missing. Please ask your Admin to run the mandatory SQL script for the 'is_email_whitelisted' function.");
      } else {
        setError(err.message || "Invalid email or password. Please try again.");
      }
      setIsSubmitting(false);
    } finally {
      // We only stop the spinner here if we haven't successfully logged in
      // If we are signed in, the top-level useEffect will handle the redirect
      if (!isAuthenticated) {
        setIsSubmitting(false);
      }
    }
  };

  // Show spinner while already authenticated (redirect in progress)
  if (isAuthenticated && user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-slate-50 relative overflow-hidden h-screen">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 bg-primary/5 pattern-boxes pattern-primary/10 pattern-size-6" />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-sm relative z-10">
        <h2 className="mt-10 text-center text-3xl font-bold leading-9 tracking-tight text-primary">
          <span className="text-accent">CIS</span> Portal
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Customer Input Requirements System
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm relative z-10">
        <div className="bg-white px-6 py-8 shadow sm:rounded-lg sm:px-12 border border-gray-100">
          <form className="space-y-6" onSubmit={handleAuth}>
            {error && (
              <div className="p-3 text-sm text-white bg-red-500 rounded-md animate-pulse">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 text-sm text-white bg-green-600 rounded-md flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {success}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-3"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                  Password
                </label>
                <div className="text-sm">
                  <a href="#" className="font-semibold text-primary hover:text-accent transition-colors">
                    Forgot password?
                  </a>
                </div>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-3"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full justify-center items-center rounded-md bg-accent px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent transition-colors disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSignUp ? "Creating account..." : "Signing in..."}
                  </>
                ) : (
                  isSignUp ? "Sign Up & Set Password" : "Sign In"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            {isSignUp ? (
              <p>
                Already setup?{" "}
                <button type="button" onClick={() => { setIsSignUp(false); setError(""); }} className="font-semibold text-primary hover:text-accent">
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                First time logging in?{" "}
                <button type="button" onClick={() => { setIsSignUp(true); setError(""); }} className="font-semibold text-primary hover:text-accent">
                  Set up your password
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
