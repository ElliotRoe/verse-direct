<script lang="ts">
	import { createRadialGradient } from '$lib/utils/canvas';
	export let values: Float32Array;

	export let color: string | undefined = undefined;
	export let startHue: number | undefined = undefined;
	export let endHue: number | undefined = undefined;
	export let minRadius: number = 0.5;
	export let maxRadius: number = 1;
	export let invert: boolean = true;
	export let rotate = 0.6;
	// export let varyBrightness = false;
	export let blur: number = 30;
	export let displacement: number = 40;
	export let radiusAdjustment: number = 100;

	const direction = invert ? -1 : 1;
	let canvas: HTMLCanvasElement;
	let contentRect: DOMRectReadOnly;

	$: if (canvas && contentRect) {
		const ctx = canvas.getContext('2d')!;

		//Update canvas size
		canvas.width = Math.round(contentRect.width) * 2;
		canvas.height = Math.round(contentRect.height) * 2;

		//Clear
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		//const points = normalizeArray(data, detail, true);
		const smaller = Math.min(canvas.width, canvas.height) + radiusAdjustment;

		const minCircleSize = (Math.PI * 2 * minRadius * smaller) / values.length / 2;
		const maxCircleSize = (Math.PI * 2 * maxRadius * smaller) / values.length / 2;

		const minCircleHeight = minRadius * smaller;
		const maxCircleHeight = (maxRadius - minRadius) * smaller;
		const hueRange = (endHue ?? 0) - (startHue ?? 0);

		if (color !== undefined) {
			ctx.fillStyle = color;
		}

		for (let i = 0; i < values.length; i++) {
			const amplitude = values[i];
			const circleHeight = smaller / 2 - amplitude * displacement;
			const circleSize = minCircleSize + (maxCircleSize - minCircleSize) * amplitude;
			const angle = (i / values.length) * Math.PI * 2 + rotate;

			// Save the current context state
			ctx.save();

			// Translate and rotate the context to position the roundRect
			ctx.translate(centerX, centerY);
			ctx.rotate(angle);

			if (startHue !== undefined && endHue !== undefined) {
				// t goes from 0 to 1, then back to 0 (startHue to endHue back to startHue)
				let t = (i / values.length) * 2;
				if (t > 1) {
					t = 2 - t;
				}
				const hue = (startHue ?? 0) + t * hueRange;
				const nextHue = ((startHue ?? 0) + ((t + 0.1) % 1) * hueRange) % 360;

				// Ensure gradient coordinates are finite values
				const gradientX = isFinite(-circleSize / 2) ? -circleSize / 2 : 0;
				const gradientY = isFinite(circleHeight) ? circleHeight : 0;
				const gradientRadius = isFinite(circleSize) ? circleSize : 1;

				ctx.fillStyle = createRadialGradient(
					ctx,
					gradientX,
					gradientY,
					gradientRadius,
					hue,
					nextHue
				);
			}

			ctx.beginPath();
			ctx.ellipse(-circleSize / 2, circleHeight, circleSize / 2, circleSize / 2, 0, 0, Math.PI * 2);
			ctx.fill();
			ctx.translate(-centerX, -centerY);

			ctx.restore();
		}
	}
</script>

<canvas
	bind:this={canvas}
	bind:contentRect
	style="filter: blur({blur}px); height: 100%; width: 100%;"
></canvas>
