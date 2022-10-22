'use strict'

const StrOP = require('..');

it('exists', () => {
    expect(StrOP).toBeInstanceOf(Function);
});

it('is unchanged', () => {
    expect(Object.getOwnPropertyNames(StrOP).sort()).toMatchSnapshot();
});

describe('instance', () => {
    it('requires a name', () => {
        expect(() => new StrOP).toThrowError(TypeError);
    });

    it('constructs', () => {
        expect(() => new StrOP('Basic')).not.toThrow();
    });

    it('is a function', () => {
        expect(new StrOP('Basic')).toBeInstanceOf(Function);
    });

    it('has the correct name', () => {
        expect(new StrOP('Basic').name).toEqual('Basic');
    });

    it('is not a constructor', () => {
        expect(() => new (new StrOP('Basic'))).toThrowError(TypeError);
    });

    it('is unchanged', () => {
        expect(Object.getOwnPropertyNames(new StrOP('Basic')).sort()).toMatchSnapshot();
    });

    it('tags strings', () => {
        const test = new StrOP('Basic');

        expect(test`Some string`).toBeDefined();
    });

    it('expects valid indentation characters', () => {
        const test = new StrOP('Basic');

        expect(() => { test.indent = null; }).toThrowError(TypeError);
        expect(() => { test.indent = 7; }).toThrowError(TypeError);
        expect(() => { test.indent = ''; }).toThrowError(TypeError);
        expect(() => { delete test.indent; }).toThrowError(TypeError);
    });

    it('freezes results', () => {
        const test = new StrOP('Basic');

        expect(Object.isFrozen(test`Some string`)).toBeTruthy();
    });
});
