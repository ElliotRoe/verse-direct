<script lang="ts">
	import Icon from '@iconify/svelte';
	import { Button } from './ui/button';
	import Input from './ui/input/input.svelte';

	type Todo = {
		id: string;
		title: string;
		status: 'completed' | 'pushed' | 'cancelled' | 'pending';
	};

	const exampleTodos: Todo[] = [
		{
			id: '1',
			title: 'Buy groceries',
			status: 'completed'
		},
		{
			id: '2',
			title:
				'Have a really long to do. This is a really long to do. This is a really long to do. This is a really long to do. This is a really long to do.',
			status: 'pushed'
		},
		{
			id: '3',
			title: 'Be happier than yesterday',
			status: 'cancelled'
		},
		{
			id: '4',
			title: 'Have a really long to do',
			status: 'pending'
		}
	];
</script>

{#each exampleTodos as todo, index}
	<div class="flex flex-row items-center gap-2">
		<span class="text-sm text-muted-foreground">{index + 1}.</span>
		<Input defaultValue={todo.title} />
		<Button variant="secondary">
			<Icon icon="ph:trash" />
		</Button>
	</div>
{/each}
