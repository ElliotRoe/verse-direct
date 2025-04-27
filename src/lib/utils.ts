import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { TransitionConfig } from 'svelte/transition';
import { cubicOut } from 'svelte/easing';
import { onMount } from 'svelte';
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

type FlyAndScaleParams = {
	y?: number;
	x?: number;
	start?: number;
	duration?: number;
};

export const flyAndScale = (
	node: Element,
	params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 }
): TransitionConfig => {
	const style = getComputedStyle(node);
	const transform = style.transform === 'none' ? '' : style.transform;

	const scaleConversion = (valueA: number, scaleA: [number, number], scaleB: [number, number]) => {
		const [minA, maxA] = scaleA;
		const [minB, maxB] = scaleB;

		const percentage = (valueA - minA) / (maxA - minA);
		const valueB = percentage * (maxB - minB) + minB;

		return valueB;
	};

	const styleToString = (style: Record<string, number | string | undefined>): string => {
		return Object.keys(style).reduce((str, key) => {
			if (style[key] === undefined) return str;
			return str + `${key}:${style[key]};`;
		}, '');
	};

	return {
		duration: params.duration ?? 200,
		delay: 0,
		css: (t) => {
			const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
			const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
			const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

			return styleToString({
				transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
				opacity: t
			});
		},
		easing: cubicOut
	};
};

/**
 * Normalizes a Float32Array to Array(m): We use this to draw amplitudes on a graph
 * If we're rendering the same audio data, then we'll often be using
 * the same (data, m, downsamplePeaks) triplets so we give option to memoize
 */
export const normalizeArray = (
	data: Float32Array,
	m: number,
	downsamplePeaks: boolean = false,
	memoize: boolean = false
) => {
	let cache, mKey, dKey;
	if (memoize) {
		mKey = m.toString();
		dKey = downsamplePeaks.toString();
		cache = dataMap.has(data) ? dataMap.get(data) : {};
		dataMap.set(data, cache);
		cache[mKey] = cache[mKey] || {};
		if (cache[mKey][dKey]) {
			return cache[mKey][dKey];
		}
	}
	const n = data.length;
	const result = new Array(m);
	if (m <= n) {
		// Downsampling
		result.fill(0);
		const count = new Array(m).fill(0);
		for (let i = 0; i < n; i++) {
			const index = Math.floor(i * (m / n));
			if (downsamplePeaks) {
				// take highest result in the set
				result[index] = Math.max(result[index], Math.abs(data[i]));
			} else {
				result[index] += Math.abs(data[i]);
			}
			count[index]++;
		}
		if (!downsamplePeaks) {
			for (let i = 0; i < result.length; i++) {
				result[i] = result[i] / count[i];
			}
		}
	} else {
		for (let i = 0; i < m; i++) {
			const index = (i * (n - 1)) / (m - 1);
			const low = Math.floor(index);
			const high = Math.ceil(index);
			const t = index - low;
			if (high >= n) {
				result[i] = data[n - 1];
			} else {
				result[i] = data[low] * (1 - t) + data[high] * t;
			}
		}
	}
	if (memoize) {
		cache[mKey as string][dKey as string] = result;
	}
	return result;
};

export function preventDefault<T extends (this: unknown, event: Event) => void>(fn: T) {
	return function (this: unknown, event: Event) {
		event.preventDefault();
		fn.call(this, event);
	};
}

const dataMap = new WeakMap();

export async function raf(callback: () => void) {
	let mounted = true;

	async function render() {
		if (!mounted || !callback) return;

		try {
			callback();
		} catch (e) {
			console.error(e);
		}
		requestAnimationFrame(render);
	}

	onMount(() => {
		render();
		return () => (mounted = false);
	});
}
