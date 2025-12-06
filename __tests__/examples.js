'use strict';

/* eslint-disable prefer-const */
/* eslint-disable sort-keys */

const StrOP = require('..');

const sample = new StrOP('Sample');

let person = { name: 'Alice', job: 'programmer', options: [ 'yes', 'no' ] };

let greeting = sample`
        Hi, ${ person.name }!

    Do you like being a ${ person.job }?

    Options:
        ${ person.options.map((o) => `* ${ o }`).join('\n') }

`;

const result = [
    '    Hi, Alice!',
    '',
    'Do you like being a programmer?',
    '',
    'Options:',
    '    * yes',
    '    * no',
].join('\n');


describe('tag', () => {
    it('is typed', () => {
        expect(greeting instanceof sample).toBe(true);
    });

    it('stringifies', () => {
        expect(`${ greeting }`).toEqual(result);
        expect(greeting.toString()).toEqual(result);
        expect(String.raw(...greeting)).toEqual(result);
    });

    it('loads files', () => {
        const greet = sample.file('./examples/greeting.in');

        expect(`${ greet(person) }`).toEqual(result);
    });

    it('uses custom indentation characters', () => {
        const custom = new StrOP('Custom indentation');

        custom.indent = '\t >';

        const todo = custom` TODO:
            > Write code
            > Test code
        `;

        const list = [
            ' TODO:',
            'Write code',
            'Test code',
        ].join('\n');

        expect(`${ todo }`).toEqual(list);
    });

    it('uses rules', () => {
        sample.rule(3, 'three');
        sample.rule(4, 'four');

        const count = sample`${ 1 }, ${ 2 }, ${ 3 }, ${ 4 }`;

        expect(`${ count }`).toEqual('1, 2, three, four');
    });

    it('uses types', () => {
        class Percentage extends Number { }

        sample.type(Percentage, (p) => `${ (p * 100).toFixed(2) }%`);

        const score = sample`Your score is: ${ new Percentage(28 / 30) }`;

        expect(`${ score }`).toEqual('Your score is: 93.33%');
    });
});
