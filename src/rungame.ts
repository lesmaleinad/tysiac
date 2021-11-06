import { Tysiac, Card, cardCompare } from './index';

let numOfScenes = 0;

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
            (acc, points, i) =>
                acc + (i === currentId ? points : -(points / 2)),
            0
        );
        if (bestPoints < totalPoints) {
            bestPoints = totalPoints;
            bestCard = card;
            playerPoints = allPlayersPoints;
        }
    }

    return [bestCard, playerPoints];
}

export function bestMoveWithTracking(
    game: Tysiac
): [Card | undefined, [number, number, number]] {
    numOfScenes = 0;
    const result = findBestMove(game);
    console.log(numOfScenes);
    return result;
}
