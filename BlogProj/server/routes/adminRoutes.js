const joi = require('joi');
const jwt = require('jsonwebtoken');
const config = require('config');
const mongoose = require('mongoose');
const Admin = require('../models/admin');
const Blogs = require('../models/blogSchema');
const validation = require('../helper/validation');
const logger = require('../helper/logger');
const bcrypt = require('bcrypt')
const {verifyAdminJwtToken} = require('../helper/jwt');

module.exports = (app) => {

    app.post('/api/admin-signin',
        validation(joi.object({
            Email: joi.string().trim().email().required(),
            Password: joi.string().min(5).max(10).required()
        })),
        async (req, res) => {

            try {
                var data = await Admin.findOne({
                    Email: req.body.Email
                });
                if (!data) {
                    res.status(422).send({
                        message: "Invalid credentails",
                        status: "422"
                    });
                } else {
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
                        } else {
                            res.status(400).json({
                                status: "400",
                                message: "Username or Password doesn't exist"
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

    app.post('/api/admin-signup',
    validation(joi.object({
        Username: joi.string().trim().required().max(10),
        Email: joi.string().trim().email().required(),
        Password: joi.string().min(5).max(10).required()
    })),
     async (req, res) => {
        const {
            Username,
            Email,
            Password
        } = req.body;

        try {
            let finduser = await Admin.findOne({
                Email: req.body.Email
            });

            if (finduser) {
                res.status(422).send({
                    message: "Email Already registered",
                    status: "422",
                    data: null
                })
            } else {
                const user = new Admin({
                    Username,
                    Email,
                    Password
                });

                const Saveuser = await user.save();

                res.status(200).send({
                    data: Saveuser,
                    message: "Admin created Successfully",
                    status: "200"
                });
            }
        } catch (error) {
            console.log(error);
            logger(req,res,error);
            res.status(500).json({
                message: "Internal server error",
                error,
                status: "500"
            });
        }

    })


    app.delete('/api/admin/delete-post/:blogid', verifyAdminJwtToken, async (req, res) => {
        try {
            const deletedBlog = await Blogs.deleteOne({
                _id: req.params.blogid
            })
            res.status(200).send({
                deletedBlog,
                message: "Blog deleted successfully.",
                status: "200"
            })
        } catch (error) {
            logger(req,res,error);
            res.status(500).send({
                error,
                message: "blog is not deleted.",
                status: "422"
            })
        }

    })

    app.put('/api/admin/update-blog/:blogid', verifyAdminJwtToken, async (req, res) => {
        try {
            const updatedBlog = await Blogs.findByIdAndUpdate({
                _id: req.params.blogid
            }, {
                $set: req.body
            }, {
                upsert: true,
                useFindAndModify: false,
            })
            res.status(200).send({
                data: updatedBlog,
                message: "Blog Updated Successfully.",
                status: "200"
            })
        } catch (error) {
            logger(req,res,error);
            res.status(422).send({
                error,
                message: "Blog is not updated."
            })
        }
    })

    app.put('/api/admin/comments', verifyAdminJwtToken, (req, res) => {
        const comment = {
            text: req.body.text,
            Postedby: req.user._id,
        }
        Blogs.findByIdAndUpdate({
            _id: req.body.postId
        }, {
            $push: {
                Comments: comment
            }
        }, {
            useFindAndModify: false,
            new: true
        }).exec((error, result) => {
            if (error) {
                logger(req,res,error);
                return res.status(422).send({
                    error,
                    message : "Comment not posted."
                })
            } else {
                res.status(200).send({
                    result,
                    message : "Comment updated succesfully."
                })
            }
        })
    })

    app.put('/api/admin/replyToComment', verifyAdminJwtToken, async (req, res) => {
        const reply = {
            repliedby: req.body.name,
            text: req.body.text
        }
        const commentId = req.body.commentId;
        const query = {
            "Comments._id": mongoose.Types.ObjectId(commentId)
        }

        Blogs.findOne(query)
            .then(item => {
                const index = item.Comments.map(item => item.id).indexOf(commentId);
                item.Comments[index].push(reply);
                item.save();
                res.status(200).send({
                    data: item,
                    message: "replied to the comment"
                })
            }).catch(error => {
                logger(req,res,error);
                res.status(422).send({
                    error,
                    message: "reply not posted"
                })
            })
    })


}





// Blogs.aggregate([
//     {$unwind: '$Comments'},
//     {$lookup: {
//               from: "users",
//               localField: "Comments.Postedby",
//               foreignField: "_id",
//               as: "userData"
//     }},
//     {$unwind: { path: '$userData'}},
//     {$project : { Comments :{
//         _id:1, text:1, reply:1,
//         Username: "$userData.Username"
//         }
//         }
//     },
//      {
//         $group : {
//             "_id" : "$_id",
//             "Comments": {$push :"$Comments"}
//         }
//     }