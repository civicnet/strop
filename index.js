'use strict';

import { readFileSync } from 'node:fs';
import types from 'node:util/types';

const $Rule = Symbol('Rule');
const $Type = Symbol('Type');

function transform(strings, ...values) {
    const result = this.pass({ raw: this.unindent(...strings.raw) }, ...values);

    if (result instanceof Object) {
        Object.setPrototypeOf(result, this.prototype);
    }

    return Object.freeze(result);
}

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
                if (typeof value != 'string' || !value.length) {
                    throw new TypeError('indent must be a non-empty string');
                }

                indent = value;
            },
        });

        Object.defineProperty(this.prototype, Symbol.toPrimitive, {
            configurable : true,
            writable     : true,

            value(hint) {
                return this.constructor.unwrap(this, hint);
            },
        });

        Object.defineProperty(this.prototype, 'toString', {
            configurable : true,
            writable     : true,

            value() {
                return `${ this[Symbol.toPrimitive]('string') }`;
            },
        });

        const tag = new Proxy(this, {
            apply : (_, $, args) => Reflect.apply(transform, this, args),

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
        const indent = new RegExp(`^([${ this.indent }]*)`);

        values = values.map((v, i) => {
            const current = indent.exec(raw.slice(0, i + 1).join('').split('\n').pop())[1];

            const placeholder = Object.defineProperty(Object.create(null), Symbol.toPrimitive, {
                value : () => `${ this.render(v) }`.replace(/\n/g, `\n${ current }`),
            });

            return Object.freeze(placeholder);
        });

        const result = [ Object.freeze({ raw: Object.freeze(raw) }), ...values ];

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

        return result;
    }

    // https://github.com/civicnet/strop#rendervalue
    render(value) {
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

        return `${ result }`;
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

        strings[0] = strings[0].replace(new RegExp(`^([${ this.indent }]*\n)+`), '\n');

        strings[strings.length - 1] = strings[strings.length - 1].replace(
            new RegExp(`(\n[${ this.indent }]*)+$`),
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

        indent = new RegExp(`^${ indent.join('') }(.*)$`);

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

            current.push((indent.exec(flat[i]) || [ null, flat[i] ])[1]);
        }

        result = result.map((r) => r.join('\n'));

        result[0] = result[0].replace(/^\n/, '');
        result[result.length - 1] = result[result.length - 1].replace(/\n$/, '');

        return result;
    }

    // https://github.com/civicnet/strop#unwrapvalue-hint--default
    unwrap(value, hint = 'default') {
        const known = {
            isDate(h) { return new Date(this)[Symbol.toPrimitive](h) },

            isBooleanObject : Boolean.prototype.valueOf,
            isNumberObject  : Number.prototype.valueOf,
            isStringObject  : String.prototype.valueOf,
        };

        for (const [ test, cast ] of Object.entries(known)) {
            if (types[test](value)) {
                return cast.call(value, hint);
            }
        }

        if (value instanceof Object) {
            return `${ value }`;
        }

        return value;
    }
}
