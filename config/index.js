'use strict';

var init = function() {

    return require('./config.' + process.env.NODE_ENV  + '.json');
}

module.exports = init();