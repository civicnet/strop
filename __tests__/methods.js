
const StrOP = require('..');

describe('file', () => {
    const example = (file) => require('path').join(__dirname, '..', 'examples', file);

    it('exists', () => {
        const str = new StrOP('Methods');

        expect(str.file).toBeInstanceOf(Function);
    });

    it('requires a path', () => {
        const str = new StrOP('Methods');

        expect(() => str.file()).toThrowError(TypeError);
    });

    it('fails for non-existing files', () => {
        const str = new StrOP('Methods');

        expect(() => str.file(example('missing.in'))).toThrow();
    });

    it('loads existing files', () => {
        const str = new StrOP('Methods');

        expect(() => str.file(example('greeting.in'))).toBeInstanceOf(Function);
    });

    it('requires appropriate arguments', () => {
        const str = new StrOP('Methods');

        const hello = str.file(example('greeting.in'));

        expect(() => hello()).toThrowError(ReferenceError);
    });

    it('works', () => {
        const str = new StrOP('Methods');

        const greeting  = str.file(example('greeting.in'));
        const person    = { name: 'Alice', job: 'programmer', options: [ 'yes', 'no' ] };
        const output    = require('fs').readFileSync(example('greeting.out'), 'utf8');

        expect(`${greeting(person)}`).toEqual(output);
    });

    it('searches parameters in order', () => {
        const str = new StrOP('Methods');

        const greeting  = str.file(example('greeting.in'));
        const person    = { name: 'Alice' };
        const other     = { name: 'Bob', job: 'programmer', options: [ 'yes', 'no' ] };
        const output    = require('fs').readFileSync(example('greeting.out'), 'utf8');

        expect(`${greeting(person, other)}`).toEqual(output);
    });

    it('uses custom indentation characters', () => {
        const str = new StrOP('Methods');

        str.indent = '\t >';

        const todo      = str.file(example('todo.in'));
        const output    = require('fs').readFileSync(example('todo.out'), 'utf8');

        expect(`${todo()}`).toEqual(output);
    });
});

describe('pass', () => {
    it('exists', () => {
        const str = new StrOP('Methods');

        expect(str.pass).toBeInstanceOf(Function);
    });

    it('is called when tagging', () => {
        const str = new StrOP('Methods');

        str.pass = jest.fn();

        str``;

        expect(str.pass).toBeCalledWith({ raw: [ '' ] });

        str`${42}`;

        expect(str.pass).toBeCalledWith({ raw: [ '', '' ] }, 42);

        str` before ${'&'} after `;

        expect(str.pass).toBeCalledWith({ raw: [ ' before ', ' after ' ] }, '&');
    });

    it('determines the result of tagging', () => {
        const str = new StrOP('Methods');

        str.pass = () => 42;

        const result = str`literally ${'anything'}`;

        expect(result).toEqual(42);
    });

    it('has its result prototype changed', () => {
        const str = new StrOP('Methods');

        class Result { };

        str.pass = () => new Result;

        const result = str`literally ${'anything'}`;

        expect(result).toEqual(expect.any(str));
        expect(result).not.toEqual(expect.any(Result));
    });

    it('has toString called on its result when stringifying', () => {
        const str = new StrOP('Methods');

        const instance = { [Symbol.toPrimitive]: jest.fn(() => 'something') };

        str.pass = () => instance;

        const result = str`literally ${'anything'}`;

        expect(`${result}`).toEqual('something');
        expect(instance[Symbol.toPrimitive]).toBeCalled();
    });

    it('works', () => {
        const str = new StrOP('Methods');

        class Result { constructor(...props) { Object.assign(this, ...props); } };

        str.pass = () => new Result({ key: 'value' });

        const result = str`literally ${'anything'}`;

        expect(result).toHaveProperty('key', 'value');
    });
});

