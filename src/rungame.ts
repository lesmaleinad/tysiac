import Readline from 'readline';
import { Tysiac, Card, Suit, Value, cardCompare, Player } from './index';
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
let numOfScenes: number = 0;

// interface GameScene {
//     game: Tysiac;
//     intitialCard: Card;
// }

// function findBestMoveNR() {
//     const gameStack = [];
//     let bestCard: Card | undefined;
//     let bestGameScores: [number, number, number];
// }

function findBestMove(
    currentGame: Tysiac
): [Card | undefined, [number, number, number]] {
    numOfScenes++;

    let bestPoints = -Infinity;
    let playerPoints: [number, number, number] = [0, 0, 0];
    let bestCard: Card | undefined;
    const currentPlayer = currentGame.currentPlayer;
    const currentId = currentPlayer.id;

    if (currentGame.currentPlayer.cards.length === 0) {
        return [bestCard, currentGame.resolvedSortedScores];
    }

    if (currentGame.isNewTrick && !currentGame.currentTrump) {
        const [_, p2, p3] = currentGame.players;
        const unbeatableCards = currentPlayer.cards.filter(
            (c) =>
                p2.cards.every((c2) => cardCompare(c, c2, c.suit) < 0) &&
                p3.cards.every((c3) => cardCompare(c, c3, c.suit) < 0)
        );
        if (unbeatableCards.length > 0) {
            const definetlyGoingToWinCard =
                unbeatableCards.sort(cardCompare)[0]!;
            const gameCopy = currentGame.copy();
            gameCopy.sendMove(definetlyGoingToWinCard);
            const [_, points] = findBestMove(gameCopy);
            return [definetlyGoingToWinCard, points];
        }
    }

    const validMoves = currentPlayer.cards.filter((c) =>
        currentGame.isValidMove(c)
    );
    for (const card of validMoves) {
        const gameCopy = currentGame.copy();
        gameCopy.sendMove(card);
        const [_, allPlayersPoints] = findBestMove(gameCopy);
        const totalPoints = allPlayersPoints.reduce(
            (acc, points, i) => acc + (i === currentId ? points : -(points / 2))
        );
        if (bestPoints < totalPoints) {
            bestPoints = totalPoints;
            bestCard = card;
            playerPoints = allPlayersPoints;
        }
    }

    return [bestCard, playerPoints];
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

async function getMove(): Promise<Card> {
    const result = await getInput('Please input a valid card');
    const match = result.match(/^([HDCS])([atkqjn])$/);

    if (match) {
        return {
            suit: match[1] as Suit,
            value: match[2] as Value,
        };
    } else if (result === 'sequence') {
        const [bestCard, points] = findBestMove(game);
        if (!game.players[0].bid && game.players[0].cards.length === 8) {
            const bid = Math.max(100, points[0] - (points[0] % 5));
            game.players[0].bid = bid;

            console.log('Number of scenes: ', numOfScenes);
            numOfScenes = 0;
            console.log('Bid of ', bid, ' was made');
            console.log('Best points possible: ', points);

            return getMove();
        }
        console.log('Number of scenes: ', numOfScenes);
        numOfScenes = 0;
        console.log('Expected points: ', points);
        return bestCard!;
    } else if (result === 'bid') {
        const isInt = (s: string | number): s is number => {
            return !!parseInt(`${s}`);
        };

        const bidString = await getInput('Please enter p0 bid');
        const bid = parseInt(bidString);
        if (!isNaN(bid)) {
            game.sortedPlayers[0].bid = bid;
            console.log('~~ Bid set ~~');
            return getMove();
        } else {
            console.log('Invalid bid');
            return getMove();
        }
    } else {
        console.log('Not a recognized input');
        return getMove();
    }
}

(async () => {
    while (true) {
        render();
        const card = await getMove();
        console.log(card);
        game.sendMove(card);
    }
})();
