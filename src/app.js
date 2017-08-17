const bcrypt = require('bcrypt');
const Sequelize = require('sequelize');
const express = require('express');
let bodyParser = require('body-parser');
let session = require('express-session');

const sequelize = new Sequelize('groupproject', process.env.POSTGRES_USER, null, {
  host: 'localhost',
  dialect: 'postgres'
});

const app = express();

app.set('views', './views');
app.set('view engine', 'pug');

app.use(express.static(__dirname + "/../public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
    secret: "whatever",
    saveUninitialized: true,
    resave: true
}));

const User = sequelize.define('users',{
    username:{
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
    },{
        timestamps:false
    });

app.get('/', function(req,res){
    res.render('index', {
        message: req.query.message,
        user: req.session.user
    });
});

app.post('/register', (req,res)=>{
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

app.get('/login', function(req,res){
    res.render('login', {user:req.session.user})
});

app.post('/login', function (request, response) {
  if(request.body.email.length === 0) {
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
          if (!user){
              response.redirect('/?message=' + encodeURIComponent("User doesn't exist."));
          }
        else {
        bcrypt.compare(password, user.password, (err, res) => { //validates password
         // console.log('Entered hashed password'+ password)
        // console.log('Database password'+user.password);
         if (res) {
              request.session.user = user;
             response.redirect('/categories');
             }
          else {
              response.redirect('/?message=' + encodeURIComponent("Incorrect password."));
          }    
        })
           }
    });
});
    
app.get('/categories', (req,res)=>{
    var user = req.session.user;
    if (user === undefined) {
        res.redirect('/?message=' + encodeURIComponent("please log in to view your profile"))
    } else {
    res.render('categories', {
        user: user
    });
   }
});

app.get('/profile', (req,res)=>{
    var user = req.session.user;
    if (user === undefined) {
        res.redirect('/?message=' + encodeURIComponent("please log in to view your profile"))
    } else {
    res.render('profile', {
        user: user
    });
   }
});

app.get('/logout', (req,res)=>{
    req.session.destroy((error) =>{
        if(error){
            throw error;
        }
        res.redirect('/?message=' + encodeURIComponent("succesfully logged out"));
    });
});



sequelize.sync({force:false});

app.listen(3000, function(){
    console.log('Hey is this thing on?!')
})