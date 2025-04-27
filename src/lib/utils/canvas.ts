export function createRadialGradient(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    maxRadius: number,
    startHue: number,
    endHue: number
): CanvasGradient {
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
    gradient.addColorStop(0, `hsl(${startHue % 360}, 100%, 98%)`);
    gradient.addColorStop(0.3, `hsl(${startHue % 360}, 100%, 70%)`);
    gradient.addColorStop(1, `hsl(${endHue % 360}, 100%, 50%)`);
    return gradient;
} 