const config = require('config');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Admin = require('../models/admin');
const User = mongoose.model("User");
const logger = require('./logger')


module.exports.verifyUserJwtToken  = async (req, res, next) => {
    const AuthHeader = req.headers.authorization;

    if (AuthHeader) {
        const token = AuthHeader.split(" ")[1]
        jwt.verify(token, config.get("jwt_secret"), (error, payload) => {
            if (error) {
                logger(req,res,error)
                res.status(401).send({
                    message: "Invalid token"
                });
            } else {
                User.findOne({
                    Email: payload
                }).then(userdata => {
                    req.user = userdata;
                    next();
                });
            }
        })
    } else {
        res.status(403).send({
            message: "Unauthorise Access"
        });
    }
}




module.exports.verifyAdminJwtToken  = async (req, res, next) => {
    const AuthHeader = req.headers.authorization;

    if (AuthHeader) {
        const token = AuthHeader.split(" ")[1]
        jwt.verify(token, config.get("jwt_secret"), (error, payload) => {

            if (error) {
                logger(req,res,error)
                res.status(401).send({
                    message: "Invalid token"
                });
            } else {
                Admin.findOne({
                    Email: payload
                }).then(userdata => {
                    req.user = userdata;
                    next();
                });
            }
        })
    } else {
        res.status(403).send({
            message: "Unauthorise Access"
        });
    }
}