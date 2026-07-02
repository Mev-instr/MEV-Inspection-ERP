import React, { useRef, useState, useEffect } from "react";
import { LiftingToolCert } from "../types";
import * as Icons from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { QRCodeSVG } from "qrcode.react";

import mevLogoAsset from "./Horizonal_MEV_logo.png";
import faviconAsset from "./Favicon.png";
import mevStampAsset from "./MEV_Stamp.png";
import halfWhiteLogoAsset from "./Half_White_Logo.png";

interface PrintLiftingToolCertPreviewProps {
  certificate: LiftingToolCert;
  onClose: () => void;
}

export function PrintLiftingToolCertPreview({ certificate, onClose }: PrintLiftingToolCertPreviewProps) {
  const [template, setTemplate] = useState("template1");
  const [isExporting, setIsExporting] = useState(false);

  const certRef = useRef<HTMLDivElement>(null);

  // Pre-load fallback images to avoid CORS issues during PDF generation
  const fallbackInspSigBase64 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100'></svg>";
  const fallbackAuthSigBase64 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100'></svg>";
  const fallbackStampBase64 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><circle cx='100' cy='100' r='90' stroke='green' stroke-width='5' fill='none'/><text x='100' y='110' font-family='sans-serif' font-size='30' fill='green' text-anchor='middle'>APPROVED</text></svg>";

  const handleDownloadPDF = useReactToPrint({
    contentRef: certRef,
    documentTitle: `${certificate.namingSeries || certificate.id}_Certificate`.replace(/[/\\?%*:|"<>]/g, '-'),
    pageStyle: `@media print { @page { size: A4; margin: 0; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`,
    onPrintError: (error) => console.error("Print error:", error),
    onAfterPrint: () => console.log("Print success"),
  });

  const d = new Date();
  const certDateStr = d.toISOString().split('T')[0];

  const dummyLoadChartData = [
    { boom: "10.0", radius: "3.0", swl: "20.0", testLoad: "20.0" },
    { boom: "13.5", radius: "3.0", swl: "17.5", testLoad: "17.5" },
    { boom: "17.0", radius: "4.0", swl: "15.0", testLoad: "15.0" }
  ];

  const hasAccessoriesData = certificate.accessoriesData && certificate.accessoriesData.length > 0;
  const accessoriesDataToRender = hasAccessoriesData ? certificate.accessoriesData : [{ no: 1, idNo: "N/A", description: "N/A", type: "N/A", swl: "N/A", sizeWidth: "N/A", length: "N/A", color: "N/A", result: "N/A", remark: "N/A" }];

  const DetailRow = ({ label, value, labelWidth = "w-[140px]", compact = false }: { label: string, value: React.ReactNode, labelWidth?: string, compact?: boolean }) => (
    <div className="flex border-b border-slate-200 last:border-0 text-[10px]">
      <div className={`${labelWidth} shrink-0 bg-slate-50 font-semibold text-slate-700 ${compact ? 'py-1 px-3' : 'py-1.5 px-3'} border-r border-slate-200 flex items-center`}>{label}</div>
      <div className={`flex-1 ${compact ? 'py-1 px-3' : 'py-1.5 px-3'} flex items-center text-slate-600 bg-white`}>{value || "N/A"}</div>
    </div>
  );

  const templates = [
    { id: "template1", name: "Template (No Approval)" }
  ];

  const headerLogoUrl = "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0459155438.firebasestorage.app/o/Branding%2FHorizonal%20MEV%20logo.png?alt=media&token=6fd9c05f-5c66-4c31-94b5-06ff4cb6c980";
  const footerLogoUrl = "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0459155438.firebasestorage.app/o/Branding%2FHorizontal%20White%20Logo.png?alt=media&token=41850433-efdc-4527-bcc3-a071cb41cc35";

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
      {/* Top Header */}
      <div className="flex flex-col p-4 px-6 bg-slate-900 border-b border-white/10 shrink-0 gap-4">
        <div className="flex items-center w-full">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors mr-4"
          >
            <Icons.ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-black text-white">Print Preview</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Lifting Tool Certificate</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs font-bold text-slate-400 shrink-0">Template</span>
            <select 
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="bg-white/10 border border-white/20 text-white text-sm font-bold rounded-lg px-3 py-2 outline-none focus:border-[#683EFF] w-full"
            >
              {templates.map(t => (
                <option key={t.id} value={t.id} className="bg-slate-800">{t.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => handleDownloadPDF()}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#683EFF] hover:bg-[#582DE5] text-white rounded-lg text-sm font-bold transition-colors shadow-lg w-full sm:w-auto whitespace-nowrap"
          >
            <Icons.Download className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Preview Area Container */}
      <div className="flex-1 overflow-auto p-1 sm:p-8 flex flex-col items-center gap-4 pb-16 bg-slate-800">
        {template === "template1" && (
          <div className="flex flex-col gap-4 items-center justify-center transform origin-top w-full scale-[0.5] sm:scale-75 md:scale-90 lg:scale-100 print:scale-100 print:transform-none">
              
              {/* ------------ CERTIFICATE ------------ */}
              <div className="flex flex-col gap-2 shadow-2xl print:shadow-none max-w-full">
                <span className="text-xs font-bold text-slate-400 tracking-widest uppercase ml-2">Certificate</span>
                 {/* A4 wrapper: Aspect Ratio 1:1.414, setting fixed width to easily map px to mm. 
                     A4 at 96 DPI is approx 794x1123px. We'll use 800x1131px to keep it simple. */}
                 <div 
                  ref={certRef} 
                  id="certificate-content"
                  className="bg-white font-poppins relative shadow-md shrink-0 flex flex-col text-slate-800 box-border overflow-hidden"
                  style={{ 
                    WebkitFontSmoothing: "antialiased",
                    width: "800px", 
                    height: "1131px" 
                  }}
                >
                  
                  {/* Top Header */}
                  <div className="flex justify-between items-start pt-10 px-10">
                    {/* Left Logo */}
                    <div className="w-50 h-auto flex flex-col items-center">
                         <img src={headerLogoUrl} alt="MEV Logo" className="w-full h-full object-contain" />
                    </div>
                    {/* Right Titles */}
                    <div className="flex flex-col items-end mt-1">
                       <h1 className="text-[44px] font-bebas font-medium text-[#683EFF] uppercase tracking-wide leading-none">Lifting Tool Certificate</h1>
                       <div className="flex items-center gap-4 w-full">
                         <div className="h-[2px] bg-slate-800 flex-1"></div>
                         <h2 className="text-[17px] font-semibold tracking-widest uppercase text-slate-800">{certificate.namingSeries || "N/A"}</h2>
                         <div className="h-[2px] bg-slate-800 flex-1"></div>
                       </div>
                    </div>
                  </div>

                  {/* Badges Sections - Row 1, Row 2, Row 3 */}
                  <div className="flex flex-col gap-2 px-10 mt-3">
                     {/* Row 1 */}
                     <div className="flex border border-[#683EFF]/20 rounded-xl bg-white overflow-hidden divide-x divide-[#683EFF]/20">
                        <div className="flex-1 flex flex-col items-center justify-center py-2 px-1 text-center">
                           <div className="w-5 h-5 flex items-center justify-center mb-1 text-[#683EFF]">
                              <Icons.User className="w-4 h-4" />
                           </div>
                           <span className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">Client Name</span>
                           <span className="text-[11px] font-bold text-slate-800 uppercase line-clamp-1 truncate max-w-full px-1">{certificate.clientName || "N/A"}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center py-2 px-1 text-center">
                           <div className="w-5 h-5 flex items-center justify-center mb-1 text-[#683EFF]">
                              <Icons.ClipboardCheck className="w-4 h-4" />
                           </div>
                           <span className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">Checklist</span>
                           <span className="text-[11px] font-bold text-slate-800 uppercase line-clamp-1 truncate max-w-full px-1">{certificate.checkList || "N/A"}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center py-2 px-1 text-center">
                           <div className="w-5 h-5 flex items-center justify-center mb-1 text-[#683EFF]">
                              <Icons.Clock className="w-4 h-4" />
                           </div>
                           <span className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">Timesheet No</span>
                           <span className="text-[11px] font-bold text-slate-800 uppercase line-clamp-1 truncate max-w-full px-1">{certificate.timeSheetNumber || "N/A"}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center py-2 px-1 text-center">
                           <div className="w-5 h-5 flex items-center justify-center mb-1 text-[#683EFF]">
                              <Icons.Briefcase className="w-4 h-4" />
                           </div>
                           <span className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">Job No</span>
                           <span className="text-[11px] font-bold text-slate-800 uppercase line-clamp-1 truncate max-w-full px-1">{certificate.jobNumber || "N/A"}</span>
                        </div>
                     </div>

                     {/* Row 2 */}
                     <div className="flex border border-[#683EFF]/20 rounded-xl bg-white overflow-hidden divide-x divide-[#683EFF]/20">
                        <div className="flex-1 flex flex-col items-center justify-center py-2 px-1 text-center">
                           <div className="w-5 h-5 flex items-center justify-center mb-1 text-[#683EFF]">
                              <Icons.CalendarPlus className="w-4 h-4" />
                           </div>
                           <span className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">Inspection Date</span>
                           <span className="text-[11px] font-bold text-slate-800 uppercase line-clamp-1 truncate max-w-full px-1">
                              {certificate.issueDate ? new Date(certificate.issueDate).toLocaleDateString("en-GB", {day: "2-digit", month: "short", year: "numeric"}) : "N/A"}
                           </span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center py-2 px-1 text-center">
                           <div className="w-5 h-5 flex items-center justify-center mb-1 text-[#683EFF]">
                              <Icons.CalendarOff className="w-4 h-4" />
                           </div>
                           <span className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">Expiration Date</span>
                           <span className="text-[11px] font-bold text-slate-800 uppercase line-clamp-1 truncate max-w-full px-1">
                              {certificate.expiryDate ? new Date(certificate.expiryDate).toLocaleDateString("en-GB", {day: "2-digit", month: "short", year: "numeric"}) : "N/A"}
                           </span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center py-2 px-1 text-center">
                           <div className="w-5 h-5 flex items-center justify-center mb-1 text-[#683EFF]">
                              <Icons.CalendarDays className="w-4 h-4" />
                           </div>
                           <span className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">Validity</span>
                           <span className="text-[11px] font-bold text-slate-800 uppercase line-clamp-1 truncate max-w-full px-1">{certificate.validity || "N/A"}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center py-2 px-1 text-center">
                           <div className="w-5 h-5 flex items-center justify-center mb-1 text-[#683EFF]">
                              <Icons.Palette className="w-4 h-4" />
                           </div>
                           <span className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">Color Code</span>
                           <span className="text-[11px] font-bold text-slate-800 uppercase line-clamp-1 truncate max-w-full px-1">{certificate.colorCode || "N/A"}</span>
                        </div>
                     </div>

                     {/* Row 3 */}
                     <div className="flex border border-[#683EFF]/20 rounded-xl bg-white overflow-hidden divide-x divide-[#683EFF]/20">
                        <div className="flex-1 flex flex-col items-center justify-center py-2 px-1 text-center">
                           <div className="w-5 h-5 flex items-center justify-center mb-1 text-[#683EFF]">
                              <Icons.MapPin className="w-4 h-4" />
                           </div>
                           <span className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">Inspection Location</span>
                           <span className="text-[11px] font-bold text-slate-800 uppercase line-clamp-1 truncate max-w-full px-1">{certificate.location || "N/A"}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center py-2 px-1 text-center">
                           <div className="w-5 h-5 flex items-center justify-center mb-1 text-[#683EFF]">
                              <Icons.Search className="w-4 h-4" />
                           </div>
                           <span className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">Type of Inspection</span>
                           <span className="text-[11px] font-bold text-slate-800 uppercase line-clamp-1 truncate max-w-full px-1">{certificate.typeOfInspection || "N/A"}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center py-2 px-1 text-center">
                           <div className="w-5 h-5 flex items-center justify-center mb-1 text-[#683EFF]">
                              <Icons.Award className="w-4 h-4" />
                           </div>
                           <span className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">Reference Standard</span>
                           <span className="text-[11px] font-bold text-slate-800 uppercase line-clamp-1 truncate max-w-full px-1">{certificate.referenceStandard || "N/A"}</span>
                        </div>
                     </div>
                  </div>

                  {/* Accessories Description Table */}
                  <div className="px-10 mt-[26px] flex-1">
                     <div className="border border-slate-800 rounded-lg overflow-hidden bg-white">
                        <div className="flex w-full bg-[#683EFF] text-white text-[11px] font-medium text-center uppercase border-b border-slate-800">
                           <div className="py-2 px-1 border-r border-slate-800 w-[4%] flex items-center justify-center shrink-0 whitespace-normal break-words">No</div>
                           <div className="py-2 px-1 border-r border-slate-800 w-[12%] flex items-center justify-center shrink-0 whitespace-normal break-words">ID No/TAG</div>
                           <div className="py-2 px-1 border-r border-slate-800 w-[20%] flex items-center justify-center shrink-0 whitespace-normal break-words">Description</div>
                           <div className="py-2 px-1 border-r border-slate-800 w-[9%] flex items-center justify-center shrink-0 whitespace-normal break-words">Type</div>
                           <div className="py-2 px-1 border-r border-slate-800 w-[8%] flex items-center justify-center shrink-0 whitespace-normal break-words">S.W.L</div>
                           <div className="py-2 px-1 border-r border-slate-800 w-[10%] flex items-center justify-center shrink-0 whitespace-normal break-words">Size/Width</div>
                           <div className="py-2 px-1 border-r border-slate-800 w-[8%] flex items-center justify-center shrink-0 whitespace-normal break-words">Length</div>
                           <div className="py-2 px-1 border-r border-slate-800 w-[8%] flex items-center justify-center shrink-0 whitespace-normal break-words">Color</div>
                           <div className="py-2 px-1 border-r border-slate-800 w-[8%] flex items-center justify-center shrink-0 whitespace-normal break-words">Result</div>
                           <div className="py-2 px-1 w-[13%] flex items-center justify-center shrink-0 whitespace-normal break-words">Remark</div>
                        </div>
                        {accessoriesDataToRender.map((row, i) => (
                          <div key={i} className="flex w-full border-b border-slate-800 last:border-0 text-[11px] text-black text-center font-normal bg-slate-50 break-words">
                             <div className="py-1.5 px-1 border-r border-slate-800 w-[4%] flex items-center justify-center shrink-0 font-normal whitespace-normal break-words">{row.no}</div>
                             <div className="py-1.5 px-1 border-r border-slate-800 w-[12%] flex items-center justify-center shrink-0 break-all font-normal whitespace-normal break-words">{row.idNo}</div>
                             <div className="py-1.5 px-1 border-r border-slate-800 w-[20%] flex items-center justify-start text-left px-2 shrink-0 font-normal whitespace-normal break-words">{row.description}</div>
                             <div className="py-1.5 px-1 border-r border-slate-800 w-[9%] flex items-center justify-center shrink-0 font-normal whitespace-normal break-words">{row.type}</div>
                             <div className="py-1.5 px-1 border-r border-slate-800 w-[8%] flex items-center justify-center shrink-0 font-normal whitespace-normal break-words">{row.swl}</div>
                             <div className="py-1.5 px-1 border-r border-slate-800 w-[10%] flex items-center justify-center shrink-0 font-normal whitespace-normal break-words">{row.sizeWidth}</div>
                             <div className="py-1.5 px-1 border-r border-slate-800 w-[8%] flex items-center justify-center shrink-0 font-normal whitespace-normal break-words">{row.length}</div>
                             <div className="py-1.5 px-1 border-r border-slate-800 w-[8%] flex items-center justify-center shrink-0 font-normal whitespace-normal break-words">{row.color}</div>
                             <div className="py-1.5 px-1 border-r border-slate-800 w-[8%] flex items-center justify-center shrink-0 font-bold text-emerald-700 whitespace-normal break-words">{row.result}</div>
                             <div className="py-1.5 px-1 w-[13%] flex items-center justify-center shrink-0 font-normal whitespace-normal break-words">{row.remark}</div>
                          </div>
                        ))}
                     </div>
                  </div>

                  

                  {/* Signatures Section */}
                  <div className="px-10 mt-[15px] flex justify-between items-end relative">
                     {/* Inspected By */}
                     <div className="flex flex-col w-[220px] text-center relative">
                        <span className="text-[13px] font-bold text-[#683EFF] uppercase tracking-widest leading-[1.2em] mb-[3px]">Inspected By</span>
                        <span className="text-[12px] font-bold text-slate-800 uppercase tracking-widest">{certificate.inspectedBy || "Zaid Mansoor"}</span>
                        <div className="h-24 flex items-center justify-center relative">
                           {certificate.inspectedBySignature ? (
                              <img src={certificate.inspectedBySignature} className="h-24 max-w-full object-contain relative z-10" alt="Inspected By" />
                           ) : (
                              <img src={fallbackInspSigBase64} className="h-24 max-w-full object-contain relative z-10" alt="Inspected By" />
                           )}
                        </div>
                     </div>

                     {/* QR Code */}
                     <div className="absolute left-1/2 -translate-x-1/2 bottom-[15px] flex flex-col items-center w-64 text-center">
                        <div className="p-0 bg-white rounded-xl shadow-sm border border-slate-200">
                           <QRCodeSVG 
                             value={`https://mev-ins.com/verify/${certificate.id}`}
                             size={85}
                             level="H"
                             fgColor="#111827"
                             bgColor="#FFFFFF"
                           />
                        </div>
                        <p className="text-[8px] font-medium text-slate-500 mt-2">To verify the inspection certificate, scan the QR code or visit our verification portal www.mev-ins.com/verification</p>
                     </div>

                     {/* Authorized By */}
                     <div className="flex flex-col w-[220px] text-center relative">
                        <span className="text-[13px] font-bold text-[#683EFF] uppercase tracking-widest leading-[1.2em] mb-[3px]">Authorized By</span>
                        <span className="text-[12px] font-bold text-slate-800 uppercase tracking-widest">{certificate.authorizedBy || "Ali Ahmed"}</span>
                        <div className="h-24 flex items-center justify-center relative">
                           {certificate.authorizedBySignature ? (
                              <img src={certificate.authorizedBySignature} className="h-24 max-w-full object-contain relative z-10" alt="Authorized By" />
                           ) : (
                              <img src={fallbackAuthSigBase64} className="h-24 max-w-full object-contain relative z-10" alt="Authorized By" />
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Statement Box */}
                  <div className="px-10 mt-[2px] mb-[5px]">
                     <div className="bg-slate-50 border border-slate-200 rounded-xl py-[5px] px-[15px]">
                        <p className="text-[10px] font-medium text-slate-500 leading-relaxed text-center">
                           This certificate relates only to the equipment inspected on the date stated, and it shall not be reproduced except in full without the written approval of MEV.
                        </p>
                     </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-auto mb-0 py-[5px] h-auto min-h-[100px] bg-[#111827] flex items-center px-10 gap-10">
                     <div className="w-[200px] shrink-0 border-r border-white/20 h-16 flex items-center pr-10">
                         <img src={footerLogoUrl} alt="MEV White Logo" className="w-full h-full object-contain" />
                     </div>
                     
                     <div className="flex-1 grid grid-cols-2 gap-y-[7px] gap-x-8 text-white/80">
                        <div className="flex items-center gap-2">
                           <Icons.FileText className="w-3.5 h-3.5 text-[#683EFF]" />
                           <span className="text-[10px] font-medium">C.R No: 4030384332</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <Icons.Globe className="w-3.5 h-3.5 text-[#683EFF]" />
                           <span className="text-[10px] font-medium">Website: www.mev-ins.com</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <Icons.Phone className="w-3.5 h-3.5 text-[#683EFF]" />
                           <span className="text-[10px] font-medium">Mob: +966 53 404 3543</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <Icons.Mail className="w-3.5 h-3.5 text-[#683EFF]" />
                           <span className="text-[10px] font-medium">Email: info@mev-ins.com</span>
                        </div>
                        <div className="col-span-2 flex items-start gap-2 mt-1">
                           <Icons.MapPin className="w-3.5 h-3.5 text-[#683EFF] mt-0.5 shrink-0" />
                           <span className="text-[10px] font-medium">
                              Mullah Niyazi, Al Safa Dist., Jeddah 23452 Kingdom of Saudi Arabia
                           </span>
                        </div>
                     </div>
                  </div>

               </div>
            </div>
          </div>
        )}
        {/* --- TEMPLATE 2 (Classic Detailed) --- */}
        {template === "template2" && (
          <div className="flex flex-col gap-4 items-center justify-center transform origin-top w-full scale-[0.5] sm:scale-75 md:scale-90 lg:scale-100 print:scale-100 print:transform-none">
              <div className="flex flex-col gap-2 shadow-2xl print:shadow-none max-w-full">
                <span className="text-xs font-bold text-slate-400 tracking-widest uppercase ml-2">Certificate (Classic)</span>
                 <div 
                   ref={certRef}
                   className="bg-white relative overflow-hidden shrink-0 flex flex-col border-[12px] border-[#111827] print:border-none print:shadow-none font-serif"
                   style={{ 
                     width: "800px", 
                     height: "1131px",
                     WebkitFontSmoothing: "antialiased"
                   }}
                 >
                    {/* Inner Gold Border */}
                    <div className="absolute inset-2 border-[3px] border-[#D4AF37] pointer-events-none"></div>
                    
                    {/* Watermark Logo */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
                      <img src={faviconAsset} alt="Watermark" className="w-[500px] h-[500px] object-contain" />
                    </div>

                    <div className="flex-1 flex flex-col relative z-10 p-12 box-border">
                      
                      {/* Top Header */}
                      <div className="flex flex-col items-center justify-center pb-8 shrink-0 relative">
                         <div className="absolute top-0 left-0 w-full flex justify-between">
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest">
                               Ref: <span className="font-bold">{certificate.namingSeries || certificate.id}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest">
                               Date: <span className="font-bold">{certDateStr}</span>
                            </div>
                         </div>
                         <div className="h-28 w-64 flex items-center justify-center mt-6 mb-4">
                            <img src={headerLogoUrl} alt="MEV Logo" className="w-full h-full object-contain" />
                         </div>
                         <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent my-4"></div>
                         <h1 className="text-5xl font-normal text-[#111827] tracking-widest uppercase leading-tight font-serif text-center">
                            Certificate of <br/> Inspection
                         </h1>
                      </div>

                      {/* Core Information Section */}
                      <div className="flex-1 flex flex-col items-center px-8 w-full pt-6 text-center">
                         <p className="text-slate-600 italic text-lg mb-8 font-serif leading-relaxed">
                            This document serves to certify that a comprehensive inspection has been <br/> 
                            conducted on the following equipment, belonging to:
                         </p>
                         
                         <h2 className="text-3xl font-bold text-slate-800 uppercase tracking-wider mb-8 border-b border-slate-300 pb-2 inline-block">
                            {certificate.clientName || "N/A"}
                         </h2>

                         <div className="grid grid-cols-2 w-full gap-y-5 text-left bg-slate-50 p-8 border border-slate-200">
                                                        <div>
                               <span className="inline-block w-32 text-xs uppercase tracking-widest text-slate-500 font-bold">Make</span>
                               <span className="text-lg font-medium text-slate-800">{certificate.manufacturer || "N/A"}</span>
                            </div>
                            <div>
                               <span className="inline-block w-32 text-xs uppercase tracking-widest text-slate-500 font-bold">Model</span>
                               <span className="text-lg font-medium text-slate-800">{certificate.modelName || "N/A"}</span>
                            </div>
                            <div>
                               <span className="inline-block w-32 text-xs uppercase tracking-widest text-slate-500 font-bold">Serial No.</span>
                               <span className="text-lg font-medium text-slate-800">{certificate.serialNumber || "N/A"}</span>
                            </div>
                            <div>
                               <span className="inline-block w-32 text-xs uppercase tracking-widest text-slate-500 font-bold">Eqp. ID</span>
                               <span className="text-lg font-medium text-slate-800">{certificate.id || "N/A"}</span>
                            </div>
                            <div>
                               <span className="inline-block w-32 text-xs uppercase tracking-widest text-slate-500 font-bold">Location</span>
                               <span className="text-lg font-medium text-slate-800">{certificate.location || "N/A"}</span>
                            </div>
                         </div>

                         <div className="mt-10 p-6 border-2 border-slate-100 w-full relative">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-4 text-xs font-bold uppercase tracking-widest text-slate-500">Inspection Details</div>
                            <div className="flex justify-between items-center px-4 py-2">
                               <div className="flex flex-col items-center">
                                  <span className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Date of Inspection</span>
                                  <span className="text-lg font-bold text-slate-800">{certificate.issueDate ? new Date(certificate.issueDate).toISOString().split('T')[0] : "N/A"}</span>
                               </div>
                               <div className="w-px h-10 bg-slate-300"></div>
                               <div className="flex flex-col items-center">
                                  <span className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Date of Expiry</span>
                                  <span className="text-lg font-bold text-[#D4AF37]">{certificate.expiryDate ? new Date(certificate.expiryDate).toISOString().split('T')[0] : "N/A"}</span>
                               </div>
                            </div>
                         </div>
                      </div>

                      {/* Footer Signatures */}
                      <div className="mt-auto shrink-0 pt-16 pb-4 flex items-end justify-between px-12 relative">
                         <div className="flex flex-col items-center w-56 text-center relative -top-[10px]">
                            <span className="text-[13px] font-bold text-[#683EFF] uppercase tracking-widest leading-[1.2em] mb-[3px]">Inspected By</span>
                            <span className="text-[12px] font-bold text-slate-800 uppercase tracking-widest">{certificate.inspectedBy || "Zaid Mansoor"}</span>
                            <div className="h-16 w-full relative flex items-end justify-center mb-3">
                               {certificate.inspectedBySignature ? (
                                  <img src={certificate.inspectedBySignature} className="h-24 max-w-full object-contain relative z-10" alt="Inspected By" />
                               ) : (
                                  <img src={fallbackInspSigBase64} className="h-24 max-w-full object-contain relative z-10" alt="Inspected By" />
                               )}
                            </div>
                         </div>

                         <div className="flex flex-col items-center justify-center w-36 relative h-36">
                         </div>

                         <div className="flex flex-col items-center w-56 text-center relative -top-[10px]">
                            <span className="text-[13px] font-bold text-[#683EFF] uppercase tracking-widest leading-[1.2em] mb-[-10px]">Authorized By</span>
                            <span className="text-[12px] font-bold text-slate-800 uppercase tracking-widest">{certificate.authorizedBy || "Ali Ahmed"}</span>
                            <div className="h-16 w-full relative flex items-end justify-center mb-3">
                               {certificate.authorizedBySignature ? (
                                  <img src={certificate.authorizedBySignature} className="h-24 max-w-full object-contain relative z-10" alt="Authorized By" />
                               ) : (
                                  <img src={fallbackAuthSigBase64} className="h-24 max-w-full object-contain relative z-10" alt="Authorized By" />
                               )}
                            </div>
                         </div>
                      </div>

                    </div>
                 </div>
              </div>
          </div>
        )}
      </div>
    </div>
  );
}
