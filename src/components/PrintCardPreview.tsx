import React, { useRef, useState } from "react";
import { OperatorCard } from "../types";
import * as Icons from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { QRCodeSVG } from "qrcode.react";

import mevLogoAsset from "./Horizonal_MEV_logo.png";
import faviconAsset from "./Favicon.png";
import halfWhiteLogoAsset from "./Half_White_Logo.png";
import mevStampAsset from "./MEV_Stamp.png";

interface PrintCardPreviewProps {
  operator: OperatorCard;
  onClose: () => void;
}

export function PrintCardPreview({ operator, onClose }: PrintCardPreviewProps) {
  const [template, setTemplate] = useState("template1");
  const [isExporting, setIsExporting] = useState(false);

  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = useReactToPrint({
    contentRef: cardsContainerRef,
    documentTitle: `${operator.namingSeries || operator.id}_ID_Card`,
    onBeforePrint: () => {
      setIsExporting(true);
      return Promise.resolve();
    },
    onAfterPrint: () => setIsExporting(false),
  });

  const templates = [
    { id: "template1", name: "Template (No Approval)" }
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 px-6 bg-slate-900 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
          >
            <Icons.ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-black text-white">Print Preview</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">ID Card Generator</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Template</span>
            <select 
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="bg-white/10 border border-white/20 text-white text-sm font-bold rounded-lg px-3 py-2 outline-none focus:border-[#683EFF]"
            >
              {templates.map(t => (
                <option key={t.id} value={t.id} className="bg-slate-800">{t.name}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => handleDownloadPDF()}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#683EFF] hover:bg-[#582DE5] disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors shadow-lg"
          >
            {isExporting ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.Download className="w-4 h-4" />}
            {isExporting ? "Generating..." : "Print / Save as PDF"}
          </button>
        </div>
      </div>

      {/* Preview Area Container */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex flex-col items-center gap-10 pb-16 bg-slate-800">
        {template === "template1" && (
          <div ref={cardsContainerRef} className="flex flex-col gap-12 items-center justify-center transform origin-top w-full scale-[0.85] sm:scale-100 print:scale-100 print:transform-none">
            
            {/* ------------ FRONT COVER ------------ */}
            <div className="flex flex-col gap-2 shadow-2xl print:shadow-none print:break-after-page">
              <span className="text-xs font-bold text-slate-400 tracking-widest uppercase ml-2">Front</span>
              <div 
                ref={frontRef} 
                className="bg-white font-poppins rounded-xl overflow-hidden relative shadow-md shrink-0 flex flex-col border border-slate-200"
                style={{ 
                  WebkitFontSmoothing: "antialiased",
                  height: "540px",
                  minHeight: "540px",
                  maxHeight: "540px",
                  width: "856px",
                  minWidth: "856px",
                  maxWidth: "856px"
                }}
              >
                {/* Header */}
                <div className="h-[120px] shrink-0 flex items-center pl-10 pr-6 border-b border-slate-100">
                  <div className="flex items-center justify-center h-24 w-[280px]">
                    {mevLogoAsset ? (
                      <div className="w-full h-full" /> /* Space for MEV Logo */
                    ) : (
                      <MEVLogoDark />
                    )}
                  </div>
                  <div className="h-24 w-px bg-slate-300 mx-10"></div>
                  <div className="flex flex-col justify-center translate-y-1">
                    <h1 className="text-[24px] font-medium text-black tracking-wide uppercase leading-tight mb-1">Equipment Inspection Services</h1>
                    <p className="text-[#683EFF] font-normal text-[18px] tracking-wide">Safety. Integrity. Reliability</p>
                  </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 flex px-10 py-4 relative items-center min-h-0 overflow-hidden">
                  {/* Photo Profile */}
                  <div className="w-[215px] h-[252px] rounded-2xl overflow-hidden border border-[#683EFF]/30 bg-slate-100 shrink-0 shadow-sm relative mr-6 z-10 box-border p-1">
                    <div className="w-full h-full rounded-xl overflow-hidden bg-white">
                       {operator.photoAttachment ? (
                        <div className="w-full h-full bg-slate-100" /> /* Space for operator photo */
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                           <Icons.User className="w-24 h-24" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="flex-1 flex flex-col justify-center max-w-[400px] z-10">
                    <h2 className="text-[28px] font-bold text-slate-800 uppercase mb-1 leading-[1.2em]">{operator.operatorName}</h2>
                    <h3 className="text-xl font-medium text-[#683EFF] mb-1.5 leading-[1.2em]">{operator.levelType || "Operator"}</h3>
                    
                    {/* Horizontal Divider Line */}
                    <div className="w-full border-b border-[#683EFF]/40 mb-2.5"></div>

                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-[#683EFF] flex items-center justify-center text-white shrink-0 mr-3">
                          <Icons.IdCard className="w-[18px] h-[18px]" />
                        </div>
                        <span className="w-28 text-lg text-slate-800 font-medium">Card No</span>
                        <span className="text-lg text-slate-700 font-medium mx-3">:</span>
                        <span className="text-lg text-slate-900 font-normal leading-[1.2em]">{operator.namingSeries || operator.id}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-[#683EFF] flex items-center justify-center text-white shrink-0 mr-3">
                          <Icons.Building className="w-[18px] h-[18px]" />
                        </div>
                        <span className="w-28 text-lg text-slate-800 font-medium">ID No</span>
                        <span className="text-lg text-slate-700 font-medium mx-3">:</span>
                        <span className="text-lg text-slate-900 font-normal leading-[1.2em]">{operator.idNumber || "N/A"}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-[#683EFF] flex items-center justify-center text-white shrink-0 mr-3">
                          <Icons.User className="w-[18px] h-[18px]" />
                        </div>
                        <span className="w-28 text-lg text-slate-800 font-medium">Company</span>
                        <span className="text-lg text-slate-700 font-medium mx-3">:</span>
                        <span className="text-lg text-slate-900 font-normal leading-[1.2em]">{operator.company || "N/A"}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-[#683EFF] flex items-center justify-center text-white shrink-0 mr-3">
                          <Icons.Award className="w-[18px] h-[18px]" />
                        </div>
                        <span className="w-28 text-lg text-slate-800 font-medium">Level/Type</span>
                        <span className="text-lg text-slate-700 font-medium mx-3">:</span>
                        <span className="text-lg text-slate-900 font-normal leading-[1.2em]">{operator.levelType || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="absolute top-1/2 right-6 -translate-y-1/2 p-2 bg-white rounded-xl shadow-sm border border-[#683EFF] z-10">
                    <QRCodeSVG value={`https://mev-ins.com/verify/${operator.id}`} size={120} />
                  </div>
                  
                  {/* Watermark in background */}
                  {faviconAsset && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.15] pointer-events-none z-0">
                      <div className="w-[280px] h-[280px]" /> {/* Space for Watermark */}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="h-[120px] shrink-0 flex">
                  {/* Left Purple (50%) */}
                  <div className="w-1/2 bg-[#683EFF] h-full px-8 flex items-center justify-around">
                    <div className="flex items-center gap-3 text-white">
                      <Icons.Clock className="w-8 h-8 opacity-85" />
                      <div className="flex flex-col">
                        <span className="text-[12px] font-normal uppercase tracking-wider opacity-90">Issue Date</span>
                        <span className="text-[17px] font-semibold leading-[1.2em]">{operator.issueDate ? new Date(operator.issueDate).toISOString().split('T')[0] : "N/A"}</span>
                      </div>
                    </div>
                    
                    {/* Vertical Divider */}
                    <div className="h-10 w-px bg-white/30 self-center"></div>

                    <div className="flex items-center gap-3 text-white">
                      <Icons.ShieldCheck className="w-8 h-8 opacity-85" />
                      <div className="flex flex-col">
                        <span className="text-[12px] font-normal uppercase tracking-wider opacity-90">Expiry Date</span>
                        <span className="text-[17px] font-semibold leading-[1.2em]">{operator.licenseExpiry ? new Date(operator.licenseExpiry).toISOString().split('T')[0] : "N/A"}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Dark (50%) */}
                  <div className="w-1/2 bg-[#111827] h-full p-6 flex flex-col justify-center pl-8 text-white relative overflow-hidden">
                    <div className="grid grid-cols-1 gap-2 z-10">
                      <div className="flex items-center gap-3">
                        <Icons.Globe className="w-3.5 h-3.5 text-[#683EFF] shrink-0" />
                        <span className="text-xs font-medium text-white">Website: www.mev-ins.com</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Icons.Mail className="w-3.5 h-3.5 text-[#683EFF] shrink-0" />
                        <span className="text-xs font-medium text-white">Email: info@mev-ins.com</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Icons.Phone className="w-3.5 h-3.5 text-[#683EFF] shrink-0" />
                        <span className="text-xs font-medium text-white">Mob: +966 53 404 3543</span>
                      </div>
                      <div className="flex items-start gap-3 mt-0.5">
                        <Icons.MapPin className="w-3.5 h-3.5 text-[#683EFF] shrink-0 mt-0.5" />
                        <span className="text-xs font-medium text-white leading-tight max-w-[320px]">
                          3329 Prince Mutaib bin Abdulaziz Rd, Mishrifah District, Jeddah 23341, Saudi Arabia
                        </span>
                      </div>
                    </div>

                    {/* Elegant right-side pattern on the far right end */}
                    <div className="absolute right-0 top-0 bottom-0 w-28 overflow-hidden pointer-events-none opacity-25 z-0">
                      <div className="absolute top-[-50%] right-[-10%] w-[100%] h-[200%] bg-[#683EFF]/20 transform -skew-x-[24deg]"></div>
                      <div className="absolute top-0 right-4 h-full w-2 bg-[#683EFF] transform -skew-x-[24deg]"></div>
                      <div className="absolute top-0 right-8 h-full w-0.5 bg-[#683EFF] transform -skew-x-[24deg]"></div>
                      <div className="absolute top-0 right-10 h-full w-0.5 bg-[#683EFF]/50 transform -skew-x-[24deg]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ------------ BACK COVER ------------ */}
            <div className="flex flex-col gap-2 shadow-2xl print:shadow-none print:break-inside-avoid">
               <span className="text-xs font-bold text-slate-400 tracking-widest uppercase ml-2">Back</span>
               <div 
                  ref={backRef} 
                  className="bg-white font-poppins rounded-xl overflow-hidden relative shadow-md shrink-0 flex flex-col border border-slate-200"
                  style={{ 
                    WebkitFontSmoothing: "antialiased",
                    height: "540px",
                    minHeight: "540px",
                    maxHeight: "540px",
                    width: "856px",
                    minWidth: "856px",
                    maxWidth: "856px"
                  }}
                >
                  {/* Main content row */}
                  <div className="flex flex-1 overflow-hidden h-[490px]">
                    {/* Left Column (Dark) */}
                    <div className="w-[210px] bg-[#111827] h-full flex flex-col items-center justify-center p-6 text-center shrink-0 relative overflow-hidden">
                      <div className="w-40 flex justify-center items-center z-10">
                        {halfWhiteLogoAsset && (
                          <div className="w-full h-[150px]" /> /* Space for Half White Logo */
                        )}
                      </div>
                    </div>

                    {/* Right Column (Light) */}
                    <div className="flex-1 flex flex-col h-full bg-white relative">
                      
                      {/* Top sections */}
                      <div className="p-8 flex pb-0 items-start pt-[34px] h-[210px]">
                        {/* Contact Info (Left) */}
                        <div className="w-[250px] flex flex-col gap-3.5 pr-4 shrink-0">
                          <div className="flex items-center gap-3 text-slate-800">
                             <Icons.Globe className="w-4 h-4 text-[#683EFF]" />
                             <span className="text-xs font-medium">Website: www.mev-ins.com</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-800">
                             <Icons.Mail className="w-4 h-4 text-[#683EFF]" />
                             <span className="text-xs font-medium">Email: info@mev-ins.com</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-800">
                             <Icons.Phone className="w-4 h-4 text-[#683EFF]" />
                             <span className="text-xs font-medium">Mob: +966 53 404 3543</span>
                          </div>
                          <div className="flex items-start gap-3 text-slate-800">
                             <Icons.MapPin className="w-4 h-4 text-[#683EFF] shrink-0 mt-0.5" />
                             <span className="text-xs font-medium leading-relaxed">
                               3329 Prince Mutaib bin Abdulaziz Rd, Mishrifah District, Jeddah 23341, Saudi Arabia
                             </span>
                          </div>
                        </div>

                        {/* Vertical Divider between company info and disclaimer */}
                        <div className="w-px bg-[#683EFF] h-[160px] shrink-0 self-start mt-1 mx-2"></div>

                        {/* Disclaimer (Right) */}
                        <div className="flex-1 pl-6">
                          <p className="text-[12.5px] text-slate-700 font-medium leading-relaxed text-justify">
                             This card is only valid for the equipment as stated. Use of this card by person other than its owner is considered forgery & will be punishable by Law & will be punishable by law & whoever find it shall return MEV Office. Any liability occuring due to error in operations or damage will not be the responsibilty of issuing agency.
                          </p>
                        </div>
                      </div>

                      {/* Signatures */}
                      <div className="flex-1 flex px-10 pb-8 items-start justify-between pt-2.5 relative -top-[5px]">
                         <div className="flex flex-col items-center w-48 relative">
                            <div className="text-base font-bold text-[#683EFF] mb-2 uppercase text-center w-full">Authorized By:</div>
                            <div className="h-32 w-32 flex items-center justify-center relative">
                              {mevStampAsset && (
                                <div className="absolute inset-0 w-full h-full" /> /* Space for MEV Stamp */
                              )}
                              {operator.authorizedBySignature ? (
                                <div className="absolute inset-0 w-full h-full" /> /* Space for Authorized By */
                              ) : null}
                            </div>
                         </div>

                         <div className="flex flex-col items-center shrink-0 min-w-[12rem] relative right-[35px]">
                            <div className="text-base font-bold text-[#683EFF] mb-2 uppercase text-center whitespace-nowrap leading-tight">
                               {operator.trainedBy && operator.trainedBy.length > 12 ? (
                                  <>
                                     Trained By:
                                     <br />
                                     {operator.trainedBy}
                                  </>
                               ) : (
                                  `Trained By: ${operator.trainedBy || ""}`
                               )}
                            </div>
                            <div className="h-32 w-40 flex items-center justify-center relative overflow-hidden">
                               {operator.trainedBySignature ? (
                                  <div className="w-full h-full" /> /* Space for Trained By */
                               ) : null}
                            </div>
                         </div>
                      </div>

                    </div>
                  </div>

                  {/* Footer Warning - Full Width at very bottom */}
                  <div className="h-[50px] bg-slate-100 border-y-4 border-[#683EFF] w-full flex items-center justify-center gap-12 shrink-0 z-10 pb-[5px] relative -top-[5px]">
                    <div className="h-1.5 w-16 bg-[#683EFF] rounded-full"></div>
                    <span className="text-lg font-bold text-[#683EFF] uppercase tracking-wide whitespace-nowrap">This is not a Saudi Government License</span>
                    <div className="h-1.5 w-16 bg-[#683EFF] rounded-full"></div>
                  </div>

               </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

// Logo helpers to keep main structure clean
function MEVLogoDark({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M10 90 L30 10 L50 90 L70 10 L90 90" stroke="#111827" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 50 L30 90 L50 50 L70 90 L90 50" stroke="#683EFF" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function MEVLogoLight({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
       <path d="M10 90 L30 10 L50 90 L70 10 L90 90" stroke="white" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M10 50 L30 90 L50 50 L70 90 L90 50" stroke="#683EFF" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
