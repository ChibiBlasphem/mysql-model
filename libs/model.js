'use strict';
var pluralize    = require('pluralize'),
    __           = new WeakMap(),
    _            = function(o) {
        if (!__.has(o)) __.set(o, {});
        return __.get(o);
    },
    shortid = require('./shortid'),
    mysql2  = require('mysql2');

class QueryBuilder {
    constructor(Model) {
        _(this).Model = Model;
        this.client = mysql2.createConnection(Object.assign({}, _(this).Model.options, {namedPlaceholders: true}));

        _(this).params  = {};
        _(this).from    = '';
        _(this).where   = [];
        _(this).orderBy = [];
    }

    from(table) {
        _(this).from = table;
        return this;
    }

    where(field, value) {
        if (value == undefined) {
            _(this).where.push(field);
        } else {
            let w = '', uniqid = shortid.generate();

            w = `${field} = :${uniqid}`;
            _(this).params[uniqid] = value;
            _(this).where.push(w);
        }

        return this;
    }

    limit(i) {
        _(this).limit = i;
        return this;
    }

    offset(i) {
        _(this).offset = i;
        return this;
    }

    orderBy(o, push = false) {
        if (!_(this).orderBy) {
            _(this).orderBy = [];
        }

        if (typeof o == 'string') {
            if (!push) {
                _(this).orderBy = [];
            }
            _(this).orderBy.push(o);
        } else if (Array.isArray(o)) {
            o.forEach((s) => {
                this.orderBy(s, true);
            });
        }

        return this;
    }

    selectOne(fields = '*') {
        return this.limit(1).select()
            .then((_o) => {
                return _o.length ? _o[0] : undefined;
            });
    }

    select(fields = '*') {
        let _where = _(this).where.length ? ` WHERE ${_(this).where.map(w=>`(${w})`).join('AND')}` : '',
            _limit = _(this).limit ? ` LIMIT ${_(this).limit}${_(this).offset ? ` OFFSET ${_(this).offset}` : ''}`: '',
            _order = _(this).orderBy.length ? ` ORDER BY ${_(this).orderBy.join(', ')}` : '';

        let q = `SELECT ${fields} FROM ${_(this).from}${_where}${_order}${_limit}`;

        return new Promise((resolve, reject) => {
            this.client.execute(q, _(this).params, (err, res) => {
                this.client.end();

                if (err) {
                    return reject(err);
                }

                var objs = [];
                res.map((row) => {
                    let item = new (_(this).Model)(row);
                    _(item).hasBeenSaved = true;
                    objs.push(item);
                });

                resolve(objs);
            });
        });
    }

    delete() {
        let q = `DELETE FROM ${_(this).from}${_(this).where.length==0?'':' WHERE '+ _(this).where.map(w=>`(${w})`).join(' AND ')}`;
        return new Promise((resolve, reject) => {
            this.client.execute(q, _(this).params, (err, res) => {
                this.client.end();

                if (err) {
                    return reject(err);
                }

                resolve();
            });
        });
    }

    update(obj) {
        let data = obj.toJSON();
        let q = `UPDATE ${_(this).from} SET ${Object.keys(data).filter(k=>k!='id').map(k=>`${k}=:${k}`).join(', ')} WHERE id = :id`;

        return new Promise((resolve, reject) => {
            this.client.execute(q, data, (err, res) => {
                this.client.end();

                if (err) {
                    return reject(err);
                }

                resolve(obj);
            });
        });
    }

    insert(obj) {
        let data = obj.toJSON();
        let q = `INSERT INTO ${_(this).from}(${Object.keys(data).join(', ')}) VALUES(${Object.keys(data).map(p=>`:${p}`).join(', ')})`;

        return new Promise((resolve, reject) => {
            this.client.execute(q, data, (err, res) => {
                this.client.end();

                if (err) {
                    return reject(err);
                }

                obj.constructor.where('id', res.insertId)
                    .selectOne()
                    .then((_o) => {
                        resolve(_o);
                    })
                    .catch(reject);
            });
        });
    }
}

class BaseModel {
    static get table() { return pluralize(this.name.toLowerCase()); }

    // Class methods
    static new() {
        return new this();
    }

    static create(data = {}) {
        return (new this(data)).save();
    }

    static where() {
        let q = new QueryBuilder(this).from(this.table);
        if (typeof arguments[0] == 'undefined') {
            return q;
        }

        return q.where.apply(q, arguments);
    }

    static insert(o) {
        return (new QueryBuilder(this)).from(this.table).insert(o);
    }

    static update(o) {
        return (new QueryBuilder(this)).from(this.table).update(o);
    }

    static destroy(o) {
        return !o.isNewRecord ?
            (new QueryBuilder(this)).from(this.table).where('id', o.id).delete() :
            Promise.resolve();
    }

    // Instance methods
    constructor(data) {
        if (data != undefined) {
            for (let prop in data) {
                this[prop] = data[prop];
            }
        }
    }

    save() {
        return new Promise((resolve, reject) => {
            this.schema.validate(this, (err) => {
                if (err) {
                    return reject(err);
                }

                let savePromise = (!this.isNewRecord ? this.constructor.update(this) : this.constructor.insert(this))
                    .then((_o) => {
                        _(_o).hasBeenSaved = true;
                        return _o;
                    });
                resolve(savePromise);
            });
        });
    }

    destroy() {
        return this.constructor.destroy(this);
    }

    toJSON() {
        let props = Object.keys(this.schema.properties), data = {};
        props.forEach((p) => {
            if (typeof this[p] == 'undefined') {
                return;
            }

            data[p] = this[p];
        });

        return data;
    }

    get isNewRecord() { return !_(this).hasBeenSaved; }
};

module.exports = BaseModel;
