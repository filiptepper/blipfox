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

  var _getInputFile = function()
  {
    return window.document.getElementById('blipfox-input-file');
  }

  this.getInputFile = function()
  {
    return _getInputFile();
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
    if (BlipFoxPreferencesManager.get('markNewMessages') === 'true' && BlipFox.checkStatus(BlipFox.Status.INITIALIZED) === true)
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
    _container.className = 'blipfox-loading';
    _container.id = 'blipfox-panel';

    _panel = document.createElement('panel');
    _panel.setAttribute('noautofocus', 'true');
    _panel.setAttribute('noautohide', 'true');
    _panel.appendChild(_container);

    var popupset = window.document.getElementById('browser-bottombox');
    popupset.appendChild(_panel);

    _containerMovingElement = _panel.boxObject;

    return;
  }

  /**
   * Metoda ukrywająca obiekty XUL wyświetlające rozszerzenie.
   * @private
   */
  var _hidePopup = function()
  {
    BlipFox.unsetStatus(BlipFox.Status.VISIBLE);
    _hideContainer();
  }

  /**
   * Metoda kontrolująca pokazywanie obiektu XUL wyświetlającego rozszerzenie.
   * @private
   */
  var _showPopup = function()
  {
    /* Ustawienie statusu rozszerzenia na widoczny. */
    BlipFox.setStatus(BlipFox.Status.VISIBLE);

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
      if (BlipFox.checkStatus(BlipFox.Status.INITIALIZED) === true)
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

  this.setInputFileOn = function()
  {
    return _getInputFile().src = 'chrome://blipfox/content/images/blipfox-input-file-on.gif';
  }

  this.setInputFileOff = function()
  {
    return _getInputFile().src = 'chrome://blipfox/content/images/blipfox-input-file-off.gif';
  }

  var _getProcessingThrobber = function()
  {
    return window.document.getElementById('blipfox-processing-throbber');
  }

  this.enableProcessingThrobber = function()
  {
    _getProcessingThrobber().src = 'chrome://blipfox/content/images/blipfox-processing-throbber.gif';
  }

  this.disableProcessingThrobber = function()
  {
    _getProcessingThrobber().src = '';
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
    if (BlipFox.checkStatus(BlipFox.Status.VISIBLE) === true)
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
    if (BlipFox.checkStatus(BlipFox.Status.VISIBLE) === false)
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

      messagesList.insertBefore(_showMessage(messages[i]), messagesList.firstChild);
    }

    /* Zaktualizowanie status użytkownika - tylko w wypadku zmiany. */
    if (lastUserStatus !== '')
    {
      this.setUserStatus(lastUserStatus, lastUserStatusId);
    }

    if (BlipFox.checkStatus(BlipFox.Status.LOADING) === true)
    {
      BlipFox.unsetStatus(BlipFox.Status.LOADING);
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
    var userStatusWrapped = wordwrap(userStatus, 33, ' ', true);
    while (currentUserStatus.firstChild)
    {
      currentUserStatus.removeChild(currentUserStatus.firstChild);
    }
    _appendMessageToElement(userStatusWrapped, currentUserStatus);
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

    if (BlipFox.checkStatus(BlipFox.Status.LOADING) === false && message.user.login != BlipFoxPreferencesManager.get('username'))
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
        BlipFox.notify(message.user.login + ( message.type == 'PrivateMessage' ? ' >> ' : ' > ' ) + message.recipient.login + ': ' + message.body, notificationImage);
      }
      if (BlipFoxPreferencesManager.get('notifyNotifications') === 'true' && (message.type == 'Notice' || message.type == 'UpdateTip'))
      {
        BlipFox.notify(message.body, notificationImage);
      }
    }

    if ((message.type == 'Notice' && BlipFoxPreferencesManager.get('showNotifications') === 'true') || message.type == 'UpdateTip')
    {
      window.document.getElementById('blipfox-statusbar-panel').setAttribute('tooltiptext', message.user.login + ' > ' + message.body);
      messageContainer.id = message.id;
      messageContainer.style.opacity = 1;
      messageContainer.className = 'blipfox-notification';

      /* Oznaczanie nowych wiadomości. */
      if (BlipFoxPreferencesManager.get('markNewMessages') === 'true' && BlipFox.checkStatus(BlipFox.Status.VISIBLE) === false && message.user.login != BlipFoxPreferencesManager.get('username'))
      {
        messageContainer.setAttribute('new_message', 'true');
      }

      messageContainer.appendChild(document.createTextNode(' '));

      var messageBody = message.body;

      _appendMessageToElement(messageBody, messageContainer);
    }
    else if (message.type != 'Notice' )
    {
      window.document.getElementById('blipfox-statusbar-panel').setAttribute('tooltiptext', message.user.login + ' > ' + message.body);
      messageContainer.id = message.id;
      messageContainer.style.opacity = 1;
      messageContainer.className = 'blipfox-message';
      messageContainer.setAttribute('username', message.user.login);
      messageContainer.setAttribute('transport', message.transport.name.toLowerCase());

      /* Oznaczanie nowych wiadomości. */
      if (BlipFoxPreferencesManager.get('markNewMessages') === 'true' && BlipFox.checkStatus(BlipFox.Status.VISIBLE) === false && message.user.login != BlipFoxPreferencesManager.get('username'))
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

        var size = {width : 220, height : 176};
      } else {
        var size = {width : 240, height : 192};
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
    }

    return messageContainer;
  };

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
              var shortlink = JSON.parse(request.responseText);

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
        if (RegExp.lastMatch.substring(0, 15) == 'http://blip.pl/' || RegExp.lastMatch.substring(0, 19) == 'http://www.blip.pl/')
        {
          /* Prawdopodobnie działająca obsługa podglądu wiadomości blipowych. */
          var linkUrl = RegExp.lastMatch.split('/').slice(3).join('/');
          link.setAttribute('blipMessage', linkUrl.split('/')[1]);
          linkTitle = "[blip]";
          BlipFox.getRequestManager().sendGetRequest(BlipFox.Const.BLIPFOX_API_URL + linkUrl,
          {
            success: function(request)
            {
              var linkedMessage = JSON.parse(request.responseText);

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

      if (element.id == 'blipfox-popup-header-status')
      {
        link.className = 'blipfox-status-link';
      }
      else
      {
        link.className = 'blipfox-message-link';
      }

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
      	message = wordwrap(message, 25, ' ', true);
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
    // var friendsList = _getInputFriends();
    //
    // /* Usunięcie istniejących znajomych z listy */
    // var friendsLength = friends.length;
    // for (var i = friendsLength; i >= 0; i--)
    // {
    // 	friendsList.removeItemAt(i);
    // }
    // friendsList.insertItemAt(0, '---' , '');
    //
    // var friendsLength = friends.length;
    // for (i = 0; i < friendsLength; i++)
    // {
    // 	friendsList.insertItemAt(i + 1, friends[i], friends[i]);
    // }
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
