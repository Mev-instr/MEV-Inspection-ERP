export enum ERPSection {
  PORTFOLIO = "Portfolio",
  JOBS = "Jobs",
  CHECK_LIST_REPORT = "Check List / Report",
  CERTIFICATES = "Certificates",
  MASTER_DIRECTORY = "Master Directory",
  FINANCIALS = "Financials",
  SETTING = "Settings",
  JOB_CARDS = "Job Cards",
  OPERATOR_CARDS = "Operator Cards",
  INTEGRATIONS = "Integrations",
}

export enum ERPCategory {
  CUSTOMER_DETAILS = "Customer Details",
  EMPLOYEE_DETAILS = "Employee Details",
  TRAINING_JOB_ORDER_CARD = "Training Job Order/Card",
  INSPECTION_JOB_ORDER_CARD = "Inspection Job Order/Card",
  INSPECTION_REPORT = "Inspection Report",
  MACHINE_CERTIFICATES = "Machine Certificates",
  LIFTING_TOOL_CERTIFICATE = "Lifting Tool Certificate",
  MACHINE_DETAILS = "Machine Models",
  OPERATOR_CARD = "Operator Card",
}

export interface MenuItem {
  category: ERPCategory;
  title: string;
  iconName: string;
}

export interface MenuSection {
  section: ERPSection;
  title: string;
  cards: MenuItem[];
}

export interface DashboardCard {
  id: string;
  section: ERPSection;
  category: ERPCategory;
  title: string;
  iconName: string;
  count: number;
}

export interface CustomerDetail {
  id: string;
  companyName?: string;
  vatNumber?: string;
  crNumber?: string;
  address?: string;
  contactPerson?: string;
  contactNumber?: string;
  email?: string;
  status?: string;
  accountBalance?: number;
  country?: string;
  trainingSiteAddress?: string;
  addressLine1?: string;
  cityAddress?: string;
  trainingContactPhone?: string;
  phone?: string;
  customerType?: string;
  trainingContactPerson?: string;
  inspectionContactPerson?: string;
  inspectionContactPhone?: string;
  inspectionMobile?: string;
  primaryEmail?: string;
  primaryMobile?: string;
  addressLine2?: string;
  stateProvince?: string;
  zipPostalCode?: string;
  inspectionSiteAddress?: string;
  lastUpdated?: string;
}

export interface EmployeeDetail {
  id: string;
  firstName?: string;
  lastName?: string;
  designation?: string;
  department?: string;
  email?: string;
  phone?: string;
  status?: string;
  joinDate?: string;
  joiningDate?: string;
  name?: string;
  role?: string;
}

export interface TrainingOperator {
  operatorId: string; // The ID from master operator list
  operatorName: string;
  iqamaNumber: string;
  machineId: string;
  machineName: string;
}

export interface TrainingJob {
  id: string;
  courseTitle?: string;
  instructor?: string;
  targetDate?: string;
  registeredCandidates?: number;
  status?: string;
  location?: string;
  namingSeries?: string;
  trainerId?: string;
  trainingStartDate?: string;
  trainingEndDate?: string;
  clientName?: string;
  attentionLocation?: string;
  attentionPhone?: string;
  machineName?: string;
  machineCount?: string | number;
  operators?: TrainingOperator[];
}

export interface InspectionJob {
  id: string;
  assetType?: string;
  inspector?: string;
  scheduledDate?: string;
  location?: string;
  urgency?: string;
  status?: string;
  namingSeries?: string;
  inspectorId?: string;
  inspectionStartDate?: string;
  inspectionEndDate?: string;
  clientName?: string;
  attentionLocation?: string;
  attentionPhone?: string;
  machineName?: string;
  machineCount?: string | number;
  operators?: TrainingOperator[];
}

export interface ChecklistItem {
  item: string;
  status: 'Pass' | 'Fail' | 'N/A';
  comments?: string;
}

export interface InspectionReport {
  id: string;
  reportName?: string;
  assetTested?: string;
  inspector?: string;
  testDate?: string;
  complianceScore?: number;
  status?: string;
  checklist?: ChecklistItem[];
  namingSeries?: string;
  trainerId?: string;
  inspectionStartDate?: string;
  inspectionEndDate?: string;
  clientName?: string;
  attentionLocation?: string;
  attentionPhone?: string;
  machineName?: string;
  machineCount?: string | number;
  operators?: any[];
  
