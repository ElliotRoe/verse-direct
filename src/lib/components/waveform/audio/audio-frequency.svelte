<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { raf, normalizeArray } from '$lib/utils';

	// Voice frequency ranges (in Hz)
	const voiceFrequencies = [20, 60, 250, 500, 2000, 4000, 6000, 20000];
	const voiceFrequencyLabels = [
		'Sub-bass',
		'Bass',
		'Low-mids',
		'Mids',
		'High-mids',
		'Presence',
		'Brilliance'
	];

	export let stream: MediaStream;
	export let minDecibels: number = -100;
	export let maxDecibels: number = -30;

	let values: Float32Array = new Float32Array([0]);
	let frequencies = voiceFrequencies;
	let labels = voiceFrequencyLabels;
	let analyser: AnalyserNode;
	let audioContext: AudioContext;

	onMount(() => {
		audioContext = new AudioContext();
		analyser = audioContext.createAnalyser();
		const source = audioContext.createMediaStreamSource(stream);

		analyser.minDecibels = minDecibels;
		analyser.maxDecibels = maxDecibels;
		analyser.smoothingTimeConstant = 0.8;
		analyser.fftSize = 2048;

		source.connect(analyser);
	});

	onDestroy(() => {
		if (audioContext) {
			audioContext.close();
		}
	});

	// Update frequency values every render frame
	raf(() => {
		if (!analyser) {
			values = new Float32Array([0]);
			return;
		}

		const fftSize = analyser.frequencyBinCount;
		const fftResult = new Float32Array(fftSize);
		analyser.getFloatFrequencyData(fftResult);

		const sampleRate = audioContext.sampleRate;
		const nyquistFrequency = sampleRate / 2;
		const frequencyStep = (1 / fftSize) * nyquistFrequency;

		// Aggregate frequencies into voice ranges
		const aggregateOutput = Array(voiceFrequencies.length - 1).fill(minDecibels);

		for (let i = 0; i < fftResult.length; i++) {
			const frequency = i * frequencyStep;
			const amplitude = fftResult[i];
			for (let n = voiceFrequencies.length - 1; n >= 0; n--) {
				if (frequency > voiceFrequencies[n]) {
					aggregateOutput[n] = Math.max(aggregateOutput[n], amplitude);
					break;
				}
			}
		}

		// Normalize to {0, 1} range
		const normalizedOutput = aggregateOutput.map((v) => {
			return Math.max(0, Math.min((v - minDecibels) / (maxDecibels - minDecibels), 1));
		});

		values = new Float32Array(normalizedOutput);
	});

	// Recreate the getValues function when values changes (to trigger reactivity)
	$: getValues = (detail: number) => normalizeArray(values, detail);
</script>

<slot {values} {getValues} {frequencies} {labels} />
