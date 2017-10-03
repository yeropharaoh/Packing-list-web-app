// REQURING NECCESSARIES
const bcrypt = require('bcrypt');
const Sequelize = require('sequelize');
const express = require('express');
let bodyParser = require('body-parser');
let session = require('express-session');

// initalize sequelize
let sequelize = new Sequelize(`postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@localhost:5000/group_proj`);

const app = express();

app.set('views', './views');
app.set('view engine', 'pug');

app.use(express.static(__dirname + "/../public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: "whatever",
    saveUninitialized: true,
    resave: true
}));

// create User table
const User = sequelize.define('users', {
    username: {
        type: Sequelize.STRING,
        unique: true
    },
    email: {
        type: Sequelize.STRING,
        unique: true
    },
    password: {
        type: Sequelize.STRING
    }
}, {
    timestamps: false
});

// create Packinglist table
const PackingList = sequelize.define('packing_list', {
    items: {
        type: Sequelize.ARRAY(Sequelize.TEXT)
    },
}, {
    timestamps: false
});


//Establishing relationships between models
User.hasOne(PackingList);
PackingList.belongsTo(User);

// HOMEPAGE
app.get('/', function(req, res) {
    res.render('index', {
        message: req.query.message,
        user: req.session.user
    });
});

// REGISTER
app.post('/register', (req, res) => {
    var password = req.body.rgpassword
    bcrypt.hash(password, 8, (err, hash) => { //created hash for password security
        if (err) throw err;
        User.create({
                username: req.body.rgusername,
                email: req.body.rgemail,
                password: hash
            })
            .then((user) => {
                console.log("User create promise returned success!")
                req.session.user = user;
                res.redirect('/categories');
                console.log('do i make it here?')
            })
            .catch((error) => {
                console.error(error)
            })
    });

});

// LOGIN
app.get('/login', function(req, res) {
    res.render('login', { user: req.session.user })
});

app.post('/login', function(request, response) {
    if (request.body.email.length === 0) {
        response.redirect('/?message=' + encodeURIComponent("Please fill out your email address."));
        return;
    }
    if (request.body.password.length === 0) {
        response.redirect('/?message=' + encodeURIComponent("Please fill out your password."));
        return;
    }
    var email = request.body.email
    var password = request.body.password

    console.log(password);

    User.findOne({
            where: {
                email: email
            }
        })
        .then((user) => {
            if (!user) {
                response.redirect('/?message=' + encodeURIComponent("User doesn't exist."));
            } else {
                bcrypt.compare(password, user.password, (err, res) => { //validates password
                    // console.log('Entered hashed password'+ password)
                    // console.log('Database password'+user.password);
                    if (res) {
                        request.session.user = user;
                        response.redirect('/categories');
                    } else {
                        response.redirect('/?message=' + encodeURIComponent("Incorrect password."));
                    }
                })
            }
        });
});

// CATEGORIES
app.get('/categories', (req, res) => {
    var user = req.session.user;
    if (user === undefined) {
        res.redirect('/?message=' + encodeURIComponent("please log in to view your profile"))
    } else {
        res.render('categories', {
            user: user
        });
    }
});

// BEACH PACKING LIST
app.get('/sunlist', (req, res) => {
    var user = req.session.user;
    if (user === undefined) {
        res.redirect('/?message=' + encodeURIComponent("please log in to view your profile"))
    } else {
        res.render('sunlist', {
            user: user
        });
    }
});

// BEACH PACKING LIST POST
app.post('/sunlist', (req, res) => {
    var forminfo = req.body
    var user = req.session.user;

    var emptyArray1 = []
    var emptyArray2 = []

    for (var X in forminfo) {
        if (!forminfo.hasOwnProperty(X)) {
            continue;
        }
        emptyArray1.push(X);
        emptyArray2.push(forminfo[X]);
    }

    console.log(emptyArray1);
    console.log(emptyArray2);
    console.log(forminfo)

    PackingList.create({
            items: emptyArray2,
            userId: user.id
        })
        .then(packinglist => {
            var packinglist = packinglist;
            res.render('/profile', { packinglist: packinglist })
        })
    res.redirect('sunlist');
});

// PROFILE
app.get('/profile', (req, res) => {
    var user = req.session.user;
    if (user) {
        User.findOne({
                where: {
                    id: user.id
                }
            })
            .then((userfound) => {
                PackingList.findOne({
                        where: {
                            userId: user.id
                        }
                    })
                    .then(packinglist => {
                        res.render('profile', { user: userfound, packinglist: packinglist })
                    })
            })
    } else {
        res.redirect('/?message=' + encodeURIComponent("Please login to view your profile."));
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            throw error;
        }
        res.redirect('/?message=' + encodeURIComponent("succesfully logged out"));
    });
});

sequelize.sync({ force: false });

app.listen(3000, function() {
    console.log('Listening on port 3000')
})