  location?: string;
  checklistNumber?: string;
  stickerNo?: string;
  finalResult?: string;
  jobNumber?: string;
  equipmentName?: string;
  inspectionDate?: string;
  expirationDate?: string;
  expirationData?: string;
  travelToFrom?: string;
  timeSheetNumber?: string;
  validity?: string;
  typeOfInspection?: string;
  address?: string;
  equipmentLocation?: string;
  recommendation?: string;
}

export interface MachineCertificate {
  id: string;
  namingSeries?: string;
  inspectionReportNo?: string;
  jobNumber?: string;
  equipmentName?: string;
  stickerNumber?: string;
  timeSheetNumber?: string;
  result?: string;
  validity?: string;
  checkList?: string;
  clientName?: string;
  inspectionDate?: string;
  location?: string;
  expirationDate?: string;
  equipmentLocation?: string;
  typeOfInspection?: string;
  nextInspectionDate?: string;
  referenceStandard?: string;
  inspectedBy?: string;
  inspectedBySignature?: string;
  authorizedBy?: string;
  authorizedBySignature?: string;
  recommendation?: string;
  status?: string;
  manufacturer?: string;
  modelName?: string;
  serialNumber?: string;
  dateOfMfg?: string;
  ownerId?: string;
  wheelType?: string;
  loadLimit?: string;
  maxOutreach?: string;
  bucketCapacity?: string;
  enginePower?: string;
  boomLength?: string;
  maxPlatformHeight?: string;
  heoBucketCapacity?: string;
  engineSpeed?: string;
  angleOfSpan?: string;
  personAllowed?: string;
  previousInspection?: string;
  loadChartData?: { boom: string, radius: string, swl: string, testLoad: string }[];
}

export interface LiftingToolCert {
  id: string;
  toolName?: string;
  safeWorkingLoad?: string;
  certificateNo?: string;
  issueDate?: string;
  expiryDate?: string;
  status?: string;
  namingSeries?: string;
  inspectionReportNo?: string;
  jobNumber?: string;
  stickerNumber?: string;
  timeSheetNumber?: string;
  result?: string;
  validity?: string;
  checkList?: string;
  clientName?: string;
  location?: string;
  equipmentLocation?: string;
  typeOfInspection?: string;
  nextInspectionDate?: string;
  referenceStandard?: string;
  inspectedBy?: string;
  inspectedBySignature?: string;
  authorizedBy?: string;
  authorizedBySignature?: string;
  recommendation?: string;
  operators?: any[];
  colorCode?: string;
  accessoriesData?: { no: number, idNo: string, description: string, type: string, swl: string, sizeWidth: string, length: string, color: string, result: string, remark: string }[];
  loadChartData?: { boom: string, radius: string, swl: string, testLoad: string }[];
  loadLimit?: string;
  maxOutreach?: string;
  bucketCapacity?: string;
  enginePower?: string;
  boomLength?: string;
  wheelType?: string;
  maxPlatformHeight?: string;
  heoBucketCapacity?: string;
  engineSpeed?: string;
  angleOfSpan?: string;
  personAllowed?: string;
  manufacturer?: string;
  modelName?: string;
  serialNumber?: string;
  dateOfMfg?: string;
  ownerId?: string;
  previousInspection?: string;
}

export interface MachineDetail {
  id: string;
  machineName?: string;
  model?: string;
  manufacturer?: string;
  yearOfManufacture?: number;
  serialNumber?: string;
  currentLocation?: string;
  status?: string;
  workingHours?: number;
  department?: string;
  lastServiceDate?: string;
  swl?: string;
  maxOutreach?: string;
  bucketCapacity?: string;
  enginePower?: string;
  boomLength?: string;
  wheelType?: string;
  maxPlatformHeight?: string;
  heoBucketCapacity?: string;
  engineSpeed?: string;
  angleOfSpan?: string;
  personAllowed?: string;
}

export interface OperatorCard {
  id: string;
  firstName?: string;
  lastName?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  certifiedMachines?: string | string[];
  status?: string;
  photoUrl?: string;
  sponsorName?: string;
  iqamaNumber?: string;
  jobTitle?: string;
  nationality?: string;
  passportNumber?: string;
  birthDate?: string;
  bloodGroup?: string;
  issuedDate?: string;
  issueDate?: string;
  operatorName?: string;
  badgeNumber?: string;
  authorizedEquipment?: string | string[];
  machineOperator?: string;
  idNumber?: string;
  photoAttachment?: string;
  authorizedBySignature?: string;
  trainedBySignature?: string;
  namingSeries?: string;
  levelType?: string;
  company?: string;
  trainedBy?: string;
  safetyIndex?: number;
}
