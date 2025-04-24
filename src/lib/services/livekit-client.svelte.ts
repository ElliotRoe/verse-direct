import {
	type Message,
	type ConversationItem,
	ConnectionState,
	type LiveKitTokenConfig
} from '$lib/types/chat-client';
import { BaseChatClient } from './base-chat-client.svelte';
import { Timestamp } from 'firebase/firestore';
import { EventEmitter } from 'events';
import { Room, RoomEvent, Track, type RemoteParticipant, type RemoteTrack } from 'livekit-client';
import { PUBLIC_LIVEKIT_URL } from '$env/static/public';

export class LiveKitChatClient extends BaseChatClient {
	private readonly config: LiveKitTokenConfig;
	private room: Room;
	private wsUrl: string;
	private audioElement: HTMLAudioElement | null = null;
	private audioMuted: boolean = false;
	public events: EventEmitter = new EventEmitter();
	private debug: boolean = false;
	private onError?: (message: string, waitTimeMinutes: number | null) => void;
	private connectionMonitorInterval: number | null = null;
	private currentUserMessage: Message | null = null;

	private readonly audioConstraints = {
		echoCancellation: true,
		noiseSuppression: true,
		sampleRate: 48000,
		channelCount: 1,
		autoGainControl: true
	};

	constructor(
		config: LiveKitTokenConfig,
		onError?: (message: string, waitTimeMinutes: number | null) => void,
		debug: boolean = false
	) {
		super();
		this.config = config;
		this.wsUrl = PUBLIC_LIVEKIT_URL;
		this.room = new Room();
		this.debug = debug;
		this.onError = onError;
		// Setup audio element, but don't connect yet
		this.setupAudioElement();
		// Start connection monitoring
		this.startConnectionMonitoring();

		if (this.debug) {
			console.log('LiveKitChatClient initialized in debug mode');
		}
	}

	private async connectRoom(): Promise<void> {
		try {
			// Get token and connect
			const token = await this.getToken();
			await this.room.connect(this.wsUrl, token);

			// Now set up room event handlers after connection
			this.setupRoom();

			// Enable microphone after everything is set up
			await this.room.localParticipant.setMicrophoneEnabled(true);

			// Create userStream for local audio
			this.updateUserStream();

			this.connectionState = ConnectionState.Connected;
		} catch (error) {
			console.error('Error connecting to LiveKit room:', error);
			this.connectionState = ConnectionState.Error;
		}
	}

	/**
	 * Updates the userStream with current local audio tracks
	 */
	private updateUserStream(): void {
		// Create a new MediaStream for user audio
		this.userStream = new MediaStream();

		// Get local audio publications
		const audioPublications = Array.from(
			this.room.localParticipant.trackPublications.values()
		).filter((pub) => pub.kind === Track.Kind.Audio && pub.track);

		// Add tracks to the userStream
		for (const pub of audioPublications) {
			if (pub.track) {
				this.userStream.addTrack(pub.track.mediaStreamTrack);
				if (this.debug) console.log('Added local audio track to userStream');
			}
		}
	}

