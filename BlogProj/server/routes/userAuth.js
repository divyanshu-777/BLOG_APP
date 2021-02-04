const joi = require('joi');
const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../models/user');
const validation = require('../helper/validation');
const logger = require('../helper/logger');
const bcrypt = require('bcrypt');


module.exports = (app) => {

app.post('/api/sign-up',
    validation(joi.object({
        Username: joi.string().required().max(15),
        Email: joi.string().email().required().trim(),
        Password: joi.string().min(5).max(10).required()
    })),

    async (req, res) => {
        const { Username, Email, Password } = req.body;
        try {
            let finduser = await User.findOne({ Email: req.body.Email });

            if (finduser) {
                res.status(422).send({
                    message: "Email Already registered",
                    status: "422",
                    data: null
                })
            }
            else {
                    const user = new User({
                        Username,
                        Email,
                        Password
                    });

                    const Saveuser = await user.save();

                    res.status(200).send({
                        data: Saveuser,
                        message: "user created Successfully",
                        status: "200"
                    });
            }
        }
        catch (error) {
            console.log(error);
            logger(req,res,error);
            res.status(500).json({
                message: "Internal server error",
                error,
                status: "500"
            });
        }

    })


app.post('/api/sign-in',
    validation(joi.object({
        Email: joi.string().trim().email().required(),
        Password: joi.string().min(5).max(10).required()
    })),
    async (req, res) => {
       
        try {
            var data = await User.findOne({ Email: req.body.Email });
            if (!data) {
                res.status(422).send({
                    message: "Invalid credentails",
                    status: "422"
                });
            }
            else {
                bcrypt.compare(req.body.Password, data.Password, (error, result) => {
                    if (error) {
                        logger(req,res,error);
                        return res.status(401).json({
                            message: "Auth failed",
                            status: "401"
                        })
                    }
                    if (result) {
                        const accessToken = jwt.sign(data.Email, config.get("jwt_secret"));
                        res.status(200).json({
                            token: accessToken,
                            user: data,
                            message: 'Sign in successful',
                            status: "200"
                        });
                    }
                    else{
                        res.status(400).json({
                            status : "400",
                            message : "Username or Password doesn't exist"
                        })
                    }

                })
            }
        } catch (error) {
            console.log("ERROR -> ", error);
            logger(req,res,error);
            res.status(500).json({
                message: "Internal server error",
                status: "500"
            });
        }
    }
);


}