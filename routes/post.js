const express = require('express');
const mongoose = require('mongoose');
const loginMiddleware = require('../middleware/loginMiddleware.js');

const router = express.Router();
const Post = mongoose.model('Post');

router.get('/allPost', loginMiddleware, (req, res) => {
    Post.find()
        .populate('comments.postedBy', '_id name')
        .populate('postedBy', '_id name')
        .sort('-createdAt')
        .then((post) => {
            return res.status(200).json({
                error: false,
                message: 'Yay, successfully load all post.',
                data: post,
            });
        })
        .catch((err) => {
            console.error(err);
        });
});

router.get('/followingPost', loginMiddleware, (req, res) => {
    Post.find({ postedBy: { $in: req.user.following } })
        .populate('comments.postedBy', '_id name')
        .populate('postedBy', '_id name')
        .sort('-createdAt')
        .then((post) => {
            return res.status(200).json({
                error: false,
                message: 'Yay, successfully load all following post.',
                data: post,
            });
        })
        .catch((err) => {
            console.error(err);
        });
});

router.post('/createPost', loginMiddleware, (req, res) => {
    const { title, body, photo } = req.body;

    if (!title || !body || !photo) {
        return res.status(422).json({
            error: true,
            message: 'Oops, please fill all the field.',
            data: null,
        });
    } else {
        const storePost = new Post({
            title,
            body,
            photo,
            postedBy: req.user,
        });

        storePost
            .save()
            .then((post) => {
                return res.status(200).json({
                    error: false,
                    message: 'Yay, successfully create post.',
                    data: post,
                });
            })
            .catch((err) => {
                console.log(err);
            });
    }
});

router.get('/myPost', loginMiddleware, (req, res) => {
    Post.find({ postedBy: req.user._id })
        .populate('postedBy', '_id name')
        .then((post) => {
            return res.status(200).json({
                error: false,
                message: 'Yay, successfully load my post.',
                data: post,
            });
        })
        .catch((err) => {
            console.log(err);
        });
});

router.put('/likePost', loginMiddleware, (req, res) => {
    Post.findByIdAndUpdate(
        req.body.postId,
        {
            $push: { likes: req.user._id },
        },
        {
            new: true,
        }
    ).exec((err, result) => {
        if (err) {
            return res.status(422).json({
                error: true,
                message: 'Oops, cant like this post.',
                data: err,
            });
        } else {
            return res.status(200).json({
                error: false,
                message: 'Yay, successfully like this post.',
                data: result,
            });
        }
    });
});

router.put('/unlikePost', loginMiddleware, (req, res) => {
    Post.findByIdAndUpdate(
        req.body.postId,
        {
            $pull: { likes: req.user._id },
        },
        {
            new: true,
        }
    ).exec((err, result) => {
        if (err) {
            return res.status(422).json({
                error: true,
                message: 'Oops, cant unlike this post.',
                data: err,
            });
        } else {
            return res.status(200).json({
                error: false,
                message: 'Yay, successfully unlike this post.',
                data: result,
            });
        }
    });
});

router.put('/comment', loginMiddleware, (req, res) => {
    const comment = {
        text: req.body.text,
        postedBy: req.user._id,
    };

    Post.findByIdAndUpdate(
        req.body.postId,
        {
            $push: { comments: comment },
        },
        {
            new: true,
        }
    )
        .populate('comments.postedBy', '_id name')
        .populate('postedBy', '_id name')
        .exec((err, result) => {
            if (err) {
                return res.status(422).json({
                    error: true,
                    message: 'Oops, cant comment this post.',
                    data: err,
                });
            } else {
                return res.status(200).json({
                    error: false,
                    message: 'Yay, successfully comment this post.',
                    data: result,
                });
            }
        });
});

router.delete('/deletePost/:postId', loginMiddleware, (req, res) => {
    Post.findOne({ _id: req.params.postId })
        .populate('postedBy', '_id')
        .exec((err, post) => {
            if (err) {
                return res.status(422).json({
                    error: true,
                    message: 'Oops, cant delete this post.',
                    data: err,
                });
            } else if (!post) {
                return res.status(200).json({
                    error: false,
                    message: 'Oops, cant find any post.',
                    data: null,
                });
            }

            if (post.postedBy._id.toString() === req.user._id.toString()) {
                post.remove()
                    .then((result) => {
                        return res.status(200).json({
                            error: false,
                            message: 'Yay, successfully delete this post.',
                            data: result,
                        });
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            }
        });
});

module.exports = router;
