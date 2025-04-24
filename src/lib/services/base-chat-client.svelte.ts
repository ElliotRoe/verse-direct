import { ConnectionState, type ChatClient, type Message } from '$lib/types/chat-client';

export abstract class BaseChatClient implements ChatClient {
	// Core state
	public messages = $state<Message[]>([]);
	public assistantStream = $state<MediaStream | null>(null);
	public userStream = $state<MediaStream | null>(null);
	public currentMessage = $state('');
	public isRecording = $state(true);
	public connectionState = $state(ConnectionState.Disconnected);

	// Internal state using raw since they don't need deep reactivity
	protected messageMap = $state.raw(new Map<string, Message>());
	// Derived state
	public hasMessages = $derived(this.messages.length > 0);

	constructor() {}

	// Required abstract methods that must be implemented by subclasses
	abstract connect(): Promise<void>;
	abstract disconnect(): Promise<void>;
	abstract sendMessage(message: string): Promise<void>;
	abstract muteAudio(): void;
	abstract unmuteAudio(): void;
	abstract toggleAudioMute(): boolean;
	abstract isAudioMuted(): boolean;

	public async stopRecording() {
		this.isRecording = false;
	}

	public async startRecording() {
		this.isRecording = true;
	}

	async toggleRecording() {
		if (this.isRecording) {
			await this.stopRecording();
		} else {
			await this.startRecording();
		}
	}

	protected addMessage(message: Message) {
		this.messageMap.set(message.id, message);
		this.messages = Array.from(this.messageMap.values());
	}

	protected clearMessages() {
		this.messageMap.clear();
		this.messages = [];
	}
}
