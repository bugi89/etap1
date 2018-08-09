var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var User = require('./models/user');
var Promise = require('promise');
var passwordHash = require('password-hash');
var bcrypt = require('bcrypt');

// invoke an instance of express application.
var app = express();

// set our application port
app.set('port', 9000);

// initialize body-parser to parse incoming parameters requests to req.body
//app.use(bodyParser.urlencoded({extended: true}));
// to wyżej nie działa
app.use(bodyParser.json());

// initialize cookie-parser to allow us access the cookies stored in the browser. 
app.use(cookieParser());

// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
    key: 'user_sid',
    secret: 'somerandonstuffs',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));


function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}

// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
app.use((req, res, next) => {
    if (req.cookies.user_sid && !req.session.user) {
        res.clearCookie('user_sid');
    }
    next();
});

// route for user signup
app.route('/signup')
        .post((req, res) => {

            User.findOne({where: {email: req.body.email}}).then(function (user) {
                if (user) {
                    return Promise.reject({code: 406, message: 'email already exist'});
                }
            }).then(function () {
                if (isBlank(req.body.first_name)) {
                    return Promise.reject({code: 406, message: 'first_name can not be empty'});
                } else if (isBlank(req.body.last_name)) {
                    return Promise.reject({code: 406, message: 'last_name can not be empty'});
                } else if (isBlank(req.body.email)) {
                    return Promise.reject({code: 406, message: 'email can not be empty'});
                } else if (isBlank(req.body.password)) {
                    return Promise.reject({code: 406, message: 'password can not be empty'});
                }
            }).then(function () {
                User.create({
                    first_name: req.body.first_name,
                    last_name: req.body.last_name,
                    email: req.body.email,
                    password: req.body.password
                }).then(user => {
                    //req.session.user = user.dataValues;
                    res.status(201).json({message: 'account created successfully'});
                }).catch(error => {
                    res.status(500).json({message: 'an error occurred: ' + error});
                });
            }).catch(function (error) {
                res.status(error.code).json({message: error.message});
            });
        });

// route for user Login
app.route('/login')
        .post((req, res) => {
            User.findOne({where: {email: req.body.email}}).then(function (user) {
                if (!user) {
                    return res.status(401).json({message: 'invalid email'});
                } else if (!bcrypt.compareSync(req.body.password, user.password)) {
                    res.status(401).json({message: 'invalid password'});
                } else {
                    req.session.user = user.dataValues;
                    res.status(200).json({message: 'login successfully'});
                }
            });
        });


// route for user logout
app.get('/logout', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.clearCookie('user_sid');
    }
    res.json({message: 'logout successfully'});
});

// route for handling 404 requests(unavailable routes)
app.use(function (req, res, next) {
    res.status(404).json("resource not found")
});


// start the express server
app.listen(app.get('port'), () => console.log(`App started on port ${app.get('port')}`));