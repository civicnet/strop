'use strict';

const StrOP = require('..');

const tag = new StrOP('Multi-line');


describe('tag', () => {
    it('trims empty lines', () => {
        const result = tag` 

        `;

        const output = '';

        expect(`${ result }`).toEqual(output);
    });

    it('preserves first line', () => {
        const result = tag` first
        `;

        const output = ' first';

        expect(`${ result }`).toEqual(output);
    });

    it('preserves last line', () => {
        const result = tag`
        last `;

        const output = 'last ';

        expect(`${ result }`).toEqual(output);
    });

    it('interpolates', () => {
        const result = tag`
            text
            ${ 42 }
        `;

        const output = [
            'text',
            '42',
        ].join('\n');

        expect(`${ result }`).toEqual(output);
    });

    it('preserves relative indentation', () => {
        const result = tag`
            text
                ${ 42 }
        `;

        const output = [
            'text',
            '    42',
        ].join('\n');

        expect(`${ result }`).toEqual(output);
    });

    it('preserves multi-line indentation', () => {
        const other = [
            'abc',
            '  def',
        ].join('\n');

        const result = tag`
            text
                ${ other }
            more
        `;

        const output = [
            'text',
            '    abc',
            '      def',
            'more',
        ].join('\n');

        expect(`${ result }`).toEqual(output);
    });
});
