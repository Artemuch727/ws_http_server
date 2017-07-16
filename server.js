/**
 * Global variables
 */
var http = require('http');
var url = require('url');
var qs = require('querystring');
var billing = {};
var clients = {};
var clientUID = 0;
// Port where we'll run the websocket server
var webSocketsServerPort = 8081;
// websocket and http servers
var webSocketServer = require('websocket').server;

/**
 * HTTP server
 */
var server = http.createServer(function(request, response) {
  console.log('Requset from HTTP server to ' + request.url);
  const parsedRequest = url.parse(request.url,true);

  if (request.method == 'POST' && parsedRequest.pathname === '/'){
    response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
    var body = '';
    var jsonObj;
    console.log(request.headers);

    request.on('data', function(chunck){
      body += chunck;
    });
    request.on('end', function(){
      jsonObj =  qs.parse(body);
      var user = jsonObj.firstname+'_'+jsonObj.lastname+'_'+jsonObj.patronimic+'_'+jsonObj.age;

      if (!clients[clientUID]){
        ++clientUID;
        clients[clientUID] = clientUID;
        billing[clientUID] = {user: user, 'balance': 100};
        jsonObj.balance = 100;
        jsonObj.uid = clientUID;
        response.end(JSON.stringify(jsonObj));
      }else{
        jsonObj.balance = billing[clientUID].balance;
        response.end(JSON.stringify(jsonObj));
      }

    });
    }else if (parsedRequest.pathname === '/'){
      response.writeHead(200, {'Content-Type': 'text/plain'});
      response.end('Connection succesfull');
    }else   if(parsedRequest.path === '/status'){
          responseObject = {
            currentClients: Object.keys(clients).map(key => clients[key].uid).join(','),
            billing:  billing
          };
        response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
        response.end(JSON.stringify(responseObject));
      }
      else if (parsedRequest.pathname === '/status') {
      const clientUid = parsedRequest.query.uid;
      var responseObject = {};

      if (clientUid > 0){
        if (!billing[clientUid]){
          response.writeHead(404, {'Content-Type': 'text/plain'});
          response.end('Sorry, client not found');
        }else {
          responseObject = {
            uid: clientUid ,
            balance:  billing[clientUid].balance
          };
          response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
          response.end(JSON.stringify(responseObject));
        }
      }else {
        response.writeHead(404, {'Content-Type': 'text/plain'});
        response.end('Sorry, client not found');
      }
    }
    else {
      response.writeHead(404, {'Content-Type': 'text/plain'});
      response.end('Sorry, unknown url');
    }
});
server.listen(webSocketsServerPort, function() {
  console.log((new Date()) + " Server is listening on port "
      + webSocketsServerPort);
});
/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
  httpServer: server
});

wsServer.on('request', function(request, connection) {
  console.log((new Date()) + ' Connection from origin '
      + request.origin + '.');
  var connection = request.accept(null, request.origin);
  // connection.uid = request.key;
  ++clientUID;
  connection.uid = clientUID;
  clients[clientUID] = connection;
  var index = Object.keys(clients).length - 1;

  console.log((new Date()) + ' Connection accepted.');
  // user sent some message
  connection.on('message', function(message) {
    json = JSON.parse( message.utf8Data );
    if (message.type === 'utf8') {
      if (json.type == 'change'){
          messageData = {
            uid: json.uid,
            firstname: billing[json.uid].user.split('_')[0],
            lastname: billing[json.uid].user.split('_')[1],
            patronimic: billing[json.uid].user.split('_')[2],
            age: billing[json.uid].user.split('_')[3],
            balance: parseFloat(json.balance)
          }
          billing[json.uid].balance = json.balance;
          if (clients[json.uid]){
            try {
              clients[json.uid].sendUTF(JSON.stringify(messageData));
            } catch (err) {
                console.log(err);
            }
          }
      }else{
        var user = json.firstname+'_'+json.lastname+'_'+json.patronimic+'_'+json.age;

         console.log(connection.uid);
         if (billing[connection.uid] === undefined){
           billing[connection.uid] = {
             user: user,
             balance: 100
           };
           connection.billing =  billing[connection.uid];
           json.balance = billing[connection.uid].balance || 100;
           json.uid = connection.uid;
         }else{
           billing[connection.uid].user = user;
           json.balance = billing[connection.uid].balance;
           json.uid = connection.uid;
         }

       var messageData = JSON.stringify(json);
       try {
          connection.sendUTF(messageData);
       } catch (err) {
           console.log(err);
       }
      }
    }
  });
  // user disconnected
  connection.on('close', function(connection) {
      console.log((new Date()) + " Peer "
          + connection.remoteAddress + " disconnected.");
      // remove user from the list of connected clients
      const currClient = Object.keys(clients)[index];

      delete clients[currClient];
      if (billing[currClient] !== undefined){
        delete billing[currClient]
      }
      clientUID--;
  });
});

console.log("Сервер запущен на портах http:8080, ws:8081");
