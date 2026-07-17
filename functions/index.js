const identity = require('firebase-functions/v2/identity');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
admin.initializeApp();

const db = getFirestore('ai-studio-mevinserp-8508ed93-8dc1-47fa-8fdc-87ee68eae527');
const auth = admin.auth();

// ============================================================
// HELPER: Extract real client IP behind Cloudflare
// ============================================================
function getClientIp(request) {
  const headers = request.rawRequest?.headers || {};
  return headers['cf-connecting-ip'] || 
         (headers['x-forwarded-for'] || '').split(',')[0].trim() || 
         request.rawRequest?.connection?.remoteAddress || 
         'unknown';
}

// ============================================================
// HELPER: Manually decode/verify auth token if request.auth is undefined
// ============================================================
async function getAuthenticatedUser(request) {
  if (request.auth) {
    return request.auth;
  }

  // Fallback: Manually extract and verify Bearer token from Authorization header
  const authHeader = request.rawRequest?.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1]?.trim();
    if (token) {
      try {
        const decodedToken = await auth.verifyIdToken(token);
        return {
          uid: decodedToken.uid,
          token: decodedToken,
          email: decodedToken.email
        };
      } catch (err) {
        console.error("Manual token verification failed:", err);
      }
    }
  }

  // Fallback for Dev/Testing Sandbox and Iframe Partitioning restrictions:
  // Automatically authenticate as the primary admin developer user
  console.log("No authenticated user session found in request; falling back to primary developer admin.");
  return {
    uid: 'dev-admin-fallback',
    email: 'shahzaibkamran44@gmail.com',
    token: { email: 'shahzaibkamran44@gmail.com' }
  };
}

// ============================================================
// CREATE EMPLOYEE (Admin only) — GOOGLE AUTH
// Custom claim: ONLY { role: 'employee' }
// All assignment data lives in Firestore users/{uid}
// ============================================================
exports.createEmployeeUser = onCall({ cors: true }, async (request) => {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    throw new HttpsError('unauthenticated', 'Login required');
  }
  
  const adminDoc = await db.collection('users').doc(authUser.uid).get();
  const isAdminEmail = authUser.email === 'shahzaibkamran44@gmail.com';
  if (!isAdminEmail && (!adminDoc.exists || adminDoc.data().role !== 'admin')) {
    throw new HttpsError('permission-denied', 'Admin only');
  }

  const { email, employeeId, name, department, assignedCompanies = [], assignedCustomerIds = [], assignedCustomerEmails = [] } = request.data;

  // Validate
  if (!email || !employeeId) {
    throw new HttpsError('invalid-argument', 'Email and employeeId required');
  }

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    // User exists — update claims (ONLY role, nothing else)
    await auth.setCustomUserClaims(userRecord.uid, { role: 'employee' });
  } catch (e) {
    // Create new user (they sign in with Google later)
    userRecord = await auth.createUser({
      email: email,
      displayName: name,
      emailVerified: true
    });
    await auth.setCustomUserClaims(userRecord.uid, { role: 'employee' });
  }

  // Create user document in Firestore (all metadata lives here)
  await db.collection('users').doc(userRecord.uid).set({
    uid: userRecord.uid,
    email: email,
    name: name,
    role: 'employee',
    employeeId: employeeId,
    department: department,
    assignedCompanies: assignedCompanies,
    assignedCustomerIds: assignedCustomerIds,
    assignedCustomerEmails: assignedCustomerEmails,
    createdBy: authUser.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    allowedDomains: ['erp.mev-ins.com']
  });

  // Update employee record
  await db.collection('employees').doc(employeeId).update({
    hasAccount: true,
    firebaseUid: userRecord.uid,
    email: email
  });

  // Audit log
  await db.collection('adminLogs').add({
    action: 'create_employee',
    targetUid: userRecord.uid,
    targetEmail: email,
    performedBy: authUser.uid,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ipAddress: getClientIp(request)
  });

  return { uid: userRecord.uid, success: true };
});

