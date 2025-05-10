import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { DASHBOARD_URL } from '$lib/authentication';

export const load: LayoutServerLoad = async ({ locals }) => {
	const user = locals.user;

	// If user is authenticated, redirect them away from auth pages
	if (user) {
		throw redirect(302, DASHBOARD_URL);
	}

	return {
		user
	};
};
