'use strict';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import StrOP from '..';


describe('file', () => {
    const example = (file) => join(import.meta.dirname, '..', 'examples', file);

    it('exists', () => {
        const tag = new StrOP('Methods');

        expect(tag.file).toBeInstanceOf(Function);
    });

    it('requires a path', () => {
        const tag = new StrOP('Methods');

        expect(() => tag.file()).toThrow(TypeError);
    });

    it('fails for non-existing files', () => {
        const tag = new StrOP('Methods');

        expect(() => tag.file(example('missing.in'))).toThrow();
    });

    it('loads existing files', () => {
        const tag = new StrOP('Methods');

        expect(() => tag.file(example('greeting.in'))).toBeInstanceOf(Function);
    });

    it('requires appropriate arguments', () => {
        const tag = new StrOP('Methods');

        const hello = tag.file(example('greeting.in'));

        expect(() => hello()).toThrow(ReferenceError);
    });

    it('works', () => {
        const tag = new StrOP('Methods');

        const greeting = tag.file(example('greeting.in'));
        const person = { name: 'Alice', job: 'programmer', options: [ 'yes', 'no' ] }; // eslint-disable-line sort-keys
        const output = readFileSync(example('greeting.out'), 'utf8');

        expect(`${ greeting(person) }`).toEqual(output);
    });

    it('searches parameters in order', () => {
        const tag = new StrOP('Methods');

        const greeting = tag.file(example('greeting.in'));
        const person = { name: 'Alice' };
        const other = { name: 'Bob', job: 'programmer', options: [ 'yes', 'no' ] }; // eslint-disable-line sort-keys
        const output = readFileSync(example('greeting.out'), 'utf8');

        expect(`${ greeting(person, other) }`).toEqual(output);
    });

    it('calls getters', () => {
        const tag = new StrOP('Methods');

        const greeting = tag.file(example('greeting.in'));
        const person = { get name() { return 'Alice' } }; // eslint-disable-line @stylistic/max-statements-per-line
        const other = { name: 'Bob', job: 'programmer', options: [ 'yes', 'no' ] }; // eslint-disable-line sort-keys
        const output = readFileSync(example('greeting.out'), 'utf8');

        expect(`${ greeting(person, other) }`).toEqual(output);
    });

    it('calls shadowed getters', () => {
        const tag = new StrOP('Methods');

        const check = import.meta.jest.fn();

        const greeting = tag.file(example('greeting.in'));
        const person = { name: 'Alice', job: 'programmer', options: [ 'yes', 'no' ] }; // eslint-disable-line sort-keys
        const other = Object.create(null, { name: { enumerable: true, get: check } });

        `${ greeting(person, other) }`; // eslint-disable-line no-unused-expressions

        expect(check).toHaveBeenCalled();
    });

    it('calls unrelated getters', () => {
        const tag = new StrOP('Methods');

        const check = import.meta.jest.fn();

        const greeting = tag.file(example('greeting.in'));
        const person = { name: 'Alice', job: 'programmer', options: [ 'yes', 'no' ] }; // eslint-disable-line sort-keys
        const other = Object.create(null, { '*': { enumerable: true, get: check } });

        `${ greeting(person, other) }`; // eslint-disable-line no-unused-expressions

        expect(check).toHaveBeenCalled();
    });

    it('uses custom indentation characters', () => {
        const tag = new StrOP('Methods');

        tag.indent = '\t >';

        const todo = tag.file(example('todo.in'));
        const output = readFileSync(example('todo.out'), 'utf8');

        expect(`${ todo() }`).toEqual(output);
    });

    it('requires valid syntax', () => {
        const tag = new StrOP('Methods');

        expect(() => tag.file(example('bad.in'))).toThrow(SyntaxError);
    });
});

