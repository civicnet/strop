'use strict';

import { readFileSync } from 'node:fs';

const $Rule = Symbol('Rule');
const $Type = Symbol('Type');

export default class StrOP extends Function {
    // https://github.com/civicnet/strop#constructing-tags
    constructor(name) {
        if (typeof name == 'undefined') {
            throw new TypeError('StrOP instances require a name');
        }

        super();

        Object.defineProperties(this, {
            [$Rule] : { value: new Map },
            [$Type] : { value: new WeakMap },

            name : { value: `${ name }` },
        });

        let indent = '\t ';

        Object.defineProperty(this, 'indent', {
            get : () => indent,

            set(value) {
                if (typeof value != 'string') {
                    throw new TypeError('indent must be a string');
                }

                indent = value;
            },
        });

        const tag = new Proxy(this, {
            apply : (_, $, args) => Reflect.apply(
                function transform(strings, ...values) {
                    return this.pass({ raw: this.unindent(...strings.raw) }, ...values);
                },
                this,
                args,
            ),

            construct() { throw new TypeError(`${ name } is not a constructor`) },
        });

        return tag; // eslint-disable-line no-constructor-return
    }

    // https://github.com/civicnet/strop#filepath
    file(path) {
        if (typeof path == 'undefined') {
            throw new TypeError('A file path must be specified');
        }

        const raw = readFileSync(path, 'utf8');

        const body = [
            'const values = Object.assign({}, ...Array.prototype.slice.call(arguments).reverse());',
            `with (values) { return this\`${ raw }\`; }`,
        ].join('\n');

        return new Function(body).bind(this);
    }

    // https://github.com/civicnet/strop#pass-raw--values
    pass({ raw }, ...values) {
        const escaped = this.indent.split('').map((c) => `\\${ c }`).join('');
        const indent = new RegExp(`^([${ escaped }]*)`);

        values = values.map((v, i) => {
            const current = indent.exec(raw.slice(0, i + 1).join('').split('\n').pop())[1];

            const placeholder = Object.defineProperty(Object.create(null), Symbol.toPrimitive, {
                value : () => `${ this.resolve(v) }`.replace(/\n/g, `\n${ current }`),
            });

            return Object.freeze(placeholder);
        });

        let result = [ Object.freeze({ raw: Object.freeze(raw) }), ...values ];

        for (let i = 0; i < result.length; ++i) {
            const descriptor = Object.getOwnPropertyDescriptor(result, i);

            Object.defineProperty(result, i, { ...descriptor, configurable: false, writable: false });
        }

        Object.defineProperty(result, 'toString', {
            value() {
                return `${ this[Symbol.toPrimitive]('string') }`;
            },
        });

        Object.defineProperty(result, Symbol.iterator, {
            * value() {
                yield * Array.prototype.slice.call(this);
            },
        });

        Object.defineProperty(result, Symbol.toPrimitive, {
            value() {
                return String.raw(...this);
            },
        });

        result = new Proxy(result, {
            getPrototypeOf : () => this.prototype,

            set(target, property, value, receiver) {
                if (property === 'length' || (/^\d+$/).test(property)) {
                    return false;
                }

                return Reflect.set(target, property, value, receiver);
            },
        });

        return result;
    }

    // https://github.com/civicnet/strop#resolvevalue
    resolve(value) {
        let result = value;

        if (value instanceof Object) {
            let custom = null;

            for (let type = Object.getPrototypeOf(value); type && !custom; type = Object.getPrototypeOf(type)) {
                custom = this[$Type].get(type.constructor);
            }

            if (custom) {
                result = custom.call(this, value);
            }
        }
        else if (this[$Rule].has(value)) {
            result = this[$Rule].get(value);
        }

        return result;
    }

    // https://github.com/civicnet/strop#rulevalue-as
    rule(value, as) {
        switch (typeof value) {
            case 'object':
                if (value === null) {
                    break;
                }

            // eslint-disable-next-line no-fallthrough
            case 'function':
                throw new TypeError(`${ value } is not a primitive type`);
        }

        if (typeof as == 'undefined') {
            throw new TypeError('Rules require two parameters');
        }

        this[$Rule].set(value, `${ as }`);
    }

    // https://github.com/civicnet/strop#typefactory-handler
    type(factory, handler) {
        if (typeof factory != 'function') {
            throw new TypeError(`${ factory } is not a function`);
        }

        if (typeof handler != 'function') {
            throw new TypeError(`${ handler } is not a function`);
        }

        this[$Type].set(factory, handler);
    }

    // https://github.com/civicnet/strop#unindentstrings
    unindent(...strings) {
        if (!strings.length) {
            return strings;
        }

        strings = strings.map((s) => `${ s }`);

        if (!this.indent.length) {
            strings[0] = strings[0].replace(/^\n+/, '');
            strings[strings.length - 1] = strings[strings.length - 1].replace(/\n+$/, '');

            return strings;
        }

        const escaped = this.indent.split('').map((c) => `\\${ c }`).join('');

        strings[0] = strings[0].replace(new RegExp(`^([${ escaped }]*\n)+`), '\n');

        strings[strings.length - 1] = strings[strings.length - 1].replace(
            new RegExp(`(\n[${ escaped }]*)+$`),
            '\n',
        );

        const flat = strings.reduce((_, string) => _.concat(null, ...string.split('\n')), []);

        let indent = [];

        for (let same = true, current = []; same; current = []) {
            for (let i = 1; i < flat.length; ++i) {
                if (flat[i] === null || flat[i - 1] === null || !flat[i].length) {
                    continue;
                }

                if (this.indent.includes(flat[i][indent.length])) {
                    current.push(flat[i][indent.length]);

                    continue;
                }

                same = false;

                break;
            }

            same &&= !!current.length && current.every((c) => (c === current[0]));

            if (same) {
                indent.push(current[0]);
            }
        }

        indent = indent.join('');

        flat.push(null);

        let result = [];

        for (let i = 0, current = []; i < flat.length; ++i) {
            if (flat[i] === null) {
                if (i) {
                    result.push(current);
                    current = [];
                }

                continue;
            }

            if (flat[i - 1] === null) {
                current.push(flat[i]);

                continue;
            }

            if (flat[i].startsWith(indent)) {
                current.push(flat[i].slice(indent.length));

                continue;
            }

            current.push(flat[i]);
        }

        result = result.map((r) => r.join('\n'));

        result[0] = result[0].replace(/^\n/, '');
        result[result.length - 1] = result[result.length - 1].replace(/\n$/, '');

        return result;
    }
}
