import { writable } from 'svelte/store';

const playerDice = writable([]);
const dealerDice = writable([]);

playerDice.subscribe((value) => {
	console.log("Player", value);
});
dealerDice.subscribe((value) => {
	console.log("Dealer", value);
});

export { playerDice, dealerDice };
