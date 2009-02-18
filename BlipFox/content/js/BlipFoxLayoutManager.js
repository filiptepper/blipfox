/**
 * Copyright (c) 2008 Filip Tepper
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

function BlipFoxLayoutManager()
{
	/**
	 * Właściwość zawierająca uchwyt do obiektu XUL wyświetlającego rozszerzenie. 
	 * @var Object
	 * @private
	 */
	var _container = null;

	/**
	 * Właściwość zawierająca uchwyt do obiektu XUL wyświetlającego rozszerzenie w Firefox 3. 
	 * @var Object
	 * @private
	 */
	var _panel = null;
	
	/**
	 * Metoda pokazująca obiekt XUL wyświetlający rozszerzenie.
	 * @private
	 */
	var _showContainer = function()
	{
		if (_panel !== null) 
		{
			_panel.openPopup(_panel.parentNode, 'before_end', -21, -36, false, false);
		}
		else 
		{
			_container.style.display = 'block';
		}
	}

	/**
	 * Metoda znajduje wśród elementów XUL obiekt wyświetlający listę znajomych.
	 * @return object Obiekt wyświetlający listę znajomych.
	 * @private
	 */
	var _getInputFriends = function()
	{
		return window.document.getElementById('blipfox-input-friends');
	}
	
	/**
	 * Wrapper publiczny na metodę _getFriendsMenulist.
	 * @return object Obiekt wyświetlający listę znajomych.
	 * @public
	 */
	this.getInputFriends = function()
	{
		return _getInputFriends();
	}
	
	/**
	 * Metoda znajduje wśród elementów XUL obiekt do wpisywania treści wiadomości.
	 * @return object Obiekt do wpisywania treści wiadomości.
	 * @private
	 */
	var _getInputMessage = function()
	{
		return window.document.getElementById('blipfox-input-message');
	}
	
	/**
	 * Wrapper publiczny na metodę _getInputMessage.
	 * @return object Obiekt do wpisywania treści wiadomości.
	 * @public
	 */
	this.getInputMessage = function()
	{
		return _getInputMessage();
	}
	
	/**
	 * Metoda ukrywająca obiekt XUL wyświetlający rozszerzenie.
	 * @private
	 */
	var _hideContainer = function()
	{
		if (_panel !== null) 
		{
			_panel.hidePopup();
		}
		else 
		{
			_container.style.display = 'none';
		}
		
		/* Usunięcie oznaczenia kolorem z listy nowych wiadomości. */
		if (BlipFoxPreferencesManager.get('markNewMessages') === 'true' && BlipFox.checkStatus(BlipFoxStatus.INITIALIZED) === true)
		{
			var messagesList = window.document.getElementById('blipfox-popup-messages');
			var messagesCount = messagesList.childNodes.length;
			
			for (i = 0; i < messagesCount; i++) 
			{
				if (messagesList.childNodes[i].getAttribute('new_message') == 'true') 
				{
					messagesList.childNodes[i].setAttribute('new_message', 'false');
				}
			}
		}
	}
	
	/**
	 * Właściwa przetrzymująca informację, czy panel jest w trakcie ruchu w oknie przeglądarki.
	 * @var boolean
	 * @private
	 */
	var _containerMoving = false;
	
	/**
	 * Właściwość przetrzymująca pozycję X na początku przesuwania okienka.
	 * @var integer
	 * @private
	 */
	var _containerMovingX = 0;
	
	/**
	 * Właściwość przetrzymująca pozycję Y na początku przesuwania okienka.
	 * @var integer
	 * @private
	 */
	var _containerMovingY = 0;
	
	/**
	 * Właściwość przetrzymująca pozycję X myszki podczas przesuwania okienka.
	 * @var integer
	 * @private
	 */
	var _containerMovingMouseX = 0;
	
	/**
	 * Właściwość przetrzymująca pozycję Y myszki podczas przesywania okienka.
	 * @var integer
	 * @private
	 */
	var _containerMovingMouseY = 0;
	
	/**
	 * Obiekt podlegający przesunięciu.
	 * @var Object
	 * @private
	 */
	var _containerMovingElement = null;
	
	/**
	 * Metoda wywoływana w momencie kliknięcia na miejscu do przenoszenia okienka.
	 * @param Event e Obiekt Event.
	 * @private
	 */
	var _containerMovingBegin = function(e)
	{
		BlipFox.log('MovingBegin');
		
		_containerMoving = true;
		
		_containerMovingX = _containerMovingElement.screenX;
		_containerMovingY = _containerMovingElement.screenY;
//		_containerMovingX = _containerMovingElement.style.right.replace('px', '');
//		_containerMovingY = _containerMovingElement.style.bottom.replace('px', '');
		_containerMovingMouseX = e.screenX;
		_containerMovingMouseY = e.screenY;
	}
	
	/**
	 * Metoda wywoływana w momencie zakończenia przenoszenia okienka.
	 * @param Event e Obiekt Event.
	 * @private
	 */
	var _containerMovingEnd = function(e)
	{
		BlipFox.log(_containerMovingX + ':' + moveByX + ':' + _containerMovingY + ':' + moveByY);
		BlipFox.log('MovingEnd');
		_containerMoving = false;
	}
	
	/**
	 * Metoda wywoływana w momencie przenoszenia okienka.
	 * @param Event e Obiekt Event.
	 * @private
	 */
	var _containerMovingMove = function(e)
	{
		if (_containerMoving === true) 
		{
			var moveByX = -(_containerMovingMouseX - e.screenX);
			var moveByY = -(_containerMovingMouseY - e.screenY);
//			_containerMovingElement.style.right = ((parseInt(_containerMovingX - moveByX)).toString()) + 'px';
//			_containerMovingElement.style.bottom = ((parseInt(_containerMovingY - moveByY)).toString()) + 'px';
			_containerMovingElement.moveTo(_containerMovingX + moveByX, _containerMovingY + moveByY);
		}
	}
	
	this.setEvents = function(element, allEvents)
	{
		/* @todo: Dodać obsługę przesuwania. */
		/*
		element.onmousedown = _containerMovingBegin;
		if (allEvents === true) 
		{
			window.document.onmouseup = _containerMovingEnd;
			window.document.onmousemove = _containerMovingMove;
		}
		*/
	}
	
	/**
	 * Metoda inicjalizująca obiekty XUL wyświetlające rozszerzenie.
	 * @private
	 */
	var _initializePopup = function()
	{
		_container = document.createElement('vbox');
		_container.setAttribute('firefox_version', BlipFox.getFirefoxVersion());
		_container.className = 'blipfox-loading';
		_container.id = 'blipfox-panel';
						
		if (BlipFox.getFirefoxVersion() === 3)
		{
			_panel = document.createElement('panel');
			_panel.setAttribute('noautofocus', 'true');
			_panel.setAttribute('noautohide', 'true');
			_panel.appendChild(_container);

			var popupset = window.document.getElementById('browser-bottombox');
			popupset.appendChild(_panel);
			
			_containerMovingElement = _panel.boxObject;	
		}
		else
		{
			_container.align = 'end';
			_container.style.right = '19px';
			_container.style.position = 'fixed';
			_container.style.bottom = '56px';
			window.document.firstChild.appendChild(_container);			
			_containerMovingElement = _container;
		}

		if (BLIPFOX_DEBUG === true && BlipFox.getFirefoxVersion() !== 3)		
		{
			/* To działa tylko z FF2. */
			_logConsole = window.document.createElement('textbox');
			_logConsole.setAttribute('rows', 30);
			_logConsole.setAttribute('cols', 100);
			_logConsole.setAttribute('multiline', true);
			_logConsole.id = 'blip-log-console';
			_logConsole.style.position = 'fixed';
			_logConsole.style.left = '5px';
			_logConsole.style.top = '50px';
			_logConsole.style.color = 'black';
			_logConsole.wrap = 'soft';
			_logConsole.tabscrolling = true;

			window.document.firstChild.appendChild(_logConsole);
		}
		
		return;
	}
	
	/**
	 * Metoda ukrywająca obiekty XUL wyświetlające rozszerzenie.
	 * @private
	 */
	var _hidePopup = function()
	{
		BlipFox.unsetStatus(BlipFoxStatus.VISIBLE);
		_hideContainer();
	}
		
	/**
	 * Metoda kontrolująca pokazywanie obiektu XUL wyświetlającego rozszerzenie.
	 * @private
	 */
	var _showPopup = function()
	{
		/* Ustawienie statusu rozszerzenia na widoczny. */
		BlipFox.setStatus(BlipFoxStatus.VISIBLE);
		
		/* Wyzerowanie licznika wiadomości. */
		_setStatusbarCount(null);
		
		/* Pokazanie okienka rozszerzenia. */			
		_showContainer();

		/**
		 * Ustawienie fokusu na oknie wpisywania wiadomości.
		 * Timeout ze względu na czas potrzebny na rendering elementów.
		 */
		setTimeout(function()
		{
			if (BlipFox.checkStatus(BlipFoxStatus.INITIALIZED) === true)
			{
				_getInputMessage().focus();
			}
		}, 1);
	}
		
	/**
	 * Metoda ustawia liczbę wiadomości w pasku statusu.
	 * Jeżeli podany jest parametr null to wartość jest czyszczona.
	 * @param integer count Ilość wiadomości.
	 * @return Wynik ustawienia ilości.
	 * @private
	 */
	var _setStatusbarCount = function(count)
	{
		if (count === null)
		{
			count = '';
		}
		else
		{
			count = '(' + count + ')';
		}
		
		return window.document.getElementById('blipfox-statusbar-count').value = count;
	}
	
	/**
	 * Wrapper na metodę prywatną _setStatusbarCount.
	 * @param integer count Ilość wiadomości.
	 * @return Wynik ustawienia ilości.
	 * @public
	 */
	this.setStatusbarCount = function(count)
	{
		return _setStatusbarCount(count);
	}
	
	/**
	 * Metoda pobiera obiekt zawierający ikonkę w pasku statusu.
	 * @return Object Obiekt zawierający ikonkę w pasku statusu.
	 * @private
	 */
	var _getStatusbarIcon = function()
	{
		return window.document.getElementById('blipfox-statusbar-icon');
	}

	var _getStatusbarPanel = function()
	{
		return window.document.getElementById('blipfox-statusbar-panel');
	}

	/**
	 * Metoda ustawia ikonkę w pasku statusu na włączoną.
	 * @return mixed Wynik ustawienia ikonki.
	 * @public
	 */
	this.setStatusbarIconOn = function()
	{
		return _getStatusbarIcon().src = 'chrome://blipfox/content/images/blipfox-statusbar-icon-on.gif';
	}
	
	/**
	 * Metoda ustawia ikonkę w pasku statusu na wyłączoną.
	 * @return mixed Wynik ustawienia ikonki.
	 * @public
	 */
	this.setStatusbarIconOff = function()
	{
		return _getStatusbarIcon().src = 'chrome://blipfox/content/images/blipfox-statusbar-icon-off.gif';
	}

	/**
	 * Metoda ustawia tooltip na ikonce Blipa w pasku statusu.
	 * @param string value Treść do ustawienia.
	 * @public
	 */	
	this.setStatusbarPanelTooltip = function(value)
	{
		return _getStatusbarPanel().setAttribute('tooltiptext', value);
	}

	/**
	 * Metoda zapobiega znikaniu BlipFoxa przy przechodzeniu między zakładkami.
	 * Wywoływana przy zdarzeniu zmiany zakładki.
	 * @param Event e Obiekt zdarzenia JavaScript.
	 * @public
	 */
	this.restoreOverlay = function(e)
	{
		if (BlipFox.checkStatus(BlipFoxStatus.VISIBLE) === true)
		{
			_hideContainer();
			setTimeout(function()
			{
				_showContainer();
			}, 1);
		}
	}

	/**
	 * Metoda sterująca pokazywanie i ukrywaniem okienka rozszerzenia.
	 * @public
	 */
	this.togglePopup = function()
	{
		if (BlipFox.checkStatus(BlipFoxStatus.VISIBLE) === false) 
		{
			_showPopup();
		}
		else 
		{
			_hidePopup();
		}
	}
	
	/**
	 * Link do obrazka tła. Link pochodzi z profilu użytkownika.
	 * @var string
	 * @private
	 */
	var _backgroundImage = '';
	
	/**
	 * Metoda ustawiająca obrazek tła.
	 * @param String image Link do obrazka tła.
	 * @public
	 */
	this.setBackgroundImage = function(image)
	{
		_backgroundImage = image;
	}
	
	/**
	 * Kolor tła. Kolor pochodzi z profilu użytkownika.
	 * @var string
	 * @private
	 */
	var _backgroundColor = '';
	
	/**
	 * Metoda ustawiająca kolor tła.
	 * @param String color Kolor tła.
	 */
	this.setBackgroundColor = function(color)
	{
		_backgroundColor = color;
	}

	/**
	 * Metoda odpowiada za obsługę wyświetlania wiadomości
	 * @param Array messages Tablica wiadomości.
	 * @public
	 */
	this.showMessages = function(messages)
	{
		var messagesList = window.document.getElementById('blipfox-popup-messages');

		var messagesCount = messages.length;
		var currentMessagesCount = messagesList.childNodes.length;
		
		if (messagesCount + currentMessagesCount > 100)
		{
			var removeCount = messagesCount + currentMessagesCount - 100;
			for (i = 1; i <= removeCount; i++)
			{
				messagesList.removeChild(messagesList.lastChild);
			}
		}
		
		/* Zapisujemy ostatni status zalogowanego użytkownika. */
		var lastUserStatus = '';
		var lastUserStatusId = 0;

		for (var i = messagesCount - 1; i >= 0; i--)
		{
			if (messages[i].user.login === BlipFoxPreferencesManager.get('username') && messages[i].type === 'Status')
			{
				lastUserStatus = messages[i].body;
				lastUserStatusId = messages[i].id;
			}

			window.document.getElementById('blipfox-statusbar-panel').setAttribute('tooltiptext', messages[i].user.login + ' > ' + messages[i].body);
			messagesList.insertBefore(_showMessage(messages[i]), messagesList.firstChild);
		}

		/* Zaktualizowanie status użytkownika - tylko w wypadku zmiany. */
		if (lastUserStatus !== '')
		{
			this.setUserStatus(lastUserStatus, lastUserStatusId);
		}
		
		if (BlipFox.checkStatus(BlipFoxStatus.LOADING) === true)
		{
			BlipFox.unsetStatus(BlipFoxStatus.LOADING);
		}
	}
	
	/**
	 * Metoda zmienia aktualny status użytkownika w nagłówku.
	 * @param string userStatus Tekst statusu.
	 * @param integer id Identyfikator statusu.
	 * @public
	 */
	this.setUserStatus = function(userStatus, id)
	{
		var currentUserStatus = window.document.getElementById('blipfox-popup-header-status');
		while (currentUserStatus.firstChild)
		{
			currentUserStatus.removeChild(currentUserStatus.firstChild);
		}
		_appendMessageToElement(userStatus, currentUserStatus);
		currentUserStatus.setAttribute('message_id', id);
	}
	
	/**
	 * Metoda usuwa okienko.
	 * @public
	 */
	this.destroy = function()
	{
		_container.parentNode.removeChild(_container);
		this.setStatusbarIconOff();
		_initializePopup();
	}	
	
	/**
	 * Metoda wyświetlająca otrzymaną wiadomość
	 * @param Object message Obiekt wiadomości z API.
	 * @return Object Obiekt XUL zawierający wiadomość.
	 * @private
	 */
	function _showMessage(message)
	{
		var messageContainer = document.createElement('vbox');
		
		if (BlipFox.checkStatus(BlipFoxStatus.LOADING) === false && message.user.login != BlipFoxPreferencesManager.get('username')) 
		{
			var notificationImage = null;
			if (typeof message.user.avatar != 'undefined')
			{
				notificationImage = message.user.avatar.url.replace('.jpg', '_nano.jpg');
			}
			
			if (BlipFoxPreferencesManager.get('notifyStatuses') === 'true' && message.type == 'Status') 
			{
				BlipFox.notify(message.user.login + ': ' + message.body, notificationImage);
			}
			if (BlipFoxPreferencesManager.get('notifyMessages') === 'true' && (message.type == 'PrivateMessage' || message.type == 'DirectedMessage'))
			{
				BlipFox.notify(message.user.login + ' > ' + message.recipient.login + ': ' + message.body, notificationImage);
			}
			if (BlipFoxPreferencesManager.get('notifyNotifications') === 'true' && message.type == 'Notice')
			{
				BlipFox.notify(message.body, notificationImage);
			}
		}

		if (message.type == 'Notice' && BlipFoxPreferencesManager.get('showNotifications') === 'true') 
		{
			messageContainer.id = message.id;
			messageContainer.style.opacity = 1;
			messageContainer.className = 'blipfox-notification';

			/* Oznaczanie nowych wiadomości. */
			if (BlipFoxPreferencesManager.get('markNewMessages') === 'true' && BlipFox.checkStatus(BlipFoxStatus.VISIBLE) === false && message.user.login != BlipFoxPreferencesManager.get('username')) 
			{
				messageContainer.setAttribute('new_message', 'true');
			}
			
			messageContainer.appendChild(document.createTextNode(' '));
			
			var messageBody = message.body;
			
			_appendMessageToElement(messageBody, messageContainer);		
		}
		else 
		{
			messageContainer.id = message.id;
			messageContainer.style.opacity = 1;
			messageContainer.className = 'blipfox-message';
			messageContainer.setAttribute('username', message.user.login);
			messageContainer.setAttribute('transport', message.transport.name.toLowerCase());
			
			/* Oznaczanie nowych wiadomości. */
			if (BlipFoxPreferencesManager.get('markNewMessages') === 'true' && BlipFox.checkStatus(BlipFoxStatus.VISIBLE) === false && message.user.login != BlipFoxPreferencesManager.get('username')) 
			{
				messageContainer.setAttribute('new_message', 'true');
			}
			
			messageContainer.setAttribute('allow_delete', 'false');
			
			/* Ukrycie ikonki odpowiedzi, gdy użytkownik jest autorem wiadomości. */
			if (message.user.login == BlipFoxPreferencesManager.get('username')) 
			{
				messageContainer.setAttribute('user_message', 'true');
				messageContainer.setAttribute('allow_delete', 'true');
			}
			else 
			{
				messageContainer.setAttribute('user_message', 'false');
			}
			messageContainer.setAttribute('messageId', message.id);
			
			/* Avatar autora wiadomości. */
			var avatarFromUrl = 'http://static4.blip.pl/images/nn_nano.png';
			if (typeof message.user.avatar !== 'undefined') 
			{
				avatarFromUrl = message.user.avatar.url.replace('.jpg', '_nano.jpg');
			}
			messageContainer.setAttribute('avatarFromUrl', avatarFromUrl);
			
			/* Avatar adresata wiadomości. */
			if (typeof message.recipient !== 'undefined') 
			{
				if (message.recipient.login == BlipFoxPreferencesManager.get('username')) 
				{
					messageContainer.setAttribute('allow_delete', 'true');
				}
				
				var avatarToUrl = 'http://static4.blip.pl/images/nn_nano.png';
				if (typeof message.recipient.avatar !== 'undefined') 
				{
					avatarToUrl = message.recipient.avatar.url.replace('.jpg', '_nano.jpg');
				}
				messageContainer.setAttribute('avatarToUrl', avatarToUrl);
				messageContainer.setAttribute('usernameTo', message.recipient.login);
			}
			
			messageContainer.setAttribute('messageType', message.type);
			messageContainer.setAttribute('time', message.created_at.substr(11));
			
			if (typeof message.recipient !== 'undefined') 
			{
				messageContainer.setAttribute('username_destination', message.recipient.login);
			}
			
			/* Dołączenie nazwy nadawcy do treści wiadomości. */
			messageContainer.appendChild(showMessageUser(message.user.login, message.type));
			
			/* Dołączenie nazwy adresata do treści wiadomości. */
			if (message.type != 'Status') 
			{
				if (message.type == 'DirectedMessage') 
				{
					messageContainer.appendChild(document.createTextNode(' > '));
				}
				else if (message.type == 'PrivateMessage') 
				{
					messageContainer.appendChild(document.createTextNode(' >> '));
				}
				messageContainer.appendChild(showMessageUser(message.recipient.login, message.type));
			}
			
			/* Dwukropek przed treścią wiadomości. */
			messageContainer.appendChild(document.createTextNode(': '));
			
			var messageBody = message.body;
			
			_appendMessageToElement(messageBody, messageContainer);
			
			/* Obsługa obrazka. */
			if (typeof message.pictures !== 'undefined') 
			{
				var messagePicturesCount = message.pictures.length;
				for (var i = 0; i < messagePicturesCount; i++) 
				{
					var messagePicture = document.createElement('image');
					messagePicture.setAttribute('src', message.pictures[i].url.replace('.jpg', '_standard.jpg'));
					messagePicture.id = 'picture_' + message.pictures[i].id;
					messagePicture.className = 'blipfox-message-picture';
					messagePicture.setAttribute('messageType', message.type);
					messagePicture.onclick = function(e)
					{
						BlipFox.openUrl(e.target.src.replace('_standard.jpg', '.jpg'));
					}
					messageContainer.appendChild(messagePicture);
				}
			}
			
			if (BlipFoxPreferencesManager.get('showEmbeds') === 'true') 
			{
				messageContainer = _embedYouTube(messageContainer, message.body, message.type);
				messageContainer = _embedGoogleVideo(messageContainer, message.body, message.type);
			}
		}

	    return messageContainer;
	};
	
	/**
	 * Metoda wyświetla na końcu wiadomości flash playera
	 * z filmami z YouTube. 
	 * @param Object messageContainer Kontener na wiadomość.
	 * @param string messageBody Treść wiadomości.
	 * @param string messageType Rodzaj wiadomości.
	 * @private
	 */
	function _embedYouTube(messageContainer, messageBody, messageType)
	{
		var pattern = /http:\/\/(([A-Za-z]+[\.])*)youtube.com\/watch\?v=([A-Za-z0-9\-_]*)/;
		while (pattern.exec(messageBody) !== null)
		{
			var embed = document.createElement('iframe');
			embed.className = 'blipfox-embed';
			if (messageType == 'Status') 
			{
				embed.style.width = '240px';
				embed.style.height = '192px';
			}
			else
			{
				embed.style.width = '220px';
				embed.style.height = '176px';
			}
			embed.src = 'http://www.youtube.com/v/' + RegExp.$3;
			embed.setAttribute('src', 'http://www.youtube.com/v/' + RegExp.$3);
			
			messageContainer.appendChild(embed);
			messageBody = RegExp.rightContext;			
		}
		
		return messageContainer;
	}

	/**
	 * Metoda wyświetla na końcu wiadomości flash playera
	 * z filmami z Google Video. 
	 * @param Object messageContainer Kontener na wiadomość.
	 * @param string messageBody Treść wiadomości.
	 * @param string messageType Rodzaj wiadomości.
	 * @private
	 */
	function _embedGoogleVideo(messageContainer, messageBody, messageType)
	{
		var pattern = /http:\/\/video.google.com\/videoplay\?docid=([0-9\-]*)/;
		while (pattern.exec(messageBody) !== null)
		{
			var embed = document.createElement('iframe');
			embed.className = 'blipfox-embed';
			if (messageType == 'Status') 
			{
				embed.style.width = '240px';
				embed.style.height = '192px';
			}
			else
			{
				embed.style.width = '220px';
				embed.style.height = '176px';
			}
			embed.src = 'http://video.google.com/googleplayer.swf?docId=' + RegExp.$1 + '&hl=en';
			embed.setAttribute('src', 'http://video.google.com/googleplayer.swf?docId=' + RegExp.$1 + '&hl=en');
			
			messageContainer.appendChild(embed);
			messageBody = RegExp.rightContext;			
		}
		
		return messageContainer;
	}
	
	/**
	 * Metoda obsługuje wyświetlenie wiadomości.
	 * @param Object message Obiekt wiadomości z API.
	 * @param Object element Element XUL, do którego zostanie przypięta wiadomość.
	 * @private
	 */
	function _appendMessageToElement(message, element)
	{
		var linkPattern = /http:\/\/[\S]+(\b|$)|\^([A-Za-z0-9]+)|#([\s]{0,1}[A-Za-z0-9ĘÓĄŚŁŻŹĆŃęóąśłżźćń_\-]{2,50}[:]{0,1})/gim;

		element.onclick = function(e)
		{
			BlipFox.showTextContext(e);
		}

		while (linkPattern.exec(message) !== null)
		{
			var token = document.createTextNode(RegExp.leftContext);
			element.appendChild(token);
			
			var link = document.createElement('a');
			var linkTitle = RegExp.lastMatch;
			var rightContext = RegExp.rightContext;

			if (RegExp.lastMatch.substring(0, 1) == '^') 
			{
				link.href = BlipFox.getUserDashboardLink(RegExp.lastMatch.substring(1));
				link.setAttribute('tooltiptext', RegExp.lastMatch.substring(1));
			}
			else if (RegExp.lastMatch.substring(0, 1) == '#' || RegExp.lastMatch.substring(0, 1) == '@')
			{
				var tag = RegExp.lastMatch.substring(1).replace(':', '');
				
				link.href = BlipFox.getTagLink(tag);
				link.setAttribute('tooltiptext', 'tag: ' + tag);
			}
			else 
			{
				link.href = RegExp.lastMatch;
				if (RegExp.lastMatch.substring(0, 15) == 'http://rdir.pl/')
				{
					/**
					 * Dodatkowa zmienna na identyfikator linku.
					 * Musi zostać utworzona, ponieważ jeżeli w międzyczasie tworzony
					 * jest inny link, to jest on tracony.
					 */
					var linkId = RegExp.lastMatch.substring(15);
					link.setAttribute('shortlink', linkId);
					
					BlipFox.getRequestManager().getUrl(RegExp.lastMatch.substring(15), 
					{
						success: function(request)
						{
							eval('var shortlink = ' + request.responseText);
							
							var linkCollection = window.document.getElementById('blipfox-popup-scrollbox').getElementsByTagName('a');
							for (var i = 0; i < linkCollection.length; i++)
							{
								if (linkCollection[i].getAttribute('shortlink') == shortlink.shortcode)
								{
									linkCollection[i].setAttribute('tooltiptext', shortlink.original_link);
								}
							}
						}
					});
				}
				if (RegExp.lastMatch.substring(0, 15) == 'http://blip.pl/')
				{
					/* Prawdopodobnie działająca obsługa podglądu wiadomości blipowych. */
					var linkUrl = RegExp.lastMatch.substring(15);
					link.setAttribute('blipMessage', linkUrl.split('/')[1]);
					
					BlipFox.getRequestManager().sendGetRequest(linkUrl,
					{
						success: function(request)
						{
							eval('var linkedMessage = ' + request.responseText);
							
							var linkCollection = window.document.getElementById('blipfox-popup-scrollbox').getElementsByTagName('a');
							for (var i = 0; i < linkCollection.length; i++)
							{
								if (linkCollection[i].getAttribute('blipMessage') == linkedMessage.id)
								{
									var tooltip = linkedMessage.user_path.replace('/users/', '');
									if (linkedMessage.type == 'DirectedMessage')
									{
										tooltip += ' > ' + linkedMessage.recipient_path.replace('/users/', '');
									}
									tooltip += ': ' + linkedMessage.body;
									linkCollection[i].setAttribute('tooltiptext', tooltip);
								}
							}
						}
					});
					
					BlipFox.log(linkUrl);
				}
			}
			link.className = 'blipfox-message-link';
			
			linkTitle = linkTitle.replace(/^http:\/\/|http:\/\/www./, '');
			if (linkTitle.length > 25)
			{
				linkTitle = linkTitle.substr(0, 25) + '...';
			}
			
			link.appendChild(document.createTextNode(linkTitle));
		  	link.addEventListener('click', function(e)
			{
				if (BlipFoxEventUtilities.getMouseButton(e) == LEFT_MOUSE_BUTTON) 
				{
					BlipFox.openUrl(e.target.href);
				}
			}, false); 
			
			link.setAttribute('contextmenu', 'blipfox-link-context');
			
			element.appendChild(link);
			
			linkPattern.lastIndex = 0;
			message = rightContext;
		}
		
	    if (message)
		{
			element.appendChild(document.createTextNode(message));
	    }
	}
	
	/**
	 * Metoda wyświetla nazwę użytkownika.
	 * @param string username Nazwa użytkownka.
	 * @param string messageType Rodzaj wiadomości.
	 * @return Object Obiekt XUL zawierający sformatowaną nazwę użytkownika.
	 * @private
	 */
	function showMessageUser(username, messageType)
	{
		var user = document.createElement('span');
		user.className = 'blipfox-message-username';
		user.appendChild(document.createTextNode(username));
		user.setAttribute('username', username);
		user.setAttribute('messageType', messageType);
		user.onclick = function()
		{
			BlipFox.showUserDashboard(user);
		}
		
		return user;
	}
	
	/**
	 * Metoda wywoływana po zainicjowaniu wszystkich elementow niezbędnych do uruchomienia wtyczki.
	 * @public
	 */
	this.initialized = function()
	{
		_container.className = 'blipfox-popup';
		this.setBackground();
	}
	
	/**
	 * Metoda ustawia tło w okienku.
	 * @public
	 */
	this.setBackground = function()
	{
		_container.style.backgroundColor = _backgroundColor;

		if (_backgroundImage !== '')
		{
			_container.style.backgroundImage = 'url(' + _backgroundImage + ')';
		}
	}
	
	/**
	 * Metoda przygotowuje listę obserwowanych do listy wyboru.
	 * @param Array friends Lista obserwowanych z API.
	 */
	this.showFriends = function(friends)
	{
		var friendsList = _getInputFriends();

		/* Usunięcie istniejących znajomych z listy */
		var friendsLength = friends.length;
		for (var i = friendsLength; i >= 0; i--)
		{
			friendsList.removeItemAt(i);
		}
		friendsList.insertItemAt(0, '---' , '');
		
		var friendsLength = friends.length;
		for (i = 0; i < friendsLength; i++)
		{
			friendsList.insertItemAt(i + 1, friends[i], friends[i]);
		}
	}
	
	/**
	 * Metoda zwraca obiekt XUL zawierający rozszerzenie.
	 * @param Object Obiekt XUL
	 * @public
	 */
	this.getContainer = function()
	{
		return _container;
	}
	
	_initializePopup();
}