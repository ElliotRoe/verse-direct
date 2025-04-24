<script lang="ts">
	import { type Snippet } from 'svelte';
	import {
		ConnectionState,
		type ChatClient,
		type LiveKitTokenConfig
	} from '$lib/types/chat-client';
	import { EventEmitter } from 'events';
	import { LiveKitChatClient } from '$lib/services/livekit-client.svelte';

	interface ChildrenProps {
		connectionState: ConnectionState;
		startSession: (selectedDeviceId: string) => void;
		stopSession: () => void;
		assistantStream: MediaStream | null;
		userStream: MediaStream | null;
		isRecording: boolean;
		toggleRecording: () => void;
		events: EventEmitter | null;
		// Audio control methods
		muteAssistant: () => void;
		unmuteAssistant: () => void;
		toggleAssistantMute: () => boolean;
		isAssistantMuted: () => boolean;
	}

	interface Props {
		config: LiveKitTokenConfig;
		debug?: boolean;
		children?: Snippet<[ChildrenProps]>;
	}

	let { config, children, debug = false }: Props = $props();

	let chatClient = $state.raw<ChatClient | null>(null);
	let connectionState = $derived(chatClient?.connectionState ?? ConnectionState.Disconnected);
	let assistantStream = $derived<MediaStream | null>(chatClient?.assistantStream ?? null);
	let userStream = $derived<MediaStream | null>(chatClient?.userStream ?? null);

	function startSession(selectedDeviceId: string) {
		chatClient = new LiveKitChatClient(config, () => {}, debug);
		chatClient.connect();
	}

	function stopSession() {
		chatClient?.disconnect();
		chatClient = null;
	}
</script>

{#if children}
	{@render children({
		connectionState,
		startSession,
		stopSession,
		assistantStream,
		userStream,
		isRecording: chatClient?.isRecording ?? false,
		toggleRecording: chatClient?.toggleRecording?.bind(chatClient) ?? (() => {}),
		events: chatClient?.events ?? null,
		muteAssistant: chatClient?.muteAudio?.bind(chatClient) ?? (() => {}),
		unmuteAssistant: chatClient?.unmuteAudio?.bind(chatClient) ?? (() => {}),
		toggleAssistantMute: chatClient?.toggleAudioMute?.bind(chatClient) ?? (() => false),
		isAssistantMuted: chatClient?.isAudioMuted?.bind(chatClient) ?? (() => false)
	})}
{/if}
