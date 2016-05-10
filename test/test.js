'use strict';
let expect = require('chai').expect,
    {BaseModel, Schema} = require('../index.js'),
    options = {
        host: '127.0.0.1', port: 3306, user: 'test', password: 'test', database: 'tests'
    };

let testSchema = new Schema({
    id: {type: 'integer', required: false},
    valueInt: {type: 'integer', required: false},
    valueStr: {type: 'string', required: false},
    valueBool: {type: 'boolean', required: false},
    valueDatetime: {type: 'datetime', required: false}
});

class Test extends BaseModel {
    static get options() { return options; }
    get schema() { return testSchema; }
}

describe('Empty test', () => {
    let test;

    it('should save in database', (done) => {
        Test.create({})
            .then((_t) => {
                test = _t;
                expect(test).to.be.an.instanceOf(Test);
                done()
            })
            .catch(done);
    });

    it('should have an id property which is an integer', () => {
        expect(test).to.have.property('id').that.is.a('number');
    });

    it('should have a valueInt property', () => {
        expect(test).to.have.property('valueInt').that.is.a('number');
    });

    it('should have a valueStr property', () => {
        expect(test).to.have.property('valueStr').that.is.a('string');
    });

    it('should have a valueBool property', () => {
        expect(test).to.have.property('valueBool').that.is.a('number');
    });

    it('should have a valueDatetime property', () => {
        expect(test).to.have.property('valueDatetime').that.is.an.instanceOf(Date);
    });
});

describe('Test with valueBool', () => {
    let test;

    it('should save in database', (done) => {
        Test.create({valueBool: 1}).then((_t) => {
            test = _t;
            expect(test).to.be.an.instanceOf(Test);
            done()
        })
        .catch(done);
    });

    it('should have an id property which is an integer', () => {
        expect(test).to.have.property('id').that.is.a('number');
    });

    it('should have a valueInt property', () => {
        expect(test).to.have.property('valueInt').that.is.a('number');
    });

    it('should have a valueStr property', () => {
        expect(test).to.have.property('valueStr').that.is.a('string');
    });

    it('should have a valueBool property', () => {
        expect(test).to.have.property('valueBool').that.is.a('number').that.equals(1);
    });

    it('should have a valueDatetime property', () => {
        expect(test).to.have.property('valueDatetime').that.is.an.instanceOf(Date);
    });
});
