export enum Suite {
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

export interface Card {
    suite: Suite;
    value: Value;
}

export const allCards: Card[] = (() => {
    const cards: Card[] = [];
    for (const suite of Object.values(Suite)) {
        for (const value of Object.values(Value)) {
            cards.push({ suite, value });
        }
    }
    return cards;
})();

class Player {
    private _cards: readonly Card[];
    public get cards(): readonly Card[] {
        return this._cards;
    }

    constructor(initalCards: readonly Card[] = []) {
        this._cards = initalCards;
    }
}

export class Tysiac {
    public readonly players: readonly [Player, Player, Player];
    public currentLeader: Player;

    constructor() {
        this.players = this.initPlayers();
        this.currentLeader = this.players[0];
    }

    private initPlayers(): readonly [Player, Player, Player] {
        const shuffledCards = this.shuffle(allCards);
        return [
            new Player(shuffledCards.slice(0, 8)),
            new Player(shuffledCards.slice(8, 16)),
            new Player(shuffledCards.slice(16)),
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

    public getCardOwner(lookupCard: Card): Player | undefined {
        return this.players.find((player) =>
            player.cards.some(
                (card) =>
                    card.value === lookupCard.value &&
                    card.suite === lookupCard.suite
            )
        );
    }
}
