<script lang="ts">
	import Glow from '$lib/components/waveform/core/glow.svelte';
	import DeformedCircleVisualizer from '$lib/components/waveform/core/deformed-circle-visualizer.svelte';

	let { startHue = 43, endHue = 34, glow = 20, detail = 20, ...rest } = $props();
	let values = $state(new Float32Array([0.5, 1, 0.5, 0, 0, 0, 0, 0]));

	$effect.root(() => {
		let phase = 0;
		const interval = setInterval(() => {
			// Create a wave-like pattern that moves around the circle
			values = new Float32Array(values.length).map((_, i) => {
				// Vary the base and wave amplitudes over time
				const baseAmplitude = 0.5 + 0.2 * Math.sin(phase * 0.3); // Slowly varies between 0.3 and 0.7
				const waveAmplitude = 0.3 + 0.1 * Math.sin(phase * 0.5); // Slowly varies between 0.2 and 0.4
				const frequency = (2 * Math.PI) / values.length;
				return baseAmplitude + waveAmplitude * Math.sin(frequency * i + phase);
			});
			phase += 0.025; // Increment phase to make the wave move
		}, 50);

		return () => clearInterval(interval);
	});
</script>

<Glow {glow}>
	<DeformedCircleVisualizer {values} {startHue} {endHue} {...rest} />
</Glow>
