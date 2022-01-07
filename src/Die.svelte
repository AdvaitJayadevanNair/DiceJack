<script>
	import { onMount } from 'svelte';
	export let face = 1;

	let b = Math.random() < 0.5;

	onMount(() => {
		setTimeout(() => {
			b = !b;
			// die.dataset.roll = getRandomNumber(1, 6);
		});
	});

	function getRandomNumber(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
</script>

<div class="die {b ? 'odd-roll' : 'even-roll'}" data-roll="{face}">
	<div class="face front"></div>
	<div class="face back"></div>
	<div class="face left"></div>
	<div class="face right"></div>
	<div class="face top"></div>
	<div class="face bottom"></div>
</div>
<div class="odd-roll" data-roll="{face}"></div>

<style>
	.die {
		margin: 50px;
		width: 100px;
		height: 100px;
		transform-style: preserve-3d;
	}

	.even-roll {
		transition: transform 1.5s ease-out;
	}

	.odd-roll {
		transition: transform 1.25s ease-out;
	}

	.face {
		width: 100%;
		height: 100%;
		position: absolute;
		font-size: 20px;
		color: #fff;
	}

	.even-roll[data-roll='1'] {
		transform: rotateX(360deg) rotateY(720deg) rotateZ(360deg);
	}
	.even-roll[data-roll='2'] {
		transform: rotateX(450deg) rotateY(720deg) rotateZ(360deg);
	}
	.even-roll[data-roll='3'] {
		transform: rotateX(360deg) rotateY(630deg) rotateZ(360deg);
	}
	.even-roll[data-roll='4'] {
		transform: rotateX(360deg) rotateY(810deg) rotateZ(360deg);
	}
	.even-roll[data-roll='5'] {
		transform: rotateX(270deg) rotateY(720deg) rotateZ(360deg);
	}
	.even-roll[data-roll='6'] {
		transform: rotateX(360deg) rotateY(900deg) rotateZ(360deg);
	}
	.odd-roll[data-roll='1'] {
		transform: rotateX(-360deg) rotateY(-720deg) rotateZ(-360deg);
	}
	.odd-roll[data-roll='2'] {
		transform: rotateX(-270deg) rotateY(-720deg) rotateZ(-360deg);
	}
	.odd-roll[data-roll='3'] {
		transform: rotateX(-360deg) rotateY(-810deg) rotateZ(-360deg);
	}
	.odd-roll[data-roll='4'] {
		transform: rotateX(-360deg) rotateY(-630deg) rotateZ(-360deg);
	}
	.odd-roll[data-roll='5'] {
		transform: rotateX(-450deg) rotateY(-720deg) rotateZ(-360deg);
	}
	.odd-roll[data-roll='6'] {
		transform: rotateX(-360deg) rotateY(-900deg) rotateZ(-360deg);
	}
	.front {
		background: url(1.svg);
		transform: rotate3d(0, 0, 0, 90deg) translateZ(50px);
	}
	.back {
		background: url(2.svg);
		transform: rotate3d(-1, 0, 0, 90deg) translateZ(50px);
	}
	.right {
		background: url(3.svg);
		transform: rotate3d(0, 1, 0, 90deg) translateZ(50px);
	}
	.left {
		background: url(4.svg);
		transform: rotate3d(0, -1, 0, 90deg) translateZ(50px);
	}
	.top {
		background: url(5.svg);
		transform: rotate3d(1, 0, 0, 90deg) translateZ(50px);
	}
	.bottom {
		background: url(6.svg);
		transform: rotate3d(1, 0, 0, 180deg) translateZ(50px);
	}
</style>
