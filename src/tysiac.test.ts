import { allCards, Card, cardCompare, Suit, Tysiac, Value } from './index';

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

it('Should allow score and trump to work as expected', () => {
    const cards: Card[] = [
        // p1
        { suit: Suit.Hearts, value: Value.Ace },
        { suit: Suit.Hearts, value: Value.Ten },
        { suit: Suit.Hearts, value: Value.King },
        { suit: Suit.Hearts, value: Value.Queen },
        { suit: Suit.Diamonds, value: Value.Ten },
        { suit: Suit.Diamonds, value: Value.King },
        { suit: Suit.Diamonds, value: Value.Queen },
        { suit: Suit.Clubs, value: Value.Nine },
        // p2
        { suit: Suit.Hearts, value: Value.Jack },
        { suit: Suit.Hearts, value: Value.Nine },
        { suit: Suit.Diamonds, value: Value.Ace },
        { suit: Suit.Clubs, value: Value.Ten },
        { suit: Suit.Clubs, value: Value.King },
        { suit: Suit.Clubs, value: Value.Queen },
        { suit: Suit.Clubs, value: Value.Jack },
        { suit: Suit.Spades, value: Value.Ace },
        // p3
        { suit: Suit.Diamonds, value: Value.Jack },
        { suit: Suit.Diamonds, value: Value.Nine },
        { suit: Suit.Clubs, value: Value.Ace },
        { suit: Suit.Spades, value: Value.Ten },
        { suit: Suit.Spades, value: Value.King },
        { suit: Suit.Spades, value: Value.Queen },
        { suit: Suit.Spades, value: Value.Jack },
        { suit: Suit.Spades, value: Value.Nine },
    ];
    const game = new Tysiac(cards);

    const [p1, p2, p3] = game.players;
    for (const card of cards.slice(0, 8)) {
        expect(p1.cards).toContain(card);
    }
    for (const card of cards.slice(8, 16)) {
        expect(p2.cards).toContain(card);
    }
    for (const card of cards.slice(16)) {
        expect(p3.cards).toContain(card);
    }

    game.sendMove({ suit: Suit.Hearts, value: Value.King });
    expect(p1.score).toBe(0);
    expect(game.currentTrump).toBe(undefined);
    game.sendMove({ suit: Suit.Hearts, value: Value.Nine });
    game.sendMove({ suit: Suit.Diamonds, value: Value.Nine });

    expect(p1.score).toBe(4);
    expect(p2.score).toBe(0);
    expect(p3.score).toBe(0);
    expect(game.players[0]).toBe(p1);
    expect(game.currentPlayer).toBe(p1);

    game.sendMove({ suit: Suit.Diamonds, value: Value.King });
    expect(p1.score).toBe(84);
    expect(game.currentTrump).toBe(Suit.Diamonds);
    expect(game.currentPlayer).toBe(p2);

    game.sendMove({ suit: Suit.Diamonds, value: Value.Ace });
    game.sendMove({ suit: Suit.Diamonds, value: Value.Jack });

    expect(p1.score).toBe(84);
    expect(p2.score).toBe(17);
    expect(p3.score).toBe(0);
    expect(game.currentTrump).toBe(Suit.Diamonds);
    expect(game.currentPlayer).toBe(p2);

    game.sendMove({ suit: Suit.Spades, value: Value.Ace });
    game.sendMove({ suit: Suit.Spades, value: Value.Nine });
    game.sendMove({ suit: Suit.Diamonds, value: Value.Ten });

    expect(p1.score).toBe(105);
    expect(p2.score).toBe(17);
    expect(p3.score).toBe(0);
    expect(game.currentPlayer).toBe(p1);

    game.sendMove({ suit: Suit.Clubs, value: Value.Nine });
    game.sendMove({ suit: Suit.Clubs, value: Value.Jack });
    game.sendMove({ suit: Suit.Clubs, value: Value.Ace });

    expect(p1.score).toBe(105);
    expect(p2.score).toBe(17);
    expect(p3.score).toBe(13);
    expect(game.currentPlayer).toBe(p3);

    game.sendMove({ suit: Suit.Spades, value: Value.Queen });
    expect(p3.score).toBe(53);
    expect(game.currentTrump).toBe(Suit.Spades);

    game.sendMove({ suit: Suit.Hearts, value: Value.Queen });
    game.sendMove({ suit: Suit.Clubs, value: Value.King });
    expect(game.currentTrump).toBe(Suit.Spades);

    expect(p1.score).toBe(105);
    expect(p2.score).toBe(17);
    expect(p3.score).toBe(63);
    expect(game.currentPlayer).toBe(p3);
});
