<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
	import { onMount } from 'svelte';
	import { initializeCheckinState, handleCheckIn } from '$lib/services/checkinService';

	const dayAbrev = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];
	let hasCheckedInToday = false;

	// Get current day of week (0-6, where 0 is Sunday) in local timezone for calendar display
	const currentDayCalendar = new Date().getDay();

	let streakCount = 0; // Reactive variable for streak display

	onMount(() => {
		const initialState = initializeCheckinState();
		streakCount = initialState.streakCount;
		hasCheckedInToday = initialState.hasCheckedInToday;
	});

	// Function to determine if a day is in the past (for calendar styling)
	const isPastDay = (index: number): boolean => {
		return index < currentDayCalendar;
	};

	// Function to determine if it's the current day (for calendar styling)
	const isCurrentDay = (index: number): boolean => {
		return index === currentDayCalendar;
	};

	// Function to determine if it's a weekend (for calendar styling)
	const isWeekend = (index: number): boolean => {
		return index === 0 || index === 6; // Saturday or Sunday
	};

	const onCheckInClicked = () => {
		const result = handleCheckIn();
		streakCount = result.newStreakCount;
		hasCheckedInToday = result.newHasCheckedInToday;
		goto('/app');
	};
</script>

<div class="flex h-full w-full flex-col items-center justify-between">
	<div class="flex h-1/3 flex-col justify-center">
		<span class="text-[125px]">{streakCount}</span>
	</div>
	<div
		class="flex h-2/3 w-full max-w-[500px] flex-col justify-between rounded-t-2xl bg-background p-4 shadow-lg"
	>
		<div class="flex w-full flex-row">
			{#each dayAbrev as abbrv, index}
				<div
					class="m-1 flex aspect-square w-full flex-col items-center justify-center rounded-full transition-colors"
					class:bg-muted={isWeekend(index)}
					class:bg-primary={isCurrentDay(index)}
					class:bg-secondary={isPastDay(index) && !isWeekend(index)}
					class:bg-accent={!isPastDay(index) && !isCurrentDay(index) && !isWeekend(index)}
					class:text-primary-foreground={isCurrentDay(index)}
					class:text-muted-foreground={isWeekend(index)}
					class:text-secondary-foreground={isPastDay(index) && !isWeekend(index)}
					class:text-accent-foreground={!isPastDay(index) &&
						!isCurrentDay(index) &&
						!isWeekend(index)}
				>
					{abbrv}
				</div>
			{/each}
		</div>
		<div class="flex flex-col gap-2"></div>

		<div class="relative">
			<Button onclick={onCheckInClicked} class="h-[100px] w-full" disabled={hasCheckedInToday}>
				Check-in
			</Button>
			{#if hasCheckedInToday}
				<div class="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">✓</div>
			{/if}
		</div>
	</div>
</div>
