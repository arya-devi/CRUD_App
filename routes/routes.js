const express = require('express')
const router = express.Router()
const User = require('../models/users')
const multer = require('multer')
const { render } = require('ejs')
const fs = require('fs').promises

//Image upload
var storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,'./uploads')
    },
    filename:function(req,file,cb){
        cb(null,file.fieldname+"_"+Date.now()+"_"+file.originalname)
    },
})
var upload = multer({
    storage: storage,
})  .single('image')

//Insert an user into database route
router.post('/add',upload,(req,res)=>{
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        image: req.file.filename,
    })
   
user.save()
.then(() => {
    // User saved successfully
    req.session.message = {
        type: 'success',
        message: 'User added successfully!'
    };
    res.redirect('/')
})
.catch((err) => {
    // Handle the error
    res.json({ message: err.message, type: 'danger' })
})
})

//get all users route

router.get('/', (req, res) => {
    User.find().exec()
        .then((users) => {
            res.render('index', {
                title: 'Home page',
                users: users
            })
        })
        .catch((err) => {
            res.json({ message: err.message })
        })
})
router.get('/add',(req,res)=>{
    res.render('add_users',{ title:'Add Users' })
})

//Edit an user route
router.get('/edit/:id', (req, res) => {
    let id = req.params.id;
    
    User.findById(id)
        .then((user) => {
            if (user) {
                res.render('edit_users', {
                    title: 'Edit User',
                    user: user
                });
            } else {
                res.redirect('/');
            }
        })
        .catch(err => {
            res.redirect('/');
        });
});

//update user route
router.post('/update/:id', upload, async (req, res) => {
    let id = req.params.id;
    let new_image = '';

    if (req.file) {
        new_image = req.file.filename;
        try {
            await fs.unlink('./uploads/' + req.body.old_image);
        } catch (err) {
            console.log(err);
        }
    } else { 
        new_image = req.body.old_image;
    }

    try {
        const result = await User.findByIdAndUpdate(id, {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: new_image,
        });

        req.session.message = {
            type: 'success',
            message: 'User updated successfully',
        }
        res.redirect('/')
    } catch (err) {
        res.json({ message: err.message, type: 'danger' })
    }
}) 

//delete user route
router.get('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);

        if (user && user.image) {
            await fs.unlink('./uploads/' + user.image);
        }

        const result = await User.findByIdAndRemove(id);

        req.session.message = {
            type: 'info',
            message: 'User deleted successfully',
        };
        res.redirect('/')
    } catch (err) {
        res.json({ message: err.message })
    }
})
module.exports = router