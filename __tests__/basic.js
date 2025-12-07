'use strict';

import StrOP from '..';


describe('factory', () => {
    it('exists', () => {
        expect(StrOP).toBeInstanceOf(Function);
    });

    it('is unchanged', () => {
        expect(Object.getOwnPropertyNames(StrOP).sort()).toMatchSnapshot();
    });
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
            delete tag.indent;
        }).toThrow(TypeError);
    });
});


describe('result', () => {
    it('has a length property', () => {
        const tag = new StrOP('Basic');

        expect(tag`anything`.length).toBeDefined();
    });

    it('is not frozen', () => {
        const tag = new StrOP('Basic');

        expect(Object.isFrozen(tag`anything`)).toBeFalsy();
    });

    it('can not be modified', () => {
        const tag = new StrOP('Basic');

        const result = tag`anything`;

        expect(() => {
            result.length = 0;
        }).toThrow(TypeError);

        expect(() => {
            result[0] = {};
        }).toThrow(TypeError);

        expect(() => {
            result[0].raw = [];
        }).toThrow(TypeError);

        expect(() => {
            delete result[0];
        }).toThrow(TypeError);

        expect(() => {
            result[100] = 42;
        }).toThrow(TypeError);

        expect(() => {
            Object.defineProperty(result, 0, { value: {} });
        }).toThrow(TypeError);

        expect(() => {
            Array.prototype.push.call(result, 'more');
        }).toThrow(TypeError);
    });

    it('can be extended', () => {
        const tag = new StrOP('Basic');

        const result = tag`anything`;

        result.something = 'something';

        expect(result.something).toEqual('something');

        result.something = 'other';

        expect(result.something).toEqual('other');

        delete result.something;

        expect(result.something).toBeUndefined();
    });
});
