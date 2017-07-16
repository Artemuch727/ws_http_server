const wsServer = "ws://localhost:8081";
const httpServer = "http://localhost:8081";
window.transporterType = window.WebSocket ? 'ws' : 'http';

function setTransportType(){
	if (this.checked){
		window.transporterType = 'http';
	}else {
		window.transporterType = window.WebSocket ? 'ws' : 'http';
	}
}

if (!window.WebSocket) {
	document.body.innerHTML = 'WebSocket в этом браузере не поддерживается.';
}

function ajaxGet(path, uid, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", httpServer + '/' + path + '?uid=' + uid);
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.onload = callback.bind(xhr);
    xhr.send();
};

function ajaxSubmit(form, uid, callback) {
    var xhr = new XMLHttpRequest();
		var params = [].map.call(form.elements, function (el) {return el;})
				.filter(function(el) { return !!el.name; })
				.filter(function(el) { return !el.disabled; })
		.map(function(el){
			return encodeURIComponent(el.name) + '=' + encodeURIComponent(el.value);
		}).join('&');
		params = uid ? params + '&uid=' + uid : params;
    xhr.open("POST", httpServer);
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.onload = callback.bind(xhr);
    xhr.send(params);
};

if ( window.transporterType == 'ws'){
	// создать подключение
	var connection = new WebSocket(wsServer);
  connection.onopen = function () {
    // connection is opened and ready to use
		console.log('Connection is ready');
  };

  connection.onerror = function (error) {
    // an error occurred when sending/receiving data
		console.log(error);
  };

  connection.onmessage = function (message) {
		// handle incoming message
		console.log('recieve message from Server');
    try {
			showMessage(JSON.parse(message.data));
    } catch (e) {
      console.log('This doesn\'t look like a valid JSON: ',
          message.data);
      return;
    }

  };
}

	function showError(container, errorMessage) {
			container.classList.add('error');
      var msgElem = document.createElement('p');
      msgElem.className = "error-msg";
      msgElem.innerHTML = errorMessage;
      container.appendChild(msgElem);
    }
  function resetError(container) {
		container.classList.remove('error');
    if (container.lastChild.className == "error-msg") {
      container.removeChild(container.lastChild);
    }
  }
	function validate(form) {
      var formElements = form.elements;
			var validationState = true;

			resetError(formElements.firstname.parentNode);
			if (formElements.firstname.value.length > 15) {
				showError(formElements.firstname.parentNode, 'Не более 15 символов');
				validationState = false;
			}

			resetError(formElements.lastname.parentNode);
			if (formElements.lastname.value.length > 15) {
				showError(formElements.lastname.parentNode, 'Не более 15 символов');
				validationState = false;
			}

			resetError(formElements.patronimic.parentNode);
			if (formElements.patronimic.value.length > 15) {
				showError(formElements.patronimic.parentNode, 'Не более 15 символов');
				validationState = false;
			}

			resetError(formElements.age.parentNode);
			if (parseInt(formElements.age.value) < 18 || parseInt(formElements.age.value) > 50) {
				showError(formElements.age.parentNode, 'Не младше 18 и не старше 50');
				validationState = false;
			}

			return validationState;
    }

	// отправить сообщение из формы publish
	document.forms.publish.onsubmit = function(e) {
		e.preventDefault();

		if (validate(this)){
			var outgoingMessage = {
				lastname: this.lastname.value,
				firstname: this.firstname.value,
				patronimic: this.patronimic.value,
				age: this.age.value
			};

			if (transporterType == 'ws'){
				connection.send(JSON.stringify(outgoingMessage));
			  return true;
			}
			if (transporterType == 'http'){
				ajaxSubmit(this, document.getElementById('uid').value,
				function(){
					if(this.status == 200){
						showMessage(JSON.parse(this.response));
					}else{
						console.log(this.errorMessage);
					}
				});
			  return false;
			}
		}else {
			alert('Данные не отправлены');
		}

		return false;
	};

	// показать сообщение в div#subscribe
	function showMessage(message) {
	  var messageElem = document.createElement('div');
		var fieldFio = document.getElementById('fio_subscribe');
		var fieldAge = document.getElementById('age_subscribe');
		var fieldBalance = document.getElementById('balance_subscribe');
		var uid = document.getElementById('uid');
		fieldFio.innerText = message.lastname + ' ' + message.firstname + ' ' + message.patronimic;
		fieldAge.innerText = message.age;
		fieldBalance.innerText = message.balance;
	  uid.value = message.uid;
	}

	function refreshBalance(){
		const errText = document.getElementById('balance_err');

			ajaxGet('status', document.getElementById('uid').value,
				function(){
					if (this.status == 200){
						const balance = this.response.balance || JSON.parse(this.response).balance;
						if (balance){
							var fieldBalance = document.getElementById('balance_subscribe');
							fieldBalance.innerText = balance;
							errText.innerText = '';
							errText.classList.add('hidden')
							return true;
						}
					}else{
							console.log('Ошибка передачи данных');
							errText.innerText = 'Ошибка передачи данных';
							errText.classList.remove('hidden')

							return false;
					}
				});
	}
