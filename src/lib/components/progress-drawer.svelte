<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
	import Icon from '@iconify/svelte';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { Input } from './ui/input';
	import Separator from './ui/separator/separator.svelte';
	import { fly } from 'svelte/transition';
	import type { TodoItem } from '$lib/services/todoService';
	import Skeleton from './ui/skeleton/skeleton.svelte';

	let {
		isOpen = $bindable(),
		todaysTasks = $bindable(),
		onClose,
		selectedDate = $bindable(new Date()),
		loading = $bindable(false)
	}: {
		isOpen: boolean;
		todaysTasks: TodoItem[];
		onClose: () => void;
		loading: boolean;
		selectedDate?: Date;
	} = $props();

	let newTaskInput = $state('');

	// Store the editable task values separately from the actual tasks
	// This prevents reactivity issues when editing
	let editableTasks = $state<string[]>([]);

	$effect(() => {
		// Update editable tasks when todaysTasks changes
		editableTasks = todaysTasks.map((task) => task.title);
	});

	function addTask() {
		if (newTaskInput.trim() === '') return;

		todaysTasks = [...todaysTasks, { title: newTaskInput.trim(), completed: false }];
		// Editing handled via the effect above

		newTaskInput = '';
	}

	function toggleTaskComplete(index: number) {
		const tasksCopy = [...todaysTasks];
		tasksCopy[index].completed = !tasksCopy[index].completed;
		todaysTasks = tasksCopy;
	}

	function removeTask(index: number) {
		todaysTasks = todaysTasks.filter((_, i) => i !== index);
		// Editing handled via the effect above
	}

	function updateTaskTitle(index: number, newTitle: string) {
		// Update the editable value
		editableTasks[index] = newTitle;

		// Also update the actual task
		const tasksCopy = [...todaysTasks];
		tasksCopy[index].title = newTitle;
		todaysTasks = tasksCopy;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			addTask();
			newTaskInput = '';
		}
	}
</script>

<Drawer.Root bind:open={isOpen}>
	<Drawer.Trigger class="w-full">
		<Button variant="outline" class="h-[60px] w-full text-lg">
			<Icon icon="ph:notebook" class="mr-2 h-6 w-6" />
			Review
		</Button>
	</Drawer.Trigger>
	<Drawer.Content>
		<div class="mx-auto w-full max-w-md">
			<Drawer.Header>
				<Drawer.Title>Today's Progress</Drawer.Title>
				<Drawer.Description>
					Review your check-ins and tasks for {selectedDate.toLocaleDateString('en-US', {
						weekday: 'long',
						month: 'long',
						day: 'numeric'
					})}
				</Drawer.Description>
			</Drawer.Header>

			<div class="p-4">
				<!-- Tasks Section -->
				<section>
					<h3 class="mb-2 text-lg font-semibold">Tasks</h3>
					<div class="space-y-2">
						{#if loading}
							<!-- Show 3 skeleton rows as placeholders -->
							<Skeleton class="mb-2 h-10 w-full" />
							<Skeleton class="mb-2 h-10 w-full" />
							<Skeleton class="h-10 w-2/3" />
						{:else}
							{#each todaysTasks as task, index (task.title + index)}
								<div class="flex items-center gap-3 rounded-md p-2 hover:bg-yellow-50">
									<Button
										variant="ghost"
										size="icon"
										onclick={() => toggleTaskComplete(index)}
										class="flex h-5 w-5 items-center justify-center rounded-full"
									>
										{#if task.completed}
											<Icon icon="ph:check-circle-fill" class="h-5 w-5 text-green-600" />
										{:else}
											<Icon icon="ph:circle" class="h-5 w-5 text-yellow-600" />
										{/if}
									</Button>
									<Separator orientation="vertical" class="h-4" />
									{#if editableTasks[index] !== undefined}
										<Input
											class={task.completed
												? 'border-none text-gray-400 line-through'
												: 'border-none'}
											defaultValue={editableTasks[index]}
											onchange={(e) => updateTaskTitle(index, e.currentTarget.value)}
										/>
									{/if}
									<Button
										variant="ghost"
										size="icon"
										onclick={() => removeTask(index)}
										class="text-red-500 transition-opacity hover:text-red-700"
									>
										<Icon icon="ph:trash" class="h-5 w-5 text-red-500" />
									</Button>
								</div>
							{/each}

							<!-- Add new task input -->
							<div class="mt-4 flex items-center gap-2">
								<Input
									placeholder="Add a new task..."
									value={newTaskInput}
									oninput={(e) => (newTaskInput = e.currentTarget.value)}
									onkeydown={handleKeydown}
									class="flex-1"
								/>
								<Button variant="outline" size="sm" onclick={addTask}>
									<Icon icon="ph:plus" class="h-5 w-5" />
								</Button>
							</div>
						{/if}
					</div>
				</section>
			</div>

			<Drawer.Footer>
				<Drawer.Close>
					<Button variant="outline" class="h-[60px] w-full" onclick={onClose}>Close</Button>
				</Drawer.Close>
			</Drawer.Footer>
		</div>
	</Drawer.Content>
</Drawer.Root>

<style>
	/* Add necessary styles here */
</style>
