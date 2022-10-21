'use strict'

const StrOP = require('..');

const str = new StrOP('Single-line');

it('is empty', () => {
    expect(`${str``}`).toEqual('');
});

it('does not trim', () => {
    expect(`${str` `}`).toEqual(' ');
});

it('keeps raw text', () => {
    expect(`${str`\t`}`).toEqual('\\t');
});

it('interpolates', () => {
    expect(`${str`${42}`}`).toEqual('42');
});

it('keeps padding', () => {
    expect(`${str` before ${'&'} after `}`).toEqual(' before & after ');
});

it('is unchanged', () => {
    expect(`${str`${undefined} ${null}`}`).toMatchSnapshot();
    expect(`${str`${false} ${true}`}`).toMatchSnapshot();
    expect(`${str`${NaN} ${0} ${42} ${Infinity}`}`).toMatchSnapshot();
    expect(`${str`${''} ${' '} ${'text'}`}`).toMatchSnapshot();
});
