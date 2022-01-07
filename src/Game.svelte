<script>
	import { onMount } from 'svelte';
	import Die from './Die.svelte';
	import { playerDice, dealerDice } from './stores.js';
	import { get } from 'svelte/store';

	//config
	const limit = 14;
	const dealerLimit = 11;
	const drigKey = 'KeyL';
	const prigKey = 'KeyP';
	const infoKey = 'KeyI';

	let drig = false;
	let prig = false;
	let info = false;
	let playerTotal = -1;
	let dealerTotal = -1;
	let win = -1;
	let dealerWinCount = 0;
	let total = 0;

	onMount(() => {
		document.addEventListener('keyup', (e) => {
			switch(e.code){
				case drigKey:
					drig = !drig;
				break;
				case prigKey:
					prig = !prig;
				break;
				case infoKey:
					info = !info;
				break;
			}
		});
	});

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
		if(prig){
			value.push(getRandomIntInclusive(3, 5));
			value.push(getRandomIntInclusive(4, 6));
		} else{
			value.push(getRandomIntInclusive(1, 6));
			value.push(getRandomIntInclusive(1, 6));
		}

		playerDice.set(value);
	}

	function hit() {
		let value = get(playerDice);
		if(prig){
			value.push(limit - value.reduce((t, x) => t + x));
		} else{
			value.push(getRandomIntInclusive(1, 6));
		}
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
			if(drig){
				value.push(limit - value.reduce((t, x) => t + x));
			} else{
				value.push(getRandomIntInclusive(1, 6));
			}
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
		if(drig){
			value.push(getRandomIntInclusive(4, 6));
			value.push(getRandomIntInclusive(4, 5));
		} else{
			value.push(getRandomIntInclusive(1, 6));
			value.push(getRandomIntInclusive(1, 6));
		}
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
		dealerWinCount += win;
		total++;
		win = -1;
	}
</script>

{#if win == -1} {#if playerTotal > 0}

<h1>Player Dice Rolls:</h1>
<ul class="wrap">
	{#each $playerDice as die}

	<Die face="{die}" />

	{/each}
</ul>
<h3>Total: {playerTotal}</h3>
{#if dealerTotal > 0}

<h1>Dealer Dice Rolls:</h1>
<ul class="wrap">
	{#each $dealerDice as die}

	<Die face="{die}" />

	{/each}
</ul>
<h3>Total: {dealerTotal}</h3>

{:else}

<button on:click="{hit}" disabled="{playerTotal > limit}"><h1>Hit</h1></button>
<button on:click="{keep}" disabled="{playerTotal > limit}"><h1>Keep</h1></button>

{/if} {:else}
<h2>
	<h1>DiceJack</h1>
	- “BlackJack, but with dice”
</h2>

<h3>Rules:</h3>
<ul>
	<li>Player must get a higher total than dealer without going over {limit}!</li>
	<li>The dealer will hit till he gets 12 or higher!</li>
	<li>The player wins if dealer goes over {limit}!</li>
	<li>The dealer wins if player goes over {limit} or ties!</li>
</ul>

<button on:click="{play}"><h1>Play</h1></button>
{/if} {:else if win == 0}
<h1>Player wins!</h1>
<button on:click="{reset}"><h1>Reset</h1></button>
{:else if win == 1}
<h1>Dealer wins!</h1>
<button on:click="{reset}"><h1>Reset</h1></button>
{/if}


{#if drig}
	<a class="green"></a>
{/if}

{#if prig}
	<a class="red"></a>
{/if}

{#if info}
	<p>Dealer: {dealerWinCount} / {total}</p>
{/if}
<style>
	.wrap {
		display: flex;
		flex-wrap: wrap;
	}
	.green{
		position: fixed;
		top: 0;
		left: 0;
		width: 120px;
		height: 1px;
		background-color: black;
	}
	.red{
		position: fixed;
		top: 0;
		right: 0;
		width: 120px;
		height: 1px;
		background-color: black;
	}
</style>
