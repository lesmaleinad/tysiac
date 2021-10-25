export enum Suit {
    Hearts = 'H',
    Diamonds = 'D',
    Clubs = 'C',
    Spades = 'S',
}

export enum Value {
    Ace = 'a',
    Ten = 't',
    King = 'k',
    Queen = 'q',
    Jack = 'j',
    Nine = 'n',
}

export const valueToPoints: { [key in Value]: number } = {
    [Value.Ace]: 11,
    [Value.Ten]: 10,
    [Value.King]: 4,
    [Value.Queen]: 3,
    [Value.Jack]: 2,
    [Value.Nine]: 0,
};

export const suitToMarriagePoints: { [key in Suit]: number } = {
    [Suit.Hearts]: 100,
    [Suit.Diamonds]: 80,
    [Suit.Clubs]: 60,
    [Suit.Spades]: 40,
};

/**
 * @returns positive if c2 is better, else negative
 */
export function cardCompare(c1: Card, c2: Card, led?: Suit, trump?: Suit) {
    if ((c1.suit === trump) !== (c2.suit === trump)) {
        return c2.suit === trump ? 1 : -1;
    }

    if ((c1.suit === led) !== (c2.suit === led)) {
        return c2.suit === led ? 1 : -1;
    }

    return valueToPoints[c2.value] - valueToPoints[c1.value];
}

export function equalCards(c1: Card, c2: Card): boolean {
    return c1.value === c2.value && c1.suit === c2.suit;
}

export interface Card {
    suit: Suit;
    value: Value;
}

export const allCards: Card[] = (() => {
    const cards: Card[] = [];
    for (const suit of Object.values(Suit)) {
        for (const value of Object.values(Value)) {
            cards.push({ suit, value });
        }
    }
    return cards;
})();

export interface CardPot {
    suit: Suit | undefined;
    cards: Card[];
}

export class Player {
    public get cards(): readonly Card[] {
        return this._cards;
    }

    constructor(
        public readonly id: PlayerIndex,
        private _cards: readonly Card[] = [],
        public bid?: number,
        public score: number = 0
    ) {}

    public hasCard(card: Card) {
        return this.cards.some((c) => equalCards(c, card));
    }

    public hasOtherCardForMarriage(card: Card): Boolean {
        switch (card.value) {
            case Value.King:
                return this.hasCard({
                    value: Value.Queen,
                    suit: card.suit,
                });
            case Value.Queen:
                return this.hasCard({
                    value: Value.King,
                    suit: card.suit,
                });
            default:
                return false;
        }
    }

    public removeCard(card: Card) {
        this._cards = this.cards.filter((c) => !equalCards(c, card));
    }

    public toString() {
        return this.cards.map((c) => c.suit + c.value).join(',');
    }

    public copy() {
        return new Player(this.id, this.cards, this.bid, this.score);
    }
}

export type PlayerIndex = 0 | 1 | 2;
export type TysiacPlayers = readonly [Player, Player, Player];

export class Tysiac {
    public players: TysiacPlayers;
    public get sortedPlayers(): TysiacPlayers {
        return this.players.slice().sort((p1, p2) => p1.id - p2.id) as [
            Player,
            Player,
            Player
        ];
    }

    public get resolvedSortedScores(): [number, number, number] {
        return this.sortedPlayers.map((p) =>
            p.bid ? (p.bid <= p.score ? p.bid : -p.bid) : p.score
        ) as [number, number, number];
    }

    public get currentTrump(): Suit | undefined {
        return this._currentTrump;
    }

    public get currentPlayer(): Player {
        return this.players[this._currentPlayerIndex];
    }

    public get isNewTrick(): boolean {
        return this._currentPlayerIndex === 0;
    }

    constructor(
        cards?: Card[],
        bid?: number,
        private _currentTrump?: Suit,
        private _currentPlayerIndex: PlayerIndex = 0,
        public readonly cardPot: CardPot = { cards: [], suit: undefined },
        initialPlayers?: TysiacPlayers
    ) {
        this.players = initialPlayers ?? this.initPlayers(cards, bid);
    }

