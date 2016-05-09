'use strict';

let history = [];

const CHARACTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const KEY_LENGTH = 8;

function generate() {
    let rtn = '';
    for (let i = 0; i < KEY_LENGTH; ++i) {
        rtn += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
    }

    return history.indexOf(rtn) < 0 ? history.push(rtn) && rtn : generate();
}

module.exports = {
    generate() {
        return generate();
    }
};
