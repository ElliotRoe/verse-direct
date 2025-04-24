import type { Timestamp } from 'firebase/firestore';
import type { EventEmitter } from 'events';

export enum ConnectionState {
	Connecting = 'connecting',
	Connected = 'connected',
	Disconnected = 'disconnected',
	Error = 'error'
}

export interface Message {
	id: string;
	type: 'user' | 'assistant' | 'status';
	content: string;
	timestamp?: Timestamp;
	modality?: 'audio' | 'text';
}

export interface ConversationItem {
	timestamp: Timestamp;
	text: string;
	role: 'assistant' | 'user';
	duration: number;
	audioBlob?: Blob;
}

export interface LiveKitTokenConfig {
	room: string;
	userId: string;
	displayName: string;
	email: string;
	instructions: string;
}

export interface ChatClient {
	// State getters
	messages: Message[];
	currentMessage: string;
	isRecording: boolean;
	connectionState: ConnectionState;
	assistantStream: MediaStream | null;
	userStream: MediaStream | null;
	events?: EventEmitter | null;
	// Derived state
	hasMessages: boolean;

	// Methods
	connect: () => Promise<void>;
	disconnect: () => Promise<void>;
	toggleRecording: () => Promise<void>;

	// Audio control methods
	muteAudio: () => void;
	unmuteAudio: () => void;
	toggleAudioMute: () => boolean;
	isAudioMuted: () => boolean;
}
