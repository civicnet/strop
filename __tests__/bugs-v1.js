'use strict';

import StrOP from '..';


describe('tag', () => {
    it('handles \\ correctly', () => {
        const tag = new StrOP('Bugs');

        tag.indent = '\t \\';

        const result = tag`
            \\ wrong
        `;

        const output = 'wrong';

        expect(`${ result }`).toEqual(output);
    });

    it('handles ( correctly', () => {
        const tag = new StrOP('Bugs');

        tag.indent = '\t (';

        const result = tag`
            ( wrong
        `;

        const output = 'wrong';

        expect(`${ result }`).toEqual(output);
    });

    it('handles ) correctly', () => {
        const tag = new StrOP('Bugs');

        tag.indent = '\t )';

        const result = tag`
            ) wrong
        `;

        const output = 'wrong';

        expect(`${ result }`).toEqual(output);
    });

    it('handles [ correctly', () => {
        const tag = new StrOP('Bugs');

        tag.indent = '\t [';

        const result = tag`
            [ wrong
        `;

        const output = 'wrong';

        expect(`${ result }`).toEqual(output);
    });

    it('handles ] correctly', () => {
        const tag = new StrOP('Bugs');

        tag.indent = '\t ]';

        const result = tag`
            ] wrong
        `;

        const output = 'wrong';

        expect(`${ result }`).toEqual(output);
    });

    it('handles | correctly', () => {
        const tag = new StrOP('Bugs');

        tag.indent = '\t |';

        const result = tag`
            | wrong
        `;

        const output = 'wrong';

        expect(`${ result }`).toEqual(output);
    });

    it('handles ^ correctly', () => {
        const tag = new StrOP('Bugs');

        tag.indent = '^\t ';

        const result = tag`
            ^ wrong
        `;

        const output = 'wrong';

        expect(`${ result }`).toEqual(output);
    });

    it('handles $ correctly', () => {
        const tag = new StrOP('Bugs');

        tag.indent = '\t $';

        const result = tag`
            $ wrong
        `;

        const output = 'wrong';

        expect(`${ result }`).toEqual(output);
    });

    it('handles ? correctly', () => {
        const tag = new StrOP('Bugs');

        tag.indent = '\t ?';

        const result = tag`
            ? wrong
        `;

        const output = 'wrong';

        expect(`${ result }`).toEqual(output);

        tag.indent = '\t ?';

        expect(() => tag`
            ??? wrong
        `).not.toThrow();
    });

    it('handles * correctly', () => {
        const tag = new StrOP('Bugs');

        tag.indent = '\t *';

        const result = tag`
            * wrong
        `;

        const output = 'wrong';

        expect(`${ result }`).toEqual(output);

        tag.indent = '\t *';

        expect(() => tag`
            ** wrong
        `).not.toThrow();
    });

    it('handles + correctly', () => {
        const tag = new StrOP('Bugs');

        tag.indent = '\t +';

        const result = tag`
            + wrong
        `;

        const output = 'wrong';

        expect(`${ result }`).toEqual(output);

        tag.indent = '\t +';

        expect(() => tag`
            ++ wrong
        `).not.toThrow();
    });

    it('handles - correctly', () => {
        const tag = new StrOP('Bugs');

        tag.indent = '\t A-Z';

        const result = tag`WRONG
        `;

        const output = 'WRONG';

        expect(`${ result }`).toEqual(output);
    });
});
