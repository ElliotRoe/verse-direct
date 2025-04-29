// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	interface Window {
		gtag?: (...args: any[]) => void;
	}
	namespace App {
		// interface Error {}
		interface Locals {
			user: DecodedIdToken | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
