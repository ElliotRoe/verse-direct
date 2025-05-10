<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { cn, preventDefault } from '$lib/utils.js';
	import { validateEmail } from '$lib/utils/validateemail';
	import {
		signIn,
		signInWithGoogle,
		signUpWithGoogle,
		signUp,
		DASHBOARD_URL
	} from '$lib/authentication';
	import { auth } from '$lib/firebase';
	import { CurrentUserState } from 'svelte-firebase-state';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';

	let user = new CurrentUserState({ auth });

	let signInSuccess = $state(false);

	$inspect(user.data);

	$effect(() => {
		if (user.data && signInSuccess) {
			goto(DASHBOARD_URL);
		}
	});

	let {
		mode = $bindable('login'),
		class: className = undefined,
		...rest
	} = $props<{
		mode?: 'signup' | 'login';
		class?: string | undefined | null;
	}>();

	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);
	let errorMessage = $state<string | null>(null);

	let isValidEmail = $derived(validateEmail(email));
	let isFormValid = $derived(isValidEmail && password.length > 0);
	let buttonText = $derived(mode === 'signup' ? 'Sign Up' : 'Sign In');

	function getReadableError(errorCode: string): string {
		switch (errorCode) {
			case 'auth/invalid-email':
				return 'Please enter a valid email address';
			case 'auth/user-disabled':
				return 'This account has been disabled';
			case 'auth/user-not-found':
				return 'No account found with this email';
			case 'auth/wrong-password':
				return 'Incorrect password';
			case 'auth/email-already-in-use':
				return 'An account already exists with this email. Sign in instead?';
			case 'auth/weak-password':
				return 'Your password should be at least 6 characters';
			case 'auth/network-request-failed':
				return 'Network error - please check your internet connection';
			case 'auth/too-many-requests':
				return 'Too many attempts - please try again later';
			case 'auth/invalid-credential':
				return 'Invalid email or password';
			default:
				return 'An error occurred during user authentication';
		}
	}

	async function onSubmit() {
		isLoading = true;
		errorMessage = null;

		try {
			if (mode === 'signup') {
				await signUp(email, password, '', '');
			} else {
				await signIn(email, password);
			}
			signInSuccess = true;
		} catch (error: any) {
			console.log(error);
			errorMessage = getReadableError(error.code);
		} finally {
			isLoading = false;
		}
	}

	const tryGoogleSignIn = async () => {
		isLoading = true;
		errorMessage = null;

		try {
			if (mode === 'signup') {
				await signUpWithGoogle();
			} else {
				await signInWithGoogle();
			}
			signInSuccess = true;
		} catch (error: any) {
			errorMessage = getReadableError(error.code);
		} finally {
			isLoading = false;
		}
	};
</script>

<div class={cn('grid gap-6', className)} {...rest}>
	<form onsubmit={preventDefault(onSubmit)}>
		<div class="grid gap-2">
			<div class="grid gap-1">
				<Label class="sr-only" for="email">Email</Label>
				<Input
					id="email"
					bind:value={email}
					placeholder="name@example.com"
					type="email"
					autocapitalize="none"
					autocomplete="email"
					autocorrect="off"
					disabled={isLoading}
				/>
			</div>
			<div class="grid gap-1">
				<Label class="sr-only" for="password">Password</Label>
				<Input
					id="password"
					bind:value={password}
					placeholder="Password"
					type="password"
					autocapitalize="none"
					autocorrect="off"
					disabled={isLoading}
				/>
			</div>
			<Button type="submit" disabled={isLoading || !isFormValid}>
				{#if isLoading}
					<Icon icon="ph:spinner" class="mr-2 h-4 w-4 animate-spin" />
				{/if}
				{buttonText}
			</Button>
		</div>
	</form>
	{#if errorMessage}
		<div class="mt-2 rounded-md border border-red-500 bg-red-100 p-2 text-sm text-red-800">
			{errorMessage}
		</div>
	{/if}
	<div class="relative">
		<div class="absolute inset-0 flex items-center">
			<span class="w-full border-t"></span>
		</div>
		<div class="relative flex justify-center text-xs uppercase">
			<span class="bg-background px-2 text-muted-foreground"> Or continue with </span>
		</div>
	</div>
	<Button
		variant="outline"
		class="hover:bg-gray-100"
		type="button"
		onclick={tryGoogleSignIn}
		disabled={isLoading}
	>
		{#if isLoading}
			<Icon icon="ph:spinner" class="mr-2 h-4 w-4 animate-spin" />
		{:else}
			<img src="/google_icon.png" alt="Google Logo" class="mr-2 h-8 w-8" />
		{/if}
		Google
	</Button>
</div>
