'use strict';
let {Chainer, Parallelizer} = require('./chain');

let __ = new WeakMap(),
    _  = (o) => {
        if (!__.has(o)) __.set(o, {});
        return __.get(o);
    };

const DEFAULT_FIELD_CONFIGURATION = {required: true};

const TYPES_NAMES = ['integer', 'string', 'datetime', 'boolean'];
const TYPES_VALIDATORS = {
    integer(field, next, stop) {
        if (!field.config.required && typeof field.data === 'undefined') {
            return stop();
        }

        if (typeof field.data !== 'number' || isNaN(field.data)) {
            return stop(new SchemaError(`Expected "${field.config.name}" field to be "integer"`));
        }
        next();
    },
    string(field, next, stop) {
        if (!field.config.required && typeof field.data === 'undefined') {
            return stop();
        }

        if (typeof field.data !== 'string') {
            return stop(new SchemaError(`Expected "${field.config.name}" field to be "string"`));
        }
        next();
    },
    datetime(field, next, stop) {
        if (!field.config.required && typeof field.data === 'undefined') {
            return stop();
        }

        if (!(field.data instanceof Date)) {
            return stop(new SchemaError(`Expected "${field.config.name}" field to be "Date Object"`));
        }
        next();
    },
    boolean(field, next, stop) {
        if (!field.config.required && typeof field.data === 'undefined') {
            return stop();
        }

        if (typeof field.data !== 'number' || field.data < 0 || field.data > 1) {
            return stop(new SchemaError(`Expected "${field.config.name}" field to be 0 or 1 (value: ${field.data})`));
        }
        next();
    }
};

class SchemaError extends Error {}

class Schema {
    constructor(properties) {
        _(this).properties = {};
        _(this).validators = {};

        for (let name in properties) {
            let property = properties[name];

            if (TYPES_NAMES.indexOf(property.type) < 0) {
                throw new SchemaError(`No type found for "${property.type}"`);
            }

            _(this).properties[name] = Object.assign({}, DEFAULT_FIELD_CONFIGURATION, property);
            _(this).validators[name] = new Chainer();

            this.validators[name].add(TYPES_VALIDATORS[property.type]);
        }
    }

    validate(data, done) {
        var parallelizer = new Parallelizer();

        for (let prop in this.validators) {
            let validatorData = {
                config: Object.assign({}, {name: prop}, _(this).properties[prop]),
                data: data[prop]
            };
            parallelizer.addValidator(this.validators[prop], validatorData);
        }

        parallelizer.start(done);
    }

    has(key) {
        return typeof _(this).properties[key] != 'undefined';
    }

    get validators() {
        return _(this).validators;
    }

    get properties() {
        return _(this).properties;
    }

    toJSON() {
        return _(this).properties;
    }
    toString() {
        return `${this.constructor.name} ${JSON.stringify(this, null, '\t')}`;
    }
}

module.exports = Schema;
