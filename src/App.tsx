/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
import {
  initialCustomers,
  initialEmployees,
  initialTrainingJobs,
  initialInspectionJobs,
  initialInspectionReports,
  initialMachineCertificates,
  initialLiftingToolCerts,
  initialMachineDetails,
  initialOperators,
} from "./data";
import { DetailModal, LucideIcon } from "./components/DetailModal";
import { CustomerPortfolioView } from "./components/CustomerPortfolioView";
import { EmployeeDetailsPortfolioView } from "./components/EmployeeDetailsPortfolioView";
import { UserManagementView } from "./components/UserManagementView";
import { ClientPortalDashboard } from "./components/ClientPortalDashboard";
import { TrainingJobsPortfolioView } from "./components/TrainingJobsPortfolioView";
import { LiftingToolCertificatesPortfolioView } from "./components/LiftingToolCertificatesPortfolioView";
import { MachineCertificatesPortfolioView } from "./components/MachineCertificatesPortfolioView";
import { InspectionJobsPortfolioView } from "./components/InspectionJobsPortfolioView";
import { InspectionReportsPortfolioView } from "./components/InspectionReportsPortfolioView";
import { OperatorDirectoryView } from "./components/OperatorDirectoryView";
import { OperatorDetailView } from "./components/OperatorDetailView";
import { MachineDetailsPortfolioView } from "./components/MachineDetailsPortfolioView";
import { LoginPage } from "./components/LoginPage";
import { PublicVerificationView } from "./components/PublicVerificationView";
import {
  initSecureAuth,
  signInWithGoogle,
  signOutUser,
  getAccessToken,
  storage,
} from "./lib/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import {
  fetchCollection,
  saveDocument,
  deleteDocument,
  seedFirestore,
} from "./lib/firestoreSync";

