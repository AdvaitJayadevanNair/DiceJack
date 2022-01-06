const { Worker } = require('worker_threads');
let threads = 6;
const games = 10000000000;
const gamesPerThread = games / threads;

const limit = 14;
const dealerRiskLimit = 11;
const playerRiskLimit = 11;

//returns number in human readable string
function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

////returns pseudorandom fair die face value
// function rollDice(){
// 	min = 1;
// 	max = 6;
// 	return Math.floor(Math.random() * (max - min + 1) + min);
// }

////returns 1 if dealer wins else 0
// function simDiceJack(){
// 	//declare playerTotal & dealerTotal
// 	let playerTotal = 0;
// 	let dealerTotal = 0;
// 	//player rolls two fair dice
// 	playerTotal += rollDice();
// 	playerTotal += rollDice();
// 	//player hits till playerTotal is >  playerRiskLimit
// 	while(playerTotal <= playerRiskLimit){
// 		playerTotal += rollDice();
// 	}
// 	//player loses if over limit
// 	if(playerTotal > limit){
// 		return 1;
// 	}
// 	//dealer rolls two fair dice
// 	dealerTotal += rollDice();
// 	dealerTotal += rollDice();
// 	//dealer hits till dealerTotal is >  dealerRiskLimit
// 	while(dealerTotal <= dealerRiskLimit){
// 		dealerTotal += rollDice();
// 	}
// 	//dealer loses if over limit
// 	if(dealerTotal > limit){
// 		return 0;
// 	}
// 	//dealer wins if dealerTotal is limit or dealerTotal is >= playerTotal
// 	if(dealerTotal == limit || dealerTotal >= playerTotal){
// 		return 1;
// 	}
// 	return 0;
// }

let dealerWinCount = 0;
let totalGames = 0;

console.time('Execution Time');

for (let i = 0; i < threads; i++) {
	const port = new Worker(require.resolve('./worker.js'), {
		workerData: { gamesPerThread, limit, dealerRiskLimit, playerRiskLimit },
	});

	port.on('message', (data) => {
		dealerWinCount += data;
		totalGames += gamesPerThread;
	});
	port.on('error', (err) => console.error(err));
	port.on('exit', (code) => {
		console.log('Exit code:', code);
		threads--;
		if(threads == 0){
			console.timeEnd('Execution Time');
			console.log('Sim Results:');
			console.log(`Player will hit when <= ${playerRiskLimit}!`);
			console.log(`Dealer will hit when <= ${dealerRiskLimit}!`);
			console.log(`Played ${numberWithCommas(totalGames)} games of DiceJack!`);
			console.log(`Dealer won ${numberWithCommas(dealerWinCount)} games of DiceJack!`);
			console.log(`The Dealer has a win rate of ${((dealerWinCount / totalGames) * 100).toFixed(2)}% games of DiceJack!`);
		}
	});
}

// for(let i = 0; i < 100000000; i++){
// 	dealerWinCount += simDiceJack();
// 	totalGames++;
// }

// console.timeEnd('Execution Time');
// console.log('Sim Results:');
// console.log(`Player will hit when under ${playerRiskLimit}!`);
// console.log(`Dealer will hit when under ${dealerRiskLimit}!`);
// console.log(`Played ${numberWithCommas(totalGames)} games of DiceJack!`);
// console.log(`Dealer won ${numberWithCommas(dealerWinCount)} games of DiceJack!`);
// console.log(`The Dealer has a win rate of ${((dealerWinCount / totalGames) * 100).toFixed(2)}% games of DiceJack!`);
