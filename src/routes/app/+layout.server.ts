import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { UNAUTH_REDIRECT_PATH } from '$lib/authentication';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	// If user is not authenticated, redirect them to auth page
	if (!user) {
		// throw redirect(302, UNAUTH_REDIRECT_PATH);
	}

	return {
		user
	};
};
