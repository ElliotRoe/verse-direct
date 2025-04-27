import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import admin from 'firebase-admin';
import { FIREBASE_SERVICE_ACCOUNT_JSON } from '$env/static/private';
import { PUBLIC_FIREBASE_STORAGE_BUCKET } from '$env/static/public';

if (!FIREBASE_SERVICE_ACCOUNT_JSON) {
	throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not set');
}

if (!PUBLIC_FIREBASE_STORAGE_BUCKET) {
	throw new Error('PUBLIC_FIREBASE_STORAGE_BUCKET is not set');
}
// Parse json into object
const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON);

// Only initialize if no apps exist
if (admin.apps.length === 0) {
	try {
		admin.initializeApp({
			credential: admin.credential.cert(serviceAccount),
			storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET
		});
	} catch (err) {
		console.error('Firebase Admin Error: ', err);
	}
}

export const adminAuth = getAuth();
export const adminDB = getFirestore();
export const adminStorage = getStorage().bucket();
