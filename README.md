# StrOP &nbsp;&nbsp;&nbsp;![npm](https://img.shields.io/npm/v/@civicnet/strop.svg) ![Test Status](https://github.com/civicnet/strop/actions/workflows/test.yml/badge.svg) [![Coverage Status](https://coveralls.io/repos/github/civicnet/strop/badge.svg?branch=master)](https://coveralls.io/github/civicnet/strop?branch=master)

Simple tagged template literals (strings)


* [Installing]
* [Basic use]
  * [What it does]
  * [Constructing tags]
  * [Tag results]
  * [Loading from files]
* [Customizing tags]
  * [Indentation characters]
  * [Rules and types]
  * [Methods]
    * [file(path)][file]
    * [pass({ raw }, ...values)][pass]
    * [render(value)][render]
    * [rule(value, as)][rule]
    * [type(factory, handler)][type]
    * [unindent(...strings)][unindent]
    * [unwrap(value, hint = 'default')][unwrap]
* [Tests]
* [License]

## Installing

Install from [npm](https://www.npmjs.com/package/@civicnet/strop):

    npm install @civicnet/strop

Install and save as a dependency:

    npm install --save @civicnet/strop


## Basic use

```javascript
const StrOP = require('@civicnet/strop');

const sample = new StrOP('Sample');

let person = { name: 'Alice', job: 'programmer', options: [ 'yes', 'no' ] };

let greeting = sample`
        Hi, ${ person.name }!

    Do you like being a ${ person.job }?

    Options:
        ${ person.options.map((o) => `* ${ o }`).join('\n') }

`;

console.log(`${greeting}`);
```

This will produce the following output:

        Hi, Alice!
    
    Do you like being a programmer?

    Options:
        * yes
        * no


### What it does

**`StrOP`** is a factory for [template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) tags. Their main use is to adjust indentation, so that multi-line template literals can be used intuitively anywhere in your code.

A tag's default behaviour:

* **trims leading and/or trailing lines** that are empty (or contain _only_ [indentation characters]);
* **removes common indentation** from all _remaining_ non-empty lines;
* **interpolates placeholders** exactly like _untagged_ template literals and indents them accordingly;
* **produces an object** which can be converted to a string.

If the first line is not empty and doesn't contain only indentation characters, it will not have its indentation removed, nor will it be taken into account when computing the common indentation.

Single-line templates do not have their indentation changed.


### Constructing tags

A single argument is passed to the [constructor](https://github.com/civicnet/strop/blob/master/index.js#L18-L71): the tag's `name`. It won't influence functionality, but can be useful for debugging.


### Tag results

By default, a tag produces an object which contains all the information needed to be _lazily_ converted to a string. This can be done in several ways:

```javascript
console.log(`${ greeting }`);
console.log(greeting.toString());
console.log(String.raw(...greeting));
```

While the default implementation aims to prevent later modifications of the tag result, it is possible for the original interpolated values to change before the result is converted or between separate invocations. [Custom implementations][Customizing tags] can prevent, restrict and/or handle these situations if needed.


The result object is also an instance of the tag:

```javascript
console.log(greeting instanceof sample); // true
```


### Loading from files

Templates can also be loaded from files:

```javascript
let greet = sample.file('./examples/greeting.in');

console.log(`${ greet(person) }`);
```

The file must contain a bare template, i.e. without the opening and closing `` ` ``;

An error will be thrown if the file is not found or can't be parsed.

**Security note: Do not load untrusted templates.**

Loading a file returns a function which should be called with object arguments to provide context, i.e. the template will search their properties for any referenced values. The arguments are searched in the order they are passed; an error will be thrown if a required value is not found.


## Customizing tags

The removable [indentation characters] can be changed, interpolation can be customized using [rules and types], and the overall behaviour can be altered by overriding tags' [methods].


### Indentation characters

The indentation characters that a tag may remove are located in its `indent` property string; the default value of `'\t '` enables tags to remove tabs and spaces.

An example:

```javascript
const custom = new StrOP('Custom indentation');

custom.indent = '\t >';

let todo = custom` TODO:
    > Write code
    > Test code
`;

console.log(`${ todo }`);
```

Its output:

```
 TODO:
Write code
Test code
```

_Reminder: the first line will not have its indentation adjusted if it is not empty and doesn't contain only indentation characters._

If a mix of different indentation characters is used in the template, only _identical_ sequences at the beginning of _every_ eligible line are considered "common" (and removed).


### Rules and types

Rules and types can be used to customize interpolations.

Rules match interpolated primitive values and replace them with other values:

```javascript
sample.rule(3, 'three');
sample.rule(4, 'four');

let count = sample`${ 1 }, ${ 2 }, ${ 3 }, ${ 4 }`;

console.log(`${ count }`); // 1, 2, three, four
```

They work as expected with `undefined`, `null`, `NaN` and other "exotic" values (similar to `===`).

Types match using the interpolated values' constructors and call the corresponding handlers to provide substitutions:

```javascript
class Percentage extends Number { }

sample.type(Percentage, (p) => `${ (p * 100).toFixed(2) }%`);

let score = sample`Your score is: ${ new Percentage(28 / 30) }`;

console.log(`${ score }`); // Your score is: 93.33%
```

Type handlers are called with `this` set to the calling tag and the value as an argument.

Every interpolated value's prototype (inheritance) chain is searched; only the most specialized type's handler will be called.

Rules and types take precedence over the interpolated values' string conversion methods.


### Methods

A tag's behaviour can be customized by overriding its methods.


#### file(path)

This method is not called internally.

The [default implementation](https://github.com/civicnet/strop/blob/master/index.js#L74-L87) loads the template file indicated by `path` and returns a function which can be called with objects, the keys of which are searched (in the order they are passed) during interpolation.

Custom implementations could be used to:
* locate template files;
* provide default values;
* validate and/or sanitize the arguments;
* alter invocation details.

The result of the (final) function call _should not_ be altered, as it is assumed to be identical to tagging template literals. Both can be customized by overriding the [**`pass`** method][pass] instead.

Custom implementations should (but are not required to) call the default implementation.


#### pass({ raw }, ...values)

This method is the actual tag function; it is called internally to prepare the result of a tag operation, after indendation is removed from the `raw` strings, and with the original `values`. It is used both for template literals and the default [**`file`** method][file]'s returned functions.

The [default implementation](https://github.com/civicnet/strop/blob/master/index.js#L90-L118) returns an array-like object which wraps the parameters; when converted to a string, it calls the [**`render`** method][render] for every interpolated value. Indentation will be adjusted for the rendered results that span multiple lines.

Custom implementations could be used to:
* freeze the arguments;
* perform additional processing (e.g. translation, [DSLs](https://en.wikipedia.org/wiki/Domain-specific_language));
* alter the result.

The result is always processed to ensure it is an instance of the tag; this may break typed objects and does not work for primitives. Lastly, the result is [frozen](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze).

If built-in `Boolean`, `Date`, `Number` or `String` objects are returned, the default [**`unwrap`** method][unwrap] will (correctly) convert them to primitives.

Custom implementations should (but are not required to) call the default implementation.


#### render(value)

This method is used by objects returned by the default [**`pass`** method][pass] when they are converted to strings; it is called to produce a string representation for every interpolated `value`.

The [default implementation](https://github.com/civicnet/strop/blob/master/index.js#L121-L140) searches [rules and types] for substitution and converts the value (or substitute) to a string.

Custom implementations could be used to:
* freeze the value;
* change the substitution logic;
* quote, decorate and/or escape the result;
* cache conversion result.

Custom implementations must call the original implementation to apply rules and types, as there are no other means to achieve this.


#### rule(value, as)

This method is not called internally.

The [default implementation](https://github.com/civicnet/strop/blob/master/index.js#L143-L160) instructs the tag to replace every interpolated `value` with `as`.

There are no discernible use cases that would require overriding this method.

Custom implementations must call the original implementation to register effective rules, as there are no other means to achieve this.


#### type(factory, handler)

This method is not called internally.

The [default implementation](https://github.com/civicnet/strop/blob/master/index.js#L163-L173) instructs the tag to replace every interpolated value that is an instace of the `factory` function by calling the `handler` function with `this` set to the calling tag and the value as an argument.

Every interpolated value's entire prototype (inheritance) chain is searched; if the value matches multiple types, only the most specialized one's handler will be called.

There are no discernible use cases that would require overriding this method.

Custom implementations must call the original implementation to register effective types, as there are no other means to achieve this.


#### unindent(...strings)

This method is called during interpolation with the template's raw `strings` to remove [indentation characters].

The [default implementation](https://github.com/civicnet/strop/blob/master/index.js#L176-L249) trims leading and/or trailing lines that are empty (or contain only indentation characters) and removes any common indentation from all remaining non-empty lines.

Templates that span a single line before trimming do not have their indentation adjusted.

If the first line is not empty (and doesn't contain only indentation characters) before trimming, it will not have its indentation adjusted, nor will it be taken into account when computing the common indentation.

Any _completely empty_ lines that remain after trimming (i.e. were not at the very beginning or end of the template) are preserved and ignored when computing the common indentation. The assumption is that text editors will either preserve indentation in otherwise empty lines, or that they will completely empty them; however, some editors will not change template literals automatically and may leave uneven indentation in visually empty lines. This should be checked for whenever the output is different than expected.

Custom implementations could be used to:
* disable or change indentation processing;
* restrict certain usage patterns.

Custom implementations should (but are not required to) call the default implementation and must **always** return an array with the same length as `strings`.


#### unwrap(value, hint = 'default')

This method is only called when objects returned by a custom [**`pass`** method][pass] are converted to strings but they didn't provide their own [primitive conversion](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toPrimitive) method.

The [default implementation](https://github.com/civicnet/strop/blob/master/index.js#L252-L272) checks if `value` is (or was) a built-in `Boolean`, `Date`, `Number` or `String` object and returns its correct primitive conversion; other objects are converted to strings directly.

Primitives are always returned unchanged.

Custom implementations could be used to:
* alter the way built-in objects are converted;
* convert additional types of objects.

Custom implementations should (but are not required to) call the default implementation.


## Tests

Tests can be run using:

```
npm test
```

## License

[MIT](https://github.com/civicnet/strop/blob/master/LICENSE)


[![CivicNet](https://civicnet.ro/favicon-32x32.png)](https://civicnet.ro)


[Installing]: #installing
[Basic use]: #basic-use
[What it does]: #what-it-does
[Constructing tags]: #constructing-tags
[Tag results]: #tag-results
[Loading from files]: #loading-from-files
[Customizing tags]: #customizing-tags
[Indentation characters]: #indentation-characters
[Rules and types]: #rules-and-types
[Methods]: #methods
[file]: #filepath
[pass]: #pass-raw--values
[render]: #rendervalue
[rule]: #rulevalue-as
[type]: #typefactory-handler
[unindent]: #unindentstrings
[unwrap]: #unwrapvalue-hint--default
[Tests]: #tests
[License]: #license