    private initPlayers(cards?: Card[], bid?: number): TysiacPlayers {
        const shuffledCards = cards || this.shuffle(allCards);
        const third = Math.floor(shuffledCards.length / 3);
        const twoThird = shuffledCards.length - third;
        return [
            new Player(0, shuffledCards.slice(0, third), bid),
            new Player(1, shuffledCards.slice(third, twoThird)),
            new Player(2, shuffledCards.slice(twoThird)),
        ] as const;
    }

    private shuffle<T>(cards: T[]): T[] {
        const array = cards.slice();
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j]!, array[i]!];
        }
        return array;
    }

    private getWinningCardIndex(cards: Card[], trump?: Suit): PlayerIndex {
        if (cards.length !== 3) {
            console.error(this, cards, trump);
            throw new Error('Winning card decided from more than 3');
        }

        let winningIndex: PlayerIndex = 0;
        const ledSuit = cards[0]!.suit;

        for (const i of [1, 2] as const) {
            if (
                cardCompare(cards[winningIndex]!, cards[i]!, ledSuit, trump) > 0
            ) {
                winningIndex = i;
            }
        }

        return winningIndex;
    }

    public getCardOwner(lookupCard: Card): Player | undefined {
        return this.players.find((player) =>
            player.cards.some((card) => equalCards(card, lookupCard))
        );
    }

    private checkTrickFinished() {
        if (this.cardPot.cards.length === 3) {
            this.finishTrick();
        } else {
            this._currentPlayerIndex++;

            if (this._currentPlayerIndex > 2) {
                console.error(this);
                throw new Error('Too many turns have passed this round');
            }
        }
    }

    private finishTrick() {
        const roundCards = this.cardPot.cards;

        const potPoints = roundCards.reduce(
            (total, c) => total + valueToPoints[c.value],
            0
        );

        const winningPlayerIndex = this.getWinningCardIndex(
            roundCards,
            this.currentTrump
        );

        this.players[winningPlayerIndex].score += potPoints;
        this.setFirstPlayer(winningPlayerIndex);
        this.clearPot(this.cardPot);
    }

    private setFirstPlayer(playerIndex: PlayerIndex) {
        const [p1, p2, p3] = this.players;
        switch (playerIndex) {
            case 2:
                this.players = [p3, p1, p2];
                break;
            case 1:
                this.players = [p2, p3, p1];
            case 0:
                break;
        }
        this._currentPlayerIndex = 0;
    }

    private clearPot(
        cardPot: CardPot
    ): asserts cardPot is { cards: []; suit: undefined } {
        cardPot.cards = [];
        cardPot.suit = undefined;
    }

    public sendMove(card: Card) {
        if (this.currentPlayer.hasCard(card) && this.isValidMove(card)) {
            this.cardPot.suit ??= card.suit;
            this.cardPot.cards.push(card);
            this.currentPlayer.removeCard(card);

            if (
                this.cardPot.cards.length === 1 &&
                this.currentPlayer.cards.length < 7 &&
                this.currentPlayer.hasOtherCardForMarriage(card)
            ) {
                this._currentTrump = card.suit;
                this.currentPlayer.score += suitToMarriagePoints[card.suit];
            }
            this.checkTrickFinished();
        } else {
            console.error('Invalid move', this, card);
        }
    }

    public isValidMove(card: Card): boolean {
        const cardSuit = card.suit;
        const currentSuit = this.cardPot.suit;
        return (
            !currentSuit ||
            cardSuit === currentSuit ||
            this.currentPlayer.cards.every((c) => c.suit !== currentSuit)
        );
    }

    public copy() {
        return new Tysiac(
            undefined,
            undefined,
            this.currentTrump,
            this._currentPlayerIndex,
            { suit: this.cardPot.suit, cards: this.cardPot.cards.slice() },
            this.players.map((p) => p.copy()) as [Player, Player, Player]
        );
    }
}
