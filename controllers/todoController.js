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
var item1 = Todo({item: 'buy flowes'}).save(function(err){
    if(err) throw err;
    console.log('item saved');
})


// repo
var data = [{ item: 'get milk'},{item:'walk dog'},{item:'kick some coding area.'}]

var urlencodedParser = bodyParser.urlencoded({extended:true});


module.exports = function(app){
    app.get('/todo', function(req,res){
        // console.log(data);
        res.render('todo', {todos:data});
    });

    app.post('/todo', urlencodedParser, function(req,res){
        data.push(req.body);
        // send data back to the client 
        console.log(req.body)
        res.json(data);
    });


    app.delete('/todo/:item', function(req,res){
        data = data.filter(todo=> todo.item.replace(/ /g, '-')!==req.params.item);
        res.json(data);
    });
}