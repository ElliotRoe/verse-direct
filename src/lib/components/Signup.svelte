<script lang="ts">
	import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
	import { auth } from '$lib/firebase';

	let email = '';
	let password = '';
	let confirmPassword = '';
	let error: string | null = null;
	let loading = false;

	async function handleSignup() {
		if (password !== confirmPassword) {
			error = 'Passwords do not match.';
			return;
		}
		loading = true;
		error = null;
		try {
			await createUserWithEmailAndPassword(auth, email, password);
			// Signup successful, Firebase auth state listener will update the store
			// SvelteKit will handle redirect based on hooks or layout logic
			// Or redirect: goto('/dashboard');
		} catch (err: any) {
			error = err.message;
			console.error('Signup failed:', err);
		} finally {
			loading = false;
		}
	}
</script>

<div class="signup-container">
	<h2>Sign Up</h2>
	<form on:submit|preventDefault={handleSignup}>
		<div class="form-group">
			<label for="email">Email:</label>
			<input type="email" id="email" bind:value={email} required disabled={loading} />
		</div>
		<div class="form-group">
			<label for="password">Password:</label>
			<input type="password" id="password" bind:value={password} required disabled={loading} />
		</div>
		<div class="form-group">
			<label for="confirmPassword">Confirm Password:</label>
			<input
				type="password"
				id="confirmPassword"
				bind:value={confirmPassword}
				required
				disabled={loading}
			/>
		</div>
		{#if error}
			<p class="error">{error}</p>
		{/if}
		<button type="submit" disabled={loading}>{loading ? 'Signing up...' : 'Sign Up'}</button>
	</form>
	<p>Already have an account? <a href="/login">Login</a></p>
</div>

<!-- Basic styling, similar to Login component -->
<style>
	.signup-container {
		max-width: 400px;
		margin: 2rem auto;
		padding: 2rem;
		border: 1px solid #ccc;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	h2 {
		text-align: center;
		margin-bottom: 1.5rem;
	}
	.form-group {
		margin-bottom: 1rem;
	}
	label {
		display: block;
		margin-bottom: 0.5rem;
	}
	input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		box-sizing: border-box; /* Include padding and border in element's total width and height */
	}
	button {
		width: 100%;
		padding: 0.75rem;
		background-color: #28a745;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		transition: background-color 0.2s ease;
	}
	button:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}
	button:not(:disabled):hover {
		background-color: #218838;
	}
	.error {
		color: red;
		margin-bottom: 1rem;
		text-align: center;
	}
	p {
		text-align: center;
		margin-top: 1rem;
	}
</style>
