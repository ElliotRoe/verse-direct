<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button/button.svelte';
	import { onMount } from 'svelte';
	import { initializeCheckinState, handleCheckIn } from '$lib/services/checkinService';
	import Input from '$lib/components/ui/input/input.svelte';
	import Icon from '@iconify/svelte';
	import AudioVisualizationCircle from '$lib/components/waveform/audio-visualization-circle.svelte';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import ProgressDrawer from '$lib/components/progress-drawer.svelte';
	import { saveTodos, getTodos, type TodoItem, monitorTodoStatus } from '$lib/services/todoService';
	import { firebaseUser } from '$lib/authentication';

	const dayAbrev = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	let hasCheckedInToday = $state(false);

	// Parse URL parameter for drawer state - default to true if not specified
	const initialDrawerState = $page.url.searchParams.get('open') === 'true';
	let isDrawerOpen = $state(initialDrawerState);

	// Get current day of week (0-6, where 0 is Sunday) in local timezone for calendar display
	// const currentDayCalendar = new Date().getDay();
	let currentDayCalendar = $state(new Date().getDay()); // MODIFIED: Make reactive for helper functions

	let streakCount = $state(0); // Reactive variable for streak display

	let todaysTasks = $state<TodoItem[]>([]);
	let tasksGenerating = $state(false);
	let tasksFetching = $state(true);

	const trySaveTodos = async () => {
		if (firebaseUser.data?.uid) {
			await saveTodos(firebaseUser.data.uid, todaysTasks, selectedDate);
		} else {
			console.error('No user ID found');
		}
	};

	// svelte-ignore state_referenced_locally
	let originalTodaysTasks = $state<string>(JSON.stringify($state.snapshot(todaysTasks)));

	const handleDrawerClose = async () => {
		const newTodaysTasks = JSON.stringify($state.snapshot(todaysTasks));
		if (originalTodaysTasks !== newTodaysTasks) {
			originalTodaysTasks = newTodaysTasks;
			// Save to firebase
			try {
				await trySaveTodos();
			} catch (error) {
				console.error('Failed to save todos:', error);
			}
		}
	};

	interface DisplayedDay {
		// NEW
		abbr: string;
		originalIndex: number;
		dayNumber: number;
	}
	let displayedDays: DisplayedDay[] = $state([]); // NEW

	function setupCalendarDays() {
		const today = new Date();
		const todayOriginalIndex = today.getDay();
		currentDayCalendar = todayOriginalIndex;

		const offset = 2 - todayOriginalIndex; // Center is index 2 for 5 days
		const newDisplayedDays: DisplayedDay[] = [];

		for (let i = 0; i < 5; i++) {
			const originalDayIndexToDisplayInThisSlot = (i - offset + 70) % 7;
			// Calculate the real date for this chip (center chip is today)
			const date = new Date(today);
			date.setDate(today.getDate() + (i - 2));
			newDisplayedDays.push({
				abbr: dayAbrev[originalDayIndexToDisplayInThisSlot],
				originalIndex: originalDayIndexToDisplayInThisSlot,
				dayNumber: date.getDate()
			});
		}
		displayedDays = newDisplayedDays;
	}

	let selectedDate = $state(new Date());

	// Function to load todos for a specific date
	async function loadTodosForDate(date: Date) {
		try {
			selectedDate = date;
			if (firebaseUser.data?.uid) {
				const todos = await getTodos(firebaseUser.data.uid, date);
				if (todos) {
					if (todos.status === 'generating') {
						tasksGenerating = true;
						const { status, unsubscribe } = monitorTodoStatus(firebaseUser.data.uid, date);
						$effect(() => {
							if (status === 'completed') {
								tasksGenerating = false;
								unsubscribe();
							}
						});
					} else {
						tasksGenerating = false;
					}
					todaysTasks = todos.items;
				} else {
					todaysTasks = [{ title: 'Add your tasks for this day', completed: false }];
					tasksGenerating = false;
				}
				tasksFetching = false;
			} else {
				console.error('No user ID found');
			}
			originalTodaysTasks = JSON.stringify($state.snapshot(todaysTasks));
		} catch (error) {
			console.error('Failed to load todos for date:', error);
		}
	}

	onMount(async () => {
		const initialState = initializeCheckinState();
		streakCount = initialState.streakCount;
		hasCheckedInToday = initialState.hasCheckedInToday;
		setupCalendarDays(); // Initialize calendar day chips
	});

	$effect(() => {
		if (firebaseUser.data) {
			loadTodosForDate(selectedDate);
		}
	});

	// Function to determine if a day is in the past (for calendar styling)
	const isPastDay = (index: number): boolean => {
		return index < currentDayCalendar;
	};

	// Function to determine if it's the current day (for calendar styling)
	const isCurrentDay = (index: number): boolean => {
		return index === currentDayCalendar;
	};

	const onCheckInClicked = () => {
		const result = handleCheckIn();
		streakCount = result.newStreakCount;
		hasCheckedInToday = result.newHasCheckedInToday;
		goto('/app');
	};
