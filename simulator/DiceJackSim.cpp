#include <iostream>
#include <math.h>
#include <chrono>

using namespace std;
using namespace
  std::chrono;

int
  limit = 14, dealerRiskLimit = 11, playerRiskLimit = 11;

int
rollDice ()
{
  int
    min = 1;
  int
    max = 6;
  return rand () % (max - min + 1) + min;
}

int
simDiceJack ()
{
  //declare playerTotal & dealerTotal
  int
    playerTotal = 0;
  int
    dealerTotal = 0;
  //player rolls two fair dice
  playerTotal += rollDice ();
  playerTotal += rollDice ();
  //player hits till playerTotal is >  playerRiskLimit
  while (playerTotal <= playerRiskLimit)
    {
      playerTotal += rollDice ();
    }
  //player loses if over limit
  if (playerTotal > limit)
    {
      return 1;
    }
  //dealer rolls two fair dice
  dealerTotal += rollDice ();
  dealerTotal += rollDice ();
  //dealer hits till dealerTotal is >  dealerRiskLimit
  while (dealerTotal <= dealerRiskLimit)
    {
      dealerTotal += rollDice ();
    }
  //dealer loses if over limit
  if (dealerTotal > limit)
    {
      return 0;
    }
  //dealer wins if dealerTotal is limit or dealerTotal is >= playerTotal
  if (dealerTotal == limit || dealerTotal >= playerTotal)
    {
      return 1;
    }
  return 0;
}


int
main ()
{
  srand (time (0));
  double
    dealerWinCount = 0, totalGames = 0;
  auto
    start = high_resolution_clock::now ();
  for (int i = 0; i < 1000000; i++)
    {
      dealerWinCount += simDiceJack ();
      totalGames++;
    }
  auto
    stop = high_resolution_clock::now ();
  auto
    duration = duration_cast < microseconds > (stop - start);
  cout << "Time taken by function: " << duration.count () << " microseconds"
    << endl;
  cout << "Sim Results:\n";
  cout << "Player will hit when <= " << playerRiskLimit << "!\n";
  cout << "Dealer will hit when <= " << dealerRiskLimit << "!\n";
  cout << "Played " << totalGames << " games of DiceJack!\n";
  cout << "Dealer won " << dealerWinCount << " games of DiceJack!\n";
  cout << "The Dealer has a win rate of " << round (dealerWinCount / totalGames * 100) << "% games of DiceJack!\n";

  return 0;
}