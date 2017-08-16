const Sequelize = require('sequelize');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

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
	resave: false
}));

const User = sequelize.define('user',{
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

app.get('/register', function(req,res){
	console.log(req.session)
	res.render('register')
});

app.post('/register', (req,res)=>{
	User.create({
		username: req.body.username,
		email: req.body.email,
		password: req.body.password
	})
	.then((user) => {
		req.session.user = user;
		res.redirect('/profile');
	}).catch((error) =>{
		console.log(error)
	});
}); 

app.get('/login', function(req,res){
	res.render('login', {user:req.session.user})
});

app.post('/login', function (req, res) {
	if(req.body.email.length === 0 || req.body.username.length === 0) {
		res.redirect('/?message=' + encodeURIComponent("please fill out your email adress or username"));
	return;
	}

	if(req.body.password.length === 0) {
		response.redirect('/?message=' + encodeURIComponent("please fill out your password"));
		return;
	}
var username = req.body.username
var email = req.body.email
var password = req.body.password

User.findOne({
	where: {
		email: email
	}
})
.then(function(user) {
	console.log('user username '+ user.username)
	console.log('user email '+ user.email)
	console.log('user password ' + user.password)
	if (user != null && password === user.password) {
		req.session.user = user;
		res.redirect('/profile');
	} else {
		res.redirect('/?message=' + encodeURIComponent("invalid email or password"));
	}
  })
.catch(function (error) {
	console.error(error)
	res.redirect('/?message=' + encodeURIComponent("invalid email or password"));
	});
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


sequelize.sync();

app.listen(3000, function(){
	console.log('Hey is this thing on?!')
});


