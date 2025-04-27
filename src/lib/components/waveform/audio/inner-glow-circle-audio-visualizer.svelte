<script lang="ts">
	import AudioFrequency from './audio-frequency.svelte';
	import Glow from '$lib/components/waveform/core/glow.svelte';
	import InnerGlowCircleVisualizer from '$lib/components/waveform/core/inner-glow-circle-visualizer.svelte';

	export let stream: MediaStream;
	export let glow: number | undefined = 10;
	export let detail: number | undefined = 50;
</script>

<AudioFrequency {stream} let:getValues>
	<Glow {glow}>
		<InnerGlowCircleVisualizer
			values={getValues(detail || 50)}
			startHue={280}
			endHue={420}
			sideVisible={25}
			deformation={40}
			blur={10}
			{...$$restProps}
		/>
	</Glow>
</AudioFrequency>
