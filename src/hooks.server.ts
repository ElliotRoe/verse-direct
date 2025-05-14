import { sequence } from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';
import { adminAuth } from '$lib/server/admin';
import type { Handle } from '@sveltejs/kit';

Sentry.init({
	dsn: 'https://eb4caf7eca29ac1372ca5356abf367e5@o4509029094064128.ingest.us.sentry.io/4509319801208832',
	tracesSampleRate: 1
});

export const handle = sequence(Sentry.sentryHandle(), (async ({ event, resolve }) => {
	const sessionCookie = event.cookies.get('__session');

	if (!sessionCookie) {
		event.locals.user = null;
		return resolve(event);
	}

	try {
		const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
		event.locals.user = decodedClaims;
	} catch (error) {
		console.error(error);
		event.locals.user = null;
	}

	return resolve(event);
}) satisfies Handle);
export const handleError = Sentry.handleErrorWithSentry();
