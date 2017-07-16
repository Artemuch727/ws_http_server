const wsServer = "ws://localhost:8081";
const httpServer = "http://localhost:8081";

function ajaxGet(path, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", httpServer + '/' + path);
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.setRequestHeader("Access-Control-Allow-Origin", window.location);
    xhr.onload = callback.bind(xhr);
    xhr.send();
};

function requestInfo(){
  console.log();
    ajaxGet('status', function(){
      console.log(this.response);
      showBillingInfo(JSON.parse(this.response));
    })
}

function showBillingInfo(data){

  var clients = Object.keys(data.billing).map(function(key) {
    return {uid: key, user: data.billing[key].user, balance: data.billing[key].balance};
  })

  var usersBlock = document.getElementById('users');
  usersBlock.innerHTML = '';

  for (var i = 0; i < clients.length; i++){
    var userElem = document.createElement('div');
    userElem.className = 'user-item';

    var userForm = document.createElement('form');
    userForm.name = clients[i].user +'_billing';
    userForm.addEventListener('submit', function(e){
      e.preventDefault();
      var outgoingMessage = {
        type: 'change',
        uid: this.elements.uid.value,
        balance: parseFloat(this.elements.balance.value)
			};
      changeBalance(outgoingMessage);
    })
    var title = document.createElement('p');
      title.id = 'fio';
      title.innerText = 'ФИО: ' + clients[i].user.replace(/_/g, ' ') + '(года)';

    var balance = document.createElement('input');
      balance.type = 'number';
      balance.name = 'balance';
      balance.value = clients[i].balance;

    var btn = document.createElement('input');
      btn.type = 'submit';
      btn.value = 'Изменить баланс';

    var uid = document.createElement('input');
      uid.name = 'uid';
      uid.type = 'hidden';
      uid.value = clients[i].uid;

    userForm.appendChild(title);
    userForm.appendChild(balance);
    userForm.appendChild(btn);
    userForm.appendChild(uid);
    userElem.appendChild(userForm);
    usersBlock.appendChild(userElem);
  }
}

function changeBalance(message){
    var connection = new WebSocket(wsServer);
      connection.onopen = function () {
        try {
          connection.send(JSON.stringify(message));
        } catch (e) {
          console.log(e);
          connection.close();
        } finally {
          connection.close();
        }    
    };

    return true;
}
