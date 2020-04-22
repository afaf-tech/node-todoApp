var bodyParser = require('body-parser');
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