<script lang="ts">
	import AudioFrequency from './audio-frequency.svelte';
	import Glow from '$lib/components/waveform/core/glow.svelte';
	import DeformedCircleVisualizer from '$lib/components/waveform/core/deformed-circle-visualizer.svelte';

	export let stream: MediaStream;
	export let glow: number | undefined = 20;
	export let detail: number | undefined = 20;
	export let startHue: number = 43;
	export let endHue: number = 34;
</script>

<AudioFrequency {stream} let:getValues>
	<Glow {glow}>
		<DeformedCircleVisualizer
			values={getValues(detail || 20)}
			{startHue}
			{endHue}
			{...$$restProps}
		/>
	</Glow>
</AudioFrequency>
