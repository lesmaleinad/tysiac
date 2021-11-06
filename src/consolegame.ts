import Readline from 'readline';
import { Tysiac, Player, cardCompare, Card, Suit, Value } from '.';
import { bestMoveWithTracking } from './rungame';

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
    } else if (result === 'sequence') {
        const [bestCard, points] = bestMoveWithTracking(game);
        if (!game.players[0].bid && game.players[0].cards.length === 8) {
            const bid = Math.max(100, points[0] - (points[0] % 5));
            game.players[0].bid = bid;

            console.log('Bid of ', bid, ' was made');
            console.log('Best points possible: ', points);

            return getConsoleMove();
        }

        console.log('Expected points: ', points);
        return bestCard!;
    } else if (result === 'bid') {
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
    } else {
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
