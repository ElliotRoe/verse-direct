import {
	getFirestore,
	doc,
	setDoc,
	getDoc,
	collection,
	query,
	where,
	getDocs,
	Timestamp,
	onSnapshot
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { formatISO, parseISO } from 'date-fns';
import { db } from '$lib/firebase';

// Define types for todo artifacts
export interface TodoItem {
	title: string;
	completed: boolean;
}

export interface TodoArtifact {
	id: string;
	type: 'todo';
	createdAt: Timestamp;
	updatedAt: Timestamp;
	date: string; // ISO date string
	items: TodoItem[];
	userId: string;
	status: 'generating' | 'completed';
}

/**
 * Generate a UUID for document IDs
 * @returns A UUID string
 */
function generateUUID(): string {
	return crypto.randomUUID();
}

/**
 * Save todos to Firestore
 * @param todos Array of todo items
 * @param date Optional date, defaults to today
 * @param status Optional status, defaults to 'completed'
 * @returns Promise resolving to void
 */
export async function saveTodos(
	uuid: string,
	todos: TodoItem[],
	date: Date = new Date(),
	status: 'generating' | 'completed' = 'completed'
): Promise<void> {
	// Format date as ISO string but trim time components
	const dateString = formatISO(date).split('T')[0];

	// Get todos for this date to check if we need to update or create
	const existingTodos = await getTodosForDate(uuid, date);

	if (existingTodos.length > 0) {
		// Update existing todo
		const todoRef = doc(db, `users/${uuid}/artifacts/${existingTodos[0].id}`);
		await setDoc(
			todoRef,
			{
				items: todos,
				updatedAt: Timestamp.now(),
				status
			},
			{ merge: true }
		);
	} else {
		// Create a new todo with UUID
		const todoId = generateUUID();
		const todoData: TodoArtifact = {
			id: todoId,
			type: 'todo',
			createdAt: Timestamp.now(),
			updatedAt: Timestamp.now(),
			date: dateString,
			items: todos,
			userId: uuid,
			status
		};

		const todoRef = doc(db, `users/${uuid}/artifacts/${todoId}`);
		await setDoc(todoRef, todoData);
	}
}

/**
 * Get todos for a specific date
 * @param date The date to get todos for, defaults to today
 * @returns Promise resolving to array of todo items
 */
export async function getTodos(
	uuid: string,
	date: Date = new Date()
): Promise<TodoArtifact | null> {
	const todoArtifacts = await getTodosForDate(uuid, date);

	if (todoArtifacts.length > 0) {
		return todoArtifacts[0];
	}

	// Return empty array if no todos found
	return null;
}

/**
 * Get todo artifacts for a specific date
 * @param date The date to get todos for
 * @returns Promise resolving to array of todo artifacts
 */
async function getTodosForDate(uuid: string, date: Date): Promise<TodoArtifact[]> {
	// Format date as ISO string but trim time components
	const dateString = formatISO(date).split('T')[0];

	const artifactsRef = collection(db, `users/${uuid}/artifacts`);
	const q = query(artifactsRef, where('type', '==', 'todo'), where('date', '==', dateString));

	const querySnapshot = await getDocs(q);
	const todos: TodoArtifact[] = [];

	querySnapshot.forEach((doc) => {
		todos.push(doc.data() as TodoArtifact);
	});

	return todos;
}

/**
 * Get all todos within a date range
 * @param startDate Beginning of the date range
 * @param endDate End of the date range
 * @returns Promise resolving to array of todo artifacts
 */
export async function getTodosInRange(
	userId: string,
	startDate: Date,
	endDate: Date
): Promise<TodoArtifact[]> {
	const db = getFirestore();

	// Format dates as ISO strings but trim time components
	const startDateString = formatISO(startDate).split('T')[0];
	const endDateString = formatISO(endDate).split('T')[0];

	const artifactsRef = collection(db, `users/${userId}/artifacts`);
	const q = query(
		artifactsRef,
		where('type', '==', 'todo'),
		where('date', '>=', startDateString),
		where('date', '<=', endDateString)
	);

	const querySnapshot = await getDocs(q);
	const todos: TodoArtifact[] = [];

	querySnapshot.forEach((doc) => {
		todos.push(doc.data() as TodoArtifact);
	});

	return todos;
}

export function monitorTodoStatus(uuid: string, date: Date) {
	let status = $state<'generating' | 'completed' | null>(null);
	let unsubscribe: (() => void) | null = null;

	(async () => {
		const dateString = formatISO(date).split('T')[0];
		const artifactsRef = collection(db, `users/${uuid}/artifacts`);
		const q = query(artifactsRef, where('type', '==', 'todo'), where('date', '==', dateString));
		const querySnapshot = await getDocs(q);

		if (!querySnapshot.empty) {
			const docId = querySnapshot.docs[0].id;
			const todoDocRef = doc(db, `users/${uuid}/artifacts/${docId}`);
			unsubscribe = onSnapshot(todoDocRef, (docSnap) => {
				const data = docSnap.data() as TodoArtifact | undefined;
				status = data?.status ?? null;
			});
		} else {
			status = null;
		}
	})();

	return {
		status,
		unsubscribe: () => {
			if (unsubscribe) unsubscribe();
		}
	};
}