describe('pass', () => {
    it('exists', () => {
        const tag = new StrOP('Methods');

        expect(tag.pass).toBeInstanceOf(Function);
    });

    it('is called when tagging', () => {
        const tag = new StrOP('Methods');

        tag.pass = import.meta.jest.fn();

        tag``; // eslint-disable-line no-unused-expressions

        expect(tag.pass).toHaveBeenCalledWith({ raw: [ '' ] });

        tag`${ 42 }`; // eslint-disable-line no-unused-expressions

        expect(tag.pass).toHaveBeenCalledWith({ raw: [ '', '' ] }, 42);

        tag` before ${ '&' } after `; // eslint-disable-line no-unused-expressions

        expect(tag.pass).toHaveBeenCalledWith({ raw: [ ' before ', ' after ' ] }, '&');
    });

    it('determines the result of tagging', () => {
        const tag = new StrOP('Methods');

        tag.pass = () => 42;

        const result = tag`literally ${ 'anything' }`;

        expect(result).toEqual(42);
    });

    it('has toString called on its result when stringifying', () => {
        const tag = new StrOP('Methods');

        const instance = { [Symbol.toPrimitive]: import.meta.jest.fn(() => 'something') };

        tag.pass = () => instance;

        const result = tag`literally ${ 'anything' }`;

        expect(`${ result }`).toEqual('something');
        expect(instance[Symbol.toPrimitive]).toHaveBeenCalled();
    });

    it('works', () => {
        const tag = new StrOP('Methods');

        class Result {
            constructor(...props) {
                Object.assign(this, ...props);
            }
        }

        tag.pass = () => new Result({ key: 'value' });

        const result = tag`literally ${ 'anything' }`;

        expect(result).toHaveProperty('key', 'value');
    });
});

describe('rule', () => {
    it('exists', () => {
        const tag = new StrOP('Methods');

        expect(tag.rule).toBeInstanceOf(Function);
    });

    it('requries two parameters', () => {
        const tag = new StrOP('Methods');

        expect(() => tag.rule()).toThrow(TypeError);
        expect(() => tag.rule(42)).toThrow(TypeError);
        expect(() => tag.rule(42, 'magic')).not.toThrow();
    });

    it('requires the first parameter to be a primitive type', () => {
        const tag = new StrOP('Methods');

        expect(() => tag.rule({}, 42)).toThrow(TypeError);
    });

    it('requires the second parameter to be string-convertible', () => {
        const tag = new StrOP('Methods');

        expect(() => tag.rule(42, Symbol('sym'))).toThrow(TypeError);
    });
});

describe('type', () => {
    it('exists', () => {
        const tag = new StrOP('Methods');

        expect(tag.type).toBeInstanceOf(Function);
    });

    it('requries two parameters', () => {
        const tag = new StrOP('Methods');

        expect(() => tag.type()).toThrow(TypeError);
        expect(() => tag.type(Number)).toThrow(TypeError);
        expect(() => tag.type(Number, String)).not.toThrow();
    });

    it('requires the first parameter to be a function', () => {
        const tag = new StrOP('Methods');

        expect(() => tag.type(42, String)).toThrow(TypeError);
    });

    it('requires the second parameter to be a function', () => {
        const tag = new StrOP('Methods');

        expect(() => tag.type(String, 42)).toThrow(TypeError);
    });
});

describe('resolve', () => {
    it('exists', () => {
        const tag = new StrOP('Methods');

        expect(tag.resolve).toBeInstanceOf(Function);
    });

    it('uses the correct rule', () => {
        const tag = new StrOP('Methods');

        const values = [
            undefined,
            null,

            false,
            true,

            NaN,
            0,
            42,
            Infinity,

            '',
            ' ',
            'text',
        ];

        for (const [ i, v ] of values.entries()) {
            tag.rule(v, i);
        }

        for (const v of values) {
            expect(values[tag.resolve(v)]).toEqual(v);
        }
    });

    it('overwrites existing rules', () => {
        const tag = new StrOP('Methods');

        tag.rule(42, 'something');
        tag.rule(42, 'something else');

        expect(tag.resolve(42)).toEqual('something else');
    });

    it('uses the correct type', () => {
        const tag = new StrOP('Methods');

        class Parent { }

        const parent = new Parent;

        expect(tag.resolve(parent)).toEqual(parent);

        tag.type(Parent, () => 'Parent');

        expect(tag.resolve(parent)).toEqual('Parent');

        class Child extends Parent { }

        const child = new Child;

        expect(tag.resolve(child)).toEqual('Parent');

        tag.type(Child, () => 'Child');

        expect(tag.resolve(parent)).toEqual('Parent');
        expect(tag.resolve(child)).toEqual('Child');

        class Other extends Parent { }

        const other = new Other;

        tag.type(Other, () => 'Other');

        expect(tag.resolve(child)).toEqual('Child');
        expect(tag.resolve(other)).toEqual('Other');
    });

    it('overwrites existing rules', () => {
        const tag = new StrOP('Methods');

        tag.type(Object, () => 'something');
        tag.type(Object, () => 'something else');

        expect(tag.resolve(new Object)).toEqual('something else');
    });

    it('calls type handler with the instance', () => {
        const tag = new StrOP('Methods');

        const handler = import.meta.jest.fn();

        tag.type(Object, handler);

        const instance = new Object;

        tag.resolve(instance);

        expect(handler).toHaveBeenCalledWith(instance);
    });

    it('calls type handler within the context of the StrOP instance', () => {
        const tag = new StrOP('Methods');

        const handler = import.meta.jest.fn();

        tag.type(Object, function check() {
            handler(this);
        });

        tag.resolve(new Object);

        expect(handler).toHaveBeenCalledWith(tag);
    });
});

