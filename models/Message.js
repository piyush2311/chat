var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MessageSchema = new Schema({
    content: { type: String, default: '' },
    senderId: { type: mongoose.Schema.Types.ObjectId },
    postId: { type: String},
    status: { type: Number, default: 1 },
    created: { type: Date, default: new Date() },
    modified: { type: Date, default: new Date() },
    appId: {type: String, required: true}
});
module.exports = mongoose.model('Message', MessageSchema);