	private setupRoom(): void {
		// Listen for audio playback status changes
		this.room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
			if (!this.room.canPlaybackAudio) {
				if (this.debug) console.log('Audio playback requires user interaction');
				// You should notify the UI that user interaction is needed
				this.events.emit('audio_playback_blocked');
			} else {
				if (this.debug) console.log('Audio playback is allowed');
				this.events.emit('audio_playback_allowed');
			}
		});

		// Listen for local track publications to update userStream
		this.room.on(RoomEvent.LocalTrackPublished, () => {
			this.updateUserStream();
		});

		// Handle track subscriptions for audio
		this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
			if (track.kind === Track.Kind.Audio) {
				// Create assistantStream if it doesn't exist
				if (!this.assistantStream) {
					this.assistantStream = new MediaStream();
				}

				// Add the track to assistantStream
				this.assistantStream.addTrack(track.mediaStreamTrack);
				if (this.debug) console.log('Added remote audio track to assistantStream');

				// Also attach to audio element for playback
				if (this.audioElement) {
					track.attach(this.audioElement);
					// Ensure the current mute state is applied
					this.audioElement.muted = this.audioMuted;
					if (this.debug) console.log('Remote audio track attached to audio element');
				}
			}
		});

		// Handle track unsubscriptions to remove from assistantStream
		this.room.on(RoomEvent.TrackUnsubscribed, (track) => {
			if (track.kind === Track.Kind.Audio && this.assistantStream) {
				// Find and remove the track from assistantStream
				const mediaTrack = track.mediaStreamTrack;
				this.assistantStream.getTracks().forEach((t) => {
					if (t.id === mediaTrack.id) {
						this.assistantStream?.removeTrack(t);
						if (this.debug) console.log('Removed track from assistantStream');
					}
				});
			}
		});

		// Also check for existing audio tracks that might already be subscribed
		if (this.audioElement) {
			// Access remote participants with proper typing
			Array.from(this.room.remoteParticipants.values()).forEach(
				(participant: RemoteParticipant) => {
					// Get all track publications without type enforcement at first
					const publications = participant.getTrackPublications();

					// Loop through and handle the audio tracks with proper types
					publications.forEach((pub) => {
						// Only audio tracks that are subscribed
						if (pub.track && pub.track.kind === Track.Kind.Audio && pub.isSubscribed) {
							const audioTrack = pub.track as RemoteTrack;

							// Create assistantStream if needed
							if (!this.assistantStream) {
								this.assistantStream = new MediaStream();
							}

							// Add to assistantStream
							this.assistantStream.addTrack(audioTrack.mediaStreamTrack);

							// Also attach to audio element
							audioTrack.attach(this.audioElement!);
							if (this.debug)
								console.log(
									'Existing audio track attached from participant:',
									participant.identity
								);
						}
					});
				}
			);
		}

		// Handle participant connection
		this.room.on(RoomEvent.ParticipantConnected, (participant) => {
			if (this.debug) console.log('Participant connected:', participant.identity);
		});

		// Handle disconnections
		this.room.on(RoomEvent.Disconnected, () => {
			if (this.debug) console.log('Disconnected from room');
			this.connectionState = ConnectionState.Disconnected;
		});
	}

	private setupAudioElement(): void {
		this.audioElement = document.createElement('audio');
		this.audioElement.autoplay = true;
		this.audioElement.muted = this.audioMuted;
		if (this.debug) console.log('Audio element created and configured');
	}

	/**
	 * Start connection monitoring to check for disconnections
	 * and automatically reconnect if needed
	 */
	private startConnectionMonitoring(): void {
		// Clear any existing interval
		if (this.connectionMonitorInterval !== null) {
			window.clearInterval(this.connectionMonitorInterval);
		}

		// Start new monitoring interval
		this.connectionMonitorInterval = window.setInterval(() => {
			if (this.connectionState === ConnectionState.Connected && this.room.state !== 'connected') {
				console.log('LiveKit connection health check failed, attempting reconnection');
				void this.disconnect().then(() => void this.connect());
			}
		}, 5000);
	}

	/**
	 * Change the audio input device
	 * @param deviceId The ID of the audio device to use
	 */
	async setAudioTrack(deviceId: string): Promise<void> {
		if (this.connectionState !== ConnectionState.Connected) {
			throw new Error('Cannot set audio track - connection not active');
		}

		try {
			// Use LiveKit's built-in method to switch the microphone
			await this.room.switchActiveDevice('audioinput', deviceId);

			if (this.debug) console.log('Successfully switched audio device to:', deviceId);
		} catch (error) {
			console.error('Error setting audio track:', error);
			throw error;
		}
	}

	/**
	 * Start audio playback - must be called from a user interaction handler
	 * @returns Promise resolving to whether audio playback is now allowed
	 */
	public async startAudio(): Promise<boolean> {
		try {
			if (!this.room.canPlaybackAudio) {
				await this.room.startAudio();
				if (this.debug) console.log('Audio playback started successfully');
				return true;
			}
			return this.room.canPlaybackAudio;
		} catch (error) {
			console.error('Failed to start audio playback:', error);
			return false;
		}
	}

	/**
	 * Check if audio playback is currently allowed by the browser
	 * @returns boolean indicating if audio can play
	 */
	public canPlayAudio(): boolean {
		return this.room.canPlaybackAudio;
	}

	private async getToken(): Promise<string> {
		try {
			console.log('Getting token for LiveKit', this.config);
			const response = await fetch('/api/token', {
				method: 'POST',
				body: JSON.stringify(this.config)
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to get token');
			}

			const { token } = await response.json();
			return token;
		} catch (error) {
			console.error('Error getting token:', error);
			throw error;
		}
	}

	async connect(): Promise<void> {
		if (this.connectionState !== ConnectionState.Disconnected) {
			if (this.debug) console.log('Disconnecting existing connection before reconnecting');
			await this.disconnect();
		}

		this.connectionState = ConnectionState.Connecting;
		await this.connectRoom();
	}

	async disconnect(): Promise<void> {
		// Clear the monitoring interval
		if (this.connectionMonitorInterval !== null) {
			window.clearInterval(this.connectionMonitorInterval);
			this.connectionMonitorInterval = null;
		}

		// Clean up streams
		this.userStream?.getTracks().forEach((track) => {
			track.stop();
		});
		this.userStream = null;

		this.assistantStream?.getTracks().forEach((track) => {
			track.stop();
		});
		this.assistantStream = null;

		// Disconnect from room
		await this.room.disconnect();

		if (this.audioElement) {
			this.audioElement.srcObject = null;
		}

		this.connectionState = ConnectionState.Disconnected;
		super.clearMessages();
	}

	async sendMessage(message: string): Promise<void> {
		if (!message.trim() || this.connectionState !== ConnectionState.Connected) {
			return;
		}

		const messageId = `user-${Date.now()}`;
		const newMessage: Message = {
			id: messageId,
			type: 'user',
			content: message,
			timestamp: Timestamp.fromDate(new Date())
		};

		this.addMessage(newMessage);
		this.currentUserMessage = newMessage;

		// Send the message through LiveKit's data channel
		// Note: Implement your specific message sending mechanism here
		// For example, you might use room.localParticipant.publishData()
		const messageData = new TextEncoder().encode(message);
		await this.room.localParticipant.publishData(messageData, { reliable: true });
	}

	// Override handleAudioBuffer from BaseChatClient
	protected async handleAudioBuffer(buffer: Int16Array): Promise<void> {
		// For LiveKit, audio is handled through the microphone track directly,
		// so we don't need to do anything special with audio buffers
		console.log('LiveKit handles audio through tracks, not buffers');
	}

	// Override startRecording from BaseChatClient (used as unmute)
	override async startRecording(): Promise<void> {
		await super.startRecording();
		await this.room.localParticipant.setMicrophoneEnabled(true);
		// Update userStream when unmuting
		this.updateUserStream();
		console.log('Microphone unmuted');
	}

	// Override stopRecording from BaseChatClient (used as mute)
	override async stopRecording(): Promise<void> {
		await super.stopRecording();
		await this.room.localParticipant.setMicrophoneEnabled(false);
		console.log('Microphone muted');
	}

	/**
	 * Mutes the assistant's audio output
	 */
	public muteAudio(): void {
		this.audioMuted = true;
		if (this.audioElement) {
			this.audioElement.muted = true;
		}
	}

	/**
	 * Unmutes the assistant's audio output
	 */
	public unmuteAudio(): void {
		this.audioMuted = false;
		if (this.audioElement) {
			this.audioElement.muted = false;
		}
	}

	/**
	 * Toggles the mute state of the assistant's audio output
	 * @returns The new mute state
	 */
	public toggleAudioMute(): boolean {
		if (this.audioMuted) {
			this.unmuteAudio();
		} else {
			this.muteAudio();
		}
		return this.audioMuted;
	}

	/**
	 * Gets the current mute state of the assistant's audio output
	 * @returns True if audio is muted, false otherwise
	 */
	public isAudioMuted(): boolean {
		return this.audioMuted;
	}
}
