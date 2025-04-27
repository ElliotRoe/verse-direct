<script lang="ts">
	import AudioFrequency from './audio-frequency.svelte';

	import CircleCirclesVisualizer from '$lib/components/waveform/core/circle-circles-visualizer.svelte';
	import Glow from '$lib/components/waveform/core/glow.svelte';

	export let stream: MediaStream;
	export let glow: number | undefined = 20;
	export let detail: number | undefined = 20;
	export let startHue: number = 220;
	export let endHue: number = 257;
</script>

<AudioFrequency {stream} let:getValues>
	<Glow {glow}>
		<CircleCirclesVisualizer
			values={getValues(detail || 50)}
			{startHue}
			{endHue}
			{...$$restProps}
		/>
	</Glow>
</AudioFrequency>