</script>

<div class="flex h-full w-full flex-col items-start justify-between">
	<div class="flex w-full flex-col p-4 text-lg font-bold text-yellow-900">
		<div class="flex flex-row items-center justify-between">
			<span class="font-cinzel"
				>{selectedDate.toLocaleDateString('en-US', {
					weekday: 'long',
					month: 'long',
					day: 'numeric'
				})}</span
			>
			<div class="flex flex-row items-center justify-center gap-2">
				<Icon icon="ph:flame" class="h-4 w-4" />
				<span class="text-xl font-bold">{streakCount}</span>
			</div>
		</div>
		<div class="mt-2 flex flex-row items-center justify-between">
			<div class="flex w-full flex-row items-center justify-center gap-2 text-center">
				{#each displayedDays as dayChip, index}
					{@const isActualCurrentDay = isCurrentDay(dayChip.originalIndex)}
					{@const isActualPastDay = isPastDay(dayChip.originalIndex) && !isActualCurrentDay}
					<div
						class="day-chip"
						class:day-chip-current={isActualCurrentDay}
						class:day-chip-past={!isActualCurrentDay && isActualPastDay}
						class:day-chip-future={!isActualCurrentDay && !isActualPastDay}
					>
						<span class="font-normal italic">{dayChip.abbr}</span>
						<span class="font-cinzel text-xl font-bold">{dayChip.dayNumber}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
	<AudioVisualizationCircle isSessionActive={false} size={275} variant="accent" />
	<div class="flex w-full max-w-[500px] flex-row rounded-t-2xl bg-background p-4 shadow-lg">
		<div class="flex w-full flex-col items-start justify-start gap-2">
			{#if !hasCheckedInToday}
				<Button onclick={onCheckInClicked} class="h-[60px] w-full text-lg">
					<Icon icon="ph:check-circle" class="mr-2 h-6 w-6" />
					Check-in
				</Button>
			{:else}
				<div class="w-full">
					<ProgressDrawer
						bind:isOpen={isDrawerOpen}
						bind:todaysTasks
						loading={tasksGenerating || tasksFetching}
						onClose={handleDrawerClose}
						{selectedDate}
					/>
				</div>
			{/if}
		</div>
	</div>
</div>

<style lang="postcss">
	.day-chip {
		@apply flex flex-1 flex-col items-center justify-center rounded-full border p-2 text-center font-sans;
	}
	.day-chip-current {
		@apply border-yellow-700 bg-yellow-900 font-bold text-white;
	}
	.day-chip-past {
		@apply border-yellow-200/70 bg-yellow-50 text-yellow-700 opacity-80;
	}
	.day-chip-past span {
		@apply italic;
	}
	.day-chip-future {
		@apply border-yellow-300/80 bg-yellow-100 font-medium text-yellow-800;
	}
	.day-chip-selected {
		@apply border-yellow-600 bg-yellow-500 font-bold text-white;
	}
</style>
