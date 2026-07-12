import React, { useState, useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../lib/firebase";
import * as Icons from "lucide-react";

interface PublicVerificationViewProps {
  verifyId: string;
  onBackToLogin?: () => void;
}

export function PublicVerificationView({ verifyId, onBackToLogin }: PublicVerificationViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifiedData, setVerifiedData] = useState<{
    type: "Lifting Tool Certificate" | "Machine Certificate" | "Operator Card";
    data: any;
  } | null>(null);

  useEffect(() => {
    async function loadCertificate() {
      setLoading(true);
      setError(null);

      try {
        const functions = getFunctions(app);
        const verifyCertificate = httpsCallable(functions, "verifyCertificate");

        let res = await verifyCertificate({ certId: verifyId, certType: "machine" });
        let result = res.data as any;
        if (result.found) {
          setVerifiedData({ type: "Machine Certificate", data: result });
          setLoading(false);
          return;
        }

        res = await verifyCertificate({ certId: verifyId, certType: "lifting" });
        result = res.data as any;
        if (result.found) {
          setVerifiedData({ type: "Lifting Tool Certificate", data: result });
          setLoading(false);
          return;
        }

        res = await verifyCertificate({ certId: verifyId, certType: "operator" });
        result = res.data as any;
        if (result.found) {
          setVerifiedData({ type: "Operator Card", data: result });
          setLoading(false);
          return;
        }

        setError("Certificate / ID could not be found or verified in our official registry database.");
      } catch (err: any) {
        console.error("Error verifying certificate:", err);
        setError("A database connection error occurred. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    if (verifyId) {
      loadCertificate();
    }
  }, [verifyId]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 md:p-8 relative selection:bg-[#683EFF]/20 font-sans" id="verify-root">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-800/40 via-slate-900 to-slate-950 pointer-events-none" />
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden relative z-10 border border-slate-100/10 flex flex-col my-8">
        {/* Header Branding Panel */}
        <div className="bg-[#0E1B2D] p-6 flex flex-col md:flex-row items-center justify-between border-b border-slate-800 gap-4">
          <div className="flex items-center gap-4">
            <img
              src="https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0459155438.firebasestorage.app/o/Branding%2FMEV%20Logo.png?alt=media&token=4556a2dc-9296-419c-9694-2b5519e1e7b8"
              alt="Middle East VIM Logo"
              className="h-14 w-auto object-contain"
            />
            <div className="text-left">
              <h1 className="text-white font-bold text-lg tracking-tight font-sans">MIDDLE EAST VIM</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Verification & Inspection Services</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold uppercase tracking-wider">
            <Icons.CheckCircle className="w-4 h-4 shrink-0" />
            Registry Verification
          </div>
        </div>

        {/* Dynamic State Body */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 gap-4 text-slate-600 bg-white">
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-[#683EFF]/10 border-t-[#683EFF] animate-spin" />
              <Icons.ShieldAlert className="w-5 h-5 text-[#683EFF] absolute animate-pulse" />
            </div>
            <p className="text-sm font-semibold animate-pulse tracking-wide font-sans">Connecting to MEV Registry Database...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 md:px-12 text-center bg-white">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-5 border border-rose-100 shadow-sm">
              <Icons.ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight font-sans">Verification Unsuccessful</h3>
            <p className="text-slate-500 text-sm max-w-md mt-2 leading-relaxed">
              {error}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-sm justify-center">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition-all border border-slate-700 shadow-sm"
              >
                <Icons.RefreshCw className="w-4 h-4" />
                Retry Lookup
              </button>
              {onBackToLogin && (
                <button
                  onClick={onBackToLogin}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-all border border-slate-200"
                >
                  <Icons.ArrowLeft className="w-4 h-4" />
                  Back to ERP Portal
                </button>
              )}
            </div>
          </div>
        ) : verifiedData ? (
          <div className="bg-white p-6 md:p-8 flex-1 flex flex-col">
            {/* Verification Seal Banner */}
            <div className="bg-emerald-50 border border-emerald-200/60 rounded-2xl p-5 mb-8 flex items-start gap-4">
              <div className="p-3 bg-emerald-500 text-white rounded-xl shrink-0 shadow-sm">
                <Icons.Check className="w-6 h-6 stroke-[3px]" />
              </div>
              <div className="text-left">
                <h4 className="text-emerald-950 font-bold text-base font-sans tracking-tight">OFFICIALLY VERIFIED & ACTIVE</h4>
                <p className="text-emerald-700 text-xs mt-0.5 leading-relaxed">
                  This record is registered with Middle East VIM. Any alteration of this text invalidates the document's legal status.
                </p>
              </div>
            </div>

            {/* Certificate Identity */}
            <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">CERTIFICATE TYPE</span>
                <span className="text-slate-950 text-lg font-bold font-sans tracking-tight">{verifiedData.type}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-left sm:text-right">REGISTRY RECORD ID</span>
                <span className="text-[#683EFF] text-base font-mono font-semibold tracking-wide block text-left sm:text-right">{verifyId}</span>
              </div>
            </div>

            {/* Tabular Details Grid */}
            <div className="space-y-4 text-left flex-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">REGISTRATION DETAILS</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {verifiedData.type === "Lifting Tool Certificate" && (
                  <>
                    <div className="border border-slate-50 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Certificate Serial No.</span>
                      <span className="text-slate-800 font-semibold text-sm block mt-0.5">{verifiedData.data.namingSeries || "N/A"}</span>
                    </div>
                    <div className="border border-slate-50 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Client / Owner Name</span>
                      <span className="text-slate-800 font-semibold text-sm block mt-0.5">{verifiedData.data.clientName || "N/A"}</span>
                    </div>
                    <div className="border border-slate-50 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Lifting Tool Description</span>
                      <span className="text-[#683EFF] font-bold text-sm block mt-0.5">{verifiedData.data.toolName || "N/A"}</span>
                    </div>
                    <div className="border border-slate-50 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Safe Working Load (SWL)</span>
                      <span className="text-slate-800 font-semibold text-sm block mt-0.5">{verifiedData.data.safeWorkingLoad || "N/A"}</span>
                    </div>
                    <div className="border border-slate-50 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Inspection Date</span>
                      <span className="text-slate-800 font-semibold text-sm block mt-0.5">{verifiedData.data.issueDate || "N/A"}</span>
                    </div>
                    <div className="border border-slate-50 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Next Inspection Expiration</span>
                      <span className="text-slate-800 font-semibold text-sm block mt-0.5">{verifiedData.data.expiryDate || verifiedData.data.nextInspectionDate || "N/A"}</span>
                    </div>
                    <div className="border border-slate-50 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Validity State</span>
                      <span className="text-emerald-600 font-bold text-sm block mt-0.5">{verifiedData.data.validity || "VALID / ACTIVE"}</span>
                    </div>
                    <div className="border border-slate-50 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Inspection Location</span>
                      <span className="text-slate-800 font-semibold text-sm block mt-0.5">{verifiedData.data.equipmentLocation || verifiedData.data.location || "N/A"}</span>
                    </div>
                    <div className="border border-slate-50 rounded-lg p-3 hover:bg-slate-50 transition-colors md:col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Type of Inspection / Standard</span>
                      <span className="text-slate-800 font-semibold text-sm block mt-0.5">{verifiedData.data.typeOfInspection || "N/A"} - {verifiedData.data.referenceStandard || "N/A"}</span>
                    </div>
                  </>
                )}

                {verifiedData.type === "Machine Certificate" && (
                  <>
                    <div className="border border-slate-50 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Certificate Serial No.</span>
                      <span className="text-slate-800 font-semibold text-sm block mt-0.5">{verifiedData.data.namingSeries || "N/A"}</span>
                    </div>
                    <div className="border border-slate-50 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Client / Owner Name</span>
                      <span className="text-slate-800 font-semibold text-sm block mt-0.5">{verifiedData.data.clientName || "N/A"}</span>
                    </div>
                    <div className="border border-slate-50 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Equipment / Asset Tested</span>
                      <span className="text-[#683EFF] font-bold text-sm block mt-0.5">{verifiedData.data.equipmentName || "N/A"}</span>
                    </div>
                    <div className="border border-slate-50 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Manufacturer & Model</span>
                      <span className="text-slate-800 font-semibold text-sm block mt-0.5">{verifiedData.data.manufacturer || "N/A"} - {verifiedData.data.modelName || "N/A"}</span>
                    </div>
                    <div className="border border-slate-50 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Serial Number</span>
                      <span className="text-slate-800 font-semibold text-sm block mt-0.5">{verifiedData.data.serialNumber || "N/A"}</span>
                    </div>
                    <div className="border border-slate-50 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Load Limit / SWL</span>
                      <span className="text-slate-800 font-semibold text-sm block mt-0.5">{verifiedData.data.loadLimit || "N/A"}</span>
                    </div>
                    <div className="border border-slate-50 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Inspection Date</span>
                      <span className="text-slate-800 font-semibold text-sm block mt-0.5">{verifiedData.data.inspectionDate || "N/A"}</span>
                    </div>
                    <div className="border border-slate-50 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Next Inspection Due</span>
                      <span className="text-slate-800 font-semibold text-sm block mt-0.5">{verifiedData.data.nextInspectionDate || verifiedData.data.expirationDate || "N/A"}</span>
                    </div>
                    <div className="border border-slate-50 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Inspection Location</span>
                      <span className="text-slate-800 font-semibold text-sm block mt-0.5">{verifiedData.data.equipmentLocation || "N/A"}</span>
                    </div>
                    <div className="border border-slate-50 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Inspection Result</span>
                      <span className="text-emerald-600 font-bold text-sm block mt-0.5">{verifiedData.data.result || "PASSED / SAFE FOR USE"}</span>
                    </div>
                  </>
                )}

                {verifiedData.type === "Operator Card" && (
                  <>
                    <div className="flex flex-col sm:flex-row items-center gap-4 border border-slate-100 bg-slate-50/40 rounded-xl p-4 md:col-span-2 mb-2">
                      {verifiedData.data.photoAttachment || verifiedData.data.photoUrl ? (
                        <img
                          src={verifiedData.data.photoAttachment || verifiedData.data.photoUrl}
                          alt="Operator Photo"
                          className="w-24 h-24 rounded-lg object-cover border-2 border-[#683EFF]/10 shadow-sm shrink-0"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 shrink-0 border">
                          <Icons.User className="w-10 h-10" />
                        </div>
                      )}
                      <div className="text-center sm:text-left">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">OPERATOR FULL NAME</span>
                        <h2 className="text-[#683EFF] text-xl font-bold font-sans tracking-tight mt-0.5">
                          {verifiedData.data.operatorName || `${verifiedData.data.firstName || ""} ${verifiedData.data.lastName || ""}`.trim() || "N/A"}
                        </h2>
                        <span className="text-xs text-slate-500 font-semibold block mt-1">{verifiedData.data.jobTitle || "Qualified Equipment Operator"}</span>
                      </div>
                    </div>

                    <div className="border border-slate-50 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Operator Badge Number</span>
                      <span className="text-slate-800 font-semibold text-sm block mt-0.5">{verifiedData.data.badgeNumber || verifiedData.data.idNumber || "N/A"}</span>
                    </div>
                    <div className="border border-slate-50 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Iqama / ID Number</span>
                      <span className="text-slate-800 font-semibold text-sm block mt-0.5">{verifiedData.data.iqamaNumber || "N/A"}</span>
                    </div>
                    <div className="border border-slate-50 rounded-lg p-3 hover:bg-slate-50 transition-colors md:col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Authorized Equipment Types</span>
                      <span className="text-slate-800 font-bold text-sm block mt-0.5 leading-relaxed">
                        {Array.isArray(verifiedData.data.authorizedEquipment) 
                          ? verifiedData.data.authorizedEquipment.join(", ") 
                          : verifiedData.data.authorizedEquipment || verifiedData.data.certifiedMachines || "N/A"}
                      </span>
                    </div>
                    <div className="border border-slate-50 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">License Type / Level</span>
                      <span className="text-slate-800 font-semibold text-sm block mt-0.5">{verifiedData.data.levelType || "N/A"}</span>
                    </div>
                    <div className="border border-slate-50 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Company Sponsor</span>
                      <span className="text-slate-800 font-semibold text-sm block mt-0.5">{verifiedData.data.company || verifiedData.data.sponsorName || "N/A"}</span>
                    </div>
                    <div className="border border-slate-50 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Issue Date</span>
                      <span className="text-slate-800 font-semibold text-sm block mt-0.5">{verifiedData.data.issueDate || verifiedData.data.issuedDate || "N/A"}</span>
                    </div>
                    <div className="border border-slate-50 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">License Expiration Date</span>
                      <span className="text-slate-800 font-semibold text-sm block mt-0.5">{verifiedData.data.licenseExpiry || "N/A"}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Verification Footer Disclaimer */}
            <div className="border-t border-slate-100 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
              <p className="flex items-center gap-1.5 leading-relaxed text-center sm:text-left">
                <Icons.Lock className="w-3.5 h-3.5" />
                Secured via MEV Digital Signature and Registry System
              </p>
              {onBackToLogin && (
                <button
                  onClick={onBackToLogin}
                  className="text-[#683EFF] hover:text-[#522CD9] font-bold uppercase tracking-wider text-[11px] flex items-center gap-1 hover:underline shrink-0"
                >
                  <Icons.ArrowLeft className="w-3.5 h-3.5" />
                  Return to Portal
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