describe('rule', () => {
    it('exists', () => {
        const str = new StrOP('Methods');

        expect(str.rule).toBeInstanceOf(Function);
    });

    it('requries two parameters', () => {
        const str = new StrOP('Methods');

        expect(() => str.rule()).toThrowError(TypeError);
        expect(() => str.rule(42)).toThrowError(TypeError);
        expect(() => str.rule(42, 'magic')).not.toThrow();
    });

    it('requires the first parameter to be a primitive type', () => {
        const str = new StrOP('Methods');

        expect(() => str.rule({}, 42)).toThrowError(TypeError);
    });

    it('requires the second parameter to be string-convertible', () => {
        const str = new StrOP('Methods');

        expect(() => str.rule(42, Symbol('sym'))).toThrowError(TypeError);
    });
});

describe('type', () => {
    it('exists', () => {
        const str = new StrOP('Methods');

        expect(str.type).toBeInstanceOf(Function);
    });

    it('requries two parameters', () => {
        const str = new StrOP('Methods');

        expect(() => str.type()).toThrowError(TypeError);
        expect(() => str.type(Number)).toThrowError(TypeError);
        expect(() => str.type(Number, String)).not.toThrow();
    });

    it('requires the first parameter to be a function', () => {
        const str = new StrOP('Methods');

        expect(() => str.type(42, String)).toThrowError(TypeError);
    });

    it('requires the second parameter to be a function', () => {
        const str = new StrOP('Methods');

        expect(() => str.type(String, 42)).toThrowError(TypeError);
    });
});

describe('render', () => {
    it('exists', () => {
        const str = new StrOP('Methods');

        expect(str.render).toBeInstanceOf(Function);
    });

    it('works', () => {
        const str = new StrOP('Methods');

        let u; // undefined

        expect(str.render()).toEqual(`${u}`);

        const values = [
            undefined, null,
            false, true,
            NaN, 0, 42, Infinity,
            '', ' ', 'text',
            { toString() { return 'string'; } },
            { [Symbol.toPrimitive]() { return 'primitive'; } }
        ];

        for (let v of values) {
            expect(str.render(v)).toEqual(`${v}`);
        }
    });

    it('requires a string-covnertible parameter by default', () => {
        const str = new StrOP('Methods');

        expect(() => str.render(Symbol('sym'))).toThrow();
    });

    it('uses the correct rule', () => {
        const str = new StrOP('Methods');

        const values = [
            undefined, null,
            false, true,
            NaN, 0, 42, Infinity,
            '', ' ', 'text'
        ];

        for (let i in values) {
            str.rule(values[i], i);
        }

        for (let v of values) {
            expect(values[str.render(v)]).toEqual(v);
        }
    });

    it('overwrites existing rules', () => {
        const str = new StrOP('Methods');

        str.rule(42, 'something');
        str.rule(42, 'something else');

        expect(str.render(42)).toEqual('something else');
    });

    it('uses the correct type', () => {
        const str = new StrOP('Methods');

        class Parent { }

        str.type(Parent, () => 'Parent');

        expect(str.render(new Parent)).toEqual('Parent');

        class Child extends Parent { }

        expect(str.render(new Child)).toEqual('Parent');

        str.type(Child, () => 'Child');

        expect(str.render(new Parent)).toEqual('Parent');
        expect(str.render(new Child)).toEqual('Child');

        class Other extends Parent { }

        str.type(Other, () => 'Other');

        expect(str.render(new Child)).toEqual('Child');
        expect(str.render(new Other)).toEqual('Other');
    });

    it('overwrites existing rules', () => {
        const str = new StrOP('Methods');

        str.type(Object, () => 'something');
        str.type(Object, () => 'something else');

        expect(str.render(new Object)).toEqual('something else');
    });

    it('calls type handler with the instance', () => {
        const str = new StrOP('Methods');

        const handler = jest.fn();

        str.type(Object, handler);

        const instance = new Object;

        str.render(instance);

        expect(handler).toBeCalledWith(instance);
    });

    it('calls type handler within the context of the StrOP instance', () => {
        const str = new StrOP('Methods');

        const handler = jest.fn();

        str.type(Object, function () { handler(this); });
        str.render(new Object);

        expect(handler).toBeCalledWith(str);
    });
});

