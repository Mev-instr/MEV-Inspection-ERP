/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ERPSection,
  ERPCategory,
  DashboardCard,
  CustomerDetail,
  EmployeeDetail,
  TrainingJob,
  InspectionJob,
  InspectionReport,
  MachineCertificate,
  LiftingToolCert,
  MachineDetail,
  OperatorCard
} from "./types";

export const initialDashboardCards: DashboardCard[] = [
  { id: "1", section: ERPSection.SETTING, category: ERPCategory.CUSTOMER_DETAILS, title: "Customer Details", iconName: "Building", count: 252 },
  { id: "2", section: ERPSection.SETTING, category: ERPCategory.EMPLOYEE_DETAILS, title: "Employee Details", iconName: "Users", count: 4 },
  { id: "3", section: ERPSection.JOB_CARDS, category: ERPCategory.TRAINING_JOB_ORDER_CARD, title: "Training Job Order Card", iconName: "FileText", count: 1071 },
  { id: "4", section: ERPSection.JOB_CARDS, category: ERPCategory.INSPECTION_JOB_ORDER_CARD, title: "Inspection Job Order Card", iconName: "CheckSquare", count: 1471 },
  { id: "5", section: ERPSection.CHECK_LIST_REPORT, category: ERPCategory.INSPECTION_REPORT, title: "Inspection Report", iconName: "ClipboardCheck", count: 1481 },
  { id: "6", section: ERPSection.CERTIFICATES, category: ERPCategory.MACHINE_CERTIFICATES, title: "Machine Certificates", iconName: "Shield", count: 1281 },
  { id: "7", section: ERPSection.CERTIFICATES, category: ERPCategory.LIFTING_TOOL_CERTIFICATE, title: "Lifting Tool Certificate", iconName: "Anchor", count: 197 },
  { id: "8", section: ERPSection.CERTIFICATES, category: ERPCategory.MACHINE_DETAILS, title: "Machine Models", iconName: "Award", count: 640 },
  { id: "9", section: ERPSection.OPERATOR_CARDS, category: ERPCategory.OPERATOR_CARD, title: "Operator Card", iconName: "FileSpreadsheet", count: 2803 },
];

export const initialCustomers: CustomerDetail[] = [
  {
    id: "Saudi Aramco",
    companyName: "Saudi Aramco",
    country: "Saudi Arabia",
    contactPerson: "Eng. Khalid Al-Naimi",
    status: "Active",
    phone: "+966 13 874 0000",
    email: "khalid.naimi@aramco.com",
    customerType: "Oil & Gas Corporation",
    lastUpdated: "2026-06-16",
    trainingSiteAddress: "Saudi Aramco Training Complex, Dhahran",
    trainingContactPerson: "Hussein Jamil",
    trainingContactPhone: "+966 13 874 1122",
    inspectionSiteAddress: "Dhahran South Refineries Hub",
    inspectionContactPerson: "Yasmin Al-Ghamdi",
    inspectionContactPhone: "+966 13 874 4455",
    inspectionMobile: "+966 50 123 4567",
    primaryEmail: "corporate.liaison@aramco.com",
    primaryMobile: "+966 55 987 6543",
    addressLine1: "Aramco Main HQ Tower, Level 12",
    cityAddress: "Dammam / Dhahran",
    addressLine2: "P.O. Box 5000",
    stateProvince: "Eastern Province",
    zipPostalCode: "31311"
  },
  {
    id: "NEOM Construction",
    companyName: "NEOM Construction",
    country: "Saudi Arabia",
    contactPerson: "Eng. Tareq Al-Subaie",
    status: "Active",
    phone: "+966 14 551 2288",
    email: "tareq.subaie@neom.com",
    customerType: "Construction & Infrastructure Development",
    lastUpdated: "2026-06-09",
    trainingSiteAddress: "NEOM Construction Community Base 2",
    trainingContactPerson: "Mark Grayson",
    trainingContactPhone: "+966 14 551 4488",
    inspectionSiteAddress: "The Line Sector 4 Laydown Area",
    inspectionContactPerson: "Anas Al-Marri",
    inspectionContactPhone: "+966 14 551 7711",
    inspectionMobile: "+966 54 888 7777",
    primaryEmail: "procurement.eng@neom.com",
    primaryMobile: "+966 54 111 2222",
    addressLine1: "NEOM HQ Building A, Innovation City",
    cityAddress: "Tabuk",
    addressLine2: "District 2 Boulevard",
    stateProvince: "Tabuk Province",
    zipPostalCode: "41443"
  },
  {
    id: "Red Sea Global",
    companyName: "Red Sea Global",
    country: "Saudi Arabia",
    contactPerson: "Naser Al-Khashan",
    status: "Active",
    phone: "+966 12 604 1100",
    email: "naser.kh@redseaglobal.com",
    customerType: "Tourism & Commercial Real Estate",
    lastUpdated: "2026-06-02",
    trainingSiteAddress: "Red Sea Global Coastal Village Hub",
    trainingContactPerson: "Sarah Jenkins",
    trainingContactPhone: "+966 12 604 1155",
    inspectionSiteAddress: "Ummahat Island South Pier Jetty",
    inspectionContactPerson: "Eng. Fahad Salem",
    inspectionContactPhone: "+966 12 604 2299",
    inspectionMobile: "+966 52 333 4444",
    primaryEmail: "info.hseq@redseaglobal.com",
    primaryMobile: "+966 52 555 6666",
    addressLine1: "Red Sea Plaza, Al-Baghdadiyah",
    cityAddress: "Jeddah",
    addressLine2: "King Abdulaziz Road",
    stateProvince: "Makkah Province",
    zipPostalCode: "21451"
  }
];

