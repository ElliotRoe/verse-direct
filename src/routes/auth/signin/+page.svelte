<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import UserAuthForm from '$lib/components/user-auth-form.svelte';
</script>

<div
	class="container relative flex h-screen flex-col items-center justify-center bg-background md:grid lg:max-w-none lg:grid-cols-2 lg:px-0"
>
	<Button href="/auth/signup" variant="ghost" class="absolute right-4 top-4 md:right-8 md:top-8">
		Sign Up
	</Button>
	<div class="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
		<div
			class="absolute inset-0 bg-cover bg-center"
			style="
				background-image:
					url(https://images.unsplash.com/photo-1463436755683-3f805a9d1192?q=80&w=2074&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D);"
		></div>

		<div class="relative z-20 flex items-center text-xl font-medium">
			<!-- <Command class="mr-2 h-6 w-6" /> -->
			<a href="/" class="flex items-center space-x-1 hover:opacity-80">
				<img src="/logo.png" alt="Verse Logo" class="h-12" />
				<span>Verse</span>
			</a>
		</div>
		<div class="relative z-20 mt-auto">
			<blockquote class="space-y-2">
				<p class="text-lg">Creating Motivation</p>
				<footer class="text-sm">Yippee!</footer>
			</blockquote>
		</div>
	</div>
	<div class="w-full lg:p-8">
		<div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
			<div class="flex flex-col space-y-2 text-center">
				<h1 class="text-2xl font-semibold tracking-tight">Sign in</h1>
			</div>
			<UserAuthForm mode="login" />
			<!--
            <p class="text-muted-foreground px-8 text-center text-sm">
				By clicking continue, you agree to our
				<a href="/terms" class="hover:text-primary underline underline-offset-4">
					Terms of Service
				</a>
				and
				<a href="/privacy" class="hover:text-primary underline underline-offset-4">
					Privacy Policy
				</a>
				.
			</p>
			-->
		</div>
	</div>
</div>
