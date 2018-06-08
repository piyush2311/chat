/*

 * This source file is subject to the terms and conditions defined in

 * file 'LICENSE.txt', which is part of this source code package.

 * @Owner: akhilesh.jain@lmdconsulting.com

 * @License Commercial

 * @Copyright LMD Consulting, LLC. 2016

 * @Created: Feb 22, 2015 by Akhilesh

 * @Updated: March 16, 2016 by Virendra

 */
module.exports = {
    _parent_child: function (obj, pid) {
        pid = pid || null;
        var result = new Array();
        var i = 0;
        for (var k in obj) {
            if (obj[k].parent === pid || (pid && obj[k].parent && obj[k].parent.equals(pid))) {
                result[i] = obj[k];
                result[i].children = this._parent_child(obj, result[i]._id);
                i++;
            }
        }
        return result.length ? result : false;
    },
    _get_child: function (obj, pid) {
        if (this._exist(obj) && this._exist(pid) && obj.length && pid.length) {
            var flag = false;
            for (var j = 0; j < pid.length; j++) {
                for (var i in obj) {
                    if (obj[i].status == 1 && (obj[i]._id.equals(pid[j]) || (obj[i].parent && obj[i].parent.equals(pid[j])))) {
                        var flag2 = false;
                        for (var k = 0; k < pid.length; k++) {
                            if (obj[i]._id.equals(pid[k])) {
                                flag2 = true;
                                break;
                            }
                        }
                        if (!flag2) {
                            pid.push(obj[i]._id);
                            flag = true;
                        }
                    }
                }
            }
            return flag ? this._get_child(obj, pid) : pid;
        }
        else {
            return false;
        }
    },
    _get_parent: function (obj, pid) {
        if (this._exist(obj) && this._exist(pid) && obj.length && pid.length) {
            for (var j = 0; j < pid.length; j++) {
                for (var i in obj) {
                    if (obj[i].status == 1 && obj[i]._id.equals(pid[j]) && obj[i].parent) {
                        pid.push(obj[i].parent);
                        break;
                    }
                }
            }
            return pid;
        }
        else {
            return false;
        }
    },
    _get_array_data: function (obj, key) {
        return obj[key];
    },
    _timestamp_to_hoursminute: function (dateFuture, dateNow, microsec) {
        var dateNow = dateNow || new Date().getTime();
        microsec = microsec || 'minisec';
        data = new Array();
        var secs = ((dateFuture - dateNow) / 1000);

        Math.floor(secs);
        //return secs;
        var minutes = secs / 60;
        secs = Math.floor(secs % 60);
        if (minutes < 1) {
            return secs + (secs > 1 ? ' seconds' : ' second');
        }
        var hours = minutes / 60;
        minutes = Math.floor(minutes % 60);
        if (hours < 1) {
            return minutes + (minutes > 1 ? ' minutes' : ' minute');
        }
        var days = hours / 24;
        hours = Math.floor(hours % 24);
        if (days < 1) {
            return hours + (hours > 1 ? ' hours' : ' hour');
        }
        var weeks = days / 7;
        days = Math.floor(days % 7);
        if (weeks < 1) {
            return days + (days > 1 ? ' days' : ' day');
        }
        var months = weeks / 4.35;
        weeks = Math.floor(weeks % 4.35);
        if (months < 1) {
            return weeks + (weeks > 1 ? ' weeks' : ' week');
        }
        var years = months / 12;
        months = Math.floor(months % 12);
        if (years < 1) {
            return months + (months > 1 ? ' months' : ' month');
        }
        years = Math.floor(years);
        return years + (years > 1 ? ' years' : ' years');
    },
    _send_mail: function (options, callback) {
        var mail_options = {
            from: options.from_name ? options.from_name + ' <' + options.from + '>' : options.from,
            to: options.to,
            subject: options.subject,
            html: options.email_content
        };
        var mail_settings = {
            service: '1und1',
            auth: {
                user: 'virendra.rathore@lmdconsulting.com',
                pass: '6PS7M4MZ'
            }
        };
        if (options.attachments) {
            mail_options.attachments = options.attachments;
        }
        require('nodemailer').createTransport(mail_settings).sendMail(mail_options, function (err) {
            if (callback) {
                callback(err);
            }
            else {
                if (err) {
                    console.log('Error during mail send:' + err);
                }
            }
        });
    },
    _filter_email_content: function (content, obj) {
        obj = obj || new Object();
        if (content) {
            var keys = content.match(/\[(.+?)\]/g);
            if (keys.length) {
                keys.forEach(function (k) {
                    content = content.replace(k, obj[k.slice(1, -1)]);
                });
            }
            return content;
        }
        else {
            return false;
        }
    },
    _timestamp_to_year: function (dateNow, dateFuture) {
        dateNow = dateNow || new Date().getTime();
        dateFuture = dateFuture || new Date().getTime();
        var secs = ((dateFuture - dateNow) / 1000);
        var year = Math.floor(secs / (60 * 60 * 24 * 365));
        return year;
    },
    _convert_to_object: function (obj) {
        var mongoose = require('mongoose');
        if ('string' === typeof obj) {
            if (this._valid_object_id(obj)) {
                try {
                    return mongoose.Types.ObjectId(obj);
                }
                catch (e) {
                    return obj;
                }
            }
            else
                return obj;
        }
        else if ('object' === typeof obj) {
            var new_object = new Array();
            for (var i in obj) {
                if (this._valid_object_id(obj[i])) {
                    try {
                        new_object.push(mongoose.Types.ObjectId(obj[i]));
                    }
                    catch (e) {
                        new_object.push(obj[i]);
                    }
                }
                else {
                    new_object.push(obj[i]);
                }

                if ('array' === typeof obj[i] || 'object' === typeof obj[i]) {
                    new_object.push(this._convert_to_object(obj[i]));
                }
            }
            return new_object;
        }
        else
            return obj;
    },
    _get_token: function (opt) {
        var config = require('../config/config.local');
        if(config.session.timeout)
            opt.expires = new Date().getTime() + config.session.timeout;
        return require('jwt-simple').encode(opt, config.secret.token);
    },
    _check_token: function (req) {
        var config = require('../config/config.local');
        if (req && req.headers && req.headers['auth-token'] && config.webService.enable) {
            if (config.allowDevices.indexOf(req.headers['request-device']) > -1) {
                return this._decode_token(req, req.headers['auth-token']);
            }
            else return {status: 1002, valid: false, message: 'Invalid Device'};
        }
        else {
            return {status: 1003, valid: false, message: 'Auth Token is not set'};
        }
    },
    _decode_token: function (req, tok) {
        var config = require('../config/config.local');
        var auth_token = require('jwt-simple').decode(tok, require('../config/config.local').secret.token);
        if (auth_token && auth_token.userID && this._valid_object_id(auth_token.userID) && auth_token.app_key && auth_token.app_key === req.app.locals.settings.app_key && ((config.session.timeout && auth_token.expires && auth_token.expires >= new Date().getTime()) || !config.session.timeout)) {
            return this._merge_recursive({status: 200, valid: true, message: 'Success'}, auth_token);
        }
        else return {status: 1001, valid: false, message: 'Invalid Auth Token'};
    },
    _mongo_date: function (timestamp) {
        return new Date(parseInt(timestamp));
    },
    _copy_object: function (obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    _difference_days: function ($startDate, $endDate) {
        $startDate = new Date(parseInt($startDate));
        $endDate = new Date(parseInt($endDate));
        return Math.round(Math.abs(($startDate.getTime() - $endDate.getTime()) / (24 * 60 * 60 * 1000)));
    },
    _set_month: function ($startDate) {
        var $setMonth = (parseInt($startDate) % 12) ? parseInt($startDate) : 12;
        $setMonth = ($setMonth > 9) ? $startDate : "0" + $startDate;
        return $setMonth;
    },
    _set_date: function ($startDate) {
        var $manageDate = (parseInt($startDate) % 31) ? parseInt($startDate) : 31;
        $manageDate = ($manageDate > 9) ? $startDate : "0" + $startDate;
        return $manageDate;
    },
    _date_difference_array: function ($startDate, $endDate) {
        var $startDate = parseInt($startDate);
        var $endDate = parseInt($endDate);
        var $dataObject = [];
        while ($startDate < $endDate) {
            var $setMonth = this._set_month(new Date(parseInt($startDate)).getMonth() + 1);
            var $manageDate = this._set_date(new Date(parseInt($startDate)).getDate());
            var $setDate = new Date($startDate).getFullYear() + '-' + $setMonth + '-' + $manageDate;
            $dataObject[$setDate] = 0;
            $startDate = (new Date($startDate + (60 * (60 * 24) * 1000)).getTime());
        }
        return $dataObject;
    },
    // this code decides weather a user can perform action on a record
    _check_record_ownership: function (userLocale, Locales, allLocales) {
        var status = 0;
        if (!userLocale || !Locales || !Array.isArray(userLocale) || !Array.isArray(Locales)){
            return status;
        }
        // it means he is superadmin
        else if(userLocale.length == 0){
            status = 1;
            return status;
        }
        // it means he is not superadmin
        // but the record is meant for all locales
        else if(userLocale.length && Locales.length == 0){
            status = 0;
            return status;
        }
        /*// the record meant to use by multiple locales (Sharing)
         else if(Locales.length > 1){
         status = 0;
         return status;
         }*/
        // otherwise go for intersection
        else if(userLocale.length && Locales.length){
            for(var i=0; i < userLocale.length; i++){
                // found the match
                if(Locales.indexOf(userLocale[i]) > -1){
                    status = 1;
                    break;
                }
            }
        }

        return status;

    },
    _search_object: function (obj, field, value) {
        if (typeof value !== 'undefined') {
            var kkey = field.split('.');
            if (this._valid_object_id(value)) {
                for (var i in obj) {
                    var temp = obj[i];
                    kkey.forEach(function (v) {
                        temp = temp[v];
                    });
                    if (temp && temp.equals(value)) {
                        return obj[i];
                    }
                }
            }
            else {
                for (var i in obj) {
                    var temp = obj[i];
                    kkey.forEach(function (v) {
                        temp = temp[v];
                    });
                    if (temp == value) {
                        return obj[i];
                    }
                }
            }
            return false;
        }
        else {
            return new Object();
        }
    },
    _month_name: function ($stringName) {
        var $monthName = [];
        if ($stringName == "MMM") {
            $monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        } else if ($stringName == "MMMM") {
            $monthName = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        }
        return $monthName;
    },
    _date_difference_month: function ($startDate, $endDate) {
        var $startDate = parseInt($startDate);
        var $endDate = parseInt($endDate);
        var $dataObject = [];
        while ($startDate < $endDate) {
            var $setMonth = this._set_month(new Date(parseInt($startDate)).getMonth() + 1);
            var $setDate = new Date($startDate).getFullYear() + '-' + $setMonth;
            $dataObject[$setDate] = 0;
            $startDate =new Date(new Date($startDate).setMonth(new Date(parseInt($startDate)).getMonth() + 1)).getTime();
        }
        return $dataObject;
    },
  _check_auth:function(req, res) {
     if (req.session && req.session.user)
    return next();
  else
    return res.sendStatus(401);
}
};