import React, { useRef, useState, useEffect } from "react";
import { MachineCertificate } from "../types";
import * as Icons from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { QRCodeSVG } from "qrcode.react";

import mevLogoAsset from "./Horizonal_MEV_logo.png";
import faviconAsset from "./Favicon.png";
import mevStampAsset from "./MEV_Stamp.png";
import halfWhiteLogoAsset from "./Half_White_Logo.png";

interface PrintMachineCertificatePreviewProps {
  certificate: MachineCertificate;
  onClose: () => void;
}

export function PrintMachineCertificatePreview({ certificate, onClose }: PrintMachineCertificatePreviewProps) {
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
  });

  const d = new Date();
  const certDateStr = d.toISOString().split('T')[0];

  const dummyLoadChartData = [
    { boom: "10.0", radius: "3.0", swl: "20.0", testLoad: "20.0" },
    { boom: "13.5", radius: "3.0", swl: "17.5", testLoad: "17.5" },
    { boom: "17.0", radius: "4.0", swl: "15.0", testLoad: "15.0" }
  ];

  const loadChartDataToRender = certificate.loadChartData || dummyLoadChartData;

  const DetailRow = ({ label, value, labelWidth = "w-[140px]", compact = false }: { label: string, value: React.ReactNode, labelWidth?: string, compact?: boolean }) => (
    <div className="flex border-b border-slate-200 last:border-0 text-[10px]">
      <div className={`${labelWidth} shrink-0 bg-slate-50 font-semibold text-slate-700 ${compact ? 'py-1 px-3' : 'py-1.5 px-3'} border-r border-slate-200 flex items-center`}>{label}</div>
      <div className={`flex-1 ${compact ? 'py-1 px-3' : 'py-1.5 px-3'} flex items-center text-slate-600 bg-white`}>{value || "N/A"}</div>
    </div>
  );

  const templates = [
    { id: "template1", name: "Standard Design" }
  ];

  const headerLogoUrl = "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0459155438.firebasestorage.app/o/Branding%2FHorizonal%20MEV%20logo.png?alt=media&token=6fd9c05f-5c66-4c31-94b5-06ff4cb6c980";
  const footerLogoUrl = "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0459155438.firebasestorage.app/o/Branding%2FHorizontal%20White%20Logo.png?alt=media&token=41850433-efdc-4527-bcc3-a071cb41cc35";

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
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Machine Certificate</p>
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
            className="flex items-center gap-2 px-6 py-2.5 bg-[#683EFF] hover:bg-[#582DE5] text-white rounded-lg text-sm font-bold transition-colors shadow-lg"
          >
            <Icons.Download className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Preview Area Container */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex flex-col items-center gap-10 pb-16 bg-slate-800">
        {template === "template1" && (
          <div className="flex flex-col gap-12 items-center justify-center transform origin-top w-full scale-[0.85] sm:scale-100 print:scale-100 print:transform-none">
              
              {/* ------------ CERTIFICATE ------------ */}
              <div className="flex flex-col gap-2 shadow-2xl print:shadow-none">
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
                    <div className="w-40 h-auto flex flex-col items-center">
                         <img src={headerLogoUrl} alt="MEV Logo" className="w-full h-full object-contain" />
                    </div>
                    {/* Right Titles */}
                    <div className="flex flex-col items-end mt-1">
                       <h1 className="text-[44px] font-bebas font-medium text-[#683EFF] uppercase tracking-wide leading-none">Quality Inspection Certificate</h1>
                       <div className="flex items-center gap-4 w-full">
                         <div className="h-[2px] bg-slate-800 flex-1"></div>
                         <h2 className="text-[17px] font-semibold tracking-widest uppercase text-slate-800">Certified Equipment Inspection Report</h2>
                         <div className="h-[2px] bg-slate-800 flex-1"></div>
                       </div>
                    </div>
                  </div>

                  {/* Badges Section */}
                  <div className="flex gap-[3px] px-10 mt-[17px]">
                     {/* Result Badge */}
                     <div className="flex items-center justify-center gap-6 border-2 border-slate-200 rounded-xl px-8 py-3 bg-white w-1/3">
                        <div className="flex flex-col text-center">
                           <span className="text-[15px] font-bold text-slate-800 uppercase tracking-widest mb-1">Result</span>
                           <span className="text-[42px] font-black leading-none text-emerald-600 uppercase tracking-wider">
                              {certificate.result?.toUpperCase() === "PASS" ? "PASS" : certificate.result || "PASS"}
                           </span>
                        </div>
                        {certificate.result?.toUpperCase() !== "FAIL" ? (
                           <div className="w-[58px] h-[58px] rounded-full bg-white text-emerald-600 flex items-center justify-center border-[4px] border-emerald-600">
                             <Icons.Check className="w-10 h-10 stroke-[4]" />
                           </div>
                        ) : (
                           <div className="w-[58px] h-[58px] rounded-full bg-white text-rose-600 flex items-center justify-center border-[4px] border-rose-600">
                             <Icons.X className="w-10 h-10 stroke-[4]" />
                           </div>
                        )}
                     </div>

                     {/* Other Badges */}
                     <div className="flex flex-1 border-2 border-[#683EFF]/20 rounded-xl bg-white overflow-hidden divide-x-2 divide-[#683EFF]/20">
                        <div className="flex-1 flex flex-col items-center justify-center py-2 px-1">
                           <div className="w-10 h-10 rounded-full bg-[#F0EBFF] flex items-center justify-center mb-1.5 text-[#683EFF]">
                              <Icons.Tag className="w-5 h-5" />
                           </div>
                           <span className="text-[10px] font-bold text-slate-600 uppercase mb-0.5">Sticker No.</span>
                           <span className="text-[10px] font-bold text-slate-800 uppercase">{certificate.stickerNumber || "1425"}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center py-2 px-1">
                           <div className="w-10 h-10 rounded-full bg-[#F0EBFF] flex items-center justify-center mb-1.5 text-[#683EFF]">
                              <Icons.CalendarDays className="w-5 h-5" />
                           </div>
                           <span className="text-[10px] font-bold text-slate-600 uppercase mb-0.5">Validity</span>
                           <span className="text-[10px] font-bold text-slate-800 uppercase">{certificate.validity || "12 Months"}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center py-2 px-1">
                           <div className="w-10 h-10 rounded-full bg-[#F0EBFF] flex items-center justify-center mb-1.5 text-[#683EFF]">
                              <Icons.CalendarPlus className="w-5 h-5" />
                           </div>
                           <span className="text-[10px] font-bold text-slate-600 uppercase mb-0.5">Inspection Date</span>
                           <span className="text-[10px] font-bold text-slate-800 uppercase">{certificate.inspectionDate ? new Date(certificate.inspectionDate).toLocaleDateString("en-GB", {day: "2-digit", month: "short", year: "numeric"}) : "09 Jun 2026"}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center py-2 px-1">
                           <div className="w-10 h-10 rounded-full bg-[#F0EBFF] flex items-center justify-center mb-1.5 text-[#683EFF]">
                              <Icons.CalendarOff className="w-5 h-5" />
                           </div>
                           <span className="text-[10px] font-bold text-slate-600 uppercase mb-0.5">Expiry Date</span>
                           <span className="text-[10px] font-bold text-slate-800 uppercase">{certificate.expirationDate ? new Date(certificate.expirationDate).toLocaleDateString("en-GB", {day: "2-digit", month: "short", year: "numeric"}) : "08 Jun 2027"}</span>
                        </div>
                     </div>
                  </div>

                  {/* Main Two Columns */}
                  <div className="flex gap-6 px-10 mt-[6px] flex-1">
                     {/* Left Column */}
                     <div className="w-1/2 flex flex-col gap-[7px]">
                        
                        {/* Client Information */}
                        <div>
                           <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-full bg-[#683EFF] text-white flex items-center justify-center">
                                 <Icons.User className="w-[18px] h-[18px]" />
                              </div>
                              <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-widest">Client Information</h3>
                           </div>
                           <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
                              <DetailRow compact label="Client Name" value={certificate.clientName} />
                              <DetailRow compact label="Inspection Location" value={certificate.location} />
                              <DetailRow compact label="Job Number" value={certificate.jobNumber} />
                              <DetailRow compact label="Checklist No." value={certificate.checkList} />
                              <DetailRow compact label="Timesheet no." value={certificate.timeSheetNumber} />
                              <DetailRow compact label="Assigned Inspector" value={certificate.inspectedBy} />
                           </div>
                        </div>

                        {/* Technical Specifications */}
                        <div>
                           <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-full bg-[#683EFF] text-white flex items-center justify-center">
                                 <Icons.Wrench className="w-[18px] h-[18px]" />
                              </div>
                              <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-widest">Technical Specifications</h3>
                           </div>
                           <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
                              <DetailRow compact labelWidth="w-1/2" label="Load Limit (S.W.L)" value={certificate.loadLimit || "20 Ton"} />
                              <DetailRow compact labelWidth="w-1/2" label="Max Horizontal Outreach" value={certificate.maxOutreach || "10m - 30m"} />
                              <DetailRow compact labelWidth="w-1/2" label="Bucket Capacity" value={certificate.bucketCapacity || "NA"} />
                              <DetailRow compact labelWidth="w-1/2" label="Engine Power" value={certificate.enginePower || "176 kW"} />
                              <DetailRow compact labelWidth="w-1/2" label="Boom Length" value={certificate.boomLength || "10 m"} />
                              <DetailRow compact labelWidth="w-1/2" label="Wheel Type" value={certificate.wheelType || "Tyre"} />
                              <DetailRow compact labelWidth="w-1/2" label="Max Platform Height" value={certificate.maxPlatformHeight || "3.75 m"} />
                              <DetailRow compact labelWidth="w-1/2" label="Heo Bucket Capacity" value={certificate.heoBucketCapacity || "NA"} />
                              <DetailRow compact labelWidth="w-1/2" label="Engine Speed" value={certificate.engineSpeed || "2150 rpm"} />
                              <DetailRow compact labelWidth="w-1/2" label="Angle of Span" value={certificate.angleOfSpan || "NA"} />
                              <DetailRow compact labelWidth="w-1/2" label="Person Allowed" value={certificate.personAllowed || "1"} />
                           </div>
                        </div>

                     </div>

                     {/* Right Column */}
                     <div className="w-1/2 flex flex-col gap-[7px]">
                        
                        {/* Equipment Details */}
                        <div>
                           <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-full bg-[#683EFF] text-white flex items-center justify-center">
                                 <Icons.Settings className="w-[18px] h-[18px]" />
                              </div>
                              <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-widest">Equipment Details</h3>
                           </div>
                           <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
                              <DetailRow compact label="Equipment Name" value={certificate.equipmentName} />
                              <DetailRow compact label="Manufacturer / Model" value={`${certificate.manufacturer || "KATO"} / ${certificate.modelName || "NK-200M"}`} />
                              <DetailRow compact label="Serial Number" value={certificate.serialNumber || "K203510645"} />
                              <DetailRow compact label="Date of Mfg" value={certificate.dateOfMfg || "1995-01-01"} />
                              <DetailRow compact label="Owner ID / Plate No." value={certificate.ownerId || "8275 TAA"} />
                              <DetailRow compact label="Reference Standard" value={certificate.referenceStandard || "ASME B30.5"} />
                           </div>
                        </div>

                        {/* Load Chart Data */}
                        <div>
                           <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-full bg-[#683EFF] text-white flex items-center justify-center">
                                 <Icons.BarChart2 className="w-[18px] h-[18px]" />
                              </div>
                              <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-widest">Load Chart Data</h3>
                           </div>
                           <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
                              <div className="flex bg-[#683EFF] text-white text-[8px] font-normal text-center whitespace-nowrap">
                                 <div className="flex-1 py-2 px-1 border-r border-white/20">Boom (Meter)</div>
                                 <div className="flex-1 py-2 px-1 border-r border-white/20">Radius (Meter)</div>
                                 <div className="flex-1 py-2 px-1 border-r border-white/20">S.W.L (Tonne)</div>
                                 <div className="flex-1 py-2 px-1">Test Load (Tonne)</div>
                              </div>
                              {loadChartDataToRender.map((row, i) => (
                                <div key={i} className="flex border-b border-slate-200 last:border-0 text-[10px] text-slate-700 text-center font-medium bg-slate-50">
                                   <div className="flex-1 py-1.5 px-1 border-r border-slate-200">{row.boom}</div>
                                   <div className="flex-1 py-1.5 px-1 border-r border-slate-200">{row.radius}</div>
                                   <div className="flex-1 py-1.5 px-1 border-r border-slate-200">{row.swl}</div>
                                   <div className="flex-1 py-1.5 px-1">{row.testLoad}</div>
                                </div>
                              ))}
                           </div>
                        </div>

                        {/* Inspection Details */}
                        <div>
                           <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-full bg-[#683EFF] text-white flex items-center justify-center">
                                 <Icons.Search className="w-[18px] h-[18px]" />
                              </div>
                              <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-widest">Inspection Details</h3>
                           </div>
                           <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
                              <DetailRow labelWidth="w-1/2" label="Inspection Type" value={certificate.typeOfInspection || "Periodic and Visual Inspection"} />
                              <DetailRow labelWidth="w-1/2" label="Previous Inspection Details" value={certificate.previousInspection || "None"} />
                              <DetailRow labelWidth="w-1/2" label="Next Inspection Date" value={certificate.nextInspectionDate ? new Date(certificate.nextInspectionDate).toLocaleDateString("en-GB", {day: "2-digit", month: "long", year: "numeric"}) : "09 June 2027"} />
                           </div>
                        </div>

                     </div>
                  </div>

                  {/* Recommendation Box */}
                  <div className="mx-10 mt-[7px] border border-emerald-600 rounded-xl overflow-hidden bg-emerald-50/50 flex py-[24px] px-6 gap-6 items-center">
                     <div className="shrink-0 text-emerald-600">
                        <Icons.ShieldCheck className="w-[60px] h-[60px] stroke-2" />
                     </div>
                     <div className="flex flex-col flex-1">
                        <h4 className="text-[15px] font-bold text-emerald-700 uppercase tracking-wide">Recommendation</h4>
                        <p className="text-[12px] font-medium text-emerald-950 leading-[1.2em] -mt-1 w-full">
                           {certificate.recommendation || `The equipment was inspected in accordance with ${certificate.referenceStandard || "ASME B30.5"} and was found to comply with the applicable inspection criteria during the time of inspection.`}
                        </p>
                     </div>
                  </div>

                  {/* Signatures Section */}
                  <div className="px-10 mt-[2px] flex justify-between items-end relative">
                     {/* Inspected By */}
                     <div className="flex flex-col w-[220px] text-center">
                        <span className="text-[13px] font-bold text-[#683EFF] uppercase tracking-widest mb-[3px]">Inspected By</span>
                        <div className="h-24 flex items-center justify-center relative">
                           {certificate.inspectedBySignature ? (
                              <img src={certificate.inspectedBySignature} className="h-16 max-w-full object-contain relative z-10" alt="Inspected By" />
                           ) : (
                              <img src={fallbackInspSigBase64} className="h-16 max-w-full object-contain relative z-10" alt="Inspected By" />
                           )}
                        </div>
                     </div>

                     {/* QR Code */}
                     <div className="absolute left-1/2 -translate-x-1/2 bottom-[8px] flex flex-col items-center w-64 text-center">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200">
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
                     <div className="flex flex-col w-[220px] text-center">
                        <span className="text-[13px] font-bold text-[#683EFF] uppercase tracking-widest mb-[3px]">Authorized By</span>
                        <div className="h-24 flex items-center justify-center relative">
                           {certificate.authorizedBySignature ? (
                              <img src={certificate.authorizedBySignature} className="h-16 max-w-full object-contain relative z-10" alt="Authorized By" />
                           ) : (
                              <img src={fallbackAuthSigBase64} className="h-16 max-w-full object-contain relative z-10" alt="Authorized By" />
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
          <div className="flex flex-col gap-12 items-center justify-center transform origin-top w-full scale-[0.85] sm:scale-100 print:scale-100 print:transform-none">
              <div className="flex flex-col gap-2 shadow-2xl print:shadow-none">
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
                            <div className="col-span-2 mb-2">
                               <span className="inline-block w-40 text-sm uppercase tracking-widest text-slate-500 font-bold">Equipment</span>
                               <span className="text-xl font-bold text-slate-800">{certificate.equipmentName || "N/A"}</span>
                            </div>
                            <div className="col-span-2 h-px bg-slate-200 mb-2"></div>
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
                                  <span className="text-lg font-bold text-slate-800">{certificate.inspectionDate ? new Date(certificate.inspectionDate).toISOString().split('T')[0] : "N/A"}</span>
                               </div>
                               <div className="w-px h-10 bg-slate-300"></div>
                               <div className="flex flex-col items-center">
                                  <span className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Date of Expiry</span>
                                  <span className="text-lg font-bold text-[#D4AF37]">{certificate.expirationDate ? new Date(certificate.expirationDate).toISOString().split('T')[0] : "N/A"}</span>
                               </div>
                            </div>
                         </div>
                      </div>

                      {/* Footer Signatures */}
                      <div className="mt-auto shrink-0 pt-16 pb-4 flex items-end justify-between px-12 relative">
                         <div className="flex flex-col items-center w-56 text-center">
                            <div className="h-16 w-full border-b border-slate-400 relative flex items-end justify-center mb-3">
                               {certificate.inspectedBySignature ? (
                                  <img src={certificate.inspectedBySignature} className="h-16 max-w-full object-contain relative z-10" alt="Inspected By" />
                               ) : (
                                  <img src={fallbackInspSigBase64} className="h-16 max-w-full object-contain relative z-10" alt="Inspected By" />
                               )}
                            </div>
                         </div>

                         <div className="flex flex-col items-center justify-center w-36 relative h-36">
                         </div>

                         <div className="flex flex-col items-center w-56 text-center">
                            <div className="h-16 w-full border-b border-slate-400 relative flex items-end justify-center mb-3">
                               {certificate.authorizedBySignature ? (
                                  <img src={certificate.authorizedBySignature} className="h-16 max-w-full object-contain relative z-10" alt="Authorized By" />
                               ) : (
                                  <img src={fallbackAuthSigBase64} className="h-16 max-w-full object-contain relative z-10" alt="Authorized By" />
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
