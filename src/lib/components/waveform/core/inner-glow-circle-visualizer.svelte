<script lang="ts">
	export let values: Float32Array;

	export let color: string | undefined = undefined;
	export let startHue: number | undefined = undefined;
	export let endHue: number | undefined = undefined;
	export let colorTopLeft: string | undefined = undefined;
	export let colorTopRight: string | undefined = undefined;
	export let colorBottomLeft: string | undefined = undefined;
	export let colorBottomRight: string | undefined = undefined;
	export let sideVisible = 5;
	export let deformation = 10;

	// Reduce blur from 12 to 2 for a sharper circle
	export let blur: number = 2;

	let canvas: HTMLCanvasElement;
	let contentRect: DOMRectReadOnly;

	$: if (canvas && contentRect) {
		const ctx = canvas.getContext('2d')!;

		// Update canvas size
		canvas.width = Math.round(contentRect.width) * 2;
		canvas.height = Math.round(contentRect.height) * 2;

		// Clear
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		const baseRadius = Math.min(centerX, centerY) - 20; // Base radius of the circle

		// Function to create gradient based on angle
		const createGradientForAngle = (angle: number) => {
			if (color) return color;

			const startX = centerX + Math.cos(angle) * baseRadius;
			const startY = centerY + Math.sin(angle) * baseRadius;
			const endX = centerX - Math.cos(angle) * baseRadius;
			const endY = centerY - Math.sin(angle) * baseRadius;

			const gradient = ctx.createLinearGradient(startX, startY, endX, endY);

			// Determine which colors to use based on the angle
			const normalizedAngle = ((angle + Math.PI) * (180 / Math.PI)) % 360;
			if (normalizedAngle >= 315 || normalizedAngle < 45) {
				// Right side
				if (colorTopRight && colorBottomRight) {
					gradient.addColorStop(0, colorTopRight);
					gradient.addColorStop(1, colorBottomRight);
				}
			} else if (normalizedAngle >= 45 && normalizedAngle < 135) {
				// Bottom side
				if (colorBottomLeft && colorBottomRight) {
					gradient.addColorStop(0, colorBottomRight);
					gradient.addColorStop(1, colorBottomLeft);
				}
			} else if (normalizedAngle >= 135 && normalizedAngle < 225) {
				// Left side
				if (colorTopLeft && colorBottomLeft) {
					gradient.addColorStop(0, colorBottomLeft);
					gradient.addColorStop(1, colorTopLeft);
				}
			} else {
				// Top side
				if (colorTopLeft && colorTopRight) {
					gradient.addColorStop(0, colorTopLeft);
					gradient.addColorStop(1, colorTopRight);
				}
			}

			// Fallback to hue gradient if no specific colors are set
			if (startHue !== undefined && endHue !== undefined) {
				gradient.addColorStop(0, `hsl(${startHue % 360}, 100%, 40%)`);
				gradient.addColorStop(1, `hsl(${endHue % 360}, 100%, 60%)`);
			}

			return gradient;
		};

		// Draw the deformed circle
		const segments = values.length;
		const angleStep = (2 * Math.PI) / segments;

		for (let i = 0; i < segments; i++) {
			const startAngle = i * angleStep;
			const endAngle = (i + 1) * angleStep;
			const amplitude = values[i];

			ctx.beginPath();

			// Calculate radii
			const radius = baseRadius + amplitude * deformation + sideVisible;
			const nextRadius =
				baseRadius + (i < segments - 1 ? values[i + 1] : values[0]) * deformation + sideVisible;

			// Draw arc segment
			ctx.moveTo(centerX, centerY);
			ctx.arc(centerX, centerY, radius, startAngle, endAngle);
			ctx.lineTo(
				centerX + Math.cos(endAngle) * nextRadius,
				centerY + Math.sin(endAngle) * nextRadius
			);
			// ctx.arc(centerX, centerY, nextRadius, endAngle, startAngle, true);
			ctx.lineTo(centerX + Math.cos(startAngle) * radius, centerY + Math.sin(startAngle) * radius);

			// Apply gradient
			ctx.fillStyle = createGradientForAngle(startAngle);
			ctx.fill();
		}
	}
</script>

<canvas
	bind:this={canvas}
	bind:contentRect
	style="filter: blur({blur}px); width: 100%; height: 100%;"
></canvas>
