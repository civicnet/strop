'use strict';

const StrOP = require('..');


it('exists', () => {
    expect(StrOP).toBeInstanceOf(Function);
});

it('is unchanged', () => {
    expect(Object.getOwnPropertyNames(StrOP).sort()).toMatchSnapshot();
});


describe('tag', () => {
    it('requires a name', () => {
        expect(() => new StrOP).toThrow(TypeError);
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
        expect(() => new (new StrOP('Basic'))).toThrow(TypeError);
    });

    it('is unchanged', () => {
        expect(Object.getOwnPropertyNames(new StrOP('Basic')).sort()).toMatchSnapshot();
    });

    it('tags strings', () => {
        const tag = new StrOP('Basic');

        expect(tag`Some string`).toBeDefined();
    });

    it('expects valid indentation characters', () => {
        const tag = new StrOP('Basic');

        expect(() => {
            tag.indent = null;
        }).toThrow(TypeError);

        expect(() => {
            tag.indent = 7;
        }).toThrow(TypeError);

        expect(() => {
            tag.indent = '';
        }).toThrow(TypeError);

        expect(() => {
            delete tag.indent;
        }).toThrow(TypeError);
    });
});


describe('result', () => {
    it('is array-like', () => {
        const tag = new StrOP('Basic');

        expect(Array.isArray(tag`anything`)).toBeTruthy();
    });

    it('has a length property', () => {
        const tag = new StrOP('Basic');

        expect(tag`anything`.length).toBeDefined();
    });

    it('is frozen', () => {
        const tag = new StrOP('Basic');

        expect(Object.isFrozen(tag`anything`)).toBeTruthy();
    });

    it('can not be modified', () => {
        const tag = new StrOP('Bugs');

        expect(() => {
            Array.prototype.push.call(tag`anything`, 'more');
        }).toThrow(TypeError);
    });
});
