const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

// ============================================================
// HELPER: Extract real client IP behind Cloudflare
// ============================================================
function getClientIp(context) {
  const headers = context.rawRequest.headers || {};
  return headers['cf-connecting-ip'] || 
         (headers['x-forwarded-for'] || '').split(',')[0].trim() || 
         context.rawRequest.connection?.remoteAddress || 
         'unknown';
}

// ============================================================
// CREATE EMPLOYEE (Admin only) — GOOGLE AUTH
// Custom claim: ONLY { role: 'employee' }
// All assignment data lives in Firestore users/{uid}
// ============================================================
exports.createEmployeeUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }
  
  const adminDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  const { email, employeeId, name, department, assignedCompanies = [], assignedCustomerIds = [], assignedCustomerEmails = [] } = data;

  // Validate
  if (!email || !employeeId) {
    throw new functions.https.HttpsError('invalid-argument', 'Email and employeeId required');
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
    createdBy: context.auth.uid,
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
    performedBy: context.auth.uid,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ipAddress: getClientIp(context)
  });

  return { uid: userRecord.uid, success: true };
});

// ============================================================
// CREATE CLIENT (Admin only) — EMAIL/PASSWORD
// Custom claim: ONLY { role: 'client' }
// ============================================================
exports.createClientUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }
  
  const adminDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  const { email, password, companyName, customerId } = data;

  if (!email || !password || password.length < 8) {
    throw new functions.https.HttpsError('invalid-argument', 'Password must be 8+ characters');
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
    createdBy: context.auth.uid,
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
    performedBy: context.auth.uid,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ipAddress: getClientIp(context)
  });

  return { uid: userRecord.uid, success: true };
});

// ============================================================
// REVOKE / DISABLE USER (Admin only)
// ============================================================
exports.revokeUserAccess = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }
  
  const adminDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  const { uid, userType, recordId } = data;

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
    disabledBy: context.auth.uid
  });

  await db.collection('adminLogs').add({
    action: 'revoke_user',
    targetUid: uid,
    performedBy: context.auth.uid,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ipAddress: getClientIp(context)
  });

  return { success: true };
});

// ============================================================
// RESET CLIENT PASSWORD (Admin only)
// ============================================================
exports.resetClientPassword = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }
  
  const adminDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  const { uid, newPassword } = data;
  if (!newPassword || newPassword.length < 8) {
    throw new functions.https.HttpsError('invalid-argument', 'Password must be 8+ characters');
  }

  await auth.updateUser(uid, { password: newPassword });

  await db.collection('adminLogs').add({
    action: 'password_reset',
    targetUid: uid,
    performedBy: context.auth.uid,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ipAddress: getClientIp(context)
  });

  return { success: true };
});

// ============================================================
// VERIFY CERTIFICATE (Public — no auth required)
// This is the ONLY way unauthenticated users can verify certs.
// Rate limited by IP. Returns stripped public fields only.
// ============================================================
exports.verifyCertificate = functions.https.onCall(async (data, context) => {
  const { certId, certType } = data;
  
  if (!certId || !certType) {
    throw new functions.https.HttpsError('invalid-argument', 'certId and certType required');
  }

  const ip = getClientIp(context);
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  // Rate limit: 10 checks per 5 minutes per IP
  const recentChecks = await db.collection('verificationLogs')
    .where('ipAddress', '==', ip)
    .where('timestamp', '>', admin.firestore.Timestamp.fromDate(fiveMinutesAgo))
    .count()
    .get();
  
  if (recentChecks.data().count > 10) {
    throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Try again later.');
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
      throw new functions.https.HttpsError('invalid-argument', 'Invalid certificate type');
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
exports.beforeUserCreated = functions.auth.user().beforeCreate((user, context) => {
  const signInMethod = user.providerData[0]?.providerId || 'password';
  
  // Block anonymous auth completely
  if (signInMethod === 'anonymous') {
    throw new functions.auth.HttpsError('permission-denied', 'Anonymous authentication is disabled');
  }

  // For email/password: only allow if admin pre-created the user
  // (We validate this on first sign-in by checking the users collection)
  if (signInMethod === 'password') {
    return;
  }

  // For Google sign-in: allow but mark as pending if not pre-registered
  if (signInMethod === 'google.com') {
    return;
  }
});

// ============================================================
// ON USER CREATED — VALIDATE PRE-REGISTRATION
// ============================================================
exports.onUserSignedIn = functions.auth.user().onCreate(async (user) => {
  const userDoc = await db.collection('users').doc(user.uid).get();
  
  if (!userDoc.exists) {
    // Unauthorized user — create pending record, set minimal claims
    await db.collection('pendingUsers').doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      provider: user.providerData[0]?.providerId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending_approval'
    });
    
    // Set pending role so Firestore rules deny all access
    await auth.setCustomUserClaims(user.uid, { role: 'pending' });
  }
});
