import { allCards, Card, cardCompare, Suit, Tysiac } from './index';

function assertTruthy<T>(thing: T | undefined | null): asserts thing is T {
    expect(thing).toBeTruthy();
}

test('Tysiac should deal every card, 8 to each player', () => {
    const game = new Tysiac();

    for (const player of game.players) {
        expect(player.cards.length).toBe(8);
    }

    for (const card of allCards) {
        expect(game.getCardOwner(card)).toBeTruthy();
    }
});

test('Tysiac should allow players to play their cards', () => {
    const game = new Tysiac();
    const originalPlayers = game.players;
    const [p1, p2, p3] = originalPlayers;

    function findMostValuableCard(cards: readonly Card[]): Card {
        const card = cards.slice().sort(cardCompare)[0];
        assertTruthy(card);
        return card;
    }

    function findValidCard(cards: readonly Card[], suit?: Suit): Card {
        const suitCards = suit ? cards.filter((c) => c.suit === suit) : cards;
        return findMostValuableCard(suitCards.length === 0 ? cards : suitCards);
    }

    expect(game.currentPlayer).toBe(p1);
    expect(game.currentTrump).toBe(undefined);

    const p1HighestValueCard = findMostValuableCard(p1.cards);
    game.sendMove(p1HighestValueCard);
    expect(game.cardPot.cards).toContain(p1HighestValueCard);
    expect(game.cardPot.suit).toBe(p1HighestValueCard.suit);
    expect(p1.cards).not.toContain(p1HighestValueCard);
    expect(game.currentPlayer).toBe(p2);

    const nextP2Card = findValidCard(p2.cards, game.cardPot.suit);

    game.sendMove(nextP2Card);
    expect(game.cardPot.cards).toContain(p1HighestValueCard);
    expect(game.cardPot.cards).toContain(nextP2Card);
    expect(game.cardPot.suit).toBe(p1HighestValueCard.suit);
    for (const player of game.players) {
        expect(player.cards).not.toContain(nextP2Card);
    }
    expect(p1.cards).toHaveLength(7);
    expect(p2.cards).toHaveLength(7);
    expect(p3.cards).toHaveLength(8);
    expect(game.currentPlayer).toBe(p3);

    const nextP3Card = findValidCard(p3.cards, nextP2Card.suit);

    game.sendMove(nextP3Card);
    for (const player of game.players) {
        expect(player.cards).not.toContain(nextP3Card);
    }

    const playedCards = [p1HighestValueCard, nextP2Card, nextP3Card] as const;

    const bestCard = playedCards.reduce((prevCard, card) =>
        cardCompare(prevCard, card, p1HighestValueCard.suit) > 0
            ? card
            : prevCard
    );

    const bestCardIndex = playedCards.indexOf(bestCard);
    expect(bestCardIndex).not.toBe(-1);
    expect(originalPlayers[bestCardIndex]).toBe(game.players[0]);
});
