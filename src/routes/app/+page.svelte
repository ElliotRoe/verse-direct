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
	import * as Dialog from '$lib/components/ui/dialog';
	import { db } from '$lib/firebase';
	import { collection, doc, getDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
	import { goto } from '$app/navigation';

	let conversationId = $state<string>(uuidv4());
	let circleSize = $state(400);
	let isMuted = $state(false);
	let showWelcomeDialog = $state(true);
	let instructions = $state<string>('');

	function updateSize() {
		circleSize = window.innerWidth < 640 ? Math.min(window.innerWidth - 125, 400) : 400;
	}

	$inspect(firebaseUser.data);

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

	$effect(() => {
		if (firebaseUser.data && !firebaseUser.loading && !instructions) {
			void fetchUserInstructions();
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
				<div class="flex h-[20vh] w-full flex-row gap-2 rounded-t-xl bg-background p-4 shadow-md">
					<Toggle
						pressed={isMuted}
						class="h-full w-2/3 rounded-full border"
						on:click={() => {
							toggleRecording();
							isMuted = isRecording;
						}}
					>
						{#if isMuted}
							<Icon icon="ph:microphone-slash" class="h-10 w-10" />
						{:else}
							<Icon icon="ph:microphone" class="h-10 w-10" />
						{/if}
					</Toggle>
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

		<Dialog.Root bind:open={showWelcomeDialog}>
			<Dialog.Content class="flex aspect-square w-[400px] flex-col items-center justify-center">
				<Dialog.Header class="flex flex-col items-center text-center">
					<Dialog.Title class="font-caveat text-4xl">Headphones Reccomended</Dialog.Title>
					<Dialog.Description class="flex flex-col items-center">
						<img src="/logo-headphones.png" alt="Headphones" class="w-full" />
					</Dialog.Description>
				</Dialog.Header>
				<Dialog.Footer class="mt-auto">
					<Button
						variant="secondary"
						disabled={!instructions || firebaseUser.loading}
						on:click={() => {
							startSession('default');
							showWelcomeDialog = false;
						}}
					>
						{#if firebaseUser.loading || !instructions}
							Loading...
						{:else}
							Start Session
						{/if}
					</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	{/snippet}
</AssistantSession>
