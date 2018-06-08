'use strict';

var config = require('../config');
var redis = require('redis').createClient;
var adapter = require('socket.io-redis');

var Room = require('../models/roomImpl');
const async = require('async');
const Channel = require('../models/Channel');
const Message = require('../models/Message');
// var RoomController = require('../controllers/web/room');


/**
 * Encapsulates all code for emitting and listening to socket events
 *
 */
var ioEvents = function(io) {

    // Rooms namespace
    io.on('connection', function(socket) {
        // Create a new room
        socket.on('createRoom', function(title) {
            Room.findOne({ 'title': new RegExp('^' + title + '$', 'i') }, function(err, room) {
                if (err) throw err;
                if (room) {
                    socket.emit('updateRoomsList', { error: 'Room title already exists.' });
                } else {
                    Room.create({
                        title: title
                    }, function(err, newRoom) {
                        if (err) throw err;
                        socket.emit('updateRoomsList', newRoom);
                        socket.broadcast.emit('updateRoomsList', newRoom);
                    });
                }
            });
        });
    });

    // Chatroom namespace
    io.on('connection', function(socket) {
        //io.of('/chatroom').on('connection', function(socket) {
        var addedUser = false;

        // Join a chatroom
        socket.on('join', function(roomId, userId) {
            var id = "5afe9b90e49a0d19585727c9";
            //console.log('Congs! You have joined.');
            Room.findById(id, function(err, room) {

                if (err) throw err;
                if (!room) {
                    // Assuming that you already checked in router that chatroom exists
                    // Then, if a room doesn't exist here, return an error to inform the client-side.
                    socket.emit('updateUsersList', { error: 'Room doesnt exist.' });
                } else {
                    // Check if user exists in the session
                   /* if (!userId) {
                        return;
                    }*/

                    // Push a new connection object(i.e. {userId + socketId})
                    var conn = { userId: userId, socketId: socket.id };
                    room.connections.push(conn);

                    room.save(function(err, newRoom) {
                        // Join the room channel
                        socket.join(newRoom.id);

                        if(userId != null)
                        Room.getUsers(newRoom, socket, userId, function(err, users, cuntUserInRoom) {
                            if (err) throw err;

                            // Return list of all user connected to the room to the current user
                            socket.emit('updateUsersList', users, true);

                            // Return the current user to other connecting sockets in the room
                            // ONLY if the user wasn't connected already to the current room
                            if (cuntUserInRoom === 1) {
                                socket.broadcast.to(newRoom.id).emit('updateUsersList', users[users.length - 1]);
                            }
                        });
                    });
                }
            });
        });
        // when the client emits 'typing', we broadcast it to others
        socket.on('typing', function(roomId, username) {
            // console.log(username + ' is typing');
            socket.broadcast.to(roomId).emit('typing', {
                roomId: roomId,
                username: username
            });
        });
        // when the client emits 'stop typing', we broadcast it to others
        socket.on('stopTyping', function(roomId, username) {
            // console.log(username + ' has stoped typing');
            socket.broadcast.to(roomId).emit('stopTyping', {
                roomId: roomId,
                username: username
            });
        });
        // when the client emits 'left room', we broadcast it to others
        socket.on('leftRoom', function(roomId, username) {
            // console.log(username + ' has left the room');
            socket.broadcast.to(roomId).emit('leftRoom', {
                roomId: roomId,
                username: username
            });
        });
        // When a socket exits
        socket.on('disconnect', function() {

            // Check if user exists in the session
            if (socket.request.session.passport == null) {
                return;
            }

            // Find the room to which the socket is connected to, 
            // and remove the current user + socket from this room
            Room.removeUser(socket, function(err, room, userId, cuntUserInRoom) {
                if (err) throw err;

                // Leave the room channel
                socket.leave(room.id);

                // Return the user id ONLY if the user was connected to the current room using one socket
                // The user id will be then used to remove the user from users list on chatroom page
                if (cuntUserInRoom === 1) {
                    socket.broadcast.to(room.id).emit('removeUser', userId);
                }
            });
        });

        // When a new message arrives
        socket.on('newMessage', function(roomId, message) {
            // No need to emit 'addMessage' to the current socket
            // As the new message will be added manually in 'main.js' file
            // socket.emit('addMessage', message);  
            //console.log(message);
            //socket.emit('addMessage', message);
            if (message) {
                switch(message.operation) {
                    case 'ADD': {
                        var messageInstance = new Message(message);
                        messageInstance.save(function(err, data) {
                            if (err) {
                                console.log(err);
                            } else {
                                //socket.broadcast.to(roomId).emit('addMessage', data);
                                //socket.emit('addMessage', data);
                                socket.nsp.to(roomId).emit('addMessage', data);

                            }
                        });
                        break;
                    }
                    case 'EDIT': {
                        Message.update({ _id: message._id }, { $set: message}, function(err, data){
                            if (err) {
                                console.log(err);
                            } else {
                                //socket.broadcast.to(roomId).emit('addMessage', data);
                                socket.emit('addMessage', data);
                            }
                        });
                    }


                }

            }

        });

        // create channels
        // when the client emits 'typing', we broadcast it to others
        socket.on('createChannels', function(channels, appId) {

            if (channels && channels.length) {
                async.mapLimit(channels, 25, function(item, callback) {
                    Channel.update({ postId: item }, { $set: {postId:item, appId: appId} }, { upsert: true }, callback);
                }, function(err, ddata) {
                });
            }

        });
        
        // Save message
        socket.on('saveMessage', function(msg) {
        });
        
        // Get message
        /*socket.on('getMessage', function (filter) {
            console.log(filter);
            var where = {postId : filter.postId};
            Message.find(where, function (err, data) {
                console.log('Message', data);
                socket.broadcast.to(filter.roomId).emit('receivedMessage', data);
            });
        });*/
    });
}

/**
 * Initialize Socket.io
 * Uses Redis as Adapter for Socket.io
 *
 */
var init = function(app) {

    var server = app;
    var io = require('socket.io')(server);

    // Force Socket.io to ONLY use "websockets"; No Long Polling.
    //io.set('transports', ['websocket']);

    // Using Redis
    var port = config.redis.port;
    var host = config.redis.host;
    var password = config.redis.password;
    var pubClient = redis(port, host, { auth_pass: password });
    var subClient = redis(port, host, { auth_pass: password, return_buffers: true, });
    io.adapter(adapter({ pubClient: pubClient, subClient: subClient }));

    // Allow sockets to access session data
    io.use(function (socket, next) {
        require('../session')(socket.request, {}, next);
    });

    // Define all Events
    ioEvents(io);

    // The server object will be then used to list to a port number
    return server;
}

module.exports = init;