<script lang="ts">
	import '../app.css';
	let { children } = $props();
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
