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
    * [resolve(value)][resolve]
    * [rule(value, as)][rule]
    * [type(factory, handler)][type]
    * [unindent(...strings)][unindent]
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

Single-line templates do not have their indentation adjusted.

Multi-line templates preserve the first line if is not empty and doesn't contain only indentation characters; it is also not taken into account when computing the common indentation.


### Constructing tags

A single argument is passed to the [constructor](https://github.com/civicnet/strop/blob/master/index.js#L10-L51): a `name` for the tag. It won't influence functionality but can be useful for debugging.


### Tag results

By default, a tag produces an object which can be _lazily_ converted to a string:

```javascript
console.log(`${ greeting }`);
console.log(greeting.toString());
console.log(String.raw(...greeting));
```

While the default implementation aims to prevent later modifications of the tag result, it is possible for the original interpolated values to change before the result is converted or between separate invocations. [Custom implementations][Customizing tags] can prevent, restrict and/or handle these situations if needed.

The result is also an instance of the tag:

```javascript
console.log(greeting instanceof sample); // true
```


### Loading from files

Templates can also be loaded from files:

```javascript
let greet = sample.file('./examples/greeting.in');

console.log(`${ greet(person) }`);
```

The file must contain a bare template, i.e. without the opening and closing `` ` ``. An error will be thrown if the file is not found or can't be parsed.

**Security note: Do not load untrusted templates.**

Loading a file returns a function which should be called with object arguments; the template will search their properties for any referenced values. The arguments are searched in the order they are passed. An error will be thrown if a required value is not found as a property in any of the arguments.


## Customizing tags

The adjustable [indentation characters] can be changed, interpolation can be customized using [rules and types], and the overall behaviour can be altered by overriding tags' [methods].


### Indentation characters

The indentation characters that a tag may adjust are located in its `indent` property string; the default value of `'\t '` enables tags to remove tabs and spaces.

The property can be changed:

```javascript
const custom = new StrOP('Custom indentation');

custom.indent = '\t >';

let todo = custom` TODO:
    > Write code
    > Test code
`;

console.log(`${ todo }`);
```

The output:

```
 TODO:
Write code
Test code
```

_Reminder: the first line will not have its indentation adjusted if it is not empty and doesn't contain only indentation characters._

If a mix of different indentation characters is used, only _identical_ sequences at the beginning of _every_ eligible line are considered "common" (and adjusted).


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

Every interpolated value's prototype (inheritance) chain is searched; only the most specialized type's handler is called.

Rules and types take precedence over the interpolated values' string conversion methods.


### Methods

A tag's behaviour can be further customized by overriding its methods.


#### file(path)

This method is not called internally.

The [default implementation](https://github.com/civicnet/strop/blob/master/index.js#L54-L67) loads the template file indicated by `path` and returns a function which can be called with objects, the keys of which are searched in the order they are passed during interpolation.

Custom implementations could be used to:
* locate template files;
* provide default values;
* validate and/or sanitize the arguments;
* change the invocation interface (e.g. argument order, currying).

Custom implementations should (but are not required to) call the default implementation.

The result of the (final) function call _should not_ be altered, as it is assumed to be identical to tagging template literals. If necessary, this can be achieved by overriding the [**`pass`** method][pass].


#### pass({ raw }, ...values)

This method is called to prepare the result of a tag operation, after indendation is removed from the `raw` strings by the [**`unindent`** method][unindent], and with the original `values`. It is used by template literals and the default [**`file`** method][file]'s returned functions.

The [default implementation](https://github.com/civicnet/strop/blob/master/index.js#L70-L122) returns an object which wraps the parameters. The returned object is an instance of the tag and cannot be modified, but can be extended. When converted to a string, it calls the [**`resolve`** method][resolve] for every interpolated value and converts the results into strings; indentation is adjusted for the results that span multiple lines.

Custom implementations could be used to:
* freeze the arguments;
* perform additional processing (e.g. translation, [DSLs](https://en.wikipedia.org/wiki/Domain-specific_language));
* alter the result.

Custom implementations should (but are not required to) call the default implementation.


#### resolve(value)

This method is invoked by objects returned by the default [**`pass`** method][pass] when they are converted to strings to process every interpolated `value`.

The [default implementation](https://github.com/civicnet/strop/blob/master/index.js#L125-L144) searches [rules and types] for a potential substitution.

Custom implementations could be used to:
* freeze the input value;
* change the substitution logic;
* quote, decorate and/or escape the result;
* cache the conversion result.

Custom implementations must call the original implementation to apply rules and types, as there are no other means to achieve this.

The returned value is always converted to a string by objects returned by the default [**`pass`** method][pass] when they are converted to strings.


#### rule(value, as)

This method is not called internally.

The [default implementation](https://github.com/civicnet/strop/blob/master/index.js#L147-L164) enables the default [**`resolve`** method][resolve] to replace every interpolated `value` with `as`.

There are no discernible use cases that would require overriding this method.

Custom implementations must call the original implementation to register effective rules, as there are no other means to achieve this.


#### type(factory, handler)

This method is not called internally.

The [default implementation](https://github.com/civicnet/strop/blob/master/index.js#L167-L177) enables the default [**`resolve`** method][resolve] to replace every interpolated value that is an instance of the `factory` function by calling the `handler` function with `this` set to the calling tag and the value as an argument.

Every interpolated value's entire prototype (inheritance) chain is searched; if the value matches multiple registered types, only the most specialized one's handler will be called.

There are no discernible use cases that would require overriding this method.

Custom implementations must call the original implementation to register effective types, as there are no other means to achieve this.


#### unindent(...strings)

This method is called during interpolation with the template's raw `strings`; the returned value is provided to the [**`pass`** method][pass].

The [default implementation](https://github.com/civicnet/strop/blob/master/index.js#L180-L253) trims leading and/or trailing lines that are empty (or contain only indentation characters) and removes any common indentation from all remaining non-empty lines.

Templates that span a single line before trimming do not have their indentation adjusted.

If the first line is not empty (and doesn't contain only indentation characters) before trimming, it will not have its indentation adjusted, nor will it be taken into account when computing the common indentation.

Any _completely empty_ lines that remain after trimming (i.e. were not at the very beginning or end of the template) are preserved and ignored when computing the common indentation. The assumption is that text editors will either preserve indentation in otherwise empty lines, or that they will completely empty them; however, some editors will not change template literals automatically and may leave uneven indentation in visually empty lines.

If a mix of different indentation characters is used, only _identical_ sequences at the beginning of _every_ eligible line are counted as common indentation (and adjusted).

Custom implementations could be used to:
* disable or change indentation processing;
* restrict certain usage patterns.

Custom implementations should (but are not required to) call the default implementation; they must **always** return an array with the same length as `strings`.


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
[resolve]: #resolvevalue
[rule]: #rulevalue-as
[type]: #typefactory-handler
[unindent]: #unindentstrings
[Tests]: #tests
[License]: #license
