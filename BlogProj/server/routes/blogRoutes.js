const Blogs = require('../models/blogSchema');
const {
    verifyUserJwtToken
} = require('../helper/jwt');
const logger = require('../helper/logger');
const mongoose = require('mongoose');

module.exports = (app) => {

    app.post('/api/post-blog', verifyUserJwtToken, async (req, res) => {
        const {
            Title,
            Description,
            Text
        } = req.body;
        try {
            const post = new Blogs({
                Title,
                Description,
                Text,
                Writtenby: req.user
            })

            const savedData = await post.save();
            res.status(200).send({
                blog: savedData,
                message: "Posted Successfully",
                status: "200"
            });
        } catch (error) {
            logger(req, res, error);
            res.status(500).send({
                error,
                message: "Blog not posted.",
                status: "500"
            })
        }
    })

    app.get('/api/all-blogs', verifyUserJwtToken, async (req, res) => {
        // Blogs.find()
        //     .populate('Writtenby', '_id Username')
        //     .populate("Comments.Postedby", "_id Username")
        //     .sort('-createdAt')
        let query = [
            [{
                    $lookup: {
                        from: "users",
                        localField: "Writtenby",
                        foreignField: "_id",
                        as: "Writtenby"
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "Comments.Postedby",
                        foreignField: "_id",
                        as: "userData"
                    }
                },
                {
                    $unwind: {
                        path: '$userData'
                    }
                },
                {
                    $unwind: {
                        path: '$Writtenby'
                    }
                },
                {
                    $project: {
                        Title: 1,
                        Description: 1,
                        Writtenby: {
                            username: "$Writtenby.Username",
                            id: "$Writtenby._id"
                        },
                        Comments: {
                            _id: 1,
                            commentedBy: "$userData.Username",
                            text: 1,
                            reply: 1,
                        }
                    }
                },
            ]
        ]
        Blogs.aggregate(query)
            .then(blog => {
                res.status(200).send({
                    blog
                })
            })
            .catch(error => {
                logger(req, res, error);
                res.status(403).send({
                    error
                })
            })
    })

    app.put('/api/comments', verifyUserJwtToken, (req, res) => {
        const comment = {
            text: req.body.text,
            Postedby: req.user._id,
        }
        Blogs.findByIdAndUpdate(req.body.postId, {
                $push: {
                    Comments: comment
                }
            }, {
                useFindAndModify: false,
                new: true
            })
            .populate("Comments.Postedby", " _id Username")
            .populate("Writtenby", "_id Username")
            .exec((error, result) => {
                if (error) {
                    logger(req, res, error);
                    return res.status(422).send({
                        error
                    })
                } else {
                    console.log()
                    res.status(200).send(result);
                }
            })
    })


    app.put('/api/replyToComment', verifyUserJwtToken, async (req, res) => {
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
                item.Comments[index].reply.push(reply);
                item.save();
                res.status(200).send({
                    data: item,
                    message: "replied to the comment"
                })
            })
            .catch(error => {
                logger(req, res, error);
                res.status(422).send({
                    error,
                    message: "reply not posted"
                })
            })
    })


    app.delete('/api/delete-post/:blogid', verifyUserJwtToken, (req, res) => {
        Blogs.findOne({
                _id: req.params.blogid
            })
            .populate('Writtenby', '_id Username')
            .exec((error, blog) => {
                if (error) {
                    logger(req, res, error);
                    res.status(422).send({
                        error,
                    })
                } else {
                    if (blog.Writtenby._id.toString() === req.user._id.toString()) {
                        blog.remove()
                            .then(result => {
                                res.status(200).send({
                                    result,
                                    message: "Post deleted Successfully."
                                })
                            })
                            .catch(error => {
                                logger(req, res, error);
                                res.status(422).send({
                                    error,
                                    message: "Post not deleted ."
                                })
                            })
                    } else {
                        res.send({
                            message: "You are not allowed to delete this post"
                        })
                    }
                }
            })
    })

    app.put('/api/update-blog/:blogid', verifyUserJwtToken, async (req, res) => {

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
            logger(req, res, error);
            res.status(422).send({
                error,
                message: "Blog is not updated."
            })
        }
    })

}



// db.blogs.aggregate([
//     {$lookup: {
//               from: "users",
//               localField: "Writtenby",
//               foreignField: "_id",
//               as: "Writtenby"
//     }},
//      {$lookup: {
//               from: "users",
//               localField: "Comments.Postedby",
//               foreignField: "_id",
//               as: "userData"
//     }},
//      {$unwind: { path: '$userData'}},
//        {$unwind: { path: '$Writtenby'}},
//       {$project :  { Title:1, Description :1, Writtenby: {writtenby:"$Writtenby.Username",id:"$Writtenby._id"},Comments :{
//         _id:1, text:1, reply:1,
//         Username: "$userData.Username",
//         }
//         }
//     },
//     ])