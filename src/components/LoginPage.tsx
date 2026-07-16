import React, { useState } from "react";
import { signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, signInWithGoogle } from "../lib/firebase";
import * as Icons from "lucide-react";

import { EmployeeDetail, CustomerDetail } from "../types";

interface LoginPageProps {
  onSuccess: (user: any) => void;
  triggerCloudToast: (msg: string) => void;
  employees: EmployeeDetail[];
  customers: CustomerDetail[];
  domainMode: "ERP" | "CLIENT";
  setDomainMode: (mode: "ERP" | "CLIENT") => void;
  isDevEnvironment: boolean;
  externalError?: string | null;
  onClearExternalError?: () => void;
}

export function LoginPage({
  onSuccess,
  triggerCloudToast,
  employees,
  customers,
  domainMode,
  setDomainMode,
  isDevEnvironment,
  externalError,
  onClearExternalError,
}: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearAllErrors = () => {
    setErrorMessage(null);
    if (onClearExternalError) {
      onClearExternalError();
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearAllErrors();

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      triggerCloudToast(`✓ Signed in successfully as ${userCred.user.displayName || userCred.user.email}`);
      onSuccess(userCred.user);
    } catch (err: any) {
      console.error("Auth error:", err);
      let friendlyMessage = err.message;
      if (err.code === "auth/invalid-credential") {
        friendlyMessage = "Invalid email or password. Please check your credentials.";
      } else if (err.code === "auth/invalid-email") {
        friendlyMessage = "Please enter a valid email address.";
      }
      setErrorMessage(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    clearAllErrors();
    try {
      const res = await signInWithGoogle();
      triggerCloudToast(`✓ Signed in successfully via Google!`);
      onSuccess(res.user);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.message?.includes('popup-closed-by-user')) {
        console.log('Google sign in popup closed by user.');
        setErrorMessage("Google Sign-In popup was closed or blocked. If you are using the AI Studio preview iframe, please click the 'Open in New Tab' link below to log in successfully.");
      } else {
        console.error("Google sign in error:", err);
        setErrorMessage(err.message || "Google Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isIframe = typeof window !== "undefined" && window.self !== window.top;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative selection:bg-[#683EFF]/20 font-sans" id="login-root">
      {/* Background radial gradient decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-800/50 via-slate-900 to-slate-950 pointer-events-none" />

      {/* Dev Switcher Banner */}
      {isDevEnvironment && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700/60 text-slate-200 text-xs py-2.5 px-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center gap-2 sm:gap-4 z-20 transition-all">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-bold text-amber-400">🛠️ Developer Simulator:</span>
            <span className="text-slate-400">Preview subdomains:</span>
          </div>
          <div className="flex bg-slate-950 rounded-xl p-0.5 border border-slate-700/60">
            <button
              onClick={() => {
                setDomainMode("ERP");
                clearAllErrors();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                domainMode === "ERP"
                  ? "bg-[#683EFF] text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              erp.mev-ins.com (ERP)
            </button>
            <button
              onClick={() => {
                setDomainMode("CLIENT");
                clearAllErrors();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                domainMode === "CLIENT"
                  ? "bg-[#683EFF] text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              client.mev-ins.com (Clients)
            </button>
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100/10 z-10 flex flex-col p-8 relative">
        
        {/* Branding Area */}
        <div className="flex flex-col items-center text-center mb-8">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0459155438.firebasestorage.app/o/Branding%2FMEV%20Logo.png?alt=media&token=4556a2dc-9296-419c-9694-2b5519e1e7b8"
            alt="Middle East VIM Logo"
            className="h-20 w-auto object-contain mb-4 transform hover:scale-105 transition-transform duration-200"
          />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">MIDDLE EAST VIM</h1>
          <p className="text-xs text-[#683EFF] font-black uppercase tracking-widest mt-1">
            {domainMode === "CLIENT" ? "🔑 Client Portal" : "💼 Staff ERP Workspace"}
          </p>
        </div>

        {/* Error message alert block */}
        {(errorMessage || externalError) && (
          <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200/60 text-rose-700 p-3.5 rounded-xl text-xs font-medium text-left mb-5 animate-headShake">
            <Icons.AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage || externalError}</span>
          </div>
        )}

        {/* Email Form for Clients */}
        {domainMode === "CLIENT" && (
          <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <Icons.Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearAllErrors();
                  }}
                  className="w-full bg-slate-50/50 border border-slate-100 text-slate-900 text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-[#683EFF]/30 focus:bg-white transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <Icons.Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearAllErrors();
                  }}
                  className="w-full bg-slate-50/50 border border-slate-100 text-slate-900 text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-[#683EFF]/30 focus:bg-white transition-all shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#683EFF] hover:bg-[#522CD9] text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-[#683EFF]/20 active:translate-y-0.5 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              ) : (
                "Sign In to Client Portal"
              )}
            </button>
          </form>
        )}

        {/* Google Auth Button for ERP */}
        {domainMode === "ERP" && (
          <div className="space-y-3 w-full">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:bg-slate-50 hover:border-slate-300 shadow-sm hover:shadow active:translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {/* Flat Google logo */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.74 14.96 1 12 1 7.35 1 3.39 3.65 1.5 7.5l3.6 2.8C6 7.42 8.76 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.6 2.8c2.1-1.94 3.31-4.8 3.31-8.46z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.1 14.7c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3L1.5 7.3C.54 9.12 0 11.16 0 13.3s.54 4.18 1.5 6l3.6-2.6z"
                />
                <path
                  fill="#34A353"
                  d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.6-2.8c-1.1.74-2.52 1.18-4.36 1.18-3.24 0-6-2.38-6.98-5.26l-3.6 2.8C3.39 20.35 7.35 23 12 23z"
                />
              </svg>
              Sign In to ERP Workspace
            </button>
            {isIframe && (
              <div className="text-center">
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#683EFF] hover:underline font-bold inline-flex items-center gap-1.5 mt-1 transition-all"
                >
                  <Icons.ExternalLink className="w-3.5 h-3.5" />
                  Open App in New Tab to Sign In
                </a>
              </div>
            )}
          </div>
        )}

        {/* Security / System Access Notice */}
        <p className="text-[10px] text-slate-400 leading-normal text-center mt-6">
          {domainMode === "CLIENT" 
            ? "Your client account must have active credentials. Contact MEV Operations support if you cannot sign in."
            : "Access is restricted to authorized MEV personnel. External auditors can verify printed certificates directly via QR scan verification."
          }
        </p>

      </div>
    </div>
  );
}
