import { allCards, Tysiac } from './index';

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
    expect(game.currentLeader).toBe(game.players[0]);
});
