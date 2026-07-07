import React, { useRef, useState, useEffect, useCallback } from "react";
import { OperatorCard } from "../types";
import * as Icons from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface PrintCardPreviewProps {
  operator: OperatorCard;
  onClose: () => void;
  autoPrint?: boolean;
}

export function PrintCardPreview({ operator, onClose, autoPrint = false }: PrintCardPreviewProps) {
  const [template, setTemplate] = useState("template1");
  const [isExporting, setIsExporting] = useState(false);
  const [imagesReady, setImagesReady] = useState(false);

  const cardsContainerRef = useRef<HTMLDivElement>(null);

  // ── Image Preloader ───────────────────────────────────────────────
  const criticalImages = [
    "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0459155438.firebasestorage.app/o/Branding%2FHorizonal%20MEV%20logo.png?alt=media&token=6fd9c05f-5c66-4c31-94b5-06ff4cb6c980",
    "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0459155438.firebasestorage.app/o/Branding%2FFavicon.png?alt=media&token=c8b110bc-316b-439b-84d0-b1f25816b7a1",
    "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0459155438.firebasestorage.app/o/Branding%2FHalf%20White%20Logo.png?alt=media&token=5d1ceefc-3248-4da6-a8f6-b9bbb310e534",
    operator.photoAttachment,
    operator.authorizedBySignature,
    operator.trainedBySignature,
  ].filter(Boolean) as string[];

  useEffect(() => {
    let cancelled = false;
    const preloadImages = async () => {
      setImagesReady(false);
      await Promise.all(
        criticalImages.map(
          (src) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => resolve();
              img.onerror = () => resolve();
              img.src = src;
            })
        )
      );
      if (!cancelled) setImagesReady(true);
    };
    preloadImages();
    return () => {
      cancelled = true;
    };
  }, [criticalImages.join(",")]);

  // ── Custom Print Handler (bypasses sandboxed iframe) ──────────────
  const handleDownloadPDF = useCallback(() => {
    if (!imagesReady) {
      alert("Images are still loading, please wait...");
      return;
    }
    if (!cardsContainerRef.current) {
      alert("Preview not ready. Please try again.");
      return;
    }

    setIsExporting(true);

    // Get the HTML content
    const content = cardsContainerRef.current.innerHTML;

    // Build a complete HTML document
    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${(operator.namingSeries || operator.id).replace(/[/\\?%*:|"<>]/g, "-")}_ID_Card</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            @page {
              size: auto;
              margin: 0;
            }
            @media print {
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body {
                background: white !important;
                margin: 0;
                padding: 0;
              }
            }
            body {
              font-family: 'Poppins', sans-serif;
              background: white;
              margin: 0;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 20px;
            }
            .watermark-layer {
              position: absolute !important;
              inset: 0 !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              pointer-events: none !important;
              z-index: 0 !important;
            }
            .watermark-img {
              width: 290px !important;
              opacity: 0.12 !important;
              object-fit: contain !important;
            }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    // Open in new tab/window (bypasses sandbox)
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocked! Please allow popups for this site and try again.");
      setIsExporting(false);
      return;
    }

    printWindow.document.write(printHtml);
    printWindow.document.close();

    // Reset button state after a delay
    setTimeout(() => {
      setIsExporting(false);
    }, 1000);
  }, [imagesReady, operator]);

  useEffect(() => {
    if (autoPrint && imagesReady) {
      const timer = setTimeout(() => {
        handleDownloadPDF();
        onClose();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, imagesReady]);

  const templates = [
    { id: "template1", name: "Template (No Approval)" },
  ];

  return (
    <div className={`flex flex-col min-h-[calc(100vh-140px)] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300 ${autoPrint ? "opacity-0 pointer-events-none fixed -left-[9999px]" : ""}`}>
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
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              ID Card Generator
            </p>
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
              {templates.map((t) => (
                <option key={t.id} value={t.id} className="bg-slate-800">
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDownloadPDF}
            disabled={isExporting || !imagesReady}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg ${
              isExporting || !imagesReady
                ? "bg-slate-600 cursor-not-allowed text-slate-300"
                : "bg-[#683EFF] hover:bg-[#582DE5] text-white"
            }`}
          >
            <Icons.Download className="w-4 h-4" />
            {isExporting
              ? "Preparing..."
              : imagesReady
              ? "Print / Save as PDF"
              : "Loading Images..."}
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex flex-col items-center gap-10 pb-16 bg-slate-800">
        {template === "template1" && (
          <div
            ref={cardsContainerRef}
            className="flex flex-col gap-12 items-center justify-center transform origin-top w-full scale-[0.85] sm:scale-100 print:scale-100 print:transform-none"
          >
            {/* ------------ FRONT COVER ------------ */}
            <div className="flex flex-col gap-2 shadow-2xl print:shadow-none print:break-after-page">
              <span className="text-xs font-bold text-slate-400 tracking-widest uppercase ml-2">
                Front
              </span>
              <div
                className="bg-white font-poppins rounded-xl overflow-hidden relative shadow-md shrink-0 flex flex-col border border-slate-200"
                style={{
                  WebkitFontSmoothing: "antialiased",
                  height: "540px",
                  width: "856px",
                }}
              >
                {/* Header */}
                <div className="h-[120px] shrink-0 flex items-center px-10 border-b border-slate-100">
                  <div className="grid grid-cols-[1fr_2fr] items-center gap-0 w-full">
                    <div className="flex justify-center pr-10">
                      <img
                        src="https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0459155438.firebasestorage.app/o/Branding%2FHorizonal%20MEV%20logo.png?alt=media&token=6fd9c05f-5c66-4c31-94b5-06ff4cb6c980"
                        alt="MEV Logo"
                        className="h-20 object-contain"
                        loading="eager"
                        decoding="async"
                      />
                    </div>
                    <div className="flex flex-col justify-center border-l-2 border-[#683EFF] pl-10 h-16">
                      <h1 className="text-[24px] font-semibold text-slate-900 tracking-tight uppercase leading-none mb-1">
                        Equipment Inspection Services
                      </h1>
                      <p className="text-[#683EFF] font-normal text-[18px] tracking-wide">
                        Safety. Integrity. Reliability
                      </p>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 flex px-10 py-4 relative items-center min-h-0">
                  {/* Watermark */}
                  <div
                    className="watermark-layer"
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                      zIndex: 0,
                    }}
                  >
                    <img
                      src="https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0459155438.firebasestorage.app/o/Branding%2FFavicon.png?alt=media&token=c8b110bc-316b-439b-84d0-b1f25816b7a1"
                      className="watermark-img"
                      style={{ width: "290px" }}
                      alt="watermark"
                      loading="eager"
                      decoding="async"
                    />
                  </div>

                  {/* Photo */}
                  <div
                    className="w-[215px] h-[252px] rounded-2xl overflow-hidden border border-[#683EFF]/30 bg-slate-100 shrink-0 shadow-sm relative mr-6 box-border p-1"
                    style={{ zIndex: 10 }}
                  >
                    <div className="w-full h-full rounded-xl overflow-hidden bg-white">
                      {operator.photoAttachment ? (
                        <img
                          src={operator.photoAttachment}
                          className="w-full h-full object-cover"
                          alt="Operator Portrait"
                          loading="eager"
                          decoding="async"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                          <Icons.User className="w-24 h-24" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div
                    className="flex-1 flex flex-col justify-center max-w-[400px]"
                    style={{ zIndex: 10 }}
                  >
                    <h2 className="text-[28px] font-bold text-slate-800 uppercase mb-1 leading-[1.2em]">
                      {operator.operatorName}
                    </h2>
                    <h3 className="text-xl font-medium text-[#683EFF] mb-1.5 leading-[1.2em]">
                      {operator.machineOperator || "Operator"}
                    </h3>

                    <div className="w-full border-b border-[#683EFF]/40 mb-2.5"></div>

                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-[#683EFF] flex items-center justify-center text-white shrink-0 mr-3">
                          <Icons.IdCard className="w-[18px] h-[18px]" />
                        </div>
                        <span className="w-28 text-lg text-slate-800 font-medium">Card No</span>
                        <span className="text-lg text-slate-700 font-medium mx-3">:</span>
                        <span className="text-lg text-slate-900 font-normal leading-[1.2em]">
                          {operator.namingSeries || operator.id}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-[#683EFF] flex items-center justify-center text-white shrink-0 mr-3">
                          <Icons.Building className="w-[18px] h-[18px]" />
                        </div>
                        <span className="w-28 text-lg text-slate-800 font-medium">ID No</span>
                        <span className="text-lg text-slate-700 font-medium mx-3">:</span>
                        <span className="text-lg text-slate-900 font-normal leading-[1.2em]">
                          {operator.idNumber || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-[#683EFF] flex items-center justify-center text-white shrink-0 mr-3">
                          <Icons.User className="w-[18px] h-[18px]" />
                        </div>
                        <span className="w-28 text-lg text-slate-800 font-medium">Company</span>
                        <span className="text-lg text-slate-700 font-medium mx-3">:</span>
                        <span className="text-lg text-slate-900 font-normal leading-[1.2em]">
                          {operator.company || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-[#683EFF] flex items-center justify-center text-white shrink-0 mr-3">
                          <Icons.Award className="w-[18px] h-[18px]" />
                        </div>
                        <span className="w-28 text-lg text-slate-800 font-medium">Level/Type</span>
                        <span className="text-lg text-slate-700 font-medium mx-3">:</span>
                        <span className="text-lg text-slate-900 font-normal leading-[1.2em]">
                          {operator.levelType || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div
                    className="absolute top-1/2 right-6 -translate-y-1/2 p-2 bg-white rounded-xl shadow-sm border border-[#683EFF]"
                    style={{ zIndex: 10 }}
                  >
                    <QRCodeSVG
                      value={`${window.location.origin}/verify/${operator.id}`}
                      size={120}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="h-[120px] shrink-0 flex">
                  <div className="w-1/2 bg-[#683EFF] h-full px-8 flex items-center justify-around">
                    <div className="flex items-center gap-3 text-white">
                      <Icons.Clock className="w-8 h-8 opacity-85" />
                      <div className="flex flex-col">
                        <span className="text-[12px] font-normal uppercase tracking-wider opacity-90">
                          Issue Date
                        </span>
                        <span className="text-[17px] font-semibold leading-[1.2em]">
                          {operator.issueDate
                            ? new Date(operator.issueDate).toISOString().split("T")[0]
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="h-10 w-px bg-white/30 self-center"></div>
                    <div className="flex items-center gap-3 text-white">
                      <Icons.ShieldCheck className="w-8 h-8 opacity-85" />
                      <div className="flex flex-col">
                        <span className="text-[12px] font-normal uppercase tracking-wider opacity-90">
                          Expiry Date
                        </span>
                        <span className="text-[17px] font-semibold leading-[1.2em]">
                          {operator.licenseExpiry
                            ? new Date(operator.licenseExpiry).toISOString().split("T")[0]
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-1/2 bg-[#111827] h-full p-6 flex flex-col justify-center pl-8 text-white relative overflow-hidden">
                    <div className="grid grid-cols-1 gap-2 z-10">
                      <div className="flex items-center gap-3">
                        <Icons.Globe className="w-3.5 h-3.5 text-[#683EFF] shrink-0" />
                        <span className="text-xs font-medium text-white">
                          Website: www.mev-ins.com
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Icons.Mail className="w-3.5 h-3.5 text-[#683EFF] shrink-0" />
                        <span className="text-xs font-medium text-white">
                          Email: info@mev-ins.com
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Icons.Phone className="w-3.5 h-3.5 text-[#683EFF] shrink-0" />
                        <span className="text-xs font-medium text-white">
                          Mob: +966 53 404 3543
                        </span>
                      </div>
                      <div className="flex items-start gap-3 mt-0.5">
                        <Icons.MapPin className="w-3.5 h-3.5 text-[#683EFF] shrink-0 mt-0.5" />
                        <span className="text-xs font-medium text-white leading-tight max-w-[320px]">
                          3329 Prince Mutaib bin Abdulaziz Rd, Mishrifah District, Jeddah 23341, Saudi Arabia
                        </span>
                      </div>
                    </div>
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
              <span className="text-xs font-bold text-slate-400 tracking-widest uppercase ml-2">
                Back
              </span>
              <div
                className="bg-white font-poppins rounded-xl overflow-hidden relative shadow-md shrink-0 flex flex-col border border-slate-200"
                style={{
                  WebkitFontSmoothing: "antialiased",
                  height: "540px",
                  width: "856px",
                }}
              >
                <div className="flex flex-1 overflow-hidden h-[490px]">
                  {/* Left Column */}
                  <div className="w-[210px] bg-[#111827] h-full flex flex-col items-center justify-center p-6 text-center shrink-0 relative overflow-hidden">
                    <img
                      src="https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0459155438.firebasestorage.app/o/Branding%2FHalf%20White%20Logo.png?alt=media&token=5d1ceefc-3248-4da6-a8f6-b9bbb310e534"
                      alt="MEV Logo"
                      className="w-full object-contain opacity-90"
                      loading="eager"
                      decoding="async"
                    />
                  </div>

                  {/* Right Column */}
                  <div className="flex-1 flex flex-col h-full bg-white relative">
                    <div className="p-8 flex pb-0 items-start pt-[34px] h-[210px]">
                      <div className="w-[250px] flex flex-col gap-3.5 pr-4 shrink-0">
                        <div className="flex items-center gap-3 text-slate-800">
                          <Icons.Globe className="w-4 h-4 text-[#683EFF]" />
                          <span className="text-xs font-medium">
                            Website: www.mev-ins.com
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-800">
                          <Icons.Mail className="w-4 h-4 text-[#683EFF]" />
                          <span className="text-xs font-medium">
                            Email: info@mev-ins.com
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-800">
                          <Icons.Phone className="w-4 h-4 text-[#683EFF]" />
                          <span className="text-xs font-medium">
                            Mob: +966 53 404 3543
                          </span>
                        </div>
                        <div className="flex items-start gap-3 text-slate-800">
                          <Icons.MapPin className="w-4 h-4 text-[#683EFF] shrink-0 mt-0.5" />
                          <span className="text-xs font-medium leading-relaxed">
                            3329 Prince Mutaib bin Abdulaziz Rd, Mishrifah District, Jeddah 23341, Saudi Arabia
                          </span>
                        </div>
                      </div>
                      <div className="w-px bg-[#683EFF] h-[160px] shrink-0 self-start mt-1 mx-2"></div>
                      <div className="flex-1 pl-6">
                        <p className="text-[12.5px] text-slate-700 font-medium leading-relaxed text-justify">
                          This card is only valid for the equipment as stated. Use of this card by person other than its owner is considered forgery & will be punishable by Law & will be punishable by law & whoever find it shall return MEV Office. Any liability occuring due to error in operations or damage will not be the responsibilty of issuing agency.
                        </p>
                      </div>
                    </div>

                    {/* Signatures */}
                    <div className="flex-1 flex px-10 pb-8 items-start justify-between pt-2.5 relative -top-[5px]">
                      <div className="flex flex-col items-center w-48 relative">
                        <div className="text-base font-bold text-[#683EFF] mb-2 uppercase text-center whitespace-nowrap leading-tight w-full">
                          {operator.authorizedBy && operator.authorizedBy.length > 12 ? (
                            <>
                              Authorized By:
                              <br />
                              {operator.authorizedBy}
                            </>
                          ) : (
                            `Authorized By: ${operator.authorizedBy || ""}`
                          )}
                        </div>
                        <div className="h-32 w-32 flex items-center justify-center relative">
                          {operator.authorizedBySignature && (
                            <img
                              src={operator.authorizedBySignature}
                              className="absolute inset-0 w-full h-full object-contain"
                              alt="Signature"
                              loading="eager"
                              decoding="async"
                            />
                          )}
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
                            <img
                              src={operator.trainedBySignature}
                              className="w-full h-full object-contain"
                              alt="Signature"
                              loading="eager"
                              decoding="async"
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Warning */}
                <div className="h-[50px] bg-slate-100 border-y-4 border-[#683EFF] w-full flex items-center justify-center gap-12 shrink-0 z-10 pb-[5px] relative -top-[5px]">
                  <div className="h-1.5 w-16 bg-[#683EFF] rounded-full"></div>
                  <span className="text-lg font-bold text-[#683EFF] uppercase tracking-wide whitespace-nowrap">
                    This is not a Saudi Government License
                  </span>
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