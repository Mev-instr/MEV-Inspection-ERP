import React, { useState } from "react";
import * as Icons from "lucide-react";
import { MachineCertificate, LiftingToolCert, OperatorCard, CustomerDetail } from "../types";
import { PrintMachineCertificatePreview } from "./PrintMachineCertificatePreview";
import { PrintLiftingToolCertPreview } from "./PrintLiftingToolCertPreview";
import { PrintCardPreview } from "./PrintCardPreview";

interface Props {
  currentClient: CustomerDetail;
  machineCertificates: MachineCertificate[];
  liftingToolCertificates: LiftingToolCert[];
  operatorCards: OperatorCard[];
  onLogout: () => void;
}

type CardType = "machine" | "lifting" | "operator";

export function ClientPortalDashboard({
  currentClient,
  machineCertificates,
  liftingToolCertificates,
  operatorCards,
  onLogout,
}: Props) {
  const [selectedCard, setSelectedCard] = useState<CardType>("machine");
  const [searchTerm, setSearchTerm] = useState("");

  // Print states (mounting hidden/offscreen print previews)
  const [printMachineCert, setPrintMachineCert] = useState<MachineCertificate | null>(null);
  const [printLiftingCert, setPrintLiftingCert] = useState<LiftingToolCert | null>(null);
  const [printOperatorCard, setPrintOperatorCard] = useState<OperatorCard | null>(null);

  const clientName = currentClient.companyName || "Client";

  // Filter lists based on clientName matching
  const clientMachineCerts = machineCertificates.filter(
    (item) => item.clientName?.toLowerCase() === clientName.toLowerCase()
  );

  const clientLiftingCerts = liftingToolCertificates.filter(
    (item) => item.clientName?.toLowerCase() === clientName.toLowerCase()
  );

  const clientOperatorCards = operatorCards.filter(
    (item) => item.company?.toLowerCase() === clientName.toLowerCase()
  );

  // Status counters helper
  const getMachineStats = () => {
    const total = clientMachineCerts.length;
    const active = clientMachineCerts.filter(
      (c) => c.status?.toLowerCase() === "active"
    ).length;
    const expired = total - active;
    return { total, active, expired };
  };

  const getLiftingStats = () => {
    const total = clientLiftingCerts.length;
    const active = clientLiftingCerts.filter(
      (c) => c.status?.toLowerCase() === "active"
    ).length;
    const expired = total - active;
    return { total, active, expired };
  };

  const getOperatorStats = () => {
    const total = clientOperatorCards.length;
    const active = clientOperatorCards.filter((o) => {
      if (o.status?.toLowerCase() === "active") return true;
      if (o.licenseExpiry && new Date(o.licenseExpiry) >= new Date()) return true;
      return false;
    }).length;
    const expired = total - active;
    return { total, active, expired };
  };

  const machineStats = getMachineStats();
  const liftingStats = getLiftingStats();
  const operatorStats = getOperatorStats();

  // Search filter
  const filteredMachineCerts = clientMachineCerts.filter((item) =>
    `${item.id} ${item.location || item.equipmentLocation || ""}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const filteredLiftingCerts = clientLiftingCerts.filter((item) =>
    `${item.id} ${item.location || item.equipmentLocation || ""}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const filteredOperatorCards = clientOperatorCards.filter((item) =>
    `${item.id} ${item.machineOperator || ""} ${item.operatorName || ""}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="client-dashboard-root">
      {/* Offscreen Auto-Print Nodes */}
      {printMachineCert && (
        <PrintMachineCertificatePreview
          certificate={printMachineCert}
          onClose={() => setPrintMachineCert(null)}
          autoPrint={true}
        />
      )}
      {printLiftingCert && (
        <PrintLiftingToolCertPreview
          certificate={printLiftingCert}
          onClose={() => setPrintLiftingCert(null)}
          autoPrint={true}
        />
      )}
      {printOperatorCard && (
        <PrintCardPreview
          operator={printOperatorCard}
          onClose={() => setPrintOperatorCard(null)}
          autoPrint={true}
        />
      )}

      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 shrink-0 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#683EFF] flex items-center justify-center text-white shadow-md shadow-[#683EFF]/20">
              <Icons.ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">
                Client Portal
              </h1>
              <span className="text-xs font-bold text-[#683EFF] uppercase tracking-widest mt-0.5 block">
                {clientName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Icons.LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
        {/* Welcome header info card */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <span className="bg-[#683EFF] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              Authorized Portal
            </span>
            <h2 className="text-3xl font-black mt-3 tracking-tight">
              Welcome back, {clientName}!
            </h2>
            <p className="text-slate-300 mt-2 text-sm leading-relaxed">
              Access and download your valid inspection certifications, machinery compliance
              audits, and operator credential cards in real-time. Everything is configured as
              read-only for security.
            </p>
          </div>
        </div>

        {/* 3 Main KPI Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Machine Certificates Card */}
          <button
            onClick={() => {
              setSelectedCard("machine");
              setSearchTerm("");
            }}
            className={`text-left p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-48 group ${
              selectedCard === "machine"
                ? "bg-white border-[#683EFF] shadow-lg shadow-[#683EFF]/5 ring-2 ring-[#683EFF]/10"
                : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <div
                className={`p-3 rounded-xl transition-colors ${
                  selectedCard === "machine" ? "bg-[#F0EBFF] text-[#683EFF]" : "bg-slate-50 text-slate-500"
                }`}
              >
                <Icons.Cpu className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black tracking-widest text-slate-400 group-hover:text-[#683EFF] transition-colors uppercase">
                Machine Certs
              </span>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-black text-slate-800 tracking-tight">
                {machineStats.total}
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
                Total Certificates
              </p>
            </div>

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs w-full">
              <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {machineStats.active} Active
              </span>
              <span className="flex items-center gap-1.5 font-bold text-rose-600">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {machineStats.expired} Expired
              </span>
            </div>
          </button>

          {/* Lifting Tool Certificates Card */}
          <button
            onClick={() => {
              setSelectedCard("lifting");
              setSearchTerm("");
            }}
            className={`text-left p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-48 group ${
              selectedCard === "lifting"
                ? "bg-white border-[#683EFF] shadow-lg shadow-[#683EFF]/5 ring-2 ring-[#683EFF]/10"
                : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <div
                className={`p-3 rounded-xl transition-colors ${
                  selectedCard === "lifting" ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-500"
                }`}
              >
                <Icons.Anchor className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black tracking-widest text-slate-400 group-hover:text-blue-600 transition-colors uppercase">
                Lifting Tool Certs
              </span>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-black text-slate-800 tracking-tight">
                {liftingStats.total}
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
                Total Certificates
              </p>
            </div>

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs w-full">
              <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {liftingStats.active} Active
              </span>
              <span className="flex items-center gap-1.5 font-bold text-rose-600">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {liftingStats.expired} Expired
              </span>
            </div>
          </button>

          {/* Operator Cards Card */}
          <button
            onClick={() => {
              setSelectedCard("operator");
              setSearchTerm("");
            }}
            className={`text-left p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-48 group ${
              selectedCard === "operator"
                ? "bg-white border-[#683EFF] shadow-lg shadow-[#683EFF]/5 ring-2 ring-[#683EFF]/10"
                : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <div
                className={`p-3 rounded-xl transition-colors ${
                  selectedCard === "operator" ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-500"
                }`}
              >
                <Icons.Contact className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors uppercase">
                Operator Cards
              </span>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-black text-slate-800 tracking-tight">
                {operatorStats.total}
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
                Total Operator Cards
              </p>
            </div>

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs w-full">
              <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {operatorStats.active} Active
              </span>
              <span className="flex items-center gap-1.5 font-bold text-rose-600">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {operatorStats.expired} Expired
              </span>
            </div>
          </button>
        </div>

        {/* Selected Category Read-Only Entries List */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                {selectedCard === "machine" && "Machine Certificates List"}
                {selectedCard === "lifting" && "Lifting Tool Certificates List"}
                {selectedCard === "operator" && "Authorized Operator Cards List"}
              </h3>
              <p className="text-xs text-slate-400">
                Listing all registered entries for {clientName}. Everything is read-only.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Icons.Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search listings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF]"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-150">
            {selectedCard === "machine" && (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-150">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-600">Certificate ID</th>
                    <th className="px-6 py-4 font-semibold text-slate-600">Start Date</th>
                    <th className="px-6 py-4 font-semibold text-slate-600">End Date</th>
                    <th className="px-6 py-4 font-semibold text-slate-600">Location</th>
                    <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMachineCerts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-xs">
                        No machine certificates found.
                      </td>
                    </tr>
                  ) : (
                    filteredMachineCerts.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{item.id}</td>
                        <td className="px-6 py-4 text-slate-600">
                          {item.inspectionDate || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {item.expirationDate || item.nextInspectionDate || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {item.location || item.equipmentLocation || "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          {item.status?.toLowerCase() === "active" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Expired
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setPrintMachineCert(item)}
                            className="bg-[#683EFF] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#5b36e5] transition-colors inline-flex items-center gap-1 shadow-sm"
                            title="Direct PDF Print"
                          >
                            <Icons.Printer className="w-3.5 h-3.5" />
                            Print
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {selectedCard === "lifting" && (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-150">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-600">Certificate ID</th>
                    <th className="px-6 py-4 font-semibold text-slate-600">Start Date</th>
                    <th className="px-6 py-4 font-semibold text-slate-600">End Date</th>
                    <th className="px-6 py-4 font-semibold text-slate-600">Location</th>
                    <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLiftingCerts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-xs">
                        No lifting tool certificates found.
                      </td>
                    </tr>
                  ) : (
                    filteredLiftingCerts.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{item.id}</td>
                        <td className="px-6 py-4 text-slate-600">
                          {item.issueDate || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {item.expiryDate || item.nextInspectionDate || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {item.location || item.equipmentLocation || "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          {item.status?.toLowerCase() === "active" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Expired
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setPrintLiftingCert(item)}
                            className="bg-[#683EFF] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#5b36e5] transition-colors inline-flex items-center gap-1 shadow-sm"
                            title="Direct PDF Print"
                          >
                            <Icons.Printer className="w-3.5 h-3.5" />
                            Print
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {selectedCard === "operator" && (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-150">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-600">Card ID</th>
                    <th className="px-6 py-4 font-semibold text-slate-600">Machine Operator</th>
                    <th className="px-6 py-4 font-semibold text-slate-600">Name</th>
                    <th className="px-6 py-4 font-semibold text-slate-600">Issue Date</th>
                    <th className="px-6 py-4 font-semibold text-slate-600">Expiry Date</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOperatorCards.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-xs">
                        No operator cards found.
                      </td>
                    </tr>
                  ) : (
                    filteredOperatorCards.map((item) => {
                      const isActive =
                        item.status?.toLowerCase() === "active" ||
                        (item.licenseExpiry && new Date(item.licenseExpiry) >= new Date());
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800">{item.id}</td>
                          <td className="px-6 py-4 text-slate-600">
                            {item.machineOperator || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {item.operatorName || `${item.firstName || ""} ${item.lastName || ""}`.trim() || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {item.issuedDate || item.issueDate || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {item.licenseExpiry || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setPrintOperatorCard(item)}
                              className="bg-[#683EFF] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#5b36e5] transition-colors inline-flex items-center gap-1 shadow-sm"
                              title="Direct PDF Print"
                            >
                              <Icons.Printer className="w-3.5 h-3.5" />
                              Print
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