export default function App() {
  // Refs to track loaded states from Firestore to avoid redundant auto-saving / loops
  const customersLoadedRef = useRef<any[] | null>(null);
  const employeesLoadedRef = useRef<any[] | null>(null);
  const operatorsLoadedRef = useRef<any[] | null>(null);
  const machineCertificatesLoadedRef = useRef<any[] | null>(null);
  const trainingJobsLoadedRef = useRef<any[] | null>(null);
  const inspectionJobsLoadedRef = useRef<any[] | null>(null);
  const inspectionReportsLoadedRef = useRef<any[] | null>(null);
  const liftingToolCertsLoadedRef = useRef<any[] | null>(null);
  const machineDetailsLoadedRef = useRef<any[] | null>(null);

  // Authentication & Google Cloud Drive Connection States
  const [dashboardLogoUrl, setDashboardLogoUrl] = useState<string | null>(null);
  const [loginLogoUrl, setLoginLogoUrl] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const isAdmin = currentUser?.email === "shahzaibkamran44@gmail.com";
  const [cloudMessage, setCloudMessage] = useState<string | null>(null);

  // Domain separation states (client.mev-ins.com vs erp.mev-ins.com)
  const initialDomainMode = useMemo(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname.toLowerCase();
      if (hostname.includes("client")) {
        return "CLIENT";
      }
      if (hostname.includes("erp")) {
        return "ERP";
      }
    }
    return "ERP";
  }, []);

  const [domainMode, setDomainMode] = useState<"ERP" | "CLIENT">(initialDomainMode);

  useEffect(() => {
    if (domainMode === "CLIENT") {
      document.title = "MEV Inspections Client portal";
    } else {
      document.title = "MEV Inspections ERP";
    }

    const faviconUrl = "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0459155438.firebasestorage.app/o/Branding%2FFavicon%20Full%20Opacity.png?alt=media&token=921c204c-2cb6-4665-a5e5-d010fd662af4";
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  }, [domainMode]);

  const [adminPreviewClientId, setAdminPreviewClientId] = useState<string>("");

  const isDevEnvironment = useMemo(() => {
    if (typeof window === "undefined") return false;
    const h = window.location.hostname.toLowerCase();
    return h === "localhost" || h.includes("127.0.0.1") || h.includes("run.app") || h.includes("aistudio");
  }, []);

  // ERP Tables Core Database State
  const [customers, setCustomers] = useState<CustomerDetail[]>([]);
  const [employees, setEmployees] = useState<EmployeeDetail[]>([]);
  const currentEmployee = employees.find(e => e.email && e.email.toLowerCase() === currentUser?.email?.toLowerCase());

  // Find active client for portal based on domain and role
  const activeClientForPortal = useMemo(() => {
    if (isAdmin && domainMode === "CLIENT") {
      const clientWithAccount = customers.find(c => c.hasAccount) || customers[0];
      const selected = customers.find(c => c.id === adminPreviewClientId);
      return selected || clientWithAccount || null;
    }
    const client = customers.find(c => {
      const cEmail = (c.portalEmail || c.email || c.primaryEmail || "").toLowerCase();
      return cEmail && cEmail === currentUser?.email?.toLowerCase() && c.hasAccount;
    });
    return client || null;
  }, [currentUser, customers, isAdmin, domainMode, adminPreviewClientId]);

  const isClient = domainMode === "CLIENT" || (!isAdmin && customers.some(c => {
    const cEmail = (c.portalEmail || c.email || c.primaryEmail || "").toLowerCase();
    return cEmail && cEmail === currentUser?.email?.toLowerCase() && c.hasAccount;
  }));

  const currentClient = activeClientForPortal;
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [inspectionJobs, setInspectionJobs] = useState<InspectionJob[]>([]);
  const [inspectionReports, setInspectionReports] = useState<InspectionReport[]>([]);
  const [machineCertificates, setMachineCertificates] = useState<MachineCertificate[]>([]);
  const [liftingToolCerts, setLiftingToolCerts] = useState<LiftingToolCert[]>([]);
  const [machineDetails, setMachineDetails] = useState<MachineDetail[]>([]);
  const [operators, setOperators] = useState<OperatorCard[]>([]);

  // Layout states
  const [currentTab, setCurrentTab] = useState<
    | "DASHBOARD"
    | "PORTFOLIO"
    | "EMPLOYEE_DETAILS"
    | "USER_MANAGEMENT"
    | "TRAINING"
    | "INSPECTION"
    | "INSPECTION_REPORTS"
    | "OPERATORS"
    | "MACHINE_CERTIFICATES"
    | "LIFTING_TOOL_CERTIFICATE"
    | "MACHINE_DETAILS"
    | "CLOUD_DRIVE"
  >("DASHBOARD");
  const [viewOperatorId, setViewOperatorId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ERPCategory | null>(
    null,
  );
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);


  // Toast trigger for Cloud status
  const triggerCloudToast = (msg: string) => {
    setCloudMessage(msg);
    setTimeout(() => setCloudMessage(null), 4000);
  };

  // 1. Listen to Firebase Authentication State Changes with Secure Domain Authorization
  useEffect(() => {
    const unsubscribe = initSecureAuth(async (user) => {
      if (user) {
        try {
          if (user.email === "shahzaibkamran44@gmail.com") {
            // Admin has absolute access to everything
            setAuthError(null);
            setCurrentUser(user);
            triggerCloudToast(`✓ Connected to Google Cloud as Admin`);
            initializeStructure();
            return;
          }

          // Fetch fresh customers and employees from Firestore
          const freshCustomers = await fetchCollection("customers");
          const freshEmployees = await fetchCollection("employees");

          const userEmail = (user.email || "").toLowerCase();

          const isCustomer = freshCustomers.some(c => {
            const cEmail = (c.portalEmail || c.email || c.primaryEmail || "").toLowerCase();
            return cEmail && cEmail === userEmail && c.hasAccount;
          });

          const isEmployee = freshEmployees.some(e => {
            const eEmail = (e.email || "").toLowerCase();
            return eEmail && eEmail === userEmail && e.hasAccount;
          });

          // Match the domain we are currently viewing
          let currentMode = domainMode;
          if (typeof window !== "undefined") {
            const hostname = window.location.hostname.toLowerCase();
            if (hostname.includes("client")) {
              currentMode = "CLIENT";
            } else if (hostname.includes("erp")) {
              currentMode = "ERP";
            }
          }

          if (currentMode === "CLIENT") {
            if (!isCustomer) {
              setAuthError("Access Denied: This login gateway is exclusively for MEV Clients.");
              await signOutUser();
              setCurrentUser(null);
              return;
            }
          } else {
            if (!isEmployee) {
              setAuthError("Access Denied: This login gateway is for MEV ERP staff only.");
              await signOutUser();
              setCurrentUser(null);
              return;
            }
          }

          // Authorized successfully, update states
          setAuthError(null);
          if (freshCustomers && freshCustomers.length > 0) {
            setCustomers(freshCustomers);
            customersLoadedRef.current = freshCustomers;
          }
          if (freshEmployees && freshEmployees.length > 0) {
            setEmployees(freshEmployees);
            employeesLoadedRef.current = freshEmployees;
          }

          setCurrentUser(user);
          triggerCloudToast(
            `✓ Connected to Google Cloud as ${user.displayName || user.email}`,
          );
          initializeStructure();
        } catch (error) {
          console.error("Auth verification error:", error);
          setAuthError("Auth verification failed. Check your connection.");
          await signOutUser();
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
        triggerCloudToast(`Not connected. Please sign in to manage data.`);
      }
    });
    return () => unsubscribe();
  }, [domainMode]);

  // 2. Initialize Folder Structure and Load Existing Branding Files
  const initializeStructure = async () => {
    try {
      // Logic for folder/branding setup here
    } catch (err) {
      console.error("Error setting up base folders:", err);
    }
  };

  // 3. Connect/Disconnect Google Auth
  const handleSignIn = async () => {
    try {
      const res = await signInWithGoogle();
      setCurrentUser(res.user);
      triggerCloudToast(`✓ Connected successfully!`);
      await initializeStructure();
    } catch (err) {
      console.error(err);
      triggerCloudToast(`❌ Connection failed. Check API Keys.`);
    }
  };

  const handleSignOutGoogle = async () => {
    try {
      await signOutUser();
      setCurrentUser(null);
      triggerCloudToast(`Disconnected from Google Cloud.`);
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Client image upload handler passed to subviews
  const handleUploadImage = async (
    file: File,
    clientName: string,
    subfolder: string,
    entityId?: string,
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(async (blob) => {
            if (!blob) {
              reject(new Error("Failed to create blob"));
              return;
            }

            try {
              const extension = "webp";
              const safeSubfolder = subfolder.trim();
              const fileName = entityId ? `${entityId}.${extension}` : `${Date.now()}.${extension}`;
              const storageRef = ref(storage, `${safeSubfolder}/${fileName}`);
              const snapshot = await uploadBytes(storageRef, blob, { contentType: "image/webp" });
              const url = await getDownloadURL(snapshot.ref);
              resolve(url);
            } catch (err) {
              console.error("Storage upload failed, falling back to data URL:", err);
              const dataUrl = canvas.toDataURL("image/webp", 0.8);
              resolve(dataUrl);
            }
          }, "image/webp", 0.8);
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteImage = async (url: string): Promise<void> => {
    if (!url || !url.startsWith("https://firebasestorage.googleapis.com")) {
      return;
    }
    try {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
      console.log("File deleted from storage successfully");
    } catch (err: any) {
      if (err?.code !== "storage/object-not-found") {
        console.error("Error deleting file from storage:", err);
      }
    }
  };

  // 5. Connect and Sync ERP State Arrays with Firestore
  useEffect(() => {
    async function syncFirestoreData() {
      if (currentUser) {
        triggerCloudToast("Syncing database tables with Firestore...");
        try {
          const syncedCustomers = await fetchCollection("customers");
          if (syncedCustomers && syncedCustomers.length > 0) {
            customersLoadedRef.current = syncedCustomers;
            setCustomers(syncedCustomers);
          } else {
            customersLoadedRef.current = initialCustomers;
            setCustomers(initialCustomers);
            await seedFirestore("customers", initialCustomers);
          }

          const syncedEmployees = await fetchCollection("employees");
          if (syncedEmployees && syncedEmployees.length > 0) {
            employeesLoadedRef.current = syncedEmployees;
            setEmployees(syncedEmployees);
          } else {
            employeesLoadedRef.current = initialEmployees;
            setEmployees(initialEmployees);
            await seedFirestore("employees", initialEmployees);
          }

          const syncedOperators = await fetchCollection("operators");
          if (syncedOperators && syncedOperators.length > 0) {
            operatorsLoadedRef.current = syncedOperators;
            setOperators(syncedOperators);
          } else {
            operatorsLoadedRef.current = initialOperators;
            setOperators(initialOperators);
            await seedFirestore("operators", initialOperators);
          }

          const syncedCerts = await fetchCollection("machineCertificates");
          if (syncedCerts && syncedCerts.length > 0) {
            machineCertificatesLoadedRef.current = syncedCerts;
            setMachineCertificates(syncedCerts);
          } else {
            machineCertificatesLoadedRef.current = initialMachineCertificates;
            setMachineCertificates(initialMachineCertificates);
            await seedFirestore(
              "machineCertificates",
              initialMachineCertificates,
            );
          }

          const syncedTraining = await fetchCollection("trainingJobs");
          if (syncedTraining && syncedTraining.length > 0) {
            trainingJobsLoadedRef.current = syncedTraining;
            setTrainingJobs(syncedTraining);
          } else {
            trainingJobsLoadedRef.current = initialTrainingJobs;
            setTrainingJobs(initialTrainingJobs);
            await seedFirestore("trainingJobs", initialTrainingJobs);
          }

          const syncedInspection = await fetchCollection("inspectionJobs");
          if (syncedInspection && syncedInspection.length > 0) {
            inspectionJobsLoadedRef.current = syncedInspection;
            setInspectionJobs(syncedInspection);
          } else {
            inspectionJobsLoadedRef.current = initialInspectionJobs;
            setInspectionJobs(initialInspectionJobs);
            await seedFirestore("inspectionJobs", initialInspectionJobs);
          }

          const syncedReports = await fetchCollection("inspectionReports");
          if (syncedReports && syncedReports.length > 0) {
            inspectionReportsLoadedRef.current = syncedReports;
            setInspectionReports(syncedReports);
          } else {
            inspectionReportsLoadedRef.current = initialInspectionReports;
            setInspectionReports(initialInspectionReports);
            await seedFirestore("inspectionReports", initialInspectionReports);
          }

          const syncedLifting = await fetchCollection("liftingToolCerts");
          if (syncedLifting && syncedLifting.length > 0) {
            liftingToolCertsLoadedRef.current = syncedLifting;
            setLiftingToolCerts(syncedLifting);
          } else {
            liftingToolCertsLoadedRef.current = initialLiftingToolCerts;
            setLiftingToolCerts(initialLiftingToolCerts);
            await seedFirestore("liftingToolCerts", initialLiftingToolCerts);
          }

          const syncedDetails = await fetchCollection("machineDetails");
          if (syncedDetails && syncedDetails.length > 0) {
            machineDetailsLoadedRef.current = syncedDetails;
            setMachineDetails(syncedDetails);
          } else {
            machineDetailsLoadedRef.current = initialMachineDetails;
            setMachineDetails(initialMachineDetails);
            await seedFirestore("machineDetails", initialMachineDetails);
          }

          triggerCloudToast(
            "✓ Real-time database synced with Google Firestore!",
          );
        } catch (error) {
          console.error("Firestore sync error:", error);
          triggerCloudToast(
            "⚠️ Firestore Sync Failed: check Firebase blueprint configuration.",
          );
        }
      }
    }
    syncFirestoreData();
  }, [currentUser]);

  // 6. Automatically save changes to Firestore when states are updated
  useEffect(() => {
    if (currentUser && customersLoadedRef.current !== null) {
      if (JSON.stringify(customers) !== JSON.stringify(customersLoadedRef.current)) {
        customers.forEach((cust) => saveDocument("customers", cust.id, cust));
        customersLoadedRef.current = customers;
      }
    }
  }, [customers, currentUser]);

  useEffect(() => {
    if (currentUser && employeesLoadedRef.current !== null) {
      if (JSON.stringify(employees) !== JSON.stringify(employeesLoadedRef.current)) {
        employees.forEach((emp) => saveDocument("employees", emp.id, emp));
        employeesLoadedRef.current = employees;
      }
    }
  }, [employees, currentUser]);

  useEffect(() => {
    if (currentUser && operatorsLoadedRef.current !== null) {
      if (JSON.stringify(operators) !== JSON.stringify(operatorsLoadedRef.current)) {
        operators.forEach((op) => saveDocument("operators", op.id, op));
        operatorsLoadedRef.current = operators;
      }
    }
  }, [operators, currentUser]);

  useEffect(() => {
    if (currentUser && machineCertificatesLoadedRef.current !== null) {
      if (JSON.stringify(machineCertificates) !== JSON.stringify(machineCertificatesLoadedRef.current)) {
        machineCertificates.forEach((cert) =>
          saveDocument("machineCertificates", cert.id, cert),
        );
        machineCertificatesLoadedRef.current = machineCertificates;
      }
    }
  }, [machineCertificates, currentUser]);

  useEffect(() => {
    if (currentUser && trainingJobsLoadedRef.current !== null) {
      if (JSON.stringify(trainingJobs) !== JSON.stringify(trainingJobsLoadedRef.current)) {
        trainingJobs.forEach((job) => saveDocument("trainingJobs", job.id, job));
        trainingJobsLoadedRef.current = trainingJobs;
      }
    }
  }, [trainingJobs, currentUser]);

  useEffect(() => {
    if (currentUser && inspectionJobsLoadedRef.current !== null) {
      if (JSON.stringify(inspectionJobs) !== JSON.stringify(inspectionJobsLoadedRef.current)) {
        inspectionJobs.forEach((job) =>
          saveDocument("inspectionJobs", job.id, job),
        );
        inspectionJobsLoadedRef.current = inspectionJobs;
      }
    }
  }, [inspectionJobs, currentUser]);

  useEffect(() => {
    if (currentUser && inspectionReportsLoadedRef.current !== null) {
      if (JSON.stringify(inspectionReports) !== JSON.stringify(inspectionReportsLoadedRef.current)) {
        inspectionReports.forEach((rep) =>
          saveDocument("inspectionReports", rep.id, rep),
        );
        inspectionReportsLoadedRef.current = inspectionReports;
      }
    }
  }, [inspectionReports, currentUser]);

  useEffect(() => {
    if (currentUser && liftingToolCertsLoadedRef.current !== null) {
      if (JSON.stringify(liftingToolCerts) !== JSON.stringify(liftingToolCertsLoadedRef.current)) {
        liftingToolCerts.forEach((cert) =>
          saveDocument("liftingToolCerts", cert.id, cert),
        );
        liftingToolCertsLoadedRef.current = liftingToolCerts;
      }
    }
  }, [liftingToolCerts, currentUser]);

  useEffect(() => {
    if (currentUser && machineDetailsLoadedRef.current !== null) {
      if (JSON.stringify(machineDetails) !== JSON.stringify(machineDetailsLoadedRef.current)) {
        machineDetails.forEach((detail) =>
          saveDocument("machineDetails", detail.id, detail),
        );
        machineDetailsLoadedRef.current = machineDetails;
      }
    }
  }, [machineDetails, currentUser]);


  // Role-Based Filtering
  const filteredTrainingJobs = isAdmin ? trainingJobs : trainingJobs.filter(j => 
    j.trainerId === currentEmployee?.id || j.trainerId === currentEmployee?.name || j.trainerId === currentEmployee?.firstName || j.instructor === currentEmployee?.name
  );

  const filteredInspectionJobs = isAdmin ? inspectionJobs : inspectionJobs.filter(j => 
    j.inspectorId === currentEmployee?.id || j.inspectorId === currentEmployee?.name || j.inspectorId === currentEmployee?.firstName || j.inspector === currentEmployee?.name
  );

  const filteredInspectionReports = isAdmin ? inspectionReports : inspectionReports.filter(j => 
    j.trainerId === currentEmployee?.id || j.inspector === currentEmployee?.name || j.inspector === currentEmployee?.firstName || j.inspector === currentEmployee?.id
  );

  const filteredMachineCertificates = isAdmin ? machineCertificates : machineCertificates.filter(j => 
    j.inspectedBy === currentEmployee?.id || j.inspectedBy === currentEmployee?.name || j.inspectedBy === currentEmployee?.firstName
  );

  const filteredLiftingToolCerts = isAdmin ? liftingToolCerts : liftingToolCerts.filter(j => 
    j.inspectedBy === currentEmployee?.id || j.inspectedBy === currentEmployee?.name || j.inspectedBy === currentEmployee?.firstName
  );

  const filteredOperators = isAdmin ? operators : operators.filter(o => 
    o.trainedBy === currentEmployee?.id || o.trainedBy === currentEmployee?.name || o.trainedBy === currentEmployee?.firstName
  );

  // Dynamic state-linked card badges
  const getCardCount = (category: ERPCategory) => {
    switch (category) {
      case ERPCategory.CUSTOMER_DETAILS:
        return customers.length;
      case ERPCategory.EMPLOYEE_DETAILS:
        return employees.length;
      case ERPCategory.TRAINING_JOB_ORDER_CARD:
        return filteredTrainingJobs.length;
      case ERPCategory.INSPECTION_JOB_ORDER_CARD:
        return filteredInspectionJobs.length;
      case ERPCategory.INSPECTION_REPORT:
        return filteredInspectionReports.length;
      case ERPCategory.MACHINE_CERTIFICATES:
        return filteredMachineCertificates.length;
      case ERPCategory.LIFTING_TOOL_CERTIFICATE:
        return filteredLiftingToolCerts.length;
      case ERPCategory.MACHINE_DETAILS:
        return machineDetails.length;
      case ERPCategory.OPERATOR_CARD:
        return filteredOperators.length;
      default:
        return 0;
    }
  };

  // Helper callback for state modification to bump general metrics count
  const incrementCardCount = (targetCat: ERPCategory) => {
    // React state arrays already trigger rebuild. Calculations handle counts dynamically.
  };

  // Predefined cards structural matrix mapping exactly to the screenshot sections and icons
  const sectionsData = [
    {
      section: ERPSection.SETTING,
      title: "SETTING",
      cards: [
        ...(isAdmin ? [{
          category: ERPCategory.USER_MANAGEMENT,
          title: "User Management",
          iconName: "UserCog",
        }] : []),
        {
          category: ERPCategory.CUSTOMER_DETAILS,
          title: "Customer Details",
          iconName: "Building",
        },
        {
          category: ERPCategory.EMPLOYEE_DETAILS,
          title: "Employee Details",
          iconName: "Users",
        },
      ],
    },
    {
      section: ERPSection.JOB_CARDS,
      title: "JOB CARDS",
      cards: [
        {
          category: ERPCategory.TRAINING_JOB_ORDER_CARD,
          title: "Training Job Order Card",
          iconName: "FileText",
        },
        {
          category: ERPCategory.INSPECTION_JOB_ORDER_CARD,
          title: "Inspection Job Order Card",
          iconName: "CheckSquare",
        },
      ],
    },
    {
      section: ERPSection.CHECK_LIST_REPORT,
      title: "CHECK LIST REPORT",
      cards: [
        {
          category: ERPCategory.INSPECTION_REPORT,
          title: "Inspection Report",
          iconName: "ClipboardCheck",
        },
      ],
    },
    {
      section: ERPSection.CERTIFICATES,
      title: "CERTIFICATES",
      cards: [
        {
          category: ERPCategory.MACHINE_CERTIFICATES,
          title: "Machine Certificates",
          iconName: "Shield",
        },
        {
          category: ERPCategory.LIFTING_TOOL_CERTIFICATE,
          title: "Lifting Tool Certificate",
          iconName: "Anchor",
        },
        {
          category: ERPCategory.MACHINE_DETAILS,
          title: "Machine Models",
          iconName: "Award",
        },
      ],
    },
    {
      section: ERPSection.OPERATOR_CARDS,
      title: "OPERATOR CARDS",
      cards: [
        {
          category: ERPCategory.OPERATOR_CARD,
          title: "Operator Card",
          iconName: "Users",
        },
      ],
    },
  ];

  
  // Global Notification Center array (Linked directly to initial alert quantities)
  const notifications = useMemo(() => {
    const notifs: any[] = [];
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const checkExpiry = (dateStr: string | undefined, type: string, id: string, name: string) => {
      if (!dateStr) return;
      
      let expiry: Date;
      // Handle DD-MM-YYYY or DD/MM/YYYY
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3 && parts[2].length === 4) {
          expiry = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        } else {
          expiry = new Date(dateStr);
        }
      } else if (dateStr.includes('/')) {
         const parts = dateStr.split('/');
         if (parts.length === 3 && parts[2].length === 4) {
           expiry = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
         } else {
           expiry = new Date(dateStr);
         }
      } else {
        expiry = new Date(dateStr);
      }
      
      if (isNaN(expiry.getTime())) return;
      
      const notifId = `${type}-${id}`;
      if (dismissedNotifications.includes(notifId)) return;

      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

      if (diffDays < 0) {
        notifs.push({
          id: notifId,
          title: `${type} Expired`,
          text: `${name} expired on ${dateStr}.`,
          type: "high",
        });
      } else if (diffDays <= 30) {
        notifs.push({
          id: notifId,
          title: `${type} Expiring Soon`,
          text: `${name} expires in ${diffDays} days (${dateStr}).`,
          type: "warning",
        });
      }
    };

    machineCertificates.forEach(cert => {
      checkExpiry(cert.expirationDate || cert.expiryDate, "Machine Certificate", cert.id, `${cert.equipmentName || 'Equipment'} (${cert.id})`);
    });

    liftingToolCerts.forEach(cert => {
      checkExpiry(cert.expiryDate, "Lifting Tool Certificate", cert.id, `${cert.toolName || 'Tool'} (${cert.id})`);
    });

    operators.forEach(op => {
      checkExpiry(op.licenseExpiry || op.expiryDate, "Operator Card", op.id, `${op.firstName || ''} ${op.lastName || ''} (${op.id})`);
    });

    return notifs;
  }, [machineCertificates, liftingToolCerts, operators, dismissedNotifications]);


  // Handles sidebar action items triggering modal focus
  const handleNavCategoryClick = (category: ERPCategory) => {
    if (category === ERPCategory.TRAINING_JOB_ORDER_CARD) {
      setCurrentTab("TRAINING");
      setActiveCategory(null);
    } else if (category === ERPCategory.INSPECTION_JOB_ORDER_CARD) {
      setCurrentTab("INSPECTION");
      setActiveCategory(null);
    } else if (category === ERPCategory.INSPECTION_REPORT) {
      setCurrentTab("INSPECTION_REPORTS");
      setActiveCategory(null);
    } else if (category === ERPCategory.OPERATOR_CARD) {
      setCurrentTab("OPERATORS");
      setViewOperatorId(null);
      setActiveCategory(null);
    } else if (category === ERPCategory.MACHINE_CERTIFICATES) {
      setCurrentTab("MACHINE_CERTIFICATES");
      setActiveCategory(null);
    } else if (category === ERPCategory.LIFTING_TOOL_CERTIFICATE) {
      setCurrentTab("LIFTING_TOOL_CERTIFICATE");
      setActiveCategory(null);
    } else if (category === ERPCategory.MACHINE_DETAILS) {
      setCurrentTab("MACHINE_DETAILS");
      setActiveCategory(null);
    } else {
      setCurrentTab("DASHBOARD");
      setActiveCategory(category);
    }
    setMobileSidebarOpen(false);
  };

  const handleSignOut = () => {
    handleSignOutGoogle();
  };

  // Extract verifyId from URL to support public QR code scans
  const getVerifyIdFromUrl = (): string | null => {
    if (typeof window === "undefined") return null;
    const searchParams = new URLSearchParams(window.location.search);
    const verifySearch = searchParams.get("verify") || searchParams.get("id");
    if (verifySearch) return verifySearch;
    
    const pathParts = window.location.pathname.split("/");
    const verifyIndex = pathParts.findIndex(part => part === "verify");
    if (verifyIndex !== -1 && pathParts[verifyIndex + 1]) {
      return pathParts[verifyIndex + 1];
    }
    return null;
  };

  const verifyId = getVerifyIdFromUrl();

  if (verifyId) {
    return (
      <PublicVerificationView
        verifyId={verifyId}
        onBackToLogin={() => {
          if (typeof window !== "undefined") {
            window.history.pushState({}, "", window.location.origin);
            window.location.reload();
          }
        }}
      />
    );
  }

  if (!currentUser) {
    return (
      <LoginPage
        onSuccess={(user) => {
          // Handled securely via the unified initSecureAuth observer
        }}
        triggerCloudToast={triggerCloudToast}
        employees={employees}
        customers={customers}
        domainMode={domainMode}
        setDomainMode={setDomainMode}
        isDevEnvironment={isDevEnvironment}
        externalError={authError}
        onClearExternalError={() => setAuthError(null)}
      />
    );
  }

  if (domainMode === "CLIENT") {
    if (!currentClient) {
      // Logged in on CLIENT domain but not a registered Customer!
      // Trigger signout and clear user session
      signOutUser().then(() => {
        setCurrentUser(null);
        setAuthError("Access Denied: This login gateway is exclusively for MEV Clients.");
      }).catch(console.error);

      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center border border-slate-100/10">
            <h1 className="text-2xl font-bold text-rose-600 mb-2">Access Denied</h1>
            <p className="text-slate-600 text-sm mb-6">
              This login gateway is exclusively for MEV Clients.
            </p>
            <button
              onClick={async () => {
                await signOutUser();
                setCurrentUser(null);
              }}
              className="bg-[#683EFF] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#522CD9] transition-all"
            >
              Back to Login
            </button>
          </div>
        </div>
      );
    }

    return (
      <ClientPortalDashboard
        currentClient={currentClient}
        machineCertificates={machineCertificates}
        liftingToolCertificates={liftingToolCerts}
        operatorCards={operators}
        onLogout={async () => {
          await signOutUser();
          triggerCloudToast("Signed out from Client Portal");
          setAuthError(null);
          setCurrentUser(null);
        }}
        isAdmin={isAdmin}
        allClients={customers.filter(c => c.hasAccount)}
        onSelectClientForPreview={(clientId) => setAdminPreviewClientId(clientId)}
      />
    );
  }

  // ERP Domain Authorization Guard
  if (domainMode === "ERP" && !isAdmin && !currentEmployee) {
    // Logged in on ERP domain but not an authorized Employee!
    // Trigger signout and clear user session
    signOutUser().then(() => {
      setCurrentUser(null);
      setAuthError("Access Denied: This login gateway is for MEV ERP staff only.");
    }).catch(console.error);

    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center border border-slate-100/10">
          <h1 className="text-2xl font-bold text-rose-600 mb-2">Access Denied</h1>
          <p className="text-slate-600 text-sm mb-6">
            This login gateway is for MEV ERP staff only.
          </p>
          <button
            onClick={async () => {
              await signOutUser();
              setCurrentUser(null);
            }}
            className="bg-[#683EFF] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#522CD9] transition-all"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-[#FAF9FC] font-sans antialiased text-slate-700"
      id="main-frame-root"
    >
      {/* 1. SIDEBAR NAVIGATION */}
      {/* Desktop Sidebar */}
      <aside
        id="Main Sidebar"
        className={`hidden border-r border-[#ECECF3] bg-white h-full transition-all duration-300 md:flex flex-col justify-between ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo brand block exact matching screenshot layout */}
          <div className="flex items-center justify-between p-6 border-b border-[#FAF9FC]">
            <div className="flex items-center space-x-3 overflow-hidden">
              {dashboardLogoUrl ? (
                <div
                  className={`flex items-center justify-center shrink-0 ${sidebarCollapsed ? "w-12 h-12" : "h-12 w-[160px]"}`}
                >
                  <img
                    src={dashboardLogoUrl}
                    alt="MEV Logo"
                    className={`w-full h-full object-contain ${sidebarCollapsed ? "object-center" : "object-left"}`}
                  />
                </div>
              ) : (
                sidebarCollapsed ? (
                  <div className="flex items-center justify-center shrink-0 w-12 h-12">
                    <img 
                      src="https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0459155438.firebasestorage.app/o/Branding%2FFavicon.png?alt=media&token=c8b110bc-316b-439b-84d0-b1f25816b7a1" 
                      alt="MEV Favicon" 
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-start shrink-0 h-12 w-[160px]">
                    <img 
                      src="https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0459155438.firebasestorage.app/o/Branding%2FHorizonal%20MEV%20logo.png?alt=media&token=6fd9c05f-5c66-4c31-94b5-06ff4cb6c980" 
                      alt="MEV Logo" 
                      className="w-full h-full object-contain object-left"
                    />
                  </div>
                )
              )}
            </div>

            {/* Gray X Close Button toggles sidebar expand / collapse state */}
            <button
              id="sidebar-toggle-cross"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="rounded p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {sidebarCollapsed ? (
                <Icons.ArrowRight className="w-4 h-4" />
              ) : (
                <Icons.X className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Nav groups */}
          <nav className="p-4 space-y-6 flex-1">
            {/* Active Core Dashboard Category */}
            <div>
              <button
                id="nav-to-dashboard"
                onClick={() => {
                  setCurrentTab("DASHBOARD");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  currentTab === "DASHBOARD" && !activeCategory
                    ? "bg-[#F0EBFF] text-[#683EFF]"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <Icons.LayoutGrid className="w-5 h-5" />
                {!sidebarCollapsed && <span>DASHBOARD</span>}
              </button>
            </div>

            {/* OPERATIONS SECTION */}
            <div className="space-y-1.5">
              {!sidebarCollapsed && (
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none">
                  OPERATIONS
                </p>
              )}
              <div className="space-y-0.5">
                <button
                  id="nav-to-portfolio"
                  onClick={() => {
                    setCurrentTab("PORTFOLIO");
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentTab === "PORTFOLIO"
                      ? "bg-[#F0EBFF] text-[#683EFF] font-semibold"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <Icons.Briefcase className="w-5 h-5" />
                  {!sidebarCollapsed && <span>Customer Portfolio</span>}
                </button>

                <button
                  id="nav-to-training-jobs"
                  onClick={() =>
                    handleNavCategoryClick(ERPCategory.TRAINING_JOB_ORDER_CARD)
                  }
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentTab === "TRAINING"
                      ? "bg-[#F0EBFF] text-[#683EFF] font-semibold"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <Icons.FileText className="w-5 h-5" />
                  {!sidebarCollapsed && <span>Training Jobs</span>}
                </button>

                <button
                  id="nav-to-inspection-jobs"
                  onClick={() =>
                    handleNavCategoryClick(
                      ERPCategory.INSPECTION_JOB_ORDER_CARD,
                    )
                  }
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentTab === "INSPECTION"
                      ? "bg-[#F0EBFF] text-[#683EFF] font-semibold"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <Icons.ClipboardCheck className="w-5 h-5" />
                  {!sidebarCollapsed && <span>Inspection Jobs</span>}
                </button>

                <button
                  id="nav-to-inspection-reports"
                  onClick={() =>
                    handleNavCategoryClick(ERPCategory.INSPECTION_REPORT)
                  }
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentTab === "INSPECTION_REPORTS"
                      ? "bg-[#F0EBFF] text-[#683EFF] font-semibold"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <Icons.FileSpreadsheet className="w-5 h-5" />
                  {!sidebarCollapsed && <span>Inspection Reports</span>}
                </button>
              </div>
            </div>

            {/* TECHNICAL ASSETS SECTION */}
            <div className="space-y-1.5">
              {!sidebarCollapsed && (
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none">
                  TECHNICAL ASSETS
                </p>
              )}
              <div className="space-y-0.5">
                <button
                  id="nav-to-machine-details"
                  onClick={() =>
                    handleNavCategoryClick(ERPCategory.MACHINE_DETAILS)
                  }
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentTab === "MACHINE_DETAILS"
                      ? "bg-[#F0EBFF] text-[#683EFF] font-semibold"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <Icons.Settings className="w-5 h-5" />
                  {!sidebarCollapsed && <span>Machine Models</span>}
                </button>

                <button
                  id="nav-to-machine-certs"
                  onClick={() =>
                    handleNavCategoryClick(ERPCategory.MACHINE_CERTIFICATES)
                  }
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentTab === "MACHINE_CERTIFICATES"
                      ? "bg-[#F0EBFF] text-[#683EFF] font-semibold"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <Icons.ShieldAlert className="w-5 h-5" />
                  {!sidebarCollapsed && <span>Machine Certificate</span>}
                </button>

                <button
                  id="nav-to-lifting-tool-certs"
                  onClick={() =>
                    handleNavCategoryClick(ERPCategory.LIFTING_TOOL_CERTIFICATE)
                  }
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all"
                >
                  <Icons.Anchor className="w-5 h-5" />
                  {!sidebarCollapsed && <span>Lifting Tool Certificate</span>}
                </button>

                <button
                  id="nav-to-operator-directory"
                  onClick={() =>
                    handleNavCategoryClick(ERPCategory.OPERATOR_CARD)
                  }
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentTab === "OPERATORS"
                      ? "bg-[#F0EBFF] text-[#683EFF] font-semibold"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <Icons.Contact className="w-5 h-5" />
                  {!sidebarCollapsed && <span>Operator Directory</span>}
                </button>
              </div>
            </div>

            {/* ADMINISTRATION SECTION */}
            {isAdmin && (
              <div className="space-y-1.5 mt-4">
                {!sidebarCollapsed && (
                  <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none">
                    ADMINISTRATION
                  </p>
                )}
                <div className="space-y-0.5">
                  <button
                    id="nav-to-user-management"
                    onClick={() => {
                      setCurrentTab("USER_MANAGEMENT");
                      setActiveCategory(null);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentTab === "USER_MANAGEMENT"
                        ? "bg-[#F0EBFF] text-[#683EFF] font-semibold"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <Icons.UserCog className="w-5 h-5" />
                    {!sidebarCollapsed && <span>User Management</span>}
                  </button>
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* Profile and Log Out exact match bottom block */}
        <div className="p-4 border-t border-[#FAF9FC] space-y-3">
          <div className="flex items-center space-x-3 px-3 py-2 rounded-xl bg-slate-55/60 border border-slate-50">
            {/* Soft purple avatar with initial F */}
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#F0EBFF] text-[#683EFF] font-extrabold shadow-sm text-sm shrink-0">
              {currentUser
                ? (currentUser.displayName ||
                    currentUser.email ||
                    "G")[0].toUpperCase()
                : "G"}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800 truncate">
                  {currentUser
                    ? currentUser.displayName || "Google User"
                    : "Guest User"}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {currentUser ? currentUser.email : "Not Connected"}
                </p>
              </div>
            )}
          </div>

          {currentUser ? (
            <button
              id="sidebar-sign-out"
              onClick={handleSignOut}
              className={`w-full flex items-center space-x-3 px-3 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 rounded-lg transition-all`}
            >
              <Icons.LogOut className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>SIGN OUT</span>}
            </button>
          ) : (
            <button
              id="sidebar-sign-in"
              onClick={handleSignIn}
              className={`w-full flex items-center space-x-3 px-3 py-2 text-xs font-bold text-[#683EFF] hover:bg-[#F0EBFF] rounded-lg transition-all`}
            >
              <Icons.LogIn className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>SIGN IN WITH GOOGLE</span>}
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Drawer Sidebar Navigation */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 md:hidden flex"
            id="mobile-sidebar-drawer"
          >
            {/* Backdrop slide screen overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute inset-0 bg-slate-900"
            />

            {/* Drawer Body container */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="relative w-72 bg-white h-full flex flex-col p-6 shadow-2xl overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  {dashboardLogoUrl ? (
                    <div className="h-10 w-40 flex items-center justify-start">
                      <img
                        src={dashboardLogoUrl}
                        alt="MEV Logo"
                        className="w-full h-full object-contain object-left"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-start shrink-0 h-10 w-[140px]">
                      <img 
                        src="https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0459155438.firebasestorage.app/o/Branding%2FMEV%20Logo.png?alt=media&token=4556a2dc-9296-419c-9694-2b5519e1e7b8" 
                        alt="MEV Logo" 
                        className="w-full h-full object-contain object-left"
                      />
                    </div>
                  )}
                </div>
                <button
                  id="mobile-sidebar-close"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="rounded p-1 hover:bg-slate-50 text-slate-450"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile navbar listing links */}
              <nav className="space-y-6 flex-1 text-slate-700">
                <button
                  onClick={() => {
                    setCurrentTab("DASHBOARD");
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    currentTab === "DASHBOARD" && !activeCategory
                      ? "bg-[#F0EBFF] text-[#683EFF]"
                      : "text-slate-500"
                  }`}
                >
                  <Icons.LayoutGrid className="w-5 h-5" />
                  <span>DASHBOARD</span>
                </button>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider">
                    OPERATIONS
                  </p>
                  <button
                    onClick={() => {
                      setCurrentTab("PORTFOLIO");
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium ${
                      currentTab === "PORTFOLIO"
                        ? "bg-[#F0EBFF] text-[#683EFF] font-semibold"
                        : "text-slate-500"
                    }`}
                  >
                    <Icons.Briefcase className="w-5 h-5" />
                    <span>Customer Portfolio</span>
                  </button>
                  <button
                    onClick={() =>
                      handleNavCategoryClick(
                        ERPCategory.TRAINING_JOB_ORDER_CARD,
                      )
                    }
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium ${
                      currentTab === "TRAINING"
                        ? "bg-[#F0EBFF] text-[#683EFF] font-semibold"
                        : "text-slate-500"
                    }`}
                  >
                    <Icons.FileText className="w-5 h-5" />
                    <span>Training Jobs</span>
                  </button>
                  <button
                    onClick={() =>
                      handleNavCategoryClick(
                        ERPCategory.INSPECTION_JOB_ORDER_CARD,
                      )
                    }
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium ${
                      currentTab === "INSPECTION"
                        ? "bg-[#F0EBFF] text-[#683EFF] font-semibold"
                        : "text-slate-500"
                    }`}
                  >
                    <Icons.ClipboardCheck className="w-5 h-5" />
                    <span>Inspection Jobs</span>
                  </button>
                  <button
                    onClick={() =>
                      handleNavCategoryClick(ERPCategory.INSPECTION_REPORT)
                    }
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium ${
                      currentTab === "INSPECTION_REPORTS"
                        ? "bg-[#F0EBFF] text-[#683EFF] font-semibold"
                        : "text-slate-500"
                    }`}
                  >
                    <Icons.FileSpreadsheet className="w-5 h-5" />
                    <span>Inspection Reports</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider">
                    TECHNICAL ASSETS
                  </p>
                  <button
                    onClick={() =>
                      handleNavCategoryClick(ERPCategory.MACHINE_DETAILS)
                    }
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500"
                  >
                    <Icons.Settings className="w-5 h-5" />
                    <span>Machine Models</span>
                  </button>
                  <button
                    onClick={() =>
                      handleNavCategoryClick(ERPCategory.MACHINE_CERTIFICATES)
                    }
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500"
                  >
                    <Icons.ShieldAlert className="w-5 h-5" />
                    <span>Machine Certificate</span>
                  </button>
                  <button
                    onClick={() =>
                      handleNavCategoryClick(
                        ERPCategory.LIFTING_TOOL_CERTIFICATE,
                      )
                    }
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500"
                  >
                    <Icons.Anchor className="w-5 h-5" />
                    <span>Lifting Tool Certificate</span>
                  </button>
                  <button
                    onClick={() =>
                      handleNavCategoryClick(ERPCategory.OPERATOR_CARD)
                    }
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500"
                  >
                    <Icons.Contact className="w-5 h-5" />
                    <span>Operator Directory</span>
                  </button>
                </div>

                {isAdmin && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider">
                      ADMINISTRATION
                    </p>
                    <button
                      onClick={() => {
                        setCurrentTab("USER_MANAGEMENT");
                        setActiveCategory(null);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium ${
                        currentTab === "USER_MANAGEMENT"
                          ? "bg-[#F0EBFF] text-[#683EFF] font-semibold"
                          : "text-slate-500"
                      }`}
                    >
                      <Icons.UserCog className="w-5 h-5" />
                      <span>User Management</span>
                    </button>
                  </div>
                )}
              </nav>

              <div className="pt-6 border-t border-slate-100 mt-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#F0EBFF] text-[#683EFF] font-bold">
                    {currentUser
                      ? (currentUser.displayName ||
                          currentUser.email ||
                          "G")[0].toUpperCase()
                      : "G"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {currentUser
                        ? currentUser.displayName || "Google User"
                        : "Guest User"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {currentUser ? currentUser.email : "Not Connected"}
                    </p>
                  </div>
                </div>
                {currentUser ? (
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center space-x-2 rounded-lg bg-rose-50 py-2.5 text-xs font-bold text-rose-600"
                  >
                    <Icons.LogOut className="w-4 h-4" />
                    <span>SIGN OUT</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSignIn}
                    className="w-full flex items-center justify-center space-x-2 rounded-lg bg-[#F0EBFF] py-2.5 text-xs font-bold text-[#683EFF]"
                  >
                    <Icons.LogIn className="w-4 h-4" />
                    <span>SIGN IN WITH GOOGLE</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. MAIN COATED WORKSPACE FRAME */}
      <main
        className="flex-1 flex flex-col h-full bg-[#FAF9FC] relative overflow-hidden"
        id="main-panel-content"
      >
        {/* Global Toolbar Header */}
        <header className="z-10 flex items-center justify-between bg-white/70 backdrop-blur border-b border-[#ECECF3] px-6 py-4 md:px-8">
          <div className="flex items-center space-x-4">
            {/* Hamburger for mobile responsive */}
            <button
              id="mobile-hamburger-btn"
              onClick={() => setMobileSidebarOpen(true)}
              className="rounded-lg p-2 hover:bg-slate-50 md:hidden text-slate-500"
            >
              <Icons.Menu className="w-6 h-6" />
            </button>

            {/* Navigation Location breadcrumb indicators */}
            <div className="hidden sm:flex items-center space-x-2 text-xs font-medium text-slate-400 select-none">
              <span>Middle East VIM ERP</span>
              <Icons.ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="font-bold text-[#683EFF] uppercase">
                {currentTab} {activeCategory ? `> ${activeCategory}` : ""}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3.5">
            {/* Real-time UTC clock ticker */}
            <div className="hidden lg:flex items-center space-x-1.5 rounded-full bg-slate-50 border border-slate-100 px-3.5 py-1 text-[11px] font-mono text-slate-500 font-semibold select-none">
              <Icons.Clock className="w-3.5 h-3.5 text-[#683EFF] animate-pulse" />
              <span>GULF-STANDARD SECURE</span>
            </div>

            {/* Notifications Center Bell with badge matching visual "4" */}
            <div className="relative">
              <button
                id="notifications-bell-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-full p-2.5 bg-white border border-slate-100 hover:bg-slate-50 hover:shadow-sm text-slate-400 hover:text-[#683EFF] transition-all"
              >
                <Icons.Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#683EFF] text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notification Popover Panel drop list */}
              <AnimatePresence>
                {showNotifications && (
                  <>
                    {/* Popover backdrop closer */}
                    <div
                      className="fixed inset-0 z-[55]"
                      onClick={() => setShowNotifications(false)}
                      id="notif-popover-underlay"
                    />

                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 z-[60] w-80 sm:w-96 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl text-slate-700"
                      id="notifications-popover-panel"
                    >
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 select-none">
                        <h4 className="font-display font-bold text-sm text-slate-800 flex items-center">
                          <Icons.ShieldAlert className="w-4 h-4 text-[#683EFF] mr-1.5" />
                          <span>Gulf Operations Notifications</span>
                        </h4>
                        <span className="text-[10px] font-semibold bg-[#F0EBFF] text-[#683EFF] px-2 py-0.5 rounded-full">
                          {notifications.length} Alarms Alert
                        </span>
                      </div>

                      <div className="space-y-2.5 max-h-[320px] overflow-y-auto">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className="p-3 rounded-xl border border-slate-50 bg-slate-50/40 hover:bg-slate-100 transition-colors relative group"
                          >
                            <div className="flex items-start justify-between">
                              <h5 className="text-xs font-bold text-slate-800 pr-4">
                                {notif.title}
                              </h5>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-2 h-2 rounded-full mt-1 ${
                                    notif.type === "high"
                                      ? "bg-red-500 animate-ping"
                                      : notif.type === "warning"
                                        ? "bg-amber-400"
                                        : "bg-emerald-500"
                                  }`}
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDismissedNotifications(prev => [...prev, notif.id]);
                                  }}
                                  className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                  title="Dismiss notification"
                                >
                                  <Icons.X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                              {notif.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* 3. CORE ROUTER PAGE SPACE */}
        <div
          className="flex-1 overflow-y-auto p-6 md:p-8"
          id="router-scroll-container"
        >
          <AnimatePresence mode="wait">
            {/* PORTFOLIO TAB ROUTE */}
            {currentTab === "EMPLOYEE_DETAILS" && (
              <motion.div
                key="employeeDetails"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="h-full flex flex-col"
              >
                <EmployeeDetailsPortfolioView
                  employees={employees}
                  onEmployeesChange={setEmployees}
                  onUploadImage={handleUploadImage}
                />
              </motion.div>
            )}

            {currentTab === "PORTFOLIO" && (
              <motion.div
                key="portfolio"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.18 }}
              >
                <CustomerPortfolioView
                  customers={customers}
                  onCustomersChange={setCustomers}
                  onUploadImage={handleUploadImage}
                />
              </motion.div>
            )}

            {currentTab === "USER_MANAGEMENT" && (
              <motion.div
                key="userManagement"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.18 }}
              >
                <UserManagementView
                  employees={employees}
                  onEmployeesChange={setEmployees}
                  customers={customers}
                  onCustomersChange={setCustomers}
                  currentUser={currentUser}
                />
              </motion.div>
            )}

            {/* TRAINING JOBS PORTFOLIO ROUTE */}
            {currentTab === "TRAINING" && (
              <motion.div
                key="training"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.18 }}
              >
                <TrainingJobsPortfolioView
                  jobs={filteredTrainingJobs}
                  customers={customers}
                  employees={employees}
                  onJobsChange={setTrainingJobs}
                />
              </motion.div>
            )}

            {/* INSPECTION JOBS PORTFOLIO ROUTE */}
            {currentTab === "INSPECTION" && (
              <motion.div
                key="inspection"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.18 }}
              >
                <InspectionJobsPortfolioView
                  jobs={filteredInspectionJobs}
                  onJobsChange={setInspectionJobs}
                  reports={filteredInspectionReports}
                  onReportsChange={setInspectionReports}
                  customers={customers}
                  employees={employees}
                />
              </motion.div>
            )}

            {/* INSPECTION REPORTS PORTFOLIO ROUTE */}
            {currentTab === "INSPECTION_REPORTS" && (
              <motion.div
                key="inspection-reports"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.18 }}
              >
                <InspectionReportsPortfolioView
                  reports={filteredInspectionReports}
                  customers={customers}
                  onReportsChange={setInspectionReports}
                  inspectionJobs={filteredInspectionJobs}
                />
              </motion.div>
            )}

            {/* LIFTING TOOL CERTIFICATES PORTFOLIO ROUTE */}
            {currentTab === "LIFTING_TOOL_CERTIFICATE" && (
              <motion.div
                key="lifting-tool-certificates"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.18 }}
              >
                <LiftingToolCertificatesPortfolioView
                  certificates={filteredLiftingToolCerts}
                  onCertificatesChange={setLiftingToolCerts}
                  inspectionReports={filteredInspectionReports}
                  employees={employees}
                  customers={customers}
                  allCertificateIds={[...liftingToolCerts.map(c => c.id), ...machineCertificates.map(c => c.id)]}
                />
              </motion.div>
            )}

            {/* MACHINE CERTIFICATES PORTFOLIO ROUTE */}
            {currentTab === "MACHINE_CERTIFICATES" && (
              <motion.div
                key="machine-certificates"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.18 }}
              >
                <MachineCertificatesPortfolioView
                  certificates={filteredMachineCertificates}
                  onCertificatesChange={setMachineCertificates}
                  inspectionReports={filteredInspectionReports}
                  machineDetails={machineDetails}
                  onUploadImage={handleUploadImage}
                  employees={employees}
                  customers={customers}
                  allCertificateIds={[...liftingToolCerts.map(c => c.id), ...machineCertificates.map(c => c.id)]}
                />
              </motion.div>
            )}

            {/* MACHINE DETAILS PORTFOLIO ROUTE */}
            {currentTab === "MACHINE_DETAILS" && (
              <motion.div
                key="machine-details"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.18 }}
              >
                <MachineDetailsPortfolioView
                  machines={machineDetails}
                  onMachinesChange={setMachineDetails}
                />
              </motion.div>
            )}

            {/* OPERATOR DIRECTORY PORTFOLIO ROUTE */}
            {currentTab === "OPERATORS" && (
              <motion.div
                key="operators"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.18 }}
              >
                {viewOperatorId ? (
                  <OperatorDetailView
                    employees={employees}
                    customers={customers}
                    operator={operators.find((o) => o.id === viewOperatorId)!}
                    onBack={() => setViewOperatorId(null)}
                    onUpdate={(updated) =>
                      setOperators((prev) =>
                        prev.map((o) => (o.id === updated.id ? updated : o)),
                      )
                    }
                    onDelete={(id) => {
                      setOperators((prev) => prev.filter((o) => o.id !== id));
                      setViewOperatorId(null);
                    }}
                    onUploadImage={handleUploadImage}
                    onDeleteImage={handleDeleteImage}
                  />
                ) : (
                  <OperatorDirectoryView
                    employees={employees}
                    customers={customers}
                    operators={filteredOperators}
                    onOperatorsChange={setOperators}
                    onViewOperator={(id) => setViewOperatorId(id)}
                    onUploadImage={handleUploadImage}
                    onDeleteImage={handleDeleteImage}
                  />
                )}
              </motion.div>
            )}

            {/* MAIN DASHBOARD MATRIX TAB ROUTE */}
            {currentTab === "DASHBOARD" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.18 }}
                className="space-y-8"
              >
                {/* Header title */}
                <div className="select-none">
                  <h2
                    className="font-display text-4xl font-bold text-[#0E1B2D] tracking-tight"
                    id="main-portal-title"
                  >
                    Middle East VIM ERP
                  </h2>
                </div>

                {/* Grid matrix map */}
                <div className="space-y-6">
                  {sectionsData.map((sectionNode) => (
                    <div
                      key={sectionNode.section}
                      className="space-y-3"
                      id={`section-block-${sectionNode.title.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {/* Section Heading with the exact vertical Indigo bar indicator */}
                      <div className="flex items-center space-x-2 py-1 select-none">
                        <div className="w-1.5 h-4 bg-[#683EFF]/90 rounded-full" />
                        <h3 className="font-display text-xs font-semibold tracking-widest text-[#683EFF]">
                          {sectionNode.title}
                        </h3>
                      </div>

                      {/* Cards Grid layout mapping exactly columns as evaluated */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        {sectionNode.cards.map((card) => {
                          const badgeVal = getCardCount(card.category);

                          return (
                            <div
                              key={card.category}
                              id={`card-trigger-${card.category.toLowerCase().replace(/\s+/g, "-")}`}
                              onClick={() => {
                                if (
                                  card.category === ERPCategory.USER_MANAGEMENT
                                ) {
                                  setCurrentTab("USER_MANAGEMENT");
                                } else if (
                                  card.category === ERPCategory.EMPLOYEE_DETAILS
                                ) {
                                  setCurrentTab("EMPLOYEE_DETAILS");
                                } else if (
                                  card.category ===
                                  ERPCategory.CUSTOMER_DETAILS
                                ) {
                                  setCurrentTab("PORTFOLIO");
                                } else if (
                                  card.category ===
                                  ERPCategory.INSPECTION_REPORT
                                ) {
                                  setCurrentTab("INSPECTION_REPORTS");
                                } else if (
                                  card.category ===
                                  ERPCategory.TRAINING_JOB_ORDER_CARD
                                ) {
                                  setCurrentTab("TRAINING");
                                } else if (
                                  card.category ===
                                  ERPCategory.INSPECTION_JOB_ORDER_CARD
                                ) {
                                  setCurrentTab("INSPECTION");
                                  setActiveCategory(null);
                                } else if (
                                  card.category === ERPCategory.OPERATOR_CARD
                                ) {
                                  setCurrentTab("OPERATORS");
                                } else if (
                                  card.category ===
                                  ERPCategory.MACHINE_CERTIFICATES
                                ) {
                                  setCurrentTab("MACHINE_CERTIFICATES");
                                } else if (
                                  card.category ===
                                  ERPCategory.MACHINE_DETAILS
                                ) {
                                  setCurrentTab("MACHINE_DETAILS");
                                } else {
                                  setActiveCategory(card.category);
                                }
                              }}
                              className="group flex items-center justify-between bg-white rounded-xl border border-[#ECECF3]/85 p-5 shadow-sm hover:shadow-md hover:border-[#683EFF]/25 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                            >
                              <div className="flex items-center space-x-4">
                                {/* Faint purple square bounding the colored icon */}
                                <div className="p-3 bg-[#F0EBFF] text-[#683EFF] rounded-xl group-hover:bg-[#683EFF] group-hover:text-white transition-all duration-200">
                                  <LucideIcon
                                    name={card.iconName}
                                    className="w-5 h-5"
                                  />
                                </div>
                                <span className="text-sm font-semibold text-[#3F3F3F] tracking-tight group-hover:text-[#0E1B2D] transition-colors font-sans">
                                  {card.title}
                                </span>
                              </div>

                              <div className="flex items-center space-x-2">
                                {/* Faint up-right arrow matching photo */}
                                <Icons.ArrowUpRight className="w-4 h-4 text-slate-350 opacity-0 group-hover:opacity-100 group-hover:text-[#683EFF]/70 transition-all duration-200 mr-2" />

                                {/* Indigo solid count badge */}
                                <span className="inline-block bg-[#683EFF] text-white text-xs font-sans font-semibold px-3 py-1 rounded-lg shadow-sm group-hover:bg-[#522CD9] group-hover:scale-105 transition-all duration-150">
                                  {badgeVal}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* 4. MODAL DETAILED FOCUS METRIC VIEWS */}
      <DetailModal
        category={activeCategory}
        onClose={() => setActiveCategory(null)}
        state={{
          customers,
          setCustomers,
          employees,
          setEmployees,
          trainingJobs,
          setTrainingJobs,
          inspectionJobs,
          setInspectionJobs,
          inspectionReports,
          setInspectionReports,
          machineCertificates,
          setMachineCertificates,
          liftingToolCerts,
          setLiftingToolCerts,
          machineDetails,
          setMachineDetails,
          operators,
          setOperators,
          incrementCardCount,
        }}
      />
    </div>
  );
}
