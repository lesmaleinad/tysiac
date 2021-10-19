import Readline from 'readline';
import { PlayerIndex, Tysiac, Card, Suit, Value, cardCompare } from './index';
const game = new Tysiac();

function render() {
    function playerToConsole(index: PlayerIndex) {
        const player = game.players[index];
        console.log(
            `P${index}: `,
            player.cards
                .slice()
                .sort(cardCompare)
                .map((c) => c.suit + c.value)
                .join(', ')
        );
        console.log(`Score: `, player.score);
    }
    for (const i of [0, 1, 2] as const) {
        playerToConsole(i);
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

const readline = Readline.createInterface({ input: process.stdin });
async function getMove(): Promise<Card> {
    return new Promise((resolve) => {
        console.log('Please input a valid card');
        readline.question(
            'Please input a valid card (eg Ha)',
            async (result) => {
                const match = result.match(/^([HDCS])([atkqjn])$/);

                if (match) {
                    resolve({
                        suit: match[1] as Suit,
                        value: match[2] as Value,
                    });
                } else {
                    console.log('Not a recognized input');
                    resolve(await getMove());
                }
            }
        );
    });
}

(async () => {
    while (true) {
        render();
        const card = await getMove();
        console.log(card);
        game.sendMove(card);
    }
})();