export const initialEmployees: EmployeeDetail[] = [
  { id: "EMP-001", name: "Amine Al-Hussaini", role: "Managing Director", department: "Executive Office", status: "Active", email: "amine@me-vim.com", phone: "+971 4 412 8001", joiningDate: "2018-03-15" },
  { id: "EMP-002", name: "Nour Al-Faisal", role: "Inspection Lead Auditor", department: "Quality Assurance", status: "Active", email: "nour.f@me-vim.com", phone: "+971 4 412 8004", joiningDate: "2020-07-01" },
  { id: "EMP-003", name: "Zaid Mansoor", role: "Senior QHSE Consultant", department: "Operations & HSE", status: "Active", email: "zaid.m@me-vim.com", phone: "+971 4 412 8009", joiningDate: "2021-01-10" },
  { id: "EMP-004", name: "Fatima Al-Sayed", role: "Operations Coordinator", department: "Logistics", status: "Active", email: "fatima.s@me-vim.com", phone: "+971 4 412 8012", joiningDate: "2022-09-20" },
];

export const initialTrainingJobs: TrainingJob[] = [
  {
    id: "JO-TR-24-1100",
    courseTitle: "Rigging & Slinging Certification (Level 1)",
    instructor: "Zaid Mansoor",
    targetDate: "2026-06-22",
    registeredCandidates: 12,
    status: "Scheduled",
    location: "Saudi Aramco Training Complex, Dhahran",
    trainerId: "TR-ZAID-09",
    trainingStartDate: "2026-06-19",
    trainingEndDate: "2026-06-22",
    clientName: "Saudi Aramco",
    attentionLocation: "Dhahran South Refineries Hub",
    attentionPhone: "+966 13 874 112a", // let's use a nice phone
    machineName: "Rigging Hardware / Sling Shackle Simulator",
    machineCount: 2
  },
  {
    id: "JO-TR-24-1101",
    courseTitle: "Confined Space Entry Safety (CSES)",
    instructor: "Nour Al-Faisal",
    targetDate: "2026-06-18",
    registeredCandidates: 8,
    status: "In Progress",
    location: "NEOM Construction Community Base 2",
    trainerId: "TR-NOUR-03",
    trainingStartDate: "2026-06-15",
    trainingEndDate: "2026-06-18",
    clientName: "NEOM Construction",
    attentionLocation: "Tabuk",
    attentionPhone: "+966 14 551 4488",
    machineName: "Confined Space Ventilation Fans & Gas Detectors",
    machineCount: 4
  },
  {
    id: "JO-TR-24-1102",
    courseTitle: "Working at Height Practical Safety Refresher",
    instructor: "Amine Al-Hussaini",
    targetDate: "2026-06-12",
    registeredCandidates: 15,
    status: "Completed",
    location: "Red Sea Global Coastal Village Hub",
    trainerId: "TR-AMINE-01",
    trainingStartDate: "2026-06-09",
    trainingEndDate: "2026-06-12",
    clientName: "Red Sea Global",
    attentionLocation: "Jeddah",
    attentionPhone: "+966 12 604 1155",
    machineName: "Mobile Elevating Work Platform (MEWP)",
    machineCount: 1
  }
];

