# StrOP &nbsp;&nbsp;&nbsp;![npm](https://img.shields.io/npm/v/@civicnet/strop.svg) [![Build](https://travis-ci.org/civicnet/strop.svg?branch=master)](https://travis-ci.org/civicnet/strop) [![Coverage](https://coveralls.io/repos/github/civicnet/strop/badge.svg)](https://coveralls.io/github/civicnet/strop)

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
        Hi, ${person.name}!

    Do you like being a ${person.job}?

    Options:
        ${person.options.map((o) => `* ${o}`).join('\n')}

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

A single parameter is passed to the [constructor](https://github.com/civicnet/strop/blob/master/index.js#L18-L70): the tag's `name`. It doesn't _do_ anything, but can be useful when debugging.


### Tag results

By default, a tag produces an object which contains all the information needed to be _lazily_ converted to a string. This can be done in several ways:

```javascript
console.log(`${greeting}`);
console.log(greeting.toString());
console.log(String.raw(...greeting));
```

The same string is produced; either variation might be suitable for different situations.

The object is also an instance of the tag:

```javascript
console.log(greeting instanceof sample); // true
```


### Loading from files

Templates can also be loaded from files:

```javascript
let greet = sample.file('./examples/greeting.in');

console.log(`${greet(person)}`);
```

Loading a file returns a function which should be called with object parameters; their keys are used by the template during interpolation.

The parameters are searched in the order they are passed. If the template references a key that doesn't exist in _any_ of the passed objects, an error will be thrown.

The tag that loaded the file is used to produce the result.


## Customizing tags

A tag factory is used because each individual tag can be customized.

The [indentation characters] that are removed can be changed, interpolation can be customized using [rules and types], and the overall behaviour can be altered by overwriting tags' [methods].


### Indentation characters

The indentation characters that a tag may remove are located in its `indent` property string; the default value of `'\t '` allows tags to remove tabs and spaces.

An example:

```javascript
const custom = new StrOP('Custom indentation');

custom.indent = '\t >';

let todo = custom` TODO:
    > Write code
    > Test code
`;

console.log(`${todo}`);
```

Its output:

```
 TODO:
Write code
Test code
```

_Reminder:_ the first line will not have its indentation removed if it is not empty and doesn't contain only indentation characters.

In the odd case that a mix of different indentation characters is used in the template, only _identical_ runs at the beginning of _every_ eligible line are considered "common" (and removed).


### Rules and types

Rules and types can be used to customize interpolations.

Rules match interpolated primitive values and replace them with other values:

```javascript
sample.rule(3, 'three');
sample.rule(4, 'four');

let count = sample`${1}, ${2}, ${3}, ${4}`;

console.log(`${count}`); // 1, 2, three, four
```

They work as expected with `undefined`, `null`, `NaN` and other "exotic" values (similar to `===`).

Types match using the interpolated values' constructors and replace them by calling the corresponding handlers:

```javascript
class Percentage extends Number { }

sample.type(Percentage, (p) => `${(p * 100).toFixed(2)}%`);

let score = sample`Your score is: ${new Percentage(28 / 30)}`;

console.log(`${score}`); // Your score is: 93.33%
```

Handlers are called with the interpolated value, in the context (`this`) of the tag instance.

**Note:** Every interpolated value's entire prototype (inheritance) chain is searched; if the value matches multiple types, only the most specialized one's handler will be called.

Rules and types take precedence over the interpolated values' string conversion methods.


### Methods

A tag's behaviour can be customized by overwriting its methods.


#### file(path)

This method is not called internally.

The [default implementation](https://github.com/civicnet/strop/blob/master/index.js#L73-L86) loads the template file indicated by `path` and returns a function which can be called with objects, the keys of which are searched (in the order they are passed) during interpolation.

Custom implementations could be used to:
* locate template files;
* provide default values;
* alter the way the returned function is called.

**Note:** The result of the function call should _not_ be altered, as it is implied to be similar to that of tagging template literals. Both cases can be customized by overwriting the [**`pass`** method][pass] instead.

Custom implementations should (but are not required to) call the default implementation.


#### pass({ raw }, ...values)

This method is the actual tag function; it is called internally to prepare the result of a tag operation, after indendation is removed from the `raw` strings, and with the original `values`. It is used both for template literals and the default [**`file`** method][file]'s returned functions.

The [default implementation](https://github.com/civicnet/strop/blob/master/index.js#L89-L117) returns an array-like object which wraps the parameters;  when converted to a string, it calls the [**`render`** method][render] for for every interpolated value. Proper indentation will be added to the rendered results if they span multiple lines.

Custom implementations could be used to:
* emplace [DSLs](https://en.wikipedia.org/wiki/Domain-specific_language);
* make external calls;
* alter the returned value.

**Note:** The returned value is further processed internally to ensure it is an instance of the tag; this _does not work_ for primitives and "breaks" most typed objects.

If built-in `Boolean`, `Date`, `Number` or `String` objects are returned, the default [**`unwrap`** method][unwrap] will (correctly) convert them to primitives.

Custom implementations should (but are not required to) call the default implementation.


#### render(value)

This method is called internally to produce a string representation for an interpolated `value`; it is called for each interpolated value by the object returned by the default [**`pass`** method][pass] when it is converted to a string.

The [default implementation](https://github.com/civicnet/strop/blob/master/index.js#L120-L139) searches [rules and types] for substitution and converts the value (or substitute) to a string.

Custom implementations could be used to:
* change the substitution logic;
* quote, decorate and/or escape values;
* cache conversions.

Custom implementations must call the original implementation to apply rules and types, as there are no other means to achieve this.


#### rule(value, as)

This method is not called internally.

The [default implementation](https://github.com/civicnet/strop/blob/master/index.js#L142-L159) instructs the tag to replace every interpolated `value` with `as`.

There are no discernible cases that would require overwriting this method.

Custom implementations must call the original implementation to add effective rules, as there are no other means to achieve this.


#### type(factory, handler)

This method is not called internally.

The [default implementation](https://github.com/civicnet/strop/blob/master/index.js#L162-L172) instructs the tag to replace every interpolated value that is an instace of the `factory` function by calling the `handler` function with the value, in the context (`this`) of the tag.

Every interpolated value's entire prototype (inheritance) chain is searched; if the value matches multiple types, only the most specialized one's handler will be called.

There are no discernible cases that would require overwriting this method.

Custom implementations must call the original implementation to add effective types, as there are no other means to achieve this.


#### unindent(...strings)

This method is called internally with the template's raw `strings` to remove [indentation characters].

The [default implementation](https://github.com/civicnet/strop/blob/master/index.js#L175-L240) trims leading and/or trailing lines that are empty (or contain only indentation characters) and removes common indentation from all remaining non-empty lines.

If the first line is not empty and doesn't contain only indentation characters, it will not have its indentation removed, nor will it be taken into account when computing the common indentation.

Intermediate empty lines are preserved but are _not_ taken into account when computing the common indentation. This is done to mitigate some text editor behaviours which may automatically remove trailing whitespace and/or trim empty-looking lines.

**Note:** Lines that are neither _completely_ empty nor at the very beginning or end of the template _will_ be taken into account when computing the common indentation.

Single-line templates do not have their indentation changed.

There are no discernible cases that would require overwriting this method.

Custom implementations should (but are not required to) call the default implementation and must **always** return an array of the same length as `strings`.


#### unwrap(value, hint = 'default')

This method is not called internally by default. It is provided as a helper for objects returned by the [**`pass`** method][pass] which didn't provide their own [primitive conversion](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toPrimitive) method.

The [default implementation](https://github.com/civicnet/strop/blob/master/index.js#L243-L262) checks if `value` is (or was) a built-in `Boolean`, `Date`, `Number` or `String` object and returns its primitive conversion; other objects are converted to strings directly and primitives are returned unchanged.

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
