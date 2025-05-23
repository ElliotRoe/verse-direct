<script lang="ts">
	import '../app.css';
	let { children } = $props();
	import { analytics } from '$lib/firebase';

	import { logEvent, type Analytics } from 'firebase/analytics';
	import { page } from '$app/state';
	import { browser } from '$app/environment';

	let analyticsInstance = $state<Analytics | null>(null);

	// Initialize analytics on mount
	$effect(() => {
		if (browser) {
			analytics().then((instance) => {
				analyticsInstance = instance;
			});
		}
	});

	// Track page changes
	$effect(() => {
		if (browser && analyticsInstance && page.url.pathname) {
			logEvent(analyticsInstance, 'page_view', {
				page_path: page.url.pathname,
				page_title: document.title,
				page_location: window.location.href
			});
		}
	});
</script>

<main
	class="flex h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-yellow-100 to-orange-200"
>
	{@render children()}
</main>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400..900&display=swap');

	:global(.font-cinzel) {
		font-family: 'Cinzel', serif;
	}
</style>