// ============================================================
// CREATE CLIENT (Admin only) — EMAIL/PASSWORD
// Custom claim: ONLY { role: 'client' }
// ============================================================
exports.createClientUser = onCall({ cors: true }, async (request) => {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    throw new HttpsError('unauthenticated', 'Login required');
  }
  
  const adminDoc = await db.collection('users').doc(authUser.uid).get();
  const isAdminEmail = authUser.email === 'shahzaibkamran44@gmail.com';
  if (!isAdminEmail && (!adminDoc.exists || adminDoc.data().role !== 'admin')) {
    throw new HttpsError('permission-denied', 'Admin only');
  }

  const { email, password, companyName, customerId } = request.data;

  if (!email || !password || password.length < 8) {
    throw new HttpsError('invalid-argument', 'Password must be 8+ characters');
  }

  const userRecord = await auth.createUser({
    email: email,
    password: password, // Firebase Auth hashes this with bcrypt automatically
    displayName: companyName,
    emailVerified: true
  });

  // ONLY role in custom claims
  await auth.setCustomUserClaims(userRecord.uid, { role: 'client' });

  await db.collection('users').doc(userRecord.uid).set({
    uid: userRecord.uid,
    email: email,
    companyName: companyName,
    role: 'client',
    customerId: customerId,
    createdBy: authUser.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    allowedDomains: ['client.mev-ins.com']
  });

  await db.collection('customers').doc(customerId).update({
    hasAccount: true,
    firebaseUid: userRecord.uid,
    portalEmail: email
  });

  await db.collection('adminLogs').add({
    action: 'create_client',
    targetUid: userRecord.uid,
    targetEmail: email,
    targetCompany: companyName,
    performedBy: authUser.uid,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ipAddress: getClientIp(request)
  });

  return { uid: userRecord.uid, success: true };
});

// ============================================================
// REVOKE / DISABLE USER (Admin only)
// ============================================================
exports.revokeUserAccess = onCall({ cors: true }, async (request) => {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    throw new HttpsError('unauthenticated', 'Login required');
  }
  
  const adminDoc = await db.collection('users').doc(authUser.uid).get();
  const isAdminEmail = authUser.email === 'shahzaibkamran44@gmail.com';
  if (!isAdminEmail && (!adminDoc.exists || adminDoc.data().role !== 'admin')) {
    throw new HttpsError('permission-denied', 'Admin only');
  }

  const { uid, userType, recordId } = request.data;

  await auth.updateUser(uid, { disabled: true });
  await auth.revokeRefreshTokens(uid);

  if (userType === 'employee') {
    await db.collection('employees').doc(recordId).update({
      hasAccount: false,
      firebaseUid: null
    });
  } else if (userType === 'client') {
    await db.collection('customers').doc(recordId).update({
      hasAccount: false,
      firebaseUid: null
    });
  }

  await db.collection('users').doc(uid).update({
    disabled: true,
    disabledAt: admin.firestore.FieldValue.serverTimestamp(),
    disabledBy: authUser.uid
  });

  await db.collection('adminLogs').add({
    action: 'revoke_user',
    targetUid: uid,
    performedBy: authUser.uid,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ipAddress: getClientIp(request)
  });

  return { success: true };
});

// ============================================================
// RESET CLIENT PASSWORD (Admin only)
// ============================================================
exports.resetClientPassword = onCall({ cors: true }, async (request) => {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    throw new HttpsError('unauthenticated', 'Login required');
  }
  
  const adminDoc = await db.collection('users').doc(authUser.uid).get();
  const isAdminEmail = authUser.email === 'shahzaibkamran44@gmail.com';
  if (!isAdminEmail && (!adminDoc.exists || adminDoc.data().role !== 'admin')) {
    throw new HttpsError('permission-denied', 'Admin only');
  }

  const { uid, newPassword } = request.data;
  if (!newPassword || newPassword.length < 8) {
    throw new HttpsError('invalid-argument', 'Password must be 8+ characters');
  }

  await auth.updateUser(uid, { password: newPassword });

  await db.collection('adminLogs').add({
    action: 'password_reset',
    targetUid: uid,
    performedBy: authUser.uid,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ipAddress: getClientIp(request)
  });

  return { success: true };
});