describe('unindent', () => {
    it('exists', () => {
        const str = new StrOP('Methods');

        expect(str.unindent).toBeInstanceOf(Function);
    });

    it('works', () => {
        const str = new StrOP('Methods');

        expect(str.unindent()).toEqual([]);
        expect(str.unindent('text')).toEqual([ 'text' ]);
        expect(str.unindent('\ntext')).toEqual([ 'text' ]);
        expect(str.unindent(' \ntext')).toEqual([ 'text' ]);
        expect(str.unindent('text\n')).toEqual([ 'text' ]);
        expect(str.unindent('text\n ')).toEqual([ 'text' ]);
        expect(str.unindent('\nbefore', 'after')).toEqual([ 'before', 'after' ]);
        expect(str.unindent('\n before', 'after')).toEqual([ 'before', 'after' ]);
        expect(str.unindent('\nbefore', ' after')).toEqual([ 'before', ' after' ]);
        expect(str.unindent('\n before', ' after')).toEqual([ 'before', ' after' ]);
        expect(str.unindent('\n one', '\n two', '\n three')).toEqual([ 'one', '\ntwo', '\nthree' ]);
        expect(str.unindent('\n  one', '\n two', '\n three')).toEqual([ ' one', '\ntwo', '\nthree' ]);
        expect(str.unindent('\n one', '\n  two', '\n three')).toEqual([ 'one', '\n two', '\nthree' ]);
        expect(str.unindent('\n one', '\n two', '\n  three')).toEqual([ 'one', '\ntwo', '\n three' ]);
    });

    it('preserves empty inner lines', () => {
        const str = new StrOP('Methods');

        expect(str.unindent('\nbefore\n\nafter')).toEqual([ 'before\n\nafter' ]);
        expect(str.unindent('\n before\n\n after')).toEqual([ 'before\n\nafter' ]);
        expect(str.unindent('\n  before\n \n  after')).toEqual([ ' before\n\n after' ]);
    });

    it('does not consider tabs and spaces equal', () => {
        const str = new StrOP('Methods');

        expect(str.unindent('\nbefore\n\tafter')).toEqual([ 'before\n\tafter' ]);
        expect(str.unindent('\n before\n\tafter')).toEqual([ ' before\n\tafter' ]);
        expect(str.unindent('\n  before\n \tafter')).toEqual([ ' before\n\tafter' ]);
    });


    it('always returns an array of the same length', () => {
        const str = new StrOP('Methods');

        function generator(n) {
            let result = [];

            const base = [ '', '', ' ', '\n', 'text' ];

            result.push(base[n % 2]);
            result.push(base[n % 3]);
            result.push(base[n % 4]);
            result.push(base[n % 5]);

            return result.join('');
        }

        const tests = [ ...Array(60).keys() ].map(generator);

        for (let i = 0; i < tests.length; ++i) {
            expect(str.unindent(...tests.slice(0, i)).length).toEqual(i);
        }
    });
});

