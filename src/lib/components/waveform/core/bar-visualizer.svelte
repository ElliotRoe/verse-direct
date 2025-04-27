<script lang="ts">
	export let values: Float32Array;
	export let color: string = '#0050e6'; // default to a nice blue color
	export let barWidth = 12;
	export let barSpacing = 8;
	export let center = true;
	export let cornerRadius = 6;

	let canvas: HTMLCanvasElement;
	let contentRect: DOMRectReadOnly;

	function averagePairs(arr: Float32Array): Float32Array {
		const result = new Float32Array(Math.ceil(arr.length / 2));
		for (let i = 0; i < arr.length; i += 2) {
			if (i + 1 < arr.length) {
				result[i / 2] = (arr[i] + arr[i + 1]) / 2;
			} else {
				result[i / 2] = arr[i];
			}
		}
		return result;
	}

	$: if (canvas && contentRect) {
		const ctx = canvas.getContext('2d')!;

		//Update canvas size
		canvas.width = Math.round(contentRect.width) * 2;
		canvas.height = Math.round(contentRect.height) * 2;

		//Clear
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		let width = barWidth;
		const averagedValues = averagePairs(averagePairs(values));
		let dets = averagedValues.length;

		if (!dets) {
			dets = Math.floor((canvas.width - barSpacing) / (Math.max(barWidth, 1) + barSpacing));
		}
		if (!barWidth) {
			width = (canvas.width - barSpacing) / dets - barSpacing;
		}

		// Calculate total width of all bars and spacing
		const totalWidth = (width + barSpacing) * averagedValues.length - barSpacing;
		// Calculate starting X to center the bars
		const startX = (canvas.width - totalWidth) / 2;

		ctx.fillStyle = color;

		for (let i = 0; i < averagedValues.length; i++) {
			const amplitude = Math.abs(averagedValues[i]);
			const height = Math.max(1, amplitude * canvas.height);
			const x = startX + i * (width + barSpacing);
			const halfHeight = height / 2;
			const middleY = canvas.height / 2;
			const y = middleY - halfHeight;

			ctx.beginPath();
			ctx.roundRect(x, y, width, height, cornerRadius);
			ctx.fill();
		}
	}
</script>

<canvas bind:this={canvas} bind:contentRect style="height: 100%; width: 100%;"></canvas>
