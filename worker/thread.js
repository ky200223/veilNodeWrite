/**
 * Created by YoungKim on 2014. 7. 7..
 */

'use strict';

var rabbitmq = require('./rabbitmqConfig');

var serviceQueueName = 'requestQueue';

//send card info without photo to queue
var textOnlyNewCardQuery = function (request, response) {
    //is_public field error detection
    if (request.body.is_public === 'true' || request.body.is_public === 'false') {
        var connection = rabbitmq.getConn();

        //data to send
        var message = {
            author: request.body.author,
            is_public: request.body.is_public,
            content: request.body.content,
            pub_date: new Date().getTime(),
            action: 'newThread_textOnly'
        };

        connection.publish(serviceQueueName, message);

        //success
        response.contentType('application/json');
        response.send({result: "SUCCESS"});
    }
    //is_public field data error occurred
    else {
        //fail
        response.contentType('application/json');
        response.send({result: "FAIL", message: 'error message'});
    }
};

//send card info with photo to queue
var newCardQuery = function (request, response) {

    //is_public 에러 감지
    //if (request.body.is_public === 'true' || request.body.is_public === 'false') {
    var message = {
        author: request.body.author,
        is_public: request.body.is_public,
        content: request.body.content,
        time: new Date(),
        action: 'newThread'
    };

    //use rabbitMQ
    connection.on('ready', function () {
        //open queue (createQueue)
        connection.queue('newCardQueue', {autoDelete: false, durable: true}, function () {
            //insert queue
            connection.publish('newCardQueue', message);
        });
    });

    //success
    response.contentType('application/json');
    response.send({result: "SUCCESS"});
//    }
//    else {
//        //fail
//        response.contentType('application/json');
//        response.send({result: "FAIL", message: 'error message'});
//    }
};

exports.postNewCard = function (req, res) {
    var reqContentType = req.get('Content-Type');

    if (reqContentType === 'application/json') {
        textOnlyNewCardQuery(req, res);
    }
    else if (/multipart\/form-data;+/.test(reqContentType)) {

    }
    //Content-Type error
    else {
        //fail
        res.contentType('application/json');
        res.send({result: "FAIL", message: 'error message'});
    }
};

exports.addComment = function (req, res) {
    var reqContentType = req.get('Content-Type');

    if (reqContentType === 'application/json') {
        var connection = rabbitmq.getConn();

        //set queue name, action name (identifier)
        var mQueryAction = 'commentAdd',
            mQueueName = serviceQueueName;

        //data to send
        var message = {
            thread_id: req.params.thread_id,
            author: req.body.user,
            content: req.body.content,
            pub_date: new Date().getTime(),
            action: mQueryAction
        };

        connection.on('ready', function() {
            connection.publish(mQueueName, message);
        });

        //success
        res.contentType('application/json');
        res.send({result: "SUCCESS"});
    }
    //Content-Type error
    else {
        //fail
        res.contentType('application/json');
        res.send({result: "FAIL", message: 'error message'});
    }
};

var simpleThreadRequest = function (action, queueName, request, response) {
    var reqContentType = request.get('Content-Type');

    if (reqContentType === 'application/json') {
        var connection = rabbitmq.getConn();

        //set queue name, action name (identifier)
        var mQueryAction = String(action),
            mQueueName = String(queueName);

        //data to send
        var message = {
            thread_id: request.params.thread_id,
            user: request.body.user,
            time: new Date().getTime(),
            action: mQueryAction
        };

        connection.on('ready', function() {
            connection.publish(mQueueName, message);
        });

        //success
        response.contentType('application/json');
        response.send({result: "SUCCESS"});
    }
    //Content-Type error
    else {
        //fail
        response.contentType('application/json');
        response.send({result: "FAIL", message: 'error message'});
    }
};

var simpleCommentRequest = function (action, queueName, request, response) {
    var reqContentType = request.get('Content-Type');

    if (reqContentType === 'application/json') {
        var connection = rabbitmq.getConn();

        //set queue name, action name (identifier)
        var mQueryAction = String(action),
            mQueueName = String(queueName);

        //data to send
        var message = {
            comment_id: request.params.comment_id,
            user: request.body.user,
            time: new Date().getTime(),
            action: mQueryAction
        };

        connection.on('ready', function() {
            connection.publish(mQueueName, message);
        });

        //success
        response.contentType('application/json');
        response.send({result: "SUCCESS"});
    }
    //Content-Type error
    else {
        //fail
        response.contentType('application/json');
        response.send({result: "FAIL", message: 'error message'});
    }

};

exports.likeThread = function (req, res) {
    simpleThreadRequest('threadLike', serviceQueueName, req, res);
};

exports.unlikeThread = function (req, res) {
    simpleThreadRequest('threadUnlike', serviceQueueName, req, res);
};

exports.reportThread = function (req, res) {
    simpleThreadRequest('threadReport', serviceQueueName, req, res);
};

exports.blockThread = function (req, res) {
    simpleThreadRequest('threadHide', serviceQueueName, req, res);
};

exports.likeComment = function (req, res) {
    simpleCommentRequest('commentLike', serviceQueueName, req, res);
};

exports.unlikeComment = function (req, res) {
    simpleCommentRequest('commentUnlike', serviceQueueName, req, res);
};

exports.reportComment = function (req, res) {
    simpleCommentRequest('commentReport', serviceQueueName, req, res);
};

exports.blockComment = function (req, res) {
    simpleCommentRequest('commentBlock', serviceQueueName, req, res);
};
