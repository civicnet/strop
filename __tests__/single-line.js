'use strict';

const StrOP = require('..');

const tag = new StrOP('Single-line');


describe('tag', () => {
    it('is empty', () => {
        expect(`${ tag`` }`).toEqual('');
    });

    it('does not trim', () => {
        expect(`${ tag` ` }`).toEqual(' ');
    });

    it('preserves raw text', () => {
        expect(`${ tag`\t` }`).toEqual('\\t');
    });

    it('interpolates', () => {
        expect(`${ tag`${ 42 }` }`).toEqual('42');
    });

    it('preserves padding', () => {
        expect(`${ tag` before ${ '&' } after ` }`).toEqual(' before & after ');
    });

    it('is unchanged', () => {
        expect(`${ tag`${ undefined } ${ null }` }`).toMatchSnapshot();
        expect(`${ tag`${ false } ${ true }` }`).toMatchSnapshot();
        expect(`${ tag`${ NaN } ${ 0 } ${ 42 } ${ Infinity }` }`).toMatchSnapshot();
        expect(`${ tag`${ '' } ${ ' ' } ${ 'text' }` }`).toMatchSnapshot();
    });
});