export const initialInspectionJobs: InspectionJob[] = [
  {
    id: "JO-INS-26-1101",
    assetType: "Tadano 160-Ton Hydraulic Crane",
    machineName: "Tadano 160-Ton Hydraulic Crane",
    inspector: "Nour Al-Faisal",
    location: "Dhahran South Refineries Hub, Gate 4",
    urgency: "High",
    status: "In Progress",
    scheduledDate: "2026-06-19",
    inspectionStartDate: "2026-06-19",
    inspectionEndDate: "2027-06-19",
    clientName: "Saudi Aramco",
    attentionLocation: "Yard B, Laydown Pad 12",
    attentionPhone: "+966 50 123 4567"
  },
  {
    id: "JO-INS-26-1102",
    assetType: "CAT D10 Heavy Duty Crawler",
    machineName: "CAT D10 Heavy Duty Crawler",
    inspector: "Zaid Mansoor",
    location: "The Line Sector 4 Laydown Area",
    urgency: "Medium",
    status: "Pending",
    scheduledDate: "2026-06-21",
    inspectionStartDate: "2026-06-21",
    inspectionEndDate: "2026-12-21",
    clientName: "NEOM",
    attentionLocation: "Sector 4, Earthworks Zone B",
    attentionPhone: "+966 54 987 6543"
  },
  {
    id: "JO-INS-26-1103",
    assetType: "High Pressure Argon Storage Vessel V-88",
    machineName: "High Pressure Argon Storage Vessel V-88",
    inspector: "Eng. Fahad Salem",
    location: "Coastal Village Jebel Ali, Plant 3",
    urgency: "Low",
    status: "Completed",
    scheduledDate: "2026-06-10",
    inspectionStartDate: "2026-06-10",
    inspectionEndDate: "2027-06-10",
    clientName: "SABIC",
    attentionLocation: "Gas Storage Manifold Unit 4",
    attentionPhone: "+971 50 555 1234"
  }
];

