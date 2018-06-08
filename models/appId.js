'use strict';

var Mongoose  = require('mongoose');


var AppIdSchema = new Mongoose.Schema({
    appId: {type: String, required: true},
    name: {type: String, required: true},
    description: {type: String, required: false},
    version: {type: String, required: false},
    status: {type: Boolean, required: false },
    created: {type: Date, default: new Date()},
    modified: {type: Date, default: new Date()}
});

var appIdModel = Mongoose.model('appId', AppIdSchema);

module.exports = appIdModel;