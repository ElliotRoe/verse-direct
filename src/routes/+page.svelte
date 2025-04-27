<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
	import { signInAnonymously, firebaseUser } from '$lib/authentication';

	async function startJourney() {
		try {
			goto('/welcome'); // Navigate to the creed page first
		} catch (error) {
			console.error('Anonymous sign-in failed:', error);
			// Handle error display to user
		}
	}
</script>

<div class="h-screen w-full bg-black">
	<div class="flex h-full flex-col items-center justify-center gap-12">
		<img src="/logo.png" alt="App Logo" class="h-72 w-auto" />
		<div class="relative flex flex-col items-center justify-center">
			<div
				class="flex flex-col items-center justify-center gap-4 font-metal text-8xl tracking-widest text-white"
			>
				<h1 class="z-10">BRICK</h1>
				<h1 class="z-10">BRICK</h1>
			</div>
			<img src="/cross.png" alt="X" class="absolute h-24 w-auto" />
		</div>
		<Button variant="ghost" class="text-white" onclick={startJourney}>Start Building →</Button>
	</div>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Metal+Mania&display=swap');
</style>
