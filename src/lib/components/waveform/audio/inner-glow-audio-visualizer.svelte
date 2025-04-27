<script lang="ts">
	import AudioFrequency from './audio-frequency.svelte';
	import Glow from '$lib/components/waveform/core/glow.svelte';
	import InnerGlowVisualizer from '$lib/components/waveform/core/inner-glow-visualizer.svelte';

	export let stream: MediaStream;
	export let glow: number | undefined = 10;
	export let detail: number | undefined = 50;
</script>

<AudioFrequency {stream} let:getValues>
	<Glow {glow}>
		<InnerGlowVisualizer
			values={getValues(detail || 50)}
			startHue={190}
			endHue={220}
			{...$$restProps}
		/>
	</Glow>
</AudioFrequency>