export const initialInspectionReports: InspectionReport[] = [
  {
    id: "REP-2026-001",
    namingSeries: "REP-2026-001",
    reportName: "Periodic Crane Safety Audit",
    assetTested: "Tadano 160-Ton Hydraulic Crane",
    inspector: "Nour Al-Faisal",
    testDate: "2026-06-19",
    complianceScore: 98,
    status: "Completed",
    checklist: [
      { item: "Hydraulic pressure valves inspection", status: "Pass", comments: "Nominal pressure verified" },
      { item: "Wire rope & rigging integrity", status: "Pass", comments: "No fraying or corrosion" },
      { item: "Load moment indicator calibration", status: "Pass", comments: "Calibrated within 0.5% margin" }
    ],
    checklistNumber: "CHK-8821",
    stickerNo: "STK-9901",
    finalResult: "Pass",
    jobNumber: "JO-INS-26-1101",
    equipmentName: "Tadano 160-Ton Hydraulic Crane",
    inspectionDate: "2026-06-19",
    expirationData: "2027-06-19",
    travelToFrom: "Dhahran HQ to South Refineries Hub",
    timeSheetNumber: "TS-44102",
    validity: "12 months",
    typeOfInspection: "Periodic and Visual Inspection",
    clientName: "Saudi Aramco",
    address: "Dhahran South Refineries Hub, Gate 4",
    equipmentLocation: "Yard B, Laydown Pad 12",
    recommendation: "Equipment is fully compliant with ASME B30.5 safety standards. Recommended routine greasing every 250 operating hours."
  },
  {
    id: "REP-2026-002",
    namingSeries: "REP-2026-002",
    reportName: "Heavy Duty Crawler Visual Inspection",
    assetTested: "CAT D10 Heavy Duty Crawler",
    inspector: "Zaid Mansoor",
    testDate: "2026-06-21",
    complianceScore: 92,
    status: "Completed",
    checklist: [
      { item: "Undercarriage track tension", status: "Pass", comments: "Adjusted to factory spec" },
      { item: "Engine exhaust & emission check", status: "Pass", comments: "DPF clean" },
      { item: "Emergency shut-off system", status: "Pass", comments: "Tested functional" }
    ],
    checklistNumber: "CHK-8822",
    stickerNo: "STK-9902",
    finalResult: "Satisfactory",
    jobNumber: "JO-INS-26-1102",
    equipmentName: "CAT D10 Heavy Duty Crawler",
    inspectionDate: "2026-06-21",
    expirationData: "2026-12-21",
    travelToFrom: "Jubail Camp to NEOM Sector 4",
    timeSheetNumber: "TS-44108",
    validity: "6 months",
    typeOfInspection: "Periodic and Visual Inspection",
    clientName: "NEOM",
    address: "The Line Sector 4 Laydown Area",
    equipmentLocation: "Sector 4, Earthworks Zone B",
    recommendation: "Minor wear observed on track pads. Satisfactory condition for heavy excavation operations. Schedule follow-up visual check in 6 months."
  },
  {
    id: "REP-2026-003",
    namingSeries: "REP-2026-003",
    reportName: "Load Testing Vessel Certification",
    assetTested: "High Pressure Argon Storage Vessel V-88",
    inspector: "Eng. Fahad Salem",
    testDate: "2026-06-10",
    complianceScore: 85,
    status: "Requires Fix",
    checklist: [
      { item: "Hydrostatic test at 1.5x design pressure", status: "Pass", comments: "Held pressure for 60 mins" },
      { item: "Relief valve pop-off test", status: "Fail", comments: "Pop-off delayed by 15 PSI above threshold" },
      { item: "Ultrasonic weld thickness gauge", status: "Pass", comments: "Wall thickness within tolerance" }
    ],
    checklistNumber: "CHK-8825",
    stickerNo: "STK-9905",
    finalResult: "Requires Attention",
    jobNumber: "JO-INS-26-1103",
    equipmentName: "High Pressure Argon Storage Vessel V-88",
    inspectionDate: "2026-06-10",
    expirationData: "2027-06-10",
    travelToFrom: "Dubai Office to Jebel Ali Coastal Village",
    timeSheetNumber: "TS-44115",
    validity: "12 months",
    typeOfInspection: "Load Testing Inspection",
    clientName: "SABIC",
    address: "Coastal Village Jebel Ali, Plant 3",
    equipmentLocation: "Gas Storage Manifold Unit 4",
    recommendation: "Primary relief valve PRV-104 failed pop-off calibration threshold. Valve must be overhauled or replaced before issuing final certification sticker."
  }
];

export const initialMachineCertificates: MachineCertificate[] = [
  {
    id: "CERT-2026-1001",
    namingSeries: "MEV-CRT-26",
    inspectionReportNo: "IR-1001",
    jobNumber: "JN-2026-001",
    equipmentName: "Tadano 160-Ton Hydraulic Crane",
    stickerNumber: "STK-991",
    timeSheetNumber: "TS-441",
    result: "Pass",
    validity: "1 Year",
    checkList: "Standard Crane Checklist",
    clientName: "Saudi Aramco",
    inspectionDate: "2026-01-15",
    location: "Dhahran South Refineries Hub",
    expirationDate: "2027-01-14",
    equipmentLocation: "Yard B",
    typeOfInspection: "Annual",
    nextInspectionDate: "2027-01-15",
    referenceStandard: "ASME B30.5",
    inspectedBy: "John Doe",
    authorizedBy: "Jane Smith",
    recommendation: "Routine maintenance advised.",
    status: "Completed"
  },
  {
    id: "CERT-2026-1002",
    namingSeries: "MEV-CRT-26",
    inspectionReportNo: "IR-1002",
    jobNumber: "JN-2026-002",
    equipmentName: "CAT D10 Heavy Duty Crawler",
    stickerNumber: "STK-992",
    timeSheetNumber: "TS-442",
    result: "Pass",
    validity: "6 Months",
    checkList: "Heavy Duty Crawler Checklist",
    clientName: "NEOM",
    inspectionDate: "2026-02-20",
    location: "Sector 4 Laydown Area",
    expirationDate: "2026-08-19",
    equipmentLocation: "Sector 4",
    typeOfInspection: "Semi-Annual",
    nextInspectionDate: "2026-08-20",
    referenceStandard: "OSHA 1926",
    inspectedBy: "Alan Turing",
    authorizedBy: "Grace Hopper",
    recommendation: "Check hydraulic fluids monthly.",
    status: "Scheduled"
  }
];

