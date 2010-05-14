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


/**
* Obiekt sterujący rozszerzeniem.
*/
if (typeof BlipFox === "undefined") { var BlipFox = {}; }

/**
 * Wyjątek do obsługi błędów logowania.
 * @param string message Opis błędu.
 */
function CredentialsException(message){this.message = message;};
CredentialsException.prototype = new Error();

/**
 * Wyjątek do obsługi błędów sieciowych.
 * @param string message Opis błędu.
 */

function NetworkException(message){this.message = message;};
NetworkException.prototype = new Error();

BlipFox = (function()
{
  	/**
	 * Struktura zawierająca dane, na których działa rozszerzenie.
	 * @var Object
	 * @private
	 */
	var _data = {
		/**
		 * Lista obserowanych.
		 */
		_friends: [],

		/**
		 * Lista wiadomości.
		 */
		_messages: [],

		/**
		 * Aktualny status użytkownika.
		 */
		_status: []
	}

	/**
	 * Status rozszerzenia.
	 * Status rozszerzenia jest obiektem, który przyjmuje wartości z obiektu BlipFox.Status.
	 * @var integer
	 * @private
	 */
	var _status = 0;

	/**
	 * Obiekt zarządzający warstwą wyświetlania.
	 * @var BlipFoxLayoutManager
	 * @private
	 */
	var _layoutManager;

	/**
	 * Obiekt zarządzający zapytaniami do API.
	 * @var BlipFoxRequestManager
	 * @private
	 */
	var _requestManager;

	/**
	 * Obiekt zarządzający skracaniem / wydłużaniem adresow url.
	 * @var BlipFoxUrlCompreser
	 * @private
	 */
	var _urlCompresser;

	/**
	 * Identyfikator ostatnio pobranej wiadomości.
	 * @var integer
	 * @private
	 */
	var _lastMessageId = null;

	/**
	 * Czas ostatniego pobrania wiadomości.
	 * @var Date
	 * @private
	 */
	var _lastMessagePollDate = null;

	/**
	 * Użytkownik / tag dla którego będzie ustawiona blokada
	 * wysyłania wiadomości.
	 * @var string
	 * @private
	 */
	var _lockMessaging = null;

	/**
	 * Liczba nieprzeczytanych wiadomości.
	 * Informacja widoczna jest w nawiasie w pasku statusu.
	 * @var integer
	 * @private
	 */
	var _unreadCount = 0;

	/**
	 * Metoda inicjalizująca wyświetlanie rozszerzenia.
	 * Wyświetlany jest komunikat oczekiwania na załadowanie.
	 * @return boolean Czy możliwe jest pobranie danych.
	 * @private
	 */
	var _initialize = function()
	{
		/* Brak nazwy użytkownika lub hasła. */
		if (BlipFoxPreferencesManager.getUsername() === '' || BlipFoxPreferencesManager.getPassword() === '')
		{
			BlipFox.showPreferences();
			return false;
		}

		BlipFox.setStatus(BlipFox.Status.ON);
		BlipFox.setStatus(BlipFox.Status.LOADING);

		/* Pobranie informacji o aktualnym użytkowniku. */
		_getUser(BlipFoxPreferencesManager.getUsername());

		/* Wypełnienie listy znajomych. */
		_getFriends();

		/* Pierwsze pobranie wiadomości. */
		_getMessages();

		/* Ustawienie sprawdzenia, czy wszystkie elementy zostały już pobrane. */
		setTimeout(BlipFox.isInitialized, 1);

		return true;
	}

	/**
	 * Metoda wstawia nicka użytkownika do pola wiadomości.
	 * Jeśli poprzedni nick był taki sam, to typ wiadomości jest zamieniany (dm<=>pm)
	 * Po wstawieniu nicka ustawiany jest focus na polu wiadomości.
	 * @param string nick Nick do wstawienia.
	 * @param boolean privateMessage Czy wiadomość jest prywatna.
	 * @private
	 */
	var _insertNick = function(nick, privateMessage)
	{
		var inputMessage = _layoutManager.getInputMessage();
		var newMessage = (privateMessage ? '>>' : '>') + nick + ': ';
		if (inputMessage.value == newMessage)
		{
			newMessage = (!privateMessage ? '>>' : '>') + nick + ': ';
		}
		inputMessage.value = newMessage;
		inputMessage.focus();
	};

	/**
	 * Metoda pobiera informacje o obserwowanych użytkownikach.
	 * @private
	 */
	var _getFriends = function()
	{
		_requestManager.getFriends(
		{
			success: function(request)
			{
				var friends = JSON.parse(request.responseText);

				_data._friends = [];

				var friendsLength = friends.length;
				for (i = 0; i < friendsLength; i++)
				{
				  var login = friends[i].tracked_user_path.substring(7);
					/**
					 * Dodane małe zabezpieczenie na wypadek, gdyby API miało problem z metodą /friends.
					 * Sprawdzamy, czy w tablicy nie powtarzają się elementy.
					 */
					if (_data._friends.indexOf(login) == -1)
					{
						_data._friends[_data._friends.length] = login;
					}
				}

				_data._friends.sort();

				BlipFox.setStatus(BlipFox.Status.LOADED_FRIENDS);

				if (BlipFox.checkStatus(BlipFox.Status.INITIALIZED))
				{
					_layoutManager.showFriends(_data._friends);
				}
			},
			error: function(request, exception)
			{
				if (exception instanceof NetworkException)
				{
					_getFriends();
				}
			}
		});
	}

	/**
	 * Metoda pobiera zestaw najnowszych wiadomości.
	 * @private
	 */
	var _getMessages = function()
	{
		if (BlipFox.checkStatus(BlipFox.Status.POLLING) === true)
		{
			BlipFox.unsetStatus(BlipFox.Status.POLLING);
		}

		_requestManager.getMessages(
		{
			success: function(request)
			{
				/* Po wyłączeniu nie wykonujemy już żadnych operacji. */
				if (BlipFox.checkStatus(BlipFox.Status.ON) === false)
				{
					return;
				}

				_data._messages = JSON.parse(request.responseText);

				var messagesLength = _data._messages.length;
				if (messagesLength > 0)
				{
					/* Zapisanie identyfikatora ostatnio odebranej wiadomości. */
					_lastMessageId = _data._messages[0].id;

					/**
					 * Jeżeli okienko jest schowane to zapisywana jest ilość nowych wiadomości.
					 * Ilość wiadomości pokazywana jest na pasku statusu.
					 */
					if (BlipFox.checkStatus(BlipFox.Status.VISIBLE) === false)
					{
						var playSound = false;

						for (var i = 0; i < messagesLength; i++)
						{
							/* Nie doliczam wiadomości wysłanych przez użytkownika. */
							if (_data._messages[i].user.login !== BlipFoxPreferencesManager.getUsername())
							{
								if (_unreadCount <= 100)
								{
									if (_data._messages[i].type != 'Notice' || (_data._messages[i].type == 'Notice' && BlipFoxPreferencesManager.get('showNotifications') === 'true')) {
										_unreadCount++;
									}
								}
								playSound = true;
							}
						}

						if (_unreadCount > 0)
						{
							_layoutManager.setStatusbarCount(_unreadCount);
						}
						if (BlipFoxPreferencesManager.get('soundNewMessages') == 'true' && playSound === true)
						{
							BlipFox.playMessageSound();
						}
					}
				}

				/* @todo - skopiowałeś dwa razy ten sam kod, durniu */
				var date = new Date();
				_lastMessagePollDate = date.getTime();

				if (BlipFox.checkStatus(BlipFox.Status.INITIALIZED) === true)
				{
					_layoutManager.showMessages(_data._messages);
				}

				BlipFox.setStatus(BlipFox.Status.LOADED_MESSAGES);

				/* Ustawiamy timer do ponownego pobierania wiadomości */
				if (BlipFox.checkStatus(BlipFox.Status.POLLING) === false)
				{
					BlipFox.setStatus(BlipFox.Status.POLLING);
					_checkPoll();
				}
			},
			error: function(request, exception)
			{
				if (exception instanceof NetworkException)
				{
					_getMessages();
					return;
				}
				if (typeof BlipFox === 'object')
				{
					var date = new Date();
					_lastMessagePollDate = date.getTime();

					/* Ustawiamy timer do ponownego pobierania wiadomości */
					if (BlipFox.checkStatus(BlipFox.Status.POLLING) === false)
					{
						BlipFox.setStatus(BlipFox.Status.POLLING);
						_checkPoll();
					}
				}
			}
		});
	}

	/**
	 * Metoda pobiera informacje dotyczące użytkownika.
	 * Ustawiane jest tło oraz aktualny status użytkownika.
	 * @param string username Nazwa użytkownika.
	 * @private
	 */
	var _getUser = function(username)
	{
		var requestUsername = username;

		_requestManager.getUser(username,
		{
			success: function(request)
			{
				var user = JSON.parse(request.responseText);

				/**
				 * Ustawienie tła.
				 * Wpierw tłem jest obrazek, jeżeli nie zostanie odnaleziony to jako tło
				 * wstawiany jest kolor wybrany przez użytkownika.
				 * Jeżeli użytkownik nie posiada zdefiniowanych preferencji to ustawiany jest kolor szary.
				 */
				if (typeof user.background !== 'undefined' && typeof user.background.url !== 'undefined' && BlipFoxPreferencesManager.get('noDashboardBackground') === 'false')
				{
					_layoutManager.setBackgroundImage(user.background.url);
				}
				else if (typeof user.color_background !== 'undefined')
				{
					_layoutManager.setBackgroundColor(user.color_background);
				}
				else
				{
					_layoutManager.setBackgroundColor('#111111');
				}

				if (BlipFox.checkStatus(BlipFox.Status.INITIALIZED))
				{
					_layoutManager.setBackground();
				}

				/**
				 * Ustawienie aktualnego statusu użytkownika.
				 */
				if (typeof user.current_status !== "undefined" && typeof user.current_status.body !== 'undefined')
				{
					_data._status = user.current_status;
				} else {
				  _data._status = { "body": "[Nie ustawiłeś jeszcze żadnego statusu!]", "id": 0 }
				}

				BlipFox.setStatus(BlipFox.Status.LOADED_USER);
			},
			error: function(request, exception)
			{
				if (exception instanceof NetworkException)
				{
					_getUser(requestUsername);
				}
			}
		});
	}

	/**
	 * Metoda sprawdzająca, czy można wykonać zapytanie do serwera
	 * w celu pobrania nowych wiadomości
	 * @private
	 */
	var _checkPoll = function()
	{
		try
		{
			if (
				BlipFox.checkStatus(BlipFox.Status.AUTHENTICATED) === true
				&&
				BlipFox.checkStatus(BlipFox.Status.ON) === true
				&&
				BlipFox.checkStatus(BlipFox.Status.LOADED_MESSAGES) === true
				)
			{
				setTimeout(function()
				{
					var date = new Date();

					if (date.getTime() - 8000 > _lastMessagePollDate)
					{
						_getMessages();
					}
					else
					{
						_checkPoll();
					}
				}, 1000);
			}
			else if (BlipFox.checkStatus(BlipFox.Status.ON) === true || BlipFox.checkStatus(BlipFox.Status.ON) === false)
			{
				return;
			}
			else
			{
				BlipFox.destroy();
				throw invalidCredentialsError;
			}
		}
		catch (ex)
		{
			BlipFox.alert(ex.message);
		}
	}

	/**
	 * Zmienna, która przetrzymuje wersę przeglądarki Firefox.
	 * @var boolean
	 * @private
	 */
	var _firefoxVersion = null;

	/**
	 * Metoda sterująca włączaniem i pokazywaniem okienka.
	 * @private
	 */
	var _togglePopup = function()
	{
		_blurElement();
		_layoutManager.togglePopup();
		_unreadCount = 0;
	}

	/**
	 * Aktualny link do skopiowania do schowka.
	 * @var string
	 * @private
	 */
	var _clipboardLink = '';

	/**
	 * Usługa uruchamiająca powiadomienia systemowe.
	 * @var Object
	 * @private
	 */
	var _notificationService = null;

	/* Sprawdzam, czy usługa jest dostępna. */
	try
	{
		_notificationService = Components.classes["@mozilla.org/alerts-service;1"].getService(Components.interfaces.nsIAlertsService);
	}
	catch (ex)
	{
	  BlipFox.log(ex);
	}

	/**
	 * Metoda zwraca parametry POST potrzebne do zalogowania się do sekretarki.
	 * @param string username Nazwa użytkownika.
	 * @param string password Hasło użytkownika.
	 * @return string parametry POST.
	 * @public
	 */
	var _getUserSecretaryParameters = function(username, password)
	{
		return 'bliplogin=' + username + '&bliphaslo=' + password + '&submit=Zaloguj+si%C4%99&lggedin=yeap';
	}

	var _emptyInputFile = function()
	{
		_layoutManager.getInputFile().setAttribute('path', '');
		_layoutManager.getInputFile().setAttribute('leftName', '');
		_layoutManager.setInputFileOff();
	}

	var _blurElement = function()
	{
		var focused = document.commandDispatcher.focusedElement;
		if ( focused ) {
			focused.blur();
		}
	}

	/* Metody publiczne. */
	return {

    /* Stałe. */
    Const: {
      /* Konsola do debuggowania. */
      BLIPFOX_DEBUG: false,

      /* Wersja. */
      BLIPFOX_VERSION: '1.1.9',

      /* URL do API. */
      BLIPFOX_API_URL: 'http://api.blip.pl/',

      /* URL Blip. */
      BLIPFOX_BLIP_URL: 'http://blip.pl/',

      /* URL do bliplogu. */
      BLIPFOX_BLIPLOG_URL: '.blip.pl/',

      /* URL sekretarka (Tomasza Topy) */
      BLIPFOX_SECRETARY_URL: 'http://szmerybajery.pl/sekretarka/index.php',

      /* Maksymalna dlugosc wiadomosci wysylanej na Blipa */
      BLIP_MESSAGE_MAX_LENGTH: 160
    },

    /* Status rozszerzenia. */
    Status: {
      /* Rozszerzenie włączone. */
      ON: 1,

      /* Rozszerzenie widoczne. */
      VISIBLE: 2,

      /* Rozszerzenie zostało zainicjalizowane. */
      INITIALIZED: 4,

      /* Użytkownik posiada prawidłową nazwę użytkownika i hasło. */
      AUTHENTICATED: 8,

      /* Dane użytkownika załadowane. */
      LOADED_USER: 16,

      /* Wiadomości załadowane. */
      LOADED_MESSAGES: 32,

      /* Załadowani obserwowani. */
      LOADED_FRIENDS: 64,

      /* Uruchomione pobieranie wiadomości. */
      POLLING: 128,

      /* Pierwsze pobranie wiadomości. */
      LOADING: 256
    },

		/**
		 * Metoda zwraca identyfikator ostatnio pobranej wiadomości.
		 * @return integer Identyfikator ostatnio wiadomości.
		 * @public
		 */
		getLastMessageId: function()
		{
			return _lastMessageId;
		},

		/**
		 * Metoda, która sprawdza, czy zostały załadowane wszystkie elementy niezbędne
		 * do wyświetlenia rozszerzenia.
		 * @public
		 */
		isInitialized: function()
		{
			if (
				BlipFox.checkStatus(BlipFox.Status.LOADED_USER) === true
				&&
				BlipFox.checkStatus(BlipFox.Status.LOADED_FRIENDS) === true
				&&
				BlipFox.checkStatus(BlipFox.Status.LOADED_MESSAGES) === true
				&&
				BlipFox.checkStatus(BlipFox.Status.VISIBLE) === true
			)
			{
				BlipFox.setStatus(BlipFox.Status.INITIALIZED);

				_layoutManager.initialized();

				setTimeout(function()
				{
					_layoutManager.showFriends(_data._friends);
					_layoutManager.showMessages(_data._messages);
					_layoutManager.setUserStatus(_data._status.body, _data._status.id);
					window.document.getElementById('blipfox-popup-header').click =

					window.document.getElementById('blipfox-input-dashboard').setAttribute('username', BlipFoxPreferencesManager.getUsername());
					_layoutManager.getInputMessage().focus();
				}, 1);
			}

			else if (BlipFox.checkStatus(BlipFox.Status.AUTHENTICATED) === false)
			{
				BlipFox.destroy();
			}
			else
			{
				setTimeout(BlipFox.isInitialized, 1);
			}
		},

		/**
		 * Metoda do wyświetlania komunikatów dla użytkownika.
		 * @param string string Treść komunikatu.
		 * @public
		 */
		alert: function(string)
		{
			alert(string);
		},

		/**
		 * Metoda wywoływana w momencie, gdy ładowane jest rozszerzenie.
		 * @param Event e Obiekt Event JavaScript.
		 * @public
		 */
		onLoad: function(e)
		{
			_layoutManager = new BlipFoxLayoutManager();
			_requestManager = new BlipFoxRequestManager();
			_urlCompresser = new BlipFoxUrlCompresser();

			/* Inicjalizacja podstawowych zdarzeń. */

			/* Kliknięcie w ikonkę w pasku statusu. */
			window.document.getElementById('blipfox-statusbar-panel').addEventListener('click', this.handleStatusbarClick, false);
			_layoutManager.setEvents(_layoutManager.getContainer(), true);

			/* Automatyczne logowanie i sprawdzanie czy BlipFox został już uruchomiony w innym oknie */
			var hWindow = Components.classes["@mozilla.org/appshell/appShellService;1"].getService(Components.interfaces.nsIAppShellService).hiddenDOMWindow;
			if ( !hWindow.blipFoxInstance ) {
				hWindow.blipFoxInstance = true;
				var autoLogin = BlipFoxPreferencesManager.get('autoLogin');
				if ( autoLogin == 'true' ) {
					BlipFox.togglePopup();
				}
			}

			missingCredentialsError = new CredentialsException(BlipFoxLocaleManager.getLocaleString('enterUsernameAndPassword'));
			invalidCredentialsError = new CredentialsException(BlipFoxLocaleManager.getLocaleString('enterValidUsernameAndPassword'));
			networkError = new NetworkException('networkError');
		},

		/**
		 * Metoda sterująca włączaniem i wyłączaniem okienka rozszerzenia.
		 * @public
		 */
		togglePopup: function()
		{
			try
			{
				/* Za każdym razem zakładam, że użytkownik od nowa podał swoje dane. */
				BlipFox.setStatus(BlipFox.Status.AUTHENTICATED);

				/* Wtyczka nie była zainicjowana - ładowanie danych. */
				if (BlipFox.checkStatus(BlipFox.Status.INITIALIZED) === false)
				{
					if (_initialize())
					{
						/* Po udanej inicjalizacji włączenie ikonki. */
						_layoutManager.setStatusbarIconOn();
						window.document.getElementById('blipfox-statusbar-context-turnon').setAttribute('visible', false);
						window.document.getElementById('blipfox-statusbar-context-turnoff').setAttribute('visible', true);
						_togglePopup();
					}
				}
				else
				{
					_togglePopup();
				}
			}
 			catch (ex)
			{
			  BlipFox.log(ex);
				if (ex instanceof CredentialsException)
				{
					BlipFox.alert(ex.message);
					BlipFox.showPreferences();
				}
			}
		},

		/**
		 * Metoda zwracająca obiekt zarządzający warstwą wyświetlania.
		 * @return BlipFoxLayoutManager
		 * @public
		 */
		getLayoutManager: function()
		{
			return _layoutManager;
		},

		/**
		 * Metoda wywoływana po kliknięciu w ikonkę w pasku statusu.
		 * @param Event e Obiekt Event JavaScript.
		 * @public
		 */
		handleStatusbarClick: function(e)
		{
			switch (BlipFoxEventUtilities.getMouseButton(e))
			{
				case LEFT_MOUSE_BUTTON:
					/* Lewy przycisk myszy. */
					BlipFox.togglePopup();
					break;
			}
			e.stopPropagation();
		},

		/**
		 * Metoda weryfikująca, czy dany status jest ustawiony.
		 * @param integer status Właściwość obiektu BlipFox.Status.
		 * @return boolean
		 * @public
		 */
		checkStatus: function(status)
		{
			/* Wymuszenie typu boolean. */
			return !!(_status & status);
		},

		/**
		 * Metoda ustawiająca status.
		 * @param integer status Właściwość obiektu BlipFox.Status.
		 * @public
		 */
		setStatus: function(status)
		{
			_status |= status;
		},

		/**
		 * Metoda usuwająca status.
		 * @param integer status Właściwość obiektu BlipFox.Status.
		 * @public
		 */
		unsetStatus: function(status)
		{
			_status = _status ^ status;
		},

		/**
		 * Metoda wywoływana otrzymaniu fokusa przez pole na wiadomość.<b>
		 * @param Event e Obiekt Event JavaScript.
		 * @param Object inputMessage Obiekt zawierający okienko wpisywania wiadomości.
		 * @public
		 */
		onInputMessageFocus: function(e, inputMessage)
		{
			this.clearInputMessage(e, inputMessage);
			this.updateInputColor();
		},

		/**
		 * Metoda czyści okienko wpisywania wiadomości ze zbędnych znaków.
		 * Dodatkowa metoda wymusza poprawne działanie okienka wpisywania wiadomości z
		 * theme iSafari.
		 * @param Event e Obiekt Event JavaScript.
		 * @param Object inputMessage Obiekt zawierający okienko wpisywania wiadomości.
		 * @public
		 */
		clearInputMessage: function(e, inputMessage)
		{
			/* Kompatybilność z iSafari. */
			inputMessage.style.fontFamily = 'trebuchet, arial, helvetica, sans-serif';
			inputMessage.style.fontSize = '13px';

			/* Obsługa korekty pisowni. */
			if (BlipFoxPreferencesManager.get('useSpellchecker') === 'true')
			{
				inputMessage.setAttribute('spellcheck', true);
			}
			else
			{
				inputMessage.setAttribute('spellcheck', false);
			}

			inputMessage.value = inputMessage.value.replace("\n", '');
		},

		/**
		 * Metoda czyści wszelkie pozostałości po działaniu rozszerzenia.
		 * Po jej wywołaniu wszystkie elementy przywracane są do stanu zaraz po włączeniu.
		 * @public
		 */
		destroy: function()
		{
			BlipFox.unsetStatus(BlipFox.Status.POOLING);
			BlipFox.unsetStatus(BlipFox.Status.LOADED_FRIENDS);
			BlipFox.unsetStatus(BlipFox.Status.LOADED_MESSAGES);
			BlipFox.unsetStatus(BlipFox.Status.LOADED_USER);
			BlipFox.unsetStatus(BlipFox.Status.AUTHENTICATED);
			BlipFox.unsetStatus(BlipFox.Status.INITIALIZED);
			BlipFox.unsetStatus(BlipFox.Status.VISIBLE);
			BlipFox.unsetStatus(BlipFox.Status.ON);

			_lastMessageId = null;
			_layoutManager.destroy();

			/* Easter egg! */
			_layoutManager.setStatusbarPanelTooltip('Oh my god, they killed BlipFox!');
		},

		/**
		 * Funkcja logująca. Logowanie wyświetlane jest tylko w trybie BLIPFOX_DEBUG.
		 * @param String message Treść logowanej wiadomości.
		 * @public
		 */
		log: function(message)
		{
			if (BlipFox.Const.BLIPFOX_DEBUG === true)
			{
				/* Logowanie na konsolę Firefoksa. */
				var console = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
				console.logStringMessage(message);
			}
		},

		/**
		 * Metoda czyta wartość wybranego elementy z listy obserwowanych.
		 * Po jego wybraniu nick wybranej osoby wstawiany jest do okienka wpisywania wiadomości.
		 * @param string value Nick osoby.
		 * @public
		 */
		selectFriend: function(value)
		{
			var friendsList = _layoutManager.getInputFriends();
			var friend = friendsList.selectedItem;

			if (friend !== null && friendsList.selectedIndex !== 0)
			{
				friendsList.selectedIndex = 0;
				_insertNick(friend.value);
			}
		},

		/**
		 * Metoda obsługuje przycisk Odpowiedz na liście wiadomości.
		 * Po wybraniu przycisku odpowiedź nick wybranej osoby wstawiany jest do okienka wpisywania wiadomości.
		 * @param Object element Obiekt XUL, z którego pobierany jest atrybut username zawierający nick.
		 * @public
		 */
		replyToUser: function(element)
		{
			_insertNick(element.getAttribute('username'), element.getAttribute('messageType') == 'PrivateMessage');
		},

		/**
		 * Metoda przenosi do kokpitu użytkownika po klinięciu w element, który zawiera atrybut username.
		 * @param Object element Obiekt XUL, z którego pobierany jest atrybut username zawierający nick.
		 * @public
		 */
		showUserDashboard: function(element)
		{
			this.openUrl(this.getUserDashboardLink(element.getAttribute('username')));
		},

		/**
		 * Metoda zwraca link do kokpitu użytkownika.
		 * @param string username Nazwa użytkownika.
		 * @return string URL do kokpitu.
		 * @public
		 */
		getUserDashboardLink: function(username)
		{
			return BlipFox.Const.BLIPFOX_BLIP_URL + 'users/' + username + '/dashboard';
		},

		/**
		 * Metoda przenosi do bliplogu użytkownika po klinięciu w element, który zawiera atrybut username.
		 * @param Object element Obiekt XUL, z którego pobierany jest atrybut username zawierający nick.
		 * @public
		 */
		showUserBliplog: function(element)
		{
			this.openUrl('http://' + element.getAttribute('username') + BlipFox.Const.BLIPFOX_BLIPLOG_URL);
		},

		/**
		 * Metoda zwraca link do tagu.
		 * @param string tag Tag.
		 * @return string URL do tagu.
		 * @public
		 */
		getTagLink: function(tag)
		{
			return this.getBlipTagLink(tag);
		},

		/**
		 * Metoda zwraca link do tagu na Blipie.
		 * @param string tag Tag.
		 * @return string URL do tagu na Blipie.
		 * @public
		 */
		getBlipTagLink: function(tag)
		{
			return BlipFox.Const.BLIPFOX_BLIP_URL + 'tags/' + tag.replace('Ę', 'e').replace('ę', 'e').replace('Ó', 'o').replace('ó', 'o').replace('Ą', 'a').replace('ą', 'a').replace('Ś', 's').replace('ś', 's').replace('Ł', 'l').replace('ł', 'l').replace('Ż', 'z').replace('ż', 'z').replace('Ź', 'z').replace('ź', 'z').replace('Ć', 'c').replace('ć', 'c').replace('Ń', 'n').replace('ń', 'n');
		},

		/**
		 * Metoda zwraca link do publicznego statusu.
		 * @param string messageId Identyfikator wiadomości.
		 * @return string URL do statusu.
		 * @public
		 */
		getStatusLink: function(messageId)
		{
			return BlipFox.Const.BLIPFOX_BLIP_URL + 's/' + messageId;
		},

		/**
		 * Metoda przenosi użytkownika do poglądu statusu na blipie.
		 * @param Object e Event JavaScript.
		 * @param Object element Obiekt XUL, z którego pobierany jest atrybut username zawierający nick.
		 * @public
		 */
		showStatus: function(e, element)
		{
			if (BlipFoxEventUtilities.getMouseButton(e) == LEFT_MOUSE_BUTTON)
			{
				this.openUrl(this.getStatusLink(element.getAttribute('messageId')));
			}
 		},

		/**
		 * Metoda zwraca link do kierowanej wiadomości.
		 * @param string messageId Identyfikator wiadomości.
		 * @return string URL do wiadomości kierowanej.
		 * @public
		 */
		getDirectedMessageLink: function(messageId)
		{
			return BlipFox.Const.BLIPFOX_BLIP_URL + 'dm/' + messageId;
		},

		/**
		 * Metoda zwraca link do prywatnej wiadomości.
		 * @param string messageId Identyfikator wiadomości.
		 * @return string URL do wiadomości prywatnej.
		 * @public
		 */
		getPrivateMessageLink: function (messageId)
		{
			return BlipFox.Const.BLIPFOX_BLIP_URL + 'pm/' + messageId;
		},

		/**
		 * Metoda przenosi użytkownika do poglądu kierowanej wiadomości na Blipie.
		 * @param Object e Event JavaScript.
		 * @param Object element Obiekt XUL, z którego pobierany jest atrybut username zawierający nick.
		 * @public
		 */
		showDirectedMessage: function(e, element)
		{
			if (BlipFoxEventUtilities.getMouseButton(e) == LEFT_MOUSE_BUTTON)
			{
				this.openUrl(this.getDirectedMessageLink(element.getAttribute('messageId')));
			}
		},

		/**
		 * Metoda przenosi użytkownika do podglądu prywatnej wiadomości na Blipie.
		 * @param Object e Event JavaScript.
		 * @param Object element Obiekt XUL, z którego pobierany jest atrybut username zawierający nick.
		 * @public
		 */
		showPrivateMessage: function(e, element)
		{
			if (BlipFoxEventUtilities.getMouseButton(e) == LEFT_MOUSE_BUTTON)
			{
				this.openUrl(this.getPrivateMessageLink(element.getAttribute('messageId')));
			}
		},

		/**
		 * Metoda otwiera odnośnik.
		 * Odnośnik zawsze otwierany jest w nowej zakładce.
		 * Wykorzystywane tylko w Firefox 2.
		 * @param String url Treść odnośnika.
		 * @public
		 */
		openUrl: function(url)
		{
			var browser = gBrowser;
			var tabs = browser.tabContainer.childNodes;

			for (var i in tabs)
			{
				var tab = tabs[i];
				try
				{
					var tabBrowser = tabbrowser.getBrowserForTab(tab);
					if (tabBrowser)
					{
						var doc = tabBrowser.contentDocument;
						var location = doc.location.toString();
						if (loc == url)
						{
							gBrowser.selectedTab = tab;
							return;
						}
					}
				}
				catch (e)
				{
				  BlipFox.log(e);
					/**
					 * Brzydki sposób obsługi.
					 * Nie zawsze dostępny jest obiekt tabbrowser.
					 * Jeżeli obiekt tabbrowser nie jest dostępny to w sztuczny sposób łapiemy wyjątek.
					 * Po jego złapaniu algorytm idzie dalej i wyszukuje nowej zakładki.
					 */
				}
			}

			var tab = gBrowser.addTab(url, null, null);
			gBrowser.selectedTab = tab;
		},

		/**
		 * Koloruje pole na wiadomość zależnie od typu wiadomości (normalna, skierowana, prywatna).
		 * @public
		 */
		updateInputColor: function()
		{
			var input = _layoutManager.getInputMessage();

			if (this.isDirectMessage(input.value))
			{
				input.style.backgroundColor = '#CCC';
			}
			else if (this.isPrivateMessage(input.value))
			{
				input.style.backgroundColor = '#999';
			}
			else
			{
				input.style.backgroundColor = '#FFF';
			}
		},

		/**
		 * Metoda sprawdza czy wiadomość jest skierowaną (dm)
		 * @param String Wiadomość
		 * @return boolean Czy wiadomość jest skierowana
		 * @public
		 */
		isDirectMessage: function(message)
		{
			var regEx = /^>[\w\d]/;
			return regEx.exec(message);
		},

		/**
		 * Metoda sprawdza czy wiadomość jest prywatną (pm)
		 * @param String Wiadomość
		 * @return boolean Czy wiadomość jest prywatna
		 * @public
		 */
		isPrivateMessage: function(message)
		{
			var regEx = /^>>[\w\d]/;
			return regEx.exec(message);
		},

		/**
		 * Metoda sprawdza, czy zawartość okienka do wpisywania wiadomości posiada poprawną treść.
		 * @param Event e Obiekt Event JavaScript.
		 * @param Object inputMessage Obiekt zawierający odnośnik do okienka wpisywania wiadomości.
		 * @return boolean Czy treść okienka wpisywania wiadomości jest poprawna.
		 * @public
		 */
		validateInputMessage: function(e, inputMessage)
		{
			if (inputMessage.value.length > 0 && e.keyCode === 13)
			{
				this.clearInputMessage(e, inputMessage);
				return this.sendMessage();
			}
			if (inputMessage.value.length > BlipFox.Const.BLIP_MESSAGE_MAX_LENGTH && e.keyCode != 13)
			{
				return false;
			}

			return true;
		},

		/**
		 * Metoda uaktualnia licznik pozostalych znakow.
		 * @param Object inputMessage Obiekt zawierający odnośnik do okienka wpisywania wiadomości.
		 * @public
		 */
		updateCharactersLeft: function(inputMessage)
		{
			var charactersLeftLabel = window.document.getElementById('blipfox-input-charactersleft');

			charactersLeftLabel.value = BlipFox.Const.BLIP_MESSAGE_MAX_LENGTH - inputMessage.value.length;
			if (inputMessage.value.length > BlipFox.Const.BLIP_MESSAGE_MAX_LENGTH)
			{
				charactersLeftLabel.style.color = 'red';
			}
			else
			{
				charactersLeftLabel.style.color = '';
			}

			return true;
		},

		/**
		 * Metoda sprawdza, czy można dopełnić okienko wpisywania wiadomości znanym nickiem.
		 * Jeżeli jest znaleziony nick to jest on wstawiany do okienka wiadomości.
		 * @param Event e Obiekt Event JavaScript.
		 * @param Object messageInput Obiekt zawierający odnośnik do okienka wpisywania wiadomości.
		 * @public
		 */
		autocompleteInputMessage: function(e, inputMessage)
		{
			this.updateInputColor();

			/**
			 * Obsługa skrótów klawiszowych ALT + (1 - 5)
			 * Drugi warunek dla Maka.
			 * Musi być tam sprawdzany altKey, ponieważ ALT+S "ś" pod Windows zwraca e.ctrlKey === true.
			 */
			if ((e.altKey === true && e.keyCode >= 49 && e.keyCode <= 53) || (e.ctrlKey === true && e.altKey === false && e.shiftKey === false && e.keyCode >= 81 && e.keyCode <= 85))
			{
				/* Obliczenie od góry na którą wiadomość chcemy odpowiedzieć. */
				var messageNumber = (e.altKey === true && e.ctrlKey === false ? -49 : -81) + e.keyCode;
				var messageBox = window.document.getElementById('blipfox-popup-messages').childNodes[messageNumber];
				if (typeof messageBox !== 'undefined')
				{
					_insertNick(window.document.getElementById('blipfox-popup-messages').childNodes[messageNumber].getAttribute('username'));
				}
			}

			/* Autocomplete */
			if (e.keyCode !== 8 && (inputMessage.value.substr(0, 1) == '>' || inputMessage.value.substr(0, 2) == '>>') && inputMessage.value.indexOf(' ') == -1 && inputMessage.value.length > 1)
			{
				var privateMessageAutocomplete = inputMessage.value.substr(0, 2) == '>>';

				var friendsCount = _data._friends.length;

				var friendsFound = 0;
				var friendName = '';
				var lookupName = inputMessage.value.substr(privateMessageAutocomplete === true ? 2 : 1, inputMessage.value.length - 1);
				var lookupNameLength = lookupName.length;

				for (var i = 0; i < friendsCount; i++)
				{
					if (_data._friends[i].substr(0, lookupNameLength) == lookupName)
					{
						friendsFound++;
						friendName = _data._friends[i];
					}
				}

				if (friendsFound === 1)
				{
					_insertNick(friendName, privateMessageAutocomplete);
				}
			}

			this.updateCharactersLeft(inputMessage);

			return true;
		},

		/**
		 * Metoda wysyłająca wiadomość.
		 * @return boolean Czy wiadomość została przekazana do wysłania.
		 * @public
		 */
		sendMessage: function()
		{
			var inputMessage = _layoutManager.getInputMessage();
			var inputFile = _layoutManager.getInputFile();

			/**
			 * Zabezpieczenie przed ponownym wysłaniem wiadomości.
			 * Jeżeli pole jest zablokowane - nie wykonuj funkcji.
			 */
			if (inputMessage.readOnly === true)
			{
				return false;
			}

			if (inputMessage.value.length > BlipFox.Const.BLIP_MESSAGE_MAX_LENGTH)
			{
				BlipFox.alert(BlipFoxLocaleManager.getLocaleString('statusTooLong'));
				return false;
			}

			if (inputMessage.value !== '' || inputFile.getAttribute('path') !== '')
			{
				/* Wysyłka tylko niepustej wiadomości */
				inputMessage.readOnly = true;
				_layoutManager.enableProcessingThrobber();

				var callback = {
					success: function()
					{
						var msg = _lockMessaging ? _lockMessaging : '';
						_layoutManager.getInputMessage().value = msg;
						BlipFox.updateCharactersLeft(_layoutManager.getInputMessage());
						BlipFox.updateInputColor();
						_emptyInputFile();
						inputMessage.readOnly = false;

						var date = new Date();
						_lastMessagePollDate = date.getTime() - 6000;

						_layoutManager.disableProcessingThrobber();
					},
					error: function()
					{
						_emptyInputFile();
						inputMessage.readOnly = false;
						_layoutManager.disableProcessingThrobber();
						BlipFox.alert(BlipFoxLocaleManager.getLocaleString('messageSendFailed'));
					}
				}

				try
				{
					if (inputFile.getAttribute('path') === '')
					{
						_requestManager.sendMessage(inputMessage.value, callback);
					}
					else
					{
						var file = {
							filename: inputFile.getAttribute('leafName'),
							path: inputFile.getAttribute('path')
						};
						_requestManager.sendImage(inputMessage.value, file, callback);
					}
				}
				catch (ex)
				{
					_emptyInputFile();
					inputMessage.readOnly = false;
					_layoutManager.disableProcessingThrobber();
					BlipFox.alert(BlipFoxLocaleManager.getLocaleString('messageSendFailed'));
				}
			}

			return true;
		},

		/**
		 * Metoda obsługująca wyłączenie rozszerzenia.
		 * @public
		 */
		turnoff: function()
		{
			var doTurnOff = confirm(BlipFoxLocaleManager.getLocaleString('turnOffConfirmation'));
			if (doTurnOff === true)
			{
				window.document.getElementById('blipfox-statusbar-context-turnon').setAttribute('visible', true);
				window.document.getElementById('blipfox-statusbar-context-turnoff').setAttribute('visible', false);
				BlipFox.destroy();
			}
		},

		/**
		 * Metoda obsługująca włączenie rozszerzenia.
		 * Oszukana - tak naprawdę wrapper na funkcję togglePopup, która
		 * przy pierwszym uruchomieniu inicjuje rozszerzenia.
		 * @return boolean Wynik działania metody togglePopup.
		 * @public
		 */
		turnon: function()
		{
			window.document.getElementById('blipfox-statusbar-context-turnon').setAttribute('visible', false);
			window.document.getElementById('blipfox-statusbar-context-turnoff').setAttribute('visible', true);
			return this.togglePopup();
		},

		/**
		 * Metoda pokazuje okienko z preferencjami użytkownika.
		 * @public
		 */
		showPreferences: function()
		{
			window.open('chrome://blipfox/content/Preferences.xul', '', 'centerscreen,chrome,dependent=yes,modal');
		},

		/**
		 * Metoda powoduje wywołanie odświeżenia listy wiadomości oraz ponownego pobrania
		 * listy użytkowników.
		 * @public
		 * @deprecated
		 */
		refresh: function()
		{
			/**
			 * Czas od ostatniego pobrania wiadomości - 0.
			 * Przy następnym sprawdzeniu czy pobierać wiadomości warunek zostanie spełniony,
			 * a wiadomości pobrane.
			 */
			this.lastMessagePoll = 0;

			/* Pobranie listy obserwowanych - za każdym razem pełen request. */
			_getFriends();

			/* Odświeżenie informacji o użytkowniku. */
			_getUser(BlipFoxPreferencesManager.getUsername());

			/* Pobranie wiadomości. */
			_getMessages();
		},

		/**
		 * Metoda zwraca instancję obiektu BlipFoxRequestManager.
		 * @return BlipFoxRequestManager
		 * @public
		 */
		getRequestManager: function()
		{
			return _requestManager;
		},

		/**
		 * Metoda zwraca instancję obiektu BlipFoxUrlCompresser.
		 * @return BlipFoxRequestManager
		 * @public
		 */
		getUrlCompresser: function()
		{
			return _urlCompresser;
		},

		/**
		 * Metoda wywołuje usunięcie wiadomości.
		 * @param Object element Element XUL wiadomości.
		 * @public
		 */
		deleteMessage: function(element)
		{
			messageId = element.getAttribute('messageId');
			if (confirm(BlipFoxLocaleManager.getLocaleString('deleteConfirmation')))
			{
				_layoutManager.enableProcessingThrobber();
				_requestManager.deleteMessage(messageId, element.getAttribute('messageType'),
				{
					success: function(e)
					{
						_layoutManager.disableProcessingThrobber();
						messageNode = window.document.getElementById(messageId);
						setTimeout(function()
						{
							BlipFox.hideMessage(messageNode);
						}, 50);
						if (window.document.getElementById('blipfox-popup-header-status').getAttribute('message_id') == messageId)
						{
							_layoutManager.setUserStatus('[Wiadomość usunięta]')
						}
					},
					error: function(e)
					{
						_layoutManager.disableProcessingThrobber();
						BlipFox.alert(BlipFoxLocaleManager.getLocaleString('deleteFailed'));
					}
				});
			}
		},

		/**
		 * Metoda powoduje ukrycie ramki z usuwaną wiadomością.
		 * @param Object messageNode Element XUL zawierający wiadomość.
		 * @public
		 */
		hideMessage: function(messageNode)
		{
			if (messageNode.style.opacity > 0)
			{
				messageNode.style.opacity -= 0.05;
				setTimeout(function(e)
				{
					BlipFox.hideMessage(messageNode);
				}, 50);
			}
			else
			{
				messageNode.parentNode.removeChild(messageNode);
			}
		},

		/**
		 * Metoda przygotowuje link do skopiowania do schowka na podstawie klikniętego permalinku wiadomości.
		 * @public
		 */
		preparePermalinkForClipboard: function()
		{
			if (document.popupNode.getAttribute('messageType') == 'Status')
			{
				_clipboardLink = this.getStatusLink(document.popupNode.getAttribute('messageId'));
			}
			else if (document.popupNode.getAttribute('messageType') == 'DirectedMessage')
			{
				_clipboardLink = this.getDirectedMessageLink(document.popupNode.getAttribute('messageId'));
			}
			else
			{
				_clipboardLink = this.getPrivateMessageLink(document.popupNode.getAttribute('messageId'));
			}
		},

		/**
		 * Metoda przygotowuje link do skopiowania do schowka.
		 * @public
		 */
		prepareLinkForClipboard: function()
		{
			_clipboardLink = document.popupNode.href;
		},

		/**
		 * Metoda kopiuje wybrany link do schowka.
		 * @public
		 */
		copyLinkToClipboard: function()
		{
			var clipboard = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);
			clipboard.copyString(_clipboardLink);
		},

		/**
		 * Metoda odtwarza dźwięk zapisany w preferencjach użytkownika.
		 * @public
		 */
		playMessageSound: function()
		{
			if (BlipFoxPreferencesManager.get('soundFile') != '')
			{
				try
				{
					var sound = Components.classes['@mozilla.org/sound;1'].createInstance(Components.interfaces.nsISound);
					var ioService = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);
					var soundFile = ioService.newURI('file://' + BlipFoxPreferencesManager.get('soundFile'), null, null);
					sound.play(soundFile);
				}
				catch (ex)
				{
				  BlipFox.log(ex);
				}
			}
		},

		/**
		 * Metoda kopiuje zaznaczony ciąg znaków do schowka.
		 * @public
		 */
		copyMessageToClipboard: function()
		{
			var clipboard = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);
			clipboard.copyString(window.getSelection());
		},

		/**
		 * Metoda pokazuje menu kontekstowe dla zaznaczenia tekstu.
		 * @param Event e Event Javascript.
		 * @public
		 */
		showTextContext: function(e)
		{
			if (BlipFoxEventUtilities.getMouseButton(e) == RIGHT_MOUSE_BUTTON && window.getSelection() != '')
			{
				window.document.getElementById('blipfox-text-context').showPopup(e.target, e.screenX, e.screenY);
			}
		},

		/**
		 * Metoda wywołuje powiadomienie systemowe (Growl pod OS X).
		 * @param string message Treść powiadomienia.
		 * @param stirng image URL do obrazka.
		 * @public
		 */
		notify: function(message, image)
		{
			try
			{
				if (image === null)
				{
					image = 'chrome://blipfox/content/images/blipfox-logo.png';
				}
				_notificationService.showAlertNotification(image, 'BlipFox', message);
			}
			catch (ex)
			{
			  BlipFox.log(ex);
			}
		},

		/**
		 * Metoda wstawia do okna wpisywania wiadomości link do cytatu.
		 * @param Object Kliknięty element.
		 */
		quoteMessage: function(element)
		{
			var link = '';
			if (element.getAttribute('messageType') == 'Status')
			{
				link = this.getStatusLink(element.getAttribute('messageId'));
			}
			else if (element.getAttribute('messageType') == 'DirectedMessage')
			{
				link = this.getDirectedMessageLink(element.getAttribute('messageId'));
			}
			else
			{
				link = this.getPrivateMessageLink(element.getAttribute('messageId'));
			}

			var input = window.document.getElementById('blipfox-input-message');
			var start = input.selectionStart;
			var end = input.selectionEnd;

			input.value = input.value.substring(0, start) + link + ' ' + input.value.substring(end, input.value.length);
			input.focus();
		},


		// selectedFile: null,

		/**
		 * Metoda otwiera okienko wyboru zdjęcia.
		 * @public
		 */
		selectFile: function()
		{
			netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
			var nsIFilePicker = Components.interfaces.nsIFilePicker;
			var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
			fp.init(window, BlipFoxLocaleManager.getLocaleString('selectFile'), nsIFilePicker.modeOpen);
			fp.appendFilters(nsIFilePicker.filterImages);
			var res = fp.show();
			if (res == nsIFilePicker.returnOK)
			{
				_layoutManager.getInputFile().setAttribute('path', fp.file.path);
				_layoutManager.getInputFile().setAttribute('leafName', fp.file.leafName);
				_layoutManager.setInputFileOn();
			}
			else
			{
				_layoutManager.getInputFile().setAttribute('path', '');
				_layoutManager.getInputFile().setAttribute('leftName', '');
				_layoutManager.setInputFileOff();
			}
		},

		/**
		 * Metoda skraca wszystkie adresy w wiadomości.
		 * @public
		 */
		compressUrls: function()
		{
			var inputMessage = _layoutManager.getInputMessage();

			if (inputMessage.readOnly === true)
			{
				return false;
			}

			var linkPattern = /https?:\/\/[^\>\<\s\"]+/gim;
			var message = inputMessage.value;

			while (linkPattern.exec(message) !== null)
			{
        var url = RegExp.lastMatch;
        if (url.substring(0, 15) != "http://rdir.pl/") {
          _requestManager.shortenUrl(url,
          {
            success: function(request, param)
            {
              var originalUrl = param;
              var compressedUrl = JSON.parse(request.responseText);
              var inputMessage = BlipFox.getLayoutManager().getInputMessage();

              inputMessage.value = inputMessage.value.replace(compressedUrl.original_link, compressedUrl.url);
            },
            error: function(request, ex)
            {
            }
          });
        }
			}
		},

		/**
		 * Metoda przenosi do strony sekretarki użytkownika.
		 * @public
		 */
		showUserSecretary: function()
		{
			var dataString = _getUserSecretaryParameters(BlipFoxPreferencesManager.getUsername(), BlipFoxPreferencesManager.getPassword());
			try {
				this.postUrl(BlipFox.Const.BLIPFOX_SECRETARY_URL, dataString);
			} catch (ex) {
				BlipFox.alert(ex);
			}
		},

		/**
		 * Metoda otwiera odnośnik metodą POST (z parametrami)
		 * @param String url Odnośnik
		 * @param String dataString Parametry POST
		 * @public
		 */
		postUrl: function(url, dataString)
		{
			const Cc = Components.classes;
			const Ci = Components.interfaces;
			var stringStream = Cc["@mozilla.org/io/string-input-stream;1"].
			createInstance(Ci.nsIStringInputStream);
			if ("data" in stringStream)
			{
				stringStream.data = dataString;
			}
			else
			{
				stringStream.setData(dataString, dataString.length);
			}

			var postData = Cc["@mozilla.org/network/mime-input-stream;1"].
			createInstance(Ci.nsIMIMEInputStream);
			postData.addHeader("Content-Type", "application/x-www-form-urlencoded");
			postData.addContentLength = true;
			postData.setData(stringStream);

			var tab = gBrowser.addTab(url, null, null);
			gBrowser.selectedTab = tab;
			gBrowser.webNavigation.loadURI(url, gBrowser.LOAD_FLAGS_NONE, null, postData, null);
		},

		/**
		 * Metoda umożliwiająca założenie blokady na wysyłanie
		 * wiadomości do konkretnego użytkownika / taga.
		 * @param Object Kliknięty element.
		 * @public
		 */
		lockMessaging: function(element)
		{
			var inputMessage = _layoutManager.getInputMessage();

			if (inputMessage.readOnly === true)
			{
				return false;
			}

			if ( _lockMessaging ) {
				_lockMessaging = null;
				element.src = "chrome://blipfox/content/images/blipfox-input-messaging-off.gif";
				return;
			}

			var message = inputMessage.value;
			var lock = message.match(/^(?:>|>>|#)\w+\:?/);
			if ( lock ) {
				_lockMessaging = lock + " ";
				element.src = "chrome://blipfox/content/images/blipfox-input-messaging-on.gif";
			}
		}
	}
})();

