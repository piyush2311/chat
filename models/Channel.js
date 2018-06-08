var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var ChannelSchema = new Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, default: '' },
    type: { type: String, default: 'I' },
    participants: { type: [], default: [] },
    status: { type: Number, default: 1 },
    created: { type: Date, default: new Date() },
    modified: { type: Date, default: new Date() },
    appId: {type: String, required: true}

});
module.exports = mongoose.model('Channel', ChannelSchema);