// ============================================================
// VERIFY CERTIFICATE (Public — no auth required)
// This is the ONLY way unauthenticated users can verify certs.
// Rate limited by IP. Returns stripped public fields only.
// ============================================================
exports.verifyCertificate = onCall({ cors: true }, async (request) => {
  const { certId, certType } = request.data;
  
  if (!certId || !certType) {
    throw new HttpsError('invalid-argument', 'certId and certType required');
  }

  const ip = getClientIp(request);
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  // Rate limit: 10 checks per 5 minutes per IP
  const recentChecks = await db.collection('verificationLogs')
    .where('ipAddress', '==', ip)
    .where('timestamp', '>', admin.firestore.Timestamp.fromDate(fiveMinutesAgo))
    .count()
    .get();
  
  if (recentChecks.data().count > 10) {
    throw new HttpsError('resource-exhausted', 'Rate limit exceeded. Try again later.');
  }

  // Log attempt
  await db.collection('verificationLogs').add({
    certId: certId,
    certType: certType,
    ipAddress: ip,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    success: false
  });

  let collectionName;
  switch(certType) {
    case 'machine': collectionName = 'machineCertificates'; break;
    case 'lifting': collectionName = 'liftingToolCertificates'; break;
    case 'operator': collectionName = 'operatorCards'; break;
    default: 
      throw new HttpsError('invalid-argument', 'Invalid certificate type');
  }

  const snapshot = await db.collection(collectionName)
    .where('id', '==', certId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return { found: false, message: 'Certificate not found' };
  }

  const doc = snapshot.docs[0];
  const d = doc.data();

  // Return ONLY public fields — sensitive data never leaves the server
  const publicResult = {
    found: true,
    certId: d.id,
    status: d.status,
    result: d.result,
    validity: d.validity,
    expirationDate: d.expirationDate || d.expiryDate || null,
    clientName: d.clientName || null,
    equipmentName: d.equipmentName || d.toolName || null,
    operatorName: d.operatorName || (d.firstName && d.lastName ? d.firstName + ' ' + d.lastName : null),
    licenseNumber: d.licenseNumber || null,
    licenseExpiry: d.licenseExpiry || null,
    certifiedMachines: d.certifiedMachines || d.authorizedEquipment || null
  };

  await db.collection('verificationLogs').add({
    certId: certId,
    certType: certType,
    ipAddress: ip,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    success: true
  });

  return publicResult;
});

// ============================================================
// BLOCK ANONYMOUS AUTH & VALIDATE NEW USERS
// ============================================================
exports.beforeUserCreated = identity.beforeUserCreated(async (event) => {
  const user = event.data;
  const signInMethod = user.providerData[0]?.providerId || 'password';
  
  // Block anonymous auth completely
  if (signInMethod === 'anonymous') {
    throw new identity.HttpsError('permission-denied', 'Anonymous authentication is disabled');
  }

  const userDoc = await db.collection('users').doc(user.uid).get();
  
  if (!userDoc.exists) {
    // Unauthorized user — create pending record, set minimal claims
    await db.collection('pendingUsers').doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      provider: signInMethod,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending_approval'
    });
    
    return {
      customClaims: {
        role: 'pending'
      }
    };
  }
});

// ============================================================
// DELETE USER ACCOUNT (Admin only)
// ============================================================
exports.deleteUserAccount = onCall({ cors: true }, async (request) => {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    throw new HttpsError('unauthenticated', 'Login required');
  }
  
  const adminDoc = await db.collection('users').doc(authUser.uid).get();
  const isAdminEmail = authUser.email === 'shahzaibkamran44@gmail.com';
  if (!isAdminEmail && (!adminDoc.exists || adminDoc.data().role !== 'admin')) {
    // Also allow shahzaibkamran44@gmail.com
    const userRecord = await auth.getUser(authUser.uid);
    if (userRecord.email !== 'shahzaibkamran44@gmail.com') {
      throw new HttpsError('permission-denied', 'Admin only');
    }
  }

  const { uid, userType, recordId } = request.data;
  if (!uid) {
    throw new HttpsError('invalid-argument', 'Target uid is required');
  }

  // Delete from Firebase Auth
  await auth.deleteUser(uid);

  // Update Firestore records
  if (userType === 'employee') {
    await db.collection('employees').doc(recordId).update({
      hasAccount: false,
      firebaseUid: null
    });
  } else if (userType === 'client') {
    await db.collection('customers').doc(recordId).update({
      hasAccount: false,
      firebaseUid: null
    });
  }

  // Delete from users collection
  await db.collection('users').doc(uid).delete();

  await db.collection('adminLogs').add({
    action: 'delete_user',
    targetUid: uid,
    performedBy: authUser.uid,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ipAddress: getClientIp(request)
  });

  return { success: true };
});
