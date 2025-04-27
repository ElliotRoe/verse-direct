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
	import { doc, getDoc } from 'firebase/firestore';

	let conversationId = $state<string>(uuidv4());
	let circleSize = $state(400);
	let isMuted = $state(false);
	let showWelcomeDialog = $state(true);
	let instructions = $state<string>('');

	function updateSize() {
		circleSize = window.innerWidth < 640 ? Math.min(window.innerWidth - 125, 400) : 400;
	}

	async function fetchUserInstructions() {
		console.log('fetching user instructions');
		const userDocRef = doc(db, 'users', firebaseUser.data?.uid || '');
		const userDoc = await getDoc(userDocRef);
		instructions = userDoc.data()?.currentPrompt || '';
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
	{#snippet children({ connectionState, assistantStream, userStream, startSession, stopSession })}
		<div class="flex h-screen flex-col items-center overflow-y-auto pt-8">
			<div
				class="relative flex w-full flex-1 flex-col items-center justify-between space-y-6 sm:w-[400px]"
			>
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
					<Toggle
						pressed={isMuted}
						class="mt-10 h-40 w-full text-white"
						on:click={() => {
							isMuted = !isMuted;
							if (isMuted) {
								assistantStream?.getTracks().forEach((track) => (track.enabled = false));
								userStream?.getTracks().forEach((track) => (track.enabled = false));
							} else {
								assistantStream?.getTracks().forEach((track) => (track.enabled = true));
								userStream?.getTracks().forEach((track) => (track.enabled = true));
							}
						}}
					>
						{#if isMuted}
							<Icon icon="ph:microphone-slash" class="h-10 w-10" />
						{:else}
							<Icon icon="ph:microphone" class="h-10 w-10" />
						{/if}
					</Toggle>
					<Button
						variant="secondary"
						class="mt-4 w-full text-white"
						onclick={() => {
							stopSession();
							// refresh page
							window.location.reload();
						}}
					>
						End Session
					</Button>
				</div>
			</div>
		</div>

		<Dialog.Root bind:open={showWelcomeDialog}>
			<Dialog.Content
				class="flex aspect-square w-[400px] flex-col items-center justify-center border-gray-700 bg-gray-900 text-white"
			>
				<Dialog.Header class="flex flex-col items-center text-center">
					<Dialog.Title class="font-caveat text-4xl text-white">Headphones Reccomended</Dialog.Title
					>
					<Dialog.Description class="flex flex-col items-center text-gray-300">
						<img src="/logo-headphones.png" alt="Headphones" class="w-full" />
					</Dialog.Description>
				</Dialog.Header>
				<Dialog.Footer class="mt-auto">
					<Button
						variant="secondary"
						on:click={() => {
							startSession('default');
							showWelcomeDialog = false;
						}}
					>
						Start Session
					</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	{/snippet}
</AssistantSession>