export const initialLiftingToolCerts: LiftingToolCert[] = [];

export const initialMachineDetails: MachineDetail[] = [
  {
    id: "MACH-26-1001",
    machineName: "Tadano GR-500EX Crane",
    model: "GR-500EX",
    manufacturer: "Tadano Works Ltd.",
    yearOfManufacture: 2021,
    serialNumber: "TD-500-1191",
    currentLocation: "Dhahran South Refineries Hub",
    status: "Operational",
    workingHours: 1250,
    department: "Heavy Equipment Fleet",
    lastServiceDate: "2026-05-12"
  },
  {
    id: "MACH-26-1002",
    machineName: "Kato Heavy Hydraulic Crane",
    model: "TR-500-Series",
    manufacturer: "Kato Works Co., Ltd.",
    yearOfManufacture: 2022,
    serialNumber: "K-SER-4402",
    currentLocation: "NEOM Community Base 2",
    status: "Maintenance",
    workingHours: 890,
    department: "Lifting Operations",
    lastServiceDate: "2026-06-18"
  },
  {
    id: "MACH-26-1003",
    machineName: "CAT D10 Heavy Duty Crawler",
    model: "D10T2",
    manufacturer: "Caterpillar Inc.",
    yearOfManufacture: 2020,
    serialNumber: "CAT-D10-9901",
    currentLocation: "Red Sea Coastal Village Hub",
    status: "Operational",
    workingHours: 2150,
    department: "Earthmoving & Grading",
    lastServiceDate: "2026-04-30"
  },
  {
    id: "MACH-26-1004",
    machineName: "Crosby Spreader Beam",
    model: "SBL-A200",
    manufacturer: "The Crosby Group",
    yearOfManufacture: 2023,
    serialNumber: "CR-SP-5501",
    currentLocation: "Dhahran Logistics Yard",
    status: "Breakdown",
    workingHours: 350,
    department: "Rigging Fleet",
    lastServiceDate: "2026-06-01"
  }
];

export const initialOperators: OperatorCard[] = [
  {
    id: "OP-2026-9012",
    operatorName: "Mohammed Al-Qahtani",
    badgeNumber: "B-2291",
    idNumber: "B-2291",
    authorizedEquipment: ["Crawler Crane", "Mobile Crane", "Forklift"],
    safetyIndex: 98,
    issueDate: "2024-12-15",
    licenseExpiry: "2027-12-15",
    machineOperator: "Heavy Lifting Specialist",
    status: "Fully Certified"
  },
  {
    id: "OP-2026-9013",
    operatorName: "Saeed Ibrahim",
    badgeNumber: "B-1088",
    idNumber: "B-1088",
    authorizedEquipment: ["Excavator", "Bulldozer"],
    safetyIndex: 94,
    issueDate: "2023-08-10",
    licenseExpiry: "2026-08-10",
    machineOperator: "Earthmoving Operator",
    status: "Fully Certified"
  },
  {
    id: "OP-2026-9014",
    operatorName: "Abdullah Yousef",
    badgeNumber: "B-4402",
    idNumber: "B-4402",
    authorizedEquipment: ["Tower Crane", "Overhead Crane"],
    safetyIndex: 82,
    issueDate: "2023-07-05",
    licenseExpiry: "2026-07-05",
    machineOperator: "Crane Operator",
    status: "Grace Period"
  }
];
