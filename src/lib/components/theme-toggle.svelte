<script lang="ts">
	import { browser } from '$app/environment';
	import { Button } from '$lib/components/ui/button';
	import { Moon, Sun } from 'lucide-svelte';

	let theme = $state<'light' | 'dark'>('light');

	$effect(() => {
		if (browser) {
			// Check if dark mode is enabled
			if (document.documentElement.classList.contains('dark')) {
				theme = 'dark';
			} else {
				theme = 'light';
			}
		}
	});

	function toggleTheme() {
		if (browser) {
			if (theme === 'light') {
				document.documentElement.classList.add('dark');
				theme = 'dark';
			} else {
				document.documentElement.classList.remove('dark');
				theme = 'light';
			}
		}
	}
</script>

<Button variant="ghost" size="icon" on:click={toggleTheme}>
	{#if theme === 'light'}
		<Moon class="h-5 w-5" />
	{:else}
		<Sun class="h-5 w-5" />
	{/if}
	<span class="sr-only">Toggle theme</span>
</Button>
