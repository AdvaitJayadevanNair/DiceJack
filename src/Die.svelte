<script>
	import { fade } from 'svelte/transition';
	import { elasticOut } from 'svelte/easing';

	let visible = false;

	setTimeout(() => visible = true, 1000);

	function roll(node, {
		delay = 0,
		duration = 3000,
		face = 1, 
	}) {
		return {
			duration,
			css: t => {
				let faces = [
					0,
					[1,1,1,0],
					[0,1,0,180],
					[1,0,0,270],
					[0,1,0,90],
					[0,1,0,270],
					[1,0,0,90],
				];

				const eased = elasticOut(t);

				return `
					transform: rotate3d(1, 1, 1, ${eased * 1080}deg) scale(${eased});
					color: hsl(
						${Math.trunc(t * 360)},
						${Math.min(100, 1000 - 1000 * t)}%,
						${Math.min(50, 500 - 500 * t)}%
					);`
			}
		};
	}
</script>

{#if visible}
	<div class="dice" in:roll="{{ face: 2 }}">
		<div class="face front"></div>
		<div class="face back"></div>
		<div class="face left"></div>
		<div class="face right"></div>
		<div class="face top"></div>
		<div class="face bottom"></div>
	</div>
{/if}



<style>
	.dice {
		margin-top: 50px;
		margin-left: 100px;
		width: 100px;
		height: 100px;
		transform-style: preserve-3d;
		/*transform: rotate3d(1, 1, 1, 45deg);*/
	}
	.face {
		width: 100%;
		height: 100%;
		position: absolute;
		font-size: 20px;
		color: #fff;
	}

	.front {
		background: url(/1.svg);
		transform: translateZ(50px);
	}
	.back {
		background: url(/2.svg);
		transform: rotateY(180deg) translateZ(50px);
	}
	.right {
		background: url(/5.svg);
		transform: rotateY(90deg) translateZ(50px);
	}
	.left {
		background: url(/4.svg);
		transform: rotateY(-90deg) translateZ(50px);
	}
	.top {
		background: url(/3.svg);
		transform: rotateX(90deg) translateZ(50px);
	}
	.bottom {
		background: url(/6.svg);
		transform: rotateX(-90deg) translateZ(50px);
	}
</style>
