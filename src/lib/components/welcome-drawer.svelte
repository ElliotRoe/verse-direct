<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { firebaseUser } from '$lib/authentication';

	let {
		isOpen = $bindable(false),
		instructions = $bindable(''),
		startSession,
		onClose = () => {}
	}: {
		isOpen: boolean;
		instructions: string;
		startSession: (mode: string) => void;
		onClose?: () => void;
	} = $props();

	function handleStartSession() {
		startSession('default');
		isOpen = false;
	}
</script>

<Drawer.Root bind:open={isOpen}>
	<Drawer.Content>
		<div class="mx-auto w-full max-w-md">
			<Drawer.Header class="flex flex-col items-center text-center">
				<Drawer.Title class="font-caveat text-center text-4xl">Headphones Reccomended</Drawer.Title>
				<Drawer.Description class="flex flex-col items-center">
					<img src="/logo-headphones.png" alt="Headphones" class="w-full" />
				</Drawer.Description>
			</Drawer.Header>

			<Drawer.Footer class="mt-auto">
				<Button
					variant="default"
					class="h-[60px] w-full"
					disabled={!instructions || firebaseUser.loading}
					onclick={handleStartSession}
				>
					{#if firebaseUser.loading || !instructions}
						Loading...
					{:else}
						Start Session
					{/if}
				</Button>

				<Drawer.Close>
					<Button variant="outline" class="mt-2 w-full" onclick={onClose}>Cancel</Button>
				</Drawer.Close>
			</Drawer.Footer>
		</div>
	</Drawer.Content>
</Drawer.Root>
