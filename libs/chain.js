'use strict';
let __ = new WeakMap(),
    _  = (o) => {
        if (!__.has(o)) __.set(o, {});
        return __.get(o);
    };

Array.prototype.reverseEach = function(iterator) {
    for (let i = this.length - 1; i >= 0; --i) {
        iterator(this[i], i, this);
    }
};

function call(validator, data, i) {
    return _(validator).validators[i](data, _(validator).chaining[i], _(validator).stop);
}

class Chainer {
    constructor() {
        _(this).validators = [];
        _(this).chaining = [];
    }

    add(fn) {
        _(this).validators.push(fn);

        return this;
    }

    execute(data, done) {
        if (_(this).validators.length == 0) {
            return done();
        }

        _(this).stop = (err) => done(err);
        _(this).validators.reverseEach((v, i, a) => {
            let next = i == a.length - 1 ?
                done :
                () => {
                    call(this, data, i+1);
                };

            _(this).chaining[i] = () => next();
        });

        call(this, data, 0);
    }
}

class Parallelizer {
    constructor() {
        _(this).validators = [];
    }

    addValidator(validator, data) {
        _(this).validators.push({
            validator: validator,
            data:      data
        });
    }

    start(done) {
        let times = 0, length = _(this).validators.length;

        if (!length) done();
        _(this).validators.forEach((validator) => {
            setTimeout(function() {
                validator.validator.execute(validator.data, (err) => {
                    if (err) {
                        return done(err);
                    }

                    ++times;
                    if (times == length) {
                        done();
                    }
                })
            }, 0);
        });
    }
}

module.exports = {
    Chainer: Chainer,
    Parallelizer: Parallelizer
};
