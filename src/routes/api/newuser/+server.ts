import { json } from '@sveltejs/kit';
import { adminDB } from '$lib/server/admin';
import type { RequestHandler } from './$types';
import { templateDefaultPrompt } from '$lib/server/defaultPropmt';
import { mariaMessages, mariaPrompt } from '$lib/server/mariaContext';
import { MODAL_PROMPT_ENDPOINT } from '$env/static/private';

// Types
interface NewUserRequest {
	userId: string;
	displayName: string;
	email: string;
}

// Validation
function validateRequest(data: unknown): asserts data is NewUserRequest {
	if (!data || typeof data !== 'object') {
		throw new Error('Invalid request data');
	}

	const { userId, displayName, email } = data as NewUserRequest;
	if (!userId || !displayName || !email) {
		throw new Error('Missing required fields');
	}
}

// Service layer
class UserService {
	private static getPromptText(email: string, displayName: string): string {
		if (email === 'mariairwin09@gmail.com' || email === 'elliotbroe@gmail.com') {
			return mariaPrompt;
		}
		return templateDefaultPrompt(displayName);
	}

	private static async pingIngestionUrl(userId: string, displayName: string): Promise<void> {
		if (!MODAL_PROMPT_ENDPOINT) {
			console.error('MODAL_PROMPT_ENDPOINT environment variable is not set');
			return;
		}

		try {
			const response = await fetch(MODAL_PROMPT_ENDPOINT, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					user_id: userId,
					display_name: displayName
				})
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('Failed to ping ingestion URL:', errorText);
				// Don't throw the error since this is a non-critical operation
			}
		} catch (error) {
			console.error('Error pinging ingestion URL:', error);
			// Don't throw the error since this is a non-critical operation
		}
	}

	static async createUserData(userId: string, displayName: string, email: string) {
		console.log('Creating user data for', userId, displayName, email);
		const timestampUtcIso = new Date().toISOString();
		const promptsRef = adminDB.collection('users').doc(userId).collection('generated_prompts');
		const conversationsRef = adminDB.collection('users').doc(userId).collection('conversations');

		const prompt_text = this.getPromptText(email, displayName);

		// Create prompt document
		const newDocRef = await promptsRef.add({
			prompt_text,
			generation_timestamp: timestampUtcIso
		});

		// Create conversation if needed
		if (email === 'mariairwin09@gmail.com' || email === 'elliotbroe@gmail.com') {
			await conversationsRef.add({
				last_updated: timestampUtcIso,
				messages: mariaMessages
			});
		}

		// Ping ingestion URL
		await this.pingIngestionUrl(userId, displayName);

		return newDocRef.id;
	}
}

// Route handler
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		validateRequest(data);

		const { userId, displayName, email } = data;
		const promptId = await UserService.createUserData(userId, displayName, email);

		return json({
			success: true,
			message: `Successfully saved new prompt (${promptId}) for user ${userId}`,
			promptId
		});
	} catch (error) {
		console.error('Error saving new prompt:', error);
		const status =
			error instanceof Error && error.message === 'Missing required fields' ? 400 : 500;
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to save prompt' },
			{ status }
		);
	}
};
