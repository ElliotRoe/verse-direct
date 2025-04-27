<script lang="ts">
	import { signInWithEmailAndPassword } from 'firebase/auth';
	import { auth } from '$lib/firebase';
	import { goto } from '$app/navigation'; // Optional: for redirecting after login

	let email = '';
	let password = '';
	let error: string | null = null;
	let loading = false;

	async function handleLogin() {
		loading = true;
		error = null;
		try {
			await signInWithEmailAndPassword(auth, email, password);
			// Login successful, Firebase auth state listener will update the store
			// SvelteKit will handle redirect based on hooks or layout logic
			// goto('/dashboard'); // Or explicitly redirect
		} catch (err: any) {
			error = err.message;
			console.error('Login failed:', err);
		} finally {
			loading = false;
		}
	}
</script>

<div class="login-container">
	<h2>Login</h2>
	<form on:submit|preventDefault={handleLogin}>
		<div class="form-group">
			<label for="email">Email:</label>
			<input type="email" id="email" bind:value={email} required disabled={loading} />
		</div>
		<div class="form-group">
			<label for="password">Password:</label>
			<input type="password" id="password" bind:value={password} required disabled={loading} />
		</div>
		{#if error}
			<p class="error">{error}</p>
		{/if}
		<button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
	</form>
	<p>Don't have an account? <a href="/signup">Sign Up</a></p>
</div>

<!-- Basic styling -->
<style>
	.login-container {
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
		background-color: #007bff;
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
		background-color: #0056b3;
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
