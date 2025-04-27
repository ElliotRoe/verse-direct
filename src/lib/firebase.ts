import { getApps, initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import {
	PUBLIC_FIREBASE_API_KEY,
	PUBLIC_FIREBASE_MEASUREMENT_ID,
	PUBLIC_FIREBASE_APP_ID,
	PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	PUBLIC_FIREBASE_AUTH_DOMAIN,
	PUBLIC_FIREBASE_PROJECT_ID,
	PUBLIC_FIREBASE_STORAGE_BUCKET
} from '$env/static/public';

const firebaseConfig = {
	apiKey: PUBLIC_FIREBASE_API_KEY,
	authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: PUBLIC_FIREBASE_APP_ID,
	measurementId: PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Only initialize if there are no Firebase apps already initialized
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Only initialize analytics if supported and in production
export const analytics = async () => {
	try {
		const supported = await isSupported();

		if (supported && import.meta.env.PROD) {
			// Initialize analytics with configuration options
			const analyticsInstance = getAnalytics(app);
			// Disable automatic page view tracking
			if (window.gtag) {
				await window.gtag('config', PUBLIC_FIREBASE_MEASUREMENT_ID, {
					send_page_view: false
				});
			}
			return analyticsInstance;
		}
		return null;
	} catch (error) {
		console.error('Error initializing analytics:', error);
		return null;
	}
};

export const db = getFirestore(app);

export const auth = getAuth();

export const storage = getStorage(app);