describe('unwrap', () => {
    it('exists', () => {
        const str = new StrOP('Methods');

        expect(str.unwrap).toBeInstanceOf(Function);
    });

    it('unwraps Boolean-like objects', () => {
        const str = new StrOP('Methods');

        let f = new Boolean(false);
        let t = new Boolean(true);

        expect(str.unwrap(f)).toEqual(false);
        expect(str.unwrap(t)).toEqual(true);

        Object.setPrototypeOf(f, null);
        Object.setPrototypeOf(t, null);

        expect(str.unwrap(f)).toEqual(false);
        expect(str.unwrap(t)).toEqual(true);

        class Dummy { toString() { return 'string'; }; [Symbol.toPrimitive]() { return 'primitive'; } }
        
        Object.setPrototypeOf(f, Dummy.prototype);
        Object.setPrototypeOf(t, Dummy.prototype);

        expect(str.unwrap(f)).toEqual(false);
        expect(str.unwrap(t)).toEqual(true);
    });

    it('unwraps Date-like objects', () => {
        const str = new StrOP('Methods');

        let s = '2020-05-22T17:04:29.569Z';
        let d = new Date(s);

        expect(str.unwrap(d)).toEqual(new Date(s).toString());

        Object.setPrototypeOf(d, null);

        expect(str.unwrap(d)).toEqual(new Date(s).toString());

        class Dummy { toString() { return 'string'; }; [Symbol.toPrimitive]() { return 'primitive'; } }
        
        Object.setPrototypeOf(d, Dummy.prototype);

        expect(str.unwrap(d)).toEqual(new Date(s).toString());
    });

    it('unwraps Number-like objects', () => {
        const str = new StrOP('Methods');

        let nan = new Number(NaN);
        let nil = new Number(0);
        let two = new Number(2);
        let inf = new Number(Infinity);

        expect(str.unwrap(nan)).toEqual(NaN);
        expect(str.unwrap(nil)).toEqual(0);
        expect(str.unwrap(two)).toEqual(2);
        expect(str.unwrap(inf)).toEqual(Infinity);

        Object.setPrototypeOf(nan, null);
        Object.setPrototypeOf(nil, null);
        Object.setPrototypeOf(two, null);
        Object.setPrototypeOf(inf, null);

        expect(str.unwrap(nan)).toEqual(NaN);
        expect(str.unwrap(nil)).toEqual(0);
        expect(str.unwrap(two)).toEqual(2);
        expect(str.unwrap(inf)).toEqual(Infinity);

        class Dummy { toString() { return 'string'; }; [Symbol.toPrimitive]() { return 'primitive'; } }
        
        Object.setPrototypeOf(nan, Dummy.prototype);
        Object.setPrototypeOf(nil, Dummy.prototype);
        Object.setPrototypeOf(two, Dummy.prototype);
        Object.setPrototypeOf(inf, Dummy.prototype);

        expect(str.unwrap(nan)).toEqual(NaN);
        expect(str.unwrap(nil)).toEqual(0);
        expect(str.unwrap(two)).toEqual(2);
        expect(str.unwrap(inf)).toEqual(Infinity);
    });

    it('unwraps String-like objects', () => {
        const str = new StrOP('Methods');

        let empty = new String('');
        let blank = new String(' ');
        let stuff = new String('text');

        expect(str.unwrap(empty)).toEqual('');
        expect(str.unwrap(blank)).toEqual(' ');
        expect(str.unwrap(stuff)).toEqual('text');

        Object.setPrototypeOf(empty, null);
        Object.setPrototypeOf(blank, null);
        Object.setPrototypeOf(stuff, null);

        expect(str.unwrap(empty)).toEqual('');
        expect(str.unwrap(blank)).toEqual(' ');
        expect(str.unwrap(stuff)).toEqual('text');

        class Dummy { toString() { return 'string'; }; [Symbol.toPrimitive]() { return 'primitive'; } }
        
        Object.setPrototypeOf(empty, Dummy.prototype);
        Object.setPrototypeOf(blank, Dummy.prototype);
        Object.setPrototypeOf(stuff, Dummy.prototype);

        expect(str.unwrap(empty)).toEqual('');
        expect(str.unwrap(blank)).toEqual(' ');
        expect(str.unwrap(stuff)).toEqual('text');
    });

    it('returns primitives unchanged', () => {
        const str = new StrOP('Methods');

        const values = [
            undefined, null,
            false, true,
            NaN, 0, 42, Infinity,
            '', ' ', 'text'
        ];

        for (let v of values) {
            expect(str.unwrap(v)).toEqual(v);
        }
    });

    it('returns primitives unchanged', () => {
        const str = new StrOP('Methods');

        expect(str.unwrap({ toString: () => 'something' })).toEqual('something');
    });

    it('is called to unwrap passed objects when they are stringified', () => {
        const str = new StrOP('Methods');

        const instance = new String('something');

        str.pass = () => instance;
        str.unwrap = jest.fn();

        const result = str`literally ${'anything'}`;

        expect(str.unwrap).not.toBeCalled();

        `${result}`;

        expect(str.unwrap).toBeCalledWith(result, expect.anything());
    });

    it('is not called if the passed object has [Symbol.toPrimitive] defined', () => {
        const str = new StrOP('Methods');

        str.pass = () => ({ [Symbol.toPrimitive]: () => 'something' });
        str.unwrap = jest.fn();

        const result = str`literally ${'anything'}`;

        expect(`${result}`).toEqual('something');
        expect(str.unwrap).not.toBeCalled();
    });
});
