<script lang="ts">
	import DeformedCircleAudioVisualizer from './audio/deformed-circle-audio-visualizer.svelte';
	import CircleCirclesAudioVisualizer from './audio/circle-circles-audio-visualizer.svelte';
	import AnimatedDeformedCircleAudioVisualizer from './audio/animated-deformed-circle-audio-visualizer.svelte';

	export let isSessionActive = false;
	export let innerStream: MediaStream | null = null;
	export let outerStream: MediaStream | null = null;
	export let variant: 'accent' | 'primary' = 'primary';
	export let size = 400;

	let innerStartHue = variant === 'accent' ? 43 : 257;
	let innerEndHue = variant === 'accent' ? 34 : 250;
	let outerStartHue = variant === 'accent' ? 30 : 35;
	let outerEndHue = variant === 'accent' ? 25 : 30;
</script>

<div
	class="relative mx-auto shrink-0 overflow-hidden rounded-full bg-yellow-200 shadow-lg"
	style="width: {size}px; height: {size}px;"
>
	<div
		class="bg-gradient-radial absolute inset-0 from-transparent via-transparent to-green-900"
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
