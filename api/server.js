var express = require('express'),
    bodyParser = require('body-parser'),
    mongodb = require('mongodb').MongoClient,
    multiparty = require('connect-multiparty'),
    objectID = require('mongodb').ObjectId,
    fs = require('fs');
 
var app = express();
 
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(multiparty());
 
var port = 8080;
 
app.listen(port);
 
var dbName = 'instagram';
var mongoURL = 'mongodb://localhost:27017/' + dbName;
 
var connMongoDB = function(data) {
  mongodb.connect(mongoURL, { useNewUrlParser: true }, function(err, client) {
    var db = client.db(dbName);
    query(db, data);
    client.close();
   
  });
}
 
function query(db, data) {
  var collection = db.collection(data.collection);
  switch (data.operacao) {
    case 'atualizar':
      collection.update(data.where, data.set, data.multi, data.callback);
      break;
    case 'inserir':
      collection.insertOne(data.dados, data.callback);
      break;
    case 'pesquisar':
      collection.find(data.dados).toArray(data.callback);
      break;
    case 'remover':
      data.where._id = objectID(data.where._id);
      collection.remove(data.where, data.callback);
      break;
  }
}
 
console.log('Servidor HTTP escutando na porta ' + port);
 
app.get('/', function(req, res){
  res.send({msg: 'Olá'});
});
 
app.get('/api', function(req, res){
    res.setHeader("Access-Control-Allow-Origin", "*");
  var dados = {
    operacao: 'pesquisar',
    dados: '',
    collection: 'postagens',
    callback: function(err, results){
      if (err) {
        res.json(err);
      } else {
        res.json(results);
      }
    }
  }
  connMongoDB(dados);
}); 
 
app.get('/api/:id', function(req, res){
    res.setHeader("Access-Control-Allow-Origin", "*");

  var dados = {
    operacao: 'pesquisar',
    dados: objectID(req.params.id),
    collection: 'postagens',
    callback: function(err, results){
      if (err) {
        res.json(err);
      } else {
        res.json(results);
      }
    }
  }
  connMongoDB(dados);
});
 
app.post('/api', function(req, res){
    
    res.setHeader("Access-Control-Allow-Origin", "*");

    var date = new Date();
    var time_stamp = date.getTime();

    var url_imagem = time_stamp + '_' + req.files.arquivo.originalFilename;
   // var url_imagem =  req.files.arquivo.originalFilename;
    var path_origem = req.files.arquivo.path;
    var path_destino = './uploads/' + url_imagem;

    fs.rename(path_origem, path_destino, function(err){
        if(err){
            res.status(500).json({error:err});
            return;
        }
        var dados = {
            operacao: 'inserir',
            dados: { 
                    url_imagem: url_imagem,
                    titulo: req.body.titulo
                    },
            collection: 'postagens',
            callback: function(err, results){
                if(err){
                    res.json({'status': 'erro'});
                }else{
                    res.json({'status': 'inclusao realizada com sucesso'});
                }
            }
          }
          
          connMongoDB(dados);
          
        }); 
    });

  

 
app.put('/api/:id', function(req, res){
  var dados = {
    operacao: 'atualizar',
    where: { _id: objectID(req.params.id) },
    set: { $set: { titulo: req.body.titulo } },
    multi: {},
    collection: 'postagens',
    callback: function(err, records){
      if (err) {
        res.json(err);
      } else {
        res.json(records);
      }
    }
  }
  connMongoDB(dados);
});
 
app.delete('/api/:id', function(req, res){
  var dados = {
    operacao: 'remover',
    where: { _id: req.params.id },
    collection: 'postagens',
    callback: function(err, records){
      if (err) {
        res.json(err);
      } else {
        res.json(records);
      }
    }
  }
  connMongoDB(dados);
});