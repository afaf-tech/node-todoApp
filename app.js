var express = require('express');
var todoController = require('./controllers/todoController');



var app = express();

//setup template engine
app.set('view engine', 'ejs');

//static files
app.use(express.static('./public'));

// fire controller
todoController(app);

//listen to port
app.listen(7000);
console.log('You are listening to port 7000')