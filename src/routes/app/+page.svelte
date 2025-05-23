<script lang="ts">
	import AudioVisualizationCircle from '$lib/components/waveform/audio-visualization-circle.svelte';
	import AssistantSession from '$lib/components/assistant-session.svelte';
	import { ConnectionState } from '$lib/types/chat-client';
	import { onMount } from 'svelte';
	import { v4 as uuidv4 } from 'uuid';
	import { firebaseUser } from '$lib/authentication';
	import Icon from '@iconify/svelte';
	import { Toggle } from '$lib/components/ui/toggle';
	import Button from '$lib/components/ui/button/button.svelte';
	import { db } from '$lib/firebase';
	import { collection, doc, getDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
	import { goto } from '$app/navigation';
	import WelcomeDrawer from '$lib/components/welcome-drawer.svelte';
	import { getTodos, type TodoItem } from '$lib/services/todoService';

	let conversationId = $state<string>(uuidv4());
	let circleSize = $state(400);
	let showWelcomeDrawer = $state(false);
	let instructions = $state<string>('');
	let previousDaysTodos = $state<TodoItem[]>([]);

	function updateSize() {
		circleSize = window.innerWidth < 640 ? Math.min(window.innerWidth - 125, 400) : 400;
	}

	async function fetchUserInstructions() {
		if (!firebaseUser.data?.uid) {
			return null;
		}

		console.log('fetching user instructions', firebaseUser.data?.uid);
		const generatedPromptsRef = collection(
			db,
			'users',
			firebaseUser.data?.uid,
			'generated_prompts'
		);

		try {
			const q = query(generatedPromptsRef, orderBy('generation_timestamp', 'desc'), limit(1));

			const querySnapshot = await getDocs(q);
			if (!querySnapshot.empty) {
				const doc = querySnapshot.docs[0];
				instructions = doc.data().prompt_text;
			} else {
				console.log('No instructions found');
			}
		} catch (err) {
			console.error('Error fetching user instructions:', err);
		}
	}

	async function fetchPreviousDaysTodos() {
		if (!firebaseUser.data?.uid) {
			return;
		}

		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const todos = await getTodos(firebaseUser.data.uid, yesterday);
		previousDaysTodos = todos;
	}

	$effect(() => {
		if (firebaseUser.data && !firebaseUser.loading && !instructions) {
			fetchUserInstructions();
			fetchPreviousDaysTodos();
		}
	});

	onMount(() => {
		updateSize();
		window.addEventListener('resize', updateSize);
		return () => window.removeEventListener('resize', updateSize);
	});
</script>

<AssistantSession
	config={{
		room: conversationId,
		userId: firebaseUser.data?.uid || '',
		displayName: firebaseUser.data?.displayName || '',
		email: firebaseUser.data?.email || '',
		instructions
	}}
>
	{#snippet children({
		connectionState,
		assistantStream,
		userStream,
		startSession,
		stopSession,
		toggleRecording,
		isRecording
	})}
		<div class="flex h-screen flex-col items-center overflow-y-auto pt-8">
			<div
				class="relative flex w-full flex-1 flex-col items-center justify-between space-y-6 sm:w-[400px]"
			>
				<div class="flex h-full w-full flex-col justify-center">
					<div
						class="relative w-full flex-shrink-0 items-center justify-center sm:aspect-square sm:h-[400px] sm:w-[400px]"
					>
						<AudioVisualizationCircle
							isSessionActive={connectionState === ConnectionState.Connected}
							innerStream={assistantStream}
							outerStream={userStream}
							size={circleSize}
							variant="accent"
						/>
					</div>
				</div>

				<div class="flex w-full flex-col gap-4 rounded-t-xl bg-background p-4 shadow-md">
					<div class="mb-3">
						<h3 class="text-lg font-semibold">Yesterday's Tasks</h3>
						{#if previousDaysTodos.length > 0}
							<div class="mt-2 max-h-32 overflow-y-auto rounded-md border">
								{#each previousDaysTodos as todo}
									<div class="flex items-center border-b p-2 last:border-b-0">
										<div class="mr-2 flex h-5 w-5 items-center justify-center rounded-full border">
											{#if todo.completed}
												<Icon icon="ph:check" class="h-4 w-4 text-primary" />
											{/if}
										</div>
										<span class={todo.completed ? 'line-through opacity-70' : ''}>{todo.title}</span
										>
									</div>
								{/each}
							</div>
						{:else}
							<p class="mt-2 text-sm text-muted-foreground">No tasks from yesterday</p>
						{/if}
					</div>
					<div class="flex flex-row gap-2">
						<Button
							class="h-full w-2/3 rounded-full border"
							onclick={() => {
								toggleRecording();
							}}
						>
							{#if !isRecording}
								<Icon icon="ph:microphone-slash" class="h-10 w-10" />
							{:else}
								<Icon icon="ph:microphone" class="h-10 w-10" />
							{/if}
						</Button>
						<Button
							variant="destructiveLight"
							size="icon"
							class="h-full w-1/3 rounded-full"
							onclick={() => {
								stopSession();
								goto('/app/dashboard');
							}}
						>
							<Icon icon="ph:x" class="h-10 w-10" />
						</Button>
					</div>
				</div>
			</div>
		</div>

		<WelcomeDrawer
			bind:isOpen={showWelcomeDrawer}
			bind:instructions
			{startSession}
			onClose={() => {
				goto('/app/dashboard');
			}}
		/>
	{/snippet}
</AssistantSession>
