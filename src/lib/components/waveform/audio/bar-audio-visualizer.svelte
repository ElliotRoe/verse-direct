<script lang="ts">
	import AudioFrequency from './audio-frequency.svelte';
	import BarVisualizer from '../core/bar-visualizer.svelte';
	import Glow from '../core/glow.svelte';

	export let stream: MediaStream | null = null;
	export let glow: number | undefined = 3;
	export let detail: number | undefined = 20;
</script>

{#if stream}
	<AudioFrequency {stream} let:getValues>
		<BarVisualizer values={getValues(detail || 20)} {...$$restProps} />
	</AudioFrequency>
{/if}
