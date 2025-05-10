import {
	createUserWithEmailAndPassword,
	GoogleAuthProvider,
	signInWithEmailAndPassword,
	signInWithPopup,
	updateProfile,
	signInAnonymously as signInAnonymouslyFirebase
} from 'firebase/auth';
import { auth } from '$lib/firebase';
import { CurrentUserState } from 'svelte-firebase-state';

const sendTokenToServer = async (idToken: string, anonymous: boolean) => {
	await fetch(AUTH_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ idToken, anonymous })
	});
};

const sendNewUserData = async (
	userId: string,
	displayName: string,
	email: string,
	idToken: string
) => {
	console.log('Sending new user data to server');
	const response = await fetch('/api/newuser', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${idToken}`
		},
		body: JSON.stringify({
			userId,
			displayName,
			email
		})
	});

	if (!response.ok) {
		console.error('Failed to create initial user data:', await response.text());
	}
};

export const signUp = async (
	email: string,
	password: string,
	firstName: string,
	lastName: string
) => {
	try {
		const userCredential = await createUserWithEmailAndPassword(auth, email, password);
		const user = userCredential.user;
		await updateProfile(user, {
			displayName: `${firstName} ${lastName}`
		});

		const idToken = await user.getIdToken();
		await sendTokenToServer(idToken, false);
		await sendNewUserData(user.uid, `${firstName} ${lastName}`, email, idToken);

		return user;
	} catch (error) {
		return error;
	}
};

export const signIn = async (email: string, password: string) => {
	try {
		const userCredential = await signInWithEmailAndPassword(auth, email, password);
		const user = userCredential.user;

		const idToken = await user.getIdToken();
		await sendTokenToServer(idToken, false);

		return user;
	} catch (error) {
		return error;
	}
};

export async function signInWithGoogle() {
	const provider = new GoogleAuthProvider();
	provider.setCustomParameters({
		prompt: 'select_account'
	});

	const userCredential = await signInWithPopup(auth, provider);
	const user = userCredential.user;

	const idToken = await user.getIdToken();
	await sendTokenToServer(idToken, false);

	return user;
}

export async function signUpWithGoogle() {
	const user = await signInWithGoogle();
	const idToken = await user.getIdToken();
	await sendNewUserData(user.uid, user.displayName ?? '', user.email ?? '', idToken);
	return user;
}

const deleteTokenFromServer = async () => {
	await fetch(AUTH_URL, { method: 'DELETE' });
};

export const signOut = async () => {
	try {
		await deleteTokenFromServer();
		await auth.signOut();
	} catch (error) {
		return error;
	}
};

// refresh token
export const refreshToken = async () => {
	const user = auth.currentUser;
	const idToken = await user?.getIdToken();
	if (idToken) {
		await sendTokenToServer(idToken, false);
	} else {
		throw new Error('No ID token found');
	}
};

export const signInAnonymously = async () => {
	const userCredential = await signInAnonymouslyFirebase(auth);
	const user = userCredential.user;

	const idToken = await user.getIdToken();
	await sendTokenToServer(idToken, true);

	return user;
};

export const isAnonymous = () => {
	const user = auth.currentUser;
	return user?.isAnonymous ?? false;
};

/**
 * Checks if a user is anonymous using the decoded ID token claims
 * This is more reliable than isAnonymous() as it works on both client and server
 * @param decodedToken The decoded ID token from locals.user
 */
export const isAnonymousFromToken = (decodedToken: { anonymous?: boolean } | null) => {
	return decodedToken?.anonymous ?? false;
};

export const firebaseUser = new CurrentUserState({ auth });

export const UNAUTH_REDIRECT_PATH = '/auth/signin';
export const AUTH_URL = '/api/signin';
export const DASHBOARD_URL = '/app/dashboard';
