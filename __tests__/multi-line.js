'use strict'

const StrOP = require('..');

const str = new StrOP('Multi-line');

it('trims empty lines', () => {
    expect(`${str` 

    `}`).toEqual('');
});

it('preserves first line', () => {
    expect(`${str` first
    `}`).toEqual(' first');
});

it('preserves last line', () => {
    expect(`${str`
    last `}`).toEqual('last ');
});

it('interpolates', () => {
    expect(`${str`
        text
        ${42}
    `}`).toEqual('text\n42');
});

it('keeps relative indentation', () => {
    expect(`${str`
        text
            ${42}
    `}`).toEqual('text\n    42');
});
