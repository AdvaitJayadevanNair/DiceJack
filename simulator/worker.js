const { parentPort, workerData  } = require("worker_threads");

const { gamesPerThread, limit, dealerRiskLimit, playerRiskLimit } = workerData;

//returns number in human readable string
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

//returns pseudorandom fair die face value
function rollDice(){
	min = 1;
	max = 6;
	return Math.floor(Math.random() * (max - min + 1) + min);
}

//returns 1 if dealer wins else 0
function simDiceJack(){
	//declare playerTotal & dealerTotal
	let playerTotal = 0;
	let dealerTotal = 0;
	//player rolls two fair dice
	playerTotal += rollDice();
	playerTotal += rollDice();
	//player hits till playerTotal is >  playerRiskLimit
	while(playerTotal <= playerRiskLimit){
		playerTotal += rollDice();
	}
	//player loses if over limit
	if(playerTotal > limit){
		return 1;
	}
	//dealer rolls two fair dice
	dealerTotal += rollDice();
	dealerTotal += rollDice();
	//dealer hits till dealerTotal is >  dealerRiskLimit
	while(dealerTotal <= dealerRiskLimit){
		dealerTotal += rollDice();
	}
	//dealer loses if over limit
	if(dealerTotal > limit){
		return 0;
	}
	//dealer wins if dealerTotal is limit or dealerTotal is >= playerTotal
	if(dealerTotal == limit || dealerTotal >= playerTotal){
		return 1;
	}
	return 0;
}

let dealerWinCount = 0;
for(let i = 0; i < workerData.gamesPerThread; i++){
	dealerWinCount += simDiceJack();
}
parentPort.postMessage(dealerWinCount);