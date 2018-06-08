var mongoose = require('mongoose');
var security = require(__dirname + '/../locals/security');
// var errorHandler = require(__dirname + '/../error-handler/errors.controller');

var _ = require('lodash');
var url = require('url');
var qs = require('querystring');

var parse = require('parse');
// var constants = require(__dirname + '/../locals/constants');
// var UserVehicle = require(__dirname + '/../../models/UserVehicle');
const Channel = require(__dirname + '/../models/Channel');
const Message = require(__dirname + '/../models/Message');
const async = require('async');
// var userService = require(__dirname + '/../../services/userService');
const limit = 20;
const ObjectId  = require('mongodb');

module.exports = function(app) {

    app.post('/createChannelsForPost', function(req, res) {
        var channels = req.body.data;

        if (channels && channels.length) {
            async.mapLimit(channels, 25, function(item, callback) {
                Channel.update({ postId: item }, { $set: {postId:item} }, { upsert: true }, callback);
            }, function(err, ddata) {
                res.json({ status: 1, message: 'Listed Successfully', data: ddata });
            });
        } else {
            res.json({ status: 1, message: 'Listed Successfully', data: [] });
        }

    });

    app.post('/saveMessage', function(req, res) {
       // console.log(req.body.data);
        var message = new Message(req.body.data);
        message.save(function(err, data) {
            if (err) {
             //   console.log(err);
                res.json({ status: 0, message: err, data: [] });
            } else {
                res.json({ status: 1, message: 'Successfully Saved', data: data });
            }
        });


    });

    app.post('getChatFriendAndGroups', function(req, res) {
        async.parallel([
            function(cbk) {
                userService.myFriendList(req.body.userId, function(response) {
                    if (response && response.status && response.status == 1) {
                        cbk(null, response.data);
                    } else {
                        cbk(null, []);
                    }
                });
            },
            function(cbk) {
                userService.myGroupListing(req.body.userId, function(response) {
                    if (response && response.status && response.status == 1) {
                        cbk(null, response.data);
                    } else {
                        cbk(null, []);
                    }
                });
            }
        ], function(err, docs) {
            // create channel if not alreay created
            var channels = [];
            var friends = [];
            var groups = [];
            var finalList = [];
            var typeIndividual = "I";
            var typeGroup = "G";

            if (docs[0] && docs[0].length) {
                friends = JSON.parse(JSON.stringify(docs[0]));
                channels = friends.map(function(v, k) {
                    var postId = new Date(ObjectId(v.userId).getTimestamp()).getTime() + new Date(ObjectId(req.body.userId).getTimestamp()).getTime();
                    friends[k].channelId = postId;
                    finalList.push({
                        id: postId,
                        channelId: postId,
                        name: v.personalInfo.firstName + ' ' + v.personalInfo.lastName,
                        image: v.personalInfo.image,
                        type: typeIndividual
                    });
                    return {
                        postId: postId,
                        type: typeIndividual,
                        participants: [req.body.userId, v.id]
                    };
                });

            }

            if (docs[1] && docs[1].length) {
                groups = JSON.parse(JSON.stringify(docs[1]));
                channels = channels.concat(groups.map(function(v, k) {
                    var postId = new Date(ObjectId(v.groupId._id).getTimestamp()).getTime();
                    groups[k].channelId = postId;
                    finalList.push({
                        id: postId,
                        channelId: postId,
                        name: v.groupId.name,
                        image: v.groupId.image || '/img/avatar.jpg',
                        type: typeGroup
                    });
                    return {
                        postId: postId,
                        type: typeGroup,
                        participants: []
                    };
                }));
            }

            if (err) {
                res.json({ status: 0, message: 'Please fill required fields!', data: [] });
            } else {
                async.mapLimit(channels, 25, function(item, callback) {
                    Channel.update({ postId: item.postId }, { $set: item }, { upsert: true }, callback);
                }, function(err, ddata) {
                    res.json({ status: 1, message: 'Listed Successfully', data: finalList });
                });
            }
        })


    });

    /*app.get('/getMessage', function (req, res) {
        console.log("call");
        console.log(req);
        /!*if(req.param()) {
        var find = {};
        }*!/

        Message.find({},function (err,data) {
            if(err) res.json({ status: 400 , message: err, data: [] });
            res.json({ status: 200, message: 'Success', data: data });
        });
    })*/

    app.get('/message', function(req, res) {
        console.log("API");
        const requestUrl = url.parse(req.url || '');
        const query = qs.parse(requestUrl.query);


        try {
            query.filter = JSON.parse(query.filter);
        } catch(e) {
            query.filter = {};
        }
        var ins = Message.find(query.filter.where || {});
        // Fields
        if(query.filter.select)
            ins = ins.select(query.filter.select);

        // documents limit
        if(query.filter.limit)
            ins = ins.limit(query.filter.limit);

        // order by
        if(query.filter.order)
            ins = ins.order(query.filter.order);

        // offset
        if(query.filter.skip)
            ins = ins.skip(query.filter.skip);

            ins.exec(function(err, data) {
                if(err) {
                    res.writeHead(500, err.message, {'Content-Type': 'application/json'});
                    res.end();
                } else {
                    //res.writeHead(200, {'Content-Type': 'application/json'});
                   // res.end(JSON.stringify(result));
                    res.json({ status: 200, message: 'Success', data: data });
                }
            });    
    });
    app.get('/message/count', function(req, res) {
        const requestUrl = url.parse(req.url || '');
        const query = qs.parse(requestUrl.query);
        try {
            query.filter = JSON.parse(query.filter);
        } catch(e) {
            query.filter = {};
        }
        var ins = Message.count(query.filter.where || {});

        Message.aggregate([
            { "$match": (query.filter.where || {}) },
            {
               "$group" : {_id:"$postId", count:{$sum:1}}
            }
        ]).exec(function (err, data) {
            if(err) {
                    res.writeHead(500, err.message, {'Content-Type': 'application/json'});
                    res.end();
                } else {
                   res.json({ status: 200, message: 'Success', data: data });

             }
        });   
    });
};
