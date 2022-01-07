<!-- <script>
	import Die from './Die.svelte';
	import { playerDice, dealerDice } from './stores.js';
	import { get } from 'svelte/store';

	//config
	const limit = 14;
	const dealerLimit = 11;

	let playerTotal = -1;
	let dealerTotal = -1;
	let win = -1;

	playerDice.subscribe((value) => {
		if (value.length > 0) playerTotal = value.reduce((t, x) => t + x);
	});

	dealerDice.subscribe((value) => {
		if (value.length > 0) dealerTotal = value.reduce((t, x) => t + x);
	});

	function getRandomIntInclusive(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1) + min);
	}

	function play() {
		let value = get(playerDice);
		value.push(getRandomIntInclusive(1, 6));
		value.push(getRandomIntInclusive(1, 6));
		playerDice.set(value);
	}

	function hit() {
		let value = get(playerDice);
		value.push(getRandomIntInclusive(1, 6));
		playerDice.set(value);
		setTimeout(() => {
			if (playerTotal > limit) {
				//Dealer wins!
				win = 1;
			}
		}, 1500);
	}

	function dealerHit(value) {
		setTimeout(() => {
			value.push(getRandomIntInclusive(1, 6));
			dealerDice.set(value);
			if (value.reduce((t, x) => t + x) <= playerTotal && value.reduce((t, x) => t + x) <= dealerLimit) {
				dealerHit(value);
			} else {
				setTimeout(() => {
					if (dealerTotal > limit) {
						win = 0;
					} else if (dealerTotal == limit || dealerTotal > playerTotal || dealerTotal == playerTotal) {
						win = 1;
					} else {
						win = 0;
					}
				}, 1500);
			}
		}, 1000);
	}

	function keep() {
		let value = [];
		value.push(getRandomIntInclusive(1, 6));
		value.push(getRandomIntInclusive(1, 6));
		dealerDice.set(value);
		if (value.reduce((t, x) => t + x) <= dealerLimit) {
			dealerHit(value);
		} else {
			setTimeout(() => {
				if (dealerTotal > limit) {
					win = 0;
				} else if (dealerTotal == limit || dealerTotal > playerTotal || dealerTotal == playerTotal) {
					win = 1;
				} else {
					win = 0;
				}
			}, 1500);
		}
	}

	function reset() {
		playerDice.set([]);
		dealerDice.set([]);
		playerTotal = -1;
		dealerTotal = -1;
		win = -1;
	}
</script>

{#if win == -1} {#if playerTotal > 0}
<h1>Player Dice Rolls:</h1>
<ul>
	{#each $playerDice as die}
	<li>{die}</li>
	{/each}
</ul>
<h3>Total: {playerTotal}</h3>
{#if dealerTotal > 0}
<h1>Dealer Dice Rolls:</h1>
<ul>
	{#each $dealerDice as die}
	<li>{die}</li>
	{/each}
</ul>
<h3>Total: {dealerTotal}</h3>
{:else}
<button on:click="{hit}" disabled="{playerTotal > limit}">Hit</button>
<button on:click="{keep}" disabled="{playerTotal > limit}">Keep</button>
{/if} {:else}
<button on:click="{play}">Play</button>
{/if} {:else if win == 0}
<h1>Player wins!</h1>
<button on:click="{reset}">Reset</button>
{:else if win == 1}
<h1>Dealer wins!</h1>
<button on:click="{reset}">Reset</button>
{/if}

<Die face="{5}" />
<Die face="{5}" />

<style>
	.per {
		perspective: 600px;
	}
</style> -->

<script>
	import Game from "./Game.svelte";
</script>

<Game/>