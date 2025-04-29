import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { AccessToken, AgentDispatchClient, RoomServiceClient } from 'livekit-server-sdk';
import { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_AGENT_NAME } from '$env/static/private';
import { RoomAgentDispatch, RoomConfiguration } from '@livekit/protocol';
import { PUBLIC_LIVEKIT_URL } from '$env/static/public';
import type { LiveKitTokenConfig } from '$lib/types/chat-client';

export async function POST({ request }: RequestEvent) {
	try {
		const body = await request.json();
		const { room: roomName, userId, instructions, email, displayName }: LiveKitTokenConfig = body;

		console.log('displayName', displayName);

		if (!roomName) {
			return json({ error: 'Missing "room" in request body' }, { status: 400 });
		} else if (!userId) {
			return json({ error: 'Missing "userId" in request body' }, { status: 400 });
		} else if (!instructions) {
			return json({ error: 'Missing "instructions" in request body' }, { status: 400 });
		}

		if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !PUBLIC_LIVEKIT_URL) {
			return json({ error: 'Server misconfigured' }, { status: 500 });
		}

		// Create a user token for the client
		const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, { identity: userId });
		at.addGrant({ room: roomName, roomJoin: true, canPublish: true, canSubscribe: true });
		at.roomConfig = new RoomConfiguration({
			agents: [
				new RoomAgentDispatch({
					agentName: LIVEKIT_AGENT_NAME,
					metadata: JSON.stringify({
						instructions,
						user_email: email,
						user_name: displayName,
						user_id: userId
					})
				})
			]
		});
		const token = await at.toJwt();

		return json(
			{
				token
			},
			{ headers: { 'Cache-Control': 'no-store' } }
		);
	} catch (error) {
		console.error('Error creating room or dispatching agent:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