describe('unindent', () => {
    it('exists', () => {
        const tag = new StrOP('Methods');

        expect(tag.unindent).toBeInstanceOf(Function);
    });

    it('works', () => {
        const tag = new StrOP('Methods');

        expect(tag.unindent()).toEqual([]);
        expect(tag.unindent('text')).toEqual([ 'text' ]);
        expect(tag.unindent('\ntext')).toEqual([ 'text' ]);
        expect(tag.unindent(' \ntext')).toEqual([ 'text' ]);
        expect(tag.unindent('text\n')).toEqual([ 'text' ]);
        expect(tag.unindent('text\n ')).toEqual([ 'text' ]);
        expect(tag.unindent('\nbefore', 'after')).toEqual([ 'before', 'after' ]);
        expect(tag.unindent('\n before', 'after')).toEqual([ 'before', 'after' ]);
        expect(tag.unindent('\nbefore', ' after')).toEqual([ 'before', ' after' ]);
        expect(tag.unindent('\n before', ' after')).toEqual([ 'before', ' after' ]);
        expect(tag.unindent('\n one', '\n two', '\n three')).toEqual([ 'one', '\ntwo', '\nthree' ]);
        expect(tag.unindent('\n  one', '\n two', '\n three')).toEqual([ ' one', '\ntwo', '\nthree' ]);
        expect(tag.unindent('\n one', '\n  two', '\n three')).toEqual([ 'one', '\n two', '\nthree' ]);
        expect(tag.unindent('\n one', '\n two', '\n  three')).toEqual([ 'one', '\ntwo', '\n three' ]);
    });

    it('preserves empty inner lines', () => {
        const tag = new StrOP('Methods');

        expect(tag.unindent('\nbefore\n\nafter')).toEqual([ 'before\n\nafter' ]);
        expect(tag.unindent('\n before\n\n after')).toEqual([ 'before\n\nafter' ]);
        expect(tag.unindent('\n  before\n \n  after')).toEqual([ ' before\n\n after' ]);
    });

    it('does not consider tabs and spaces equal', () => {
        const tag = new StrOP('Methods');

        expect(tag.unindent('\nbefore\n\tafter')).toEqual([ 'before\n\tafter' ]);
        expect(tag.unindent('\n before\n\tafter')).toEqual([ ' before\n\tafter' ]);
        expect(tag.unindent('\n  before\n \tafter')).toEqual([ ' before\n\tafter' ]);
    });

    it('always returns an array of the same length', () => {
        const tag = new StrOP('Methods');

        function generator(n) {
            const result = [];

            const base = [ '', '', ' ', '\n', 'text' ];

            result.push(base[n % 2]);
            result.push(base[n % 3]);
            result.push(base[n % 4]);
            result.push(base[n % 5]);

            return result.join('');
        }

        const tests = [ ...Array(60).keys() ].map(generator);

        for (let i = 0; i < tests.length; ++i) {
            expect(tag.unindent(...tests.slice(0, i)).length).toEqual(i);
        }
    });

    it('can disable indentation processing', () => {
        const tag = new StrOP('Basic');

        tag.indent = '';

        expect(tag.unindent()).toEqual([]);
        expect(tag.unindent('text')).toEqual([ 'text' ]);
        expect(tag.unindent('\ntext')).toEqual([ 'text' ]);
        expect(tag.unindent(' \ntext')).toEqual([ ' \ntext' ]);
        expect(tag.unindent('text\n')).toEqual([ 'text' ]);
        expect(tag.unindent('text\n ')).toEqual([ 'text\n ' ]);
        expect(tag.unindent('\nbefore', 'after')).toEqual([ 'before', 'after' ]);
        expect(tag.unindent('\n before', 'after')).toEqual([ ' before', 'after' ]);
        expect(tag.unindent('\nbefore', ' after')).toEqual([ 'before', ' after' ]);
        expect(tag.unindent('\n before', ' after')).toEqual([ ' before', ' after' ]);
        expect(tag.unindent('\n one', '\n two', '\n three\n')).toEqual([ ' one', '\n two', '\n three' ]);
        expect(tag.unindent('\n one', '\n two', '\n three\n ')).toEqual([ ' one', '\n two', '\n three\n ' ]);
    });
});
