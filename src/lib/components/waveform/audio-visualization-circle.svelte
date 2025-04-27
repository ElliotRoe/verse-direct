<script lang="ts">
	import DeformedCircleAudioVisualizer from './audio/deformed-circle-audio-visualizer.svelte';
	import CircleCirclesAudioVisualizer from './audio/circle-circles-audio-visualizer.svelte';
	import AnimatedDeformedCircleAudioVisualizer from './audio/animated-deformed-circle-audio-visualizer.svelte';

	export let isSessionActive = false;
	export let innerStream: MediaStream | null = null;
	export let outerStream: MediaStream | null = null;
	export let variant: 'accent' | 'primary' = 'primary';
	export let size = 400;

	// Updated hues to focus on green spectrum
	let innerStartHue = 120; // Green base
	let innerEndHue = 140; // Slightly bluer green
	let outerStartHue = 100; // Yellower green
	let outerEndHue = 160; // More blue-green
</script>

<div
	class="relative mx-auto shrink-0 overflow-hidden rounded-full bg-black shadow-[0_0_30px_rgba(34,197,94,0.3)]"
	style="width: {size}px; height: {size}px;"
>
	<div
		class="bg-gradient-radial absolute inset-0 from-transparent via-transparent to-green-900/30"
	></div>
	{#if !isSessionActive}
		<div class="absolute inset-0">
			<AnimatedDeformedCircleAudioVisualizer startHue={innerStartHue} endHue={innerEndHue} />
		</div>
	{:else}
		{#if innerStream}
			<div class="absolute inset-0">
				<DeformedCircleAudioVisualizer
					stream={innerStream}
					startHue={innerStartHue}
					endHue={innerEndHue}
				/>
			</div>
		{/if}
		{#if outerStream}
			<div class="absolute inset-0">
				<CircleCirclesAudioVisualizer
					stream={outerStream}
					startHue={outerStartHue}
					endHue={outerEndHue}
				/>
			</div>
		{/if}
	{/if}
</div>
