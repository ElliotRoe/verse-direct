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

<main class="h-screen w-full bg-black">
	{@render children()}
</main>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&display=swap');
	@import url('https://fonts.googleapis.com/css2?family=Metal+Mania&display=swap');

	:global(.font-caveat) {
		font-family: 'Caveat', cursive;
	}

	:global(.font-metal) {
		font-family: 'Metal Mania', cursive;
	}
</style>
