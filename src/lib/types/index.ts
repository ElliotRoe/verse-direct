export const AUTH_DEFAULT_PATH = '/welcome';

export interface Locals {
	user: {
		uid: string;
		email?: string;
		displayName?: string;
	} | null;
}
