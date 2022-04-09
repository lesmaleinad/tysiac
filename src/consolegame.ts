import Readline from 'readline';
import { Tysiac, Player, cardCompare, Card, Suit, Value } from '.';
import { bestMoveWithTracking, findBestMove } from './rungame';

const game = new Tysiac(undefined);

function render() {
    function playerToConsole(player: Player) {
        console.log(
            `P${player.id}: `,
            player.cards
                .slice()
                .sort(cardCompare)
                .map((c) => c.suit + c.value)
                .join(', ')
        );
        console.log(`Score: `, player.score);
    }
    for (const i of [0, 1, 2] as const) {
        playerToConsole(game.players[i]);
    }

    console.log('----------------------');
    console.log('-----CURRENT POT------');
    console.log(
        'CARDS: ',
        game.cardPot.cards.map((c) => c.suit + c.value).join(', ')
    );
    console.log('SUIT: ', game.cardPot.suit);
    console.log('TRUMP: ', game.currentTrump);
    console.log();
}

const readline = Readline.createInterface({
    input: process.stdin,
});

async function getInput(question: string): Promise<string> {
    return new Promise((resolve) => {
        console.log(question);
        readline.question(question, resolve);
    });
}

async function getConsoleMove(): Promise<Card> {
    const result = await getInput('Please input a valid card');
    const match = result.match(/^([HDCS])([atkqjn])$/);

    if (match) {
        return {
            suit: match[1] as Suit,
            value: match[2] as Value,
        };
    }

    switch (result) {
        case 'aimove':
            const [bestCard, points] = bestMoveWithTracking(game);
            console.log('Expected points: ', points);
            return bestCard!;
        case 'aibid':
            let [_, [bidPoints, __, ___]] = findBestMove(game);
            console.log('Found points: ', bidPoints);
            if (bidPoints < 100) {
                console.log('P0 is probably screwed. Good luck!');
                bidPoints = 100;
                game.sortedPlayers[0].bid = bidPoints;
            } else {
                let willWin = false;
                bidPoints = bidPoints - (bidPoints % 5);
                while (bidPoints > 100 && !willWin) {
                    console.log('Trying game with bid: ', bidPoints);
                    game.sortedPlayers[0].bid = bidPoints;
                    const [_, [pointsWithBid, __, ___]] = findBestMove(game);
                    if (pointsWithBid > 0) {
                        willWin = true;
                    } else {
                        console.log('Failed, reducing by 5');
                        bidPoints -= 5;
                    }
                }
            }

            console.log('Placed bid: ', bidPoints);
            return getConsoleMove();
        case 'bid':
            const bidString = await getInput('Please enter p0 bid');
            const bid = parseInt(bidString);
            if (!isNaN(bid)) {
                game.sortedPlayers[0].bid = bid;
                console.log('~~ Bid set ~~');
                return getConsoleMove();
            } else {
                console.log('Invalid bid');
                return getConsoleMove();
            }
        default:
            console.log('Not a recognized input');
            return getConsoleMove();
    }
}

(async () => {
    while (true) {
        render();
        const card = await getConsoleMove();
        console.log(card);
        game.sendMove(card);
    }
})();
