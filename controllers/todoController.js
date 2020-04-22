var bodyParser = require('body-parser');
var mongoose = require('mongoose');
// Connect to the database
// mongodb+srv://test1:<password>@cluster0-qzmeg.mongodb.net/test?retryWrites=true&w=majority
// mongoose.connect('mongodb:')
const uri = 'mongodb+srv://ninja:ninja@cluster0-qzmeg.mongodb.net/test?retryWrites=true&w=majority';
// Prints "MongoError: bad auth Authentication failed."
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(()=>{
    console.log("mongodb is connected");
}).catch(err => {console.log('err',err) ;console.log('hahahaha')});

//create schema like blueprint
var todoSchema = new mongoose.Schema({
    item: String
});

var Todo = mongoose.model('Todo', todoSchema);

// var item1 = Todo({item: 'buy flowes'}).save(function(err){
//     if(err) throw err;
//     console.log('item saved');
// })


// repo
// var data = [{ item: 'get milk'},{item:'walk dog'},{item:'kick some coding area.'}]

var urlencodedParser = bodyParser.urlencoded({extended:true});


module.exports = function(app){
    app.get('/todo', function(req,res){
        // get data from mongodb and pass it to the view      
        Todo.find({}, function(err,data){
            if( err) throw err;
            // pass data to view
            res.render('todo', {todos:data});
        });  
    });

    app.post('/todo', urlencodedParser, function(req,res){
        // get data from the view and add it to mongodb
        var newTodo = Todo(req.body).save(function(err,data){
            if(err) throw err;
            res.json(data);
        }) // req.body = {item: 'item'}
        // data.push(req.body);
        // send data back to the client 
    });

    app.delete('/todo/:item', function(req,res){
        // delete the requested items fom mongodb
        Todo.find({item:req.params.item.replace(/\-/g, " ")}).remove(function(err, data){
            if(err)throw err;
            res.json(data);
        })
        // data = data.filter(todo=> todo.item.replace(/ /g, '-')!==req.params.item);
    });
}