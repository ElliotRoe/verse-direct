<script lang="ts">
	let { children } = $props();
</script>

<div class="mobile-container">
	{@render children()}
</div>

<style>
	.mobile-container {
		@apply flex h-full w-full flex-col items-center justify-center sm:w-[500px];
	}
</style>
