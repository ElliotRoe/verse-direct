<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
	import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { doc, setDoc } from 'firebase/firestore';
	import { updateProfile } from 'firebase/auth';
	import { db } from '$lib/firebase';
	import { firebaseUser, signInAnonymously } from '$lib/authentication';
	import { onMount } from 'svelte';
	import { createDefaultPrompt } from '$lib/utils/default-prompt';

	let { children } = $props();
	let step = $state(0);
	let name = $state('');
	let age = $state('');
	let gender = $state('');
	let reason = $state('');

	const ageGroups = ['18-24', '25-34', '35-44', '45-54', '55+'];
	const genders = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

	$effect(() => {
		console.log('firebaseUser.loading', firebaseUser.loading);
		console.log('firebaseUser.data', firebaseUser.data);
		if (!firebaseUser.loading && !firebaseUser.data) {
			console.log('signing in anonymously');
			signInAnonymously();
		}
	});

	async function handleContinue() {
		if (step === 0) {
			step = 1;
		} else if (step === 1) {
			step = 2;
		} else if (step === 2) {
			step = 3;
		} else if (step === 3) {
			step = 4;
		} else {
			// Save survey data to Firestore
			console.log('Saving survey data');
			if (firebaseUser.data) {
				try {
					// Update user's display name
					await updateProfile(firebaseUser.data, {
						displayName: name
					});

					const userDocRef = doc(db, 'users', firebaseUser.data.uid);
					await setDoc(
						userDocRef,
						{
							name,
							age,
							gender,
							reason,
							completedOnboarding: true,
							onboardingCompletedAt: new Date(),
							currentPrompt: createDefaultPrompt(name)
						},
						{ merge: true }
					);
					goto('/app');
				} catch (error) {
					console.error('Error saving survey data:', error);
				}
			} else {
				console.error('Error saving survey data: No user data');
			}
		}
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		await handleContinue();
	}
</script>

<div class="h-screen w-full bg-black">
	<div class="flex h-full flex-col items-center justify-center gap-12 px-8">
		<form onsubmit={handleSubmit} class="flex h-full flex-col items-center justify-center gap-12">
			{#if step === 0}
				<div class="font-caveat text-center text-4xl text-white">
					<p class="mb-4">Build yourself back,</p>
					<div class="flex items-center justify-center gap-2">
						<span class="font-metal text-6xl">BRICK</span>
						<span class="font-metal text-4xl">x</span>
						<span class="font-metal text-6xl">BRICK</span>
					</div>
				</div>
			{:else if step === 1}
				<div class="flex flex-col items-center gap-8">
					<h2 class="font-caveat text-4xl text-white">
						So let's re-discover ourselves, who are you?
					</h2>
					<div class="flex w-full max-w-md flex-col gap-4">
						<Label class="text-white">What's your name?</Label>
						<Input
							bind:value={name}
							placeholder="Enter your name"
							class="border-white bg-transparent text-white"
						/>
					</div>
				</div>
			{:else if step === 2}
				<div class="flex flex-col items-center gap-8">
					<h2 class="font-caveat text-4xl text-white">Tell us more about yourself</h2>
					<div class="flex flex-col gap-4">
						<Label class="text-white">What's your age group?</Label>
						<RadioGroup bind:value={age} class="grid grid-cols-2 gap-4">
							{#each ageGroups as group}
								<div class="flex items-center space-x-2">
									<RadioGroupItem value={group} id={group} />
									<Label for={group} class="text-white">{group}</Label>
								</div>
							{/each}
						</RadioGroup>
					</div>
				</div>
			{:else if step === 3}
				<div class="flex flex-col items-center gap-8">
					<h2 class="font-caveat text-4xl text-white">Tell us more about yourself</h2>
					<div class="flex flex-col gap-4">
						<Label class="text-white">What's your gender?</Label>
						<RadioGroup bind:value={gender} class="grid grid-cols-2 gap-4">
							{#each genders as g}
								<div class="flex items-center space-x-2">
									<RadioGroupItem value={g} id={g} />
									<Label for={g} class="text-white">{g}</Label>
								</div>
							{/each}
						</RadioGroup>
					</div>
				</div>
			{:else if step === 4}
				<div class="flex flex-col items-center gap-8">
					<h2 class="font-caveat text-4xl text-white">Why are you here?</h2>
					<div class="flex w-full max-w-md flex-col gap-4">
						<Label class="text-white">Tell us your reason</Label>
						<Input
							bind:value={reason}
							placeholder="I want to..."
							class="border-white bg-transparent text-white"
						/>
					</div>
				</div>
			{/if}
			<Button
				variant="ghost"
				class="text-white"
				type="submit"
				disabled={(step === 1 && !name) ||
					(step === 2 && !age) ||
					(step === 3 && !gender) ||
					(step === 4 && !reason)}
			>
				{step === 4 ? 'Complete →' : 'Continue →'}
			</Button>
		</form>
	</div>
</div>
