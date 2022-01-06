import App from './App.svelte';

const app = new App({
	target: document.body,
	props: {
		limit: 15,
	}
});

export default app;