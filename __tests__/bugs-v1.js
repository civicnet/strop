'use strict';

const StrOP = require('..');


describe('tag', () => {
    it('does not handle \\ correctly', () => {
        const tag = new StrOP('Bugs');

        tag.indent = '\t \\';

        expect(() => tag``).toThrow(SyntaxError);
    });

    it('does not handle ( correctly', () => {
        const tag = new StrOP('Bugs');

        tag.indent = '\t (';

        expect(() => tag`
            ( wrong
        `).toThrow(SyntaxError);
    });

    it('does not handle ) correctly', () => {
        const tag = new StrOP('Bugs');

        tag.indent = '\t )';

        expect(() => tag`
            ) wrong
        `).toThrow(SyntaxError);
    });

    it('does not handle [ correctly', () => {
        const tag = new StrOP('Bugs');

        tag.indent = '\t [';

        expect(() => tag`
            [ wrong
        `).toThrow(SyntaxError);
    });

    it('does not handle ] correctly', () => {
        const tag = new StrOP('Bugs');

        tag.indent = '\t ]';

        const result = tag`
            ] wrong
        `;

        const output = 'wrong';

        expect(`${ result }`).not.toEqual(output);
    });

    it('does not handle | correctly', () => {
        const tag = new StrOP('Bugs');

        tag.indent = '\t |';

        const result = tag`
            | wrong
        `;

        const output = 'wrong';

        expect(`${ result }`).not.toEqual(output);
    });

    it('does not handle ^ correctly', () => {
        const tag = new StrOP('Bugs');

        tag.indent = '^\t ';

        const result = tag`
            ^ wrong
        `;

        const output = 'wrong';

        expect(`${ result }`).not.toEqual(output);
    });

    it('does not handle $ correctly', () => {
        const tag = new StrOP('Bugs');

        tag.indent = '\t $';

        const result = tag`
            $ wrong
        `;

        const output = 'wrong';

        expect(`${ result }`).not.toEqual(output);
    });

    it('does not handle ? correctly', () => {
        const tag = new StrOP('Bugs');

        tag.indent = '\t ?';

        const result = tag`
            ? wrong
        `;

        const output = 'wrong';

        expect(`${ result }`).not.toEqual(output);

        tag.indent = '\t ?';

        expect(() => tag`
            ??? wrong
        `).toThrow(SyntaxError);
    });

    it('does not handle * correctly', () => {
        const tag = new StrOP('Bugs');

        tag.indent = '\t *';

        const result = tag`
            * wrong
        `;

        const output = 'wrong';

        expect(`${ result }`).not.toEqual(output);

        tag.indent = '\t *';

        expect(() => tag`
            ** wrong
        `).toThrow(SyntaxError);
    });

    it('does not handle + correctly', () => {
        const tag = new StrOP('Bugs');

        tag.indent = '\t +';

        const result = tag`
            + wrong
        `;

        const output = 'wrong';

        expect(`${ result }`).not.toEqual(output);

        tag.indent = '\t +';

        expect(() => tag`
            ++ wrong
        `).toThrow(SyntaxError);
    });

    it('does not handle - correctly', () => {
        const tag = new StrOP('Bugs');

        tag.indent = '\t A-Z';

        const result = tag`WRONG
        `;

        const output = 'WRONG';

        expect(`${ result }`).not.toEqual(output);
    });
});