window.addEventListener('load', function(e)
{
	BlipFox.onLoad(e);
}, false);

window.addEventListener('keydown', function(e)
{
	var shortcutPreferences = getShortcutPreferences();
	if (e.shiftKey === shortcutPreferences.shiftKey && e.ctrlKey === shortcutPreferences.shiftKey && e.altKey === shortcutPreferences.altKey && e.metaKey === shortcutPreferences.metaKey && e.keyCode == shortcutPreferences.keyCode)
	{
		BlipFox.togglePopup();
	}
}, false);

window.addEventListener('click', function(e)
{
	if (BlipFoxPreferencesManager.get('hideOnClick') == 'true' && BlipFox.checkStatus(BlipFox.Status.VISIBLE) === true && BlipFox.checkStatus(BlipFox.Status.INITIALIZED) === true)
	{
		var panel = window.document.getElementById('blipfox-panel').boxObject;

		/* Zabezpieczenie przed ukrywaniem okienka podczas akcji. */
		if (e.screenX < panel.screenX || e.screenX > panel.screenX + panel.width || e.screenY < panel.screenY || e.screenY > panel.screenY + panel.height)
		{
			if (e.target.id != 'blipfox-text-context-copyToClipboard' && e.target.id != 'blipfox-permalink-context-copyToClipboard' && e.target.id != 'blipfox-link-context-copyToClipboard')
			{
				BlipFox.togglePopup();
			}
		}
	}
}, false);