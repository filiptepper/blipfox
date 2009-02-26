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

function BlipFoxRequestManager()
{
	/**
	 * Hasło użytkownika.
	 * @var string
	 * @private
	 */
	var _password = '';
	
	/**
	 * Nazwa użytkownika.
	 * @var string
	 * @private
	 */
	var _username = '';
	
	/**
	 * Metoda inicjalizują obiekt, weryfikuje istnieje danych do logowania.
	 * @private
	 */
	function _init()
	{
		_username = BlipFoxPreferencesManager.get('username');
		_password = BlipFoxPreferencesManager.get('password');
		
		if (_username === '' || _password === '')
		{
			throw missingCredentialsError;
		}
	};
	
	/*
	function _sendMultipartRequest()
	{
		var boundary = '------deadbeef---deadbeef---' + Math.random();
		var mstream = Components.classes['@mozilla.org/io/multiplex-input-stream;1'].createInstance(Ci.nsIMultiplexInputStream);
		var sstream;
		
		esc_params = []; 
		esc_params['body'] = '>filiptepper: tset';
		esc_params['picture'] = window.document.getElementById('blipfox-input-file').getAttribute('file');
		
		for (var p in esc_params)
		{
			sstream = Components.classes['@mozilla.org/io/string-input-stream;1'].createInstance(Ci.nsIStringInputStream);
			sstream.setData('--' + boundary + '\r\nContent-Disposition: form-data; name="' + p + '"', -1);
			mstream.appendStream(sstream);
			if ('object' == typeof esc_params[p] && null != esc_params[p])
			{
				sstream = Components.classes['@mozilla.org/io/string-input-stream;1'].createInstance(Ci.nsIStringInputStream);
				sstream.setData('; filename="' + esc_params[p].filename + '"\r\nContent-Type: application/octet-stream\r\n\r\n', -1);
				mstream.appendStream(sstream);
				var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
     			file.initWithPath(esc_params[p].path);
     			var fstream = Components.classes['@mozilla.org/network/file-input-stream;1'].createInstance(Ci.nsIFileInputStream);
				fstream.init(file, 1, 1, Ci.nsIFileInputStream.CLOSE_ON_EOF);
				var bstream = Components.classes['@mozilla.org/network/buffered-input-stream;1'].createInstance(Ci.nsIBufferedInputStream);
				bstream.init(fstream, 4096);
				mstream.appendStream(bstream);
				sstream = Components.classes['@mozilla.org/io/string-input-stream;1'].createInstance(Ci.nsIStringInputStream);
				sstream.setData('\r\n', -1);
				mstream.appendStream(sstream);
			} 
			else 
			{
				sstream = Components.classes['@mozilla.org/io/string-input-stream;1'].createInstance(Ci.nsIStringInputStream);
				sstream.setData('\r\n\r\n' + esc_params[p] + '\r\n', -1);
				mstream.appendStream(sstream);
			}
		}

		sstream = Components.classes['@mozilla.org/io/string-input-stream;1'].createInstance(Ci.nsIStringInputStream);
		sstream.setData('--' + boundary + '--\r\n', -1);
		mstream.appendStream(sstream);

		sstream = Components.classes['@mozilla.org/io/string-input-stream;1'].createInstance(Ci.nsIStringInputStream);
		sstream.setData('POST /updates HTTP/1.1\r\n' +
			'Host: api.blip.pl\r\n' +
			'Authorization: Basic ' + window.btoa(_username + ':' + _password) + '\r\n' +
			'Accept: application/json\r\n' +
			'X-blip-api: 0.02\r\n' +
			'User-Agent: BlipFox ' + BLIPFOX_VERSION + '\r\n' +
			'Content-Length: ' + mstream.available() + '\r\n' +
			'Content-Type: multipart/form-data; boundary=' + boundary +
			'\r\n\r\n', -1);
		
		mstream.insertStream(sstream, 0);

		try
		{
			var service = Components.classes['@mozilla.org/network/socket-transport-service;1'].getService(Ci.nsISocketTransportService);
			var transport = service.createTransport(null, 0, 'api.blip.pl', 80, null);
			var ostream = transport.openOutputStream(Ci.nsITransport.OPEN_BLOCKING, 0, 0);
			while (mstream.available())
			{
				var a = mstream.available();
				ostream.writeFrom(mstream, Math.min(a, 8192));
			}
			var _istream = transport.openInputStream(0,0,0);
			var istream = Components.classes['@mozilla.org/scriptableinputstream;1'].createInstance(Ci.nsIScriptableInputStream);
			istream.init(_istream);
			var pump = Components.classes['@mozilla.org/network/input-stream-pump;1'].createInstance(Ci.nsIInputStreamPump);
			pump.init(_istream, -1, -1, 0, 0, false);
			pump.asyncRead({id: this.id, content_length: null, raw: '',
				onStartRequest: function(request, context) {},
				onStopRequest: function(request, context, status) {
					istream.close();
					ostream.close();
				},

				// Docs are slim so I'm not sure if this gets called only
				// once per request or perhaps multiple times
				//   The code can handle whatever
				onDataAvailable: function(request, context,
					stream, offset, count) {
					this.raw += istream.read(count);

					// If we've received all of the headers, grab the
					// content length and drop the headers
					if (!this.content_length
						&& this.raw.match(/\r?\n\r?\n/)) {
						var match = this.raw.match(
							/^Content-Length:\s*([0-9]+)$/mi);
						if (match) {
							this.content_length = match[1];
							this.raw = this.raw.split(/\r?\n\r?\n/)[1];
						}
					}

					// Nothing left to do if we don't know the length
					if (!this.content_length) { return; }

					// Also nothing more to do if there's still data coming
					if (this.raw.length != this.content_length) { return; }

					// Dispatch to the UI as soon as we have the entire
					// payload
					//threads.main.dispatch(new UploadDoneCallback(this.raw, this.id), threads.main.DISPATCH_NORMAL);

				},
			}, null);
		} catch (err) {
			alert(err);
		}
	}
	*/
	
	this.sendGetRequest = function(url, callback)
	{
		_sendRequest(url, callback, null, 'GET');
	}
	
	/**
	 * Metoda wysyła request do serwera oraz obsługuje jego zachowanie
	 * po zakończeniu.
	 * @param string url URL requestu.
	 * @param callback Object Obiekt zawierający metody success i error, wywoływane po requeście.
	 * @param params Object Obiekt z dodatkowymi opcjami requestu.
	 * @param method string Metoda POST/GET/DELETE
	 * @param headers Object Dodatkowy obiekt z nagłówkami requestu.
	 * @private
	 */
	function _sendRequest(url, callback, params, method, headers)
	{
		BlipFox.log(url);
		
		_init();
		
		if (typeof method === 'undefined')
		{
			method = 'GET';
		}

		var request = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);

		request.open(method, BLIPFOX_API_URL + url, true, _username, _password);
		request.setRequestHeader('Authorization', 'Basic ' + window.btoa(_username + ':' + _password));
		request.setRequestHeader('Accept', 'application/json');
		request.setRequestHeader('User-Agent', 'BlipFox ' + BLIPFOX_VERSION);
		request.setRequestHeader('Content-Type', 'application/json');
		request.setRequestHeader('X-blip-api', '0.02')

		if (method == 'POST')
		{
			request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		}

		request.onreadystatechange = function()
		{
 			try
			{
				if (request.readyState == 4 && ((request.status == 200 && (method == 'GET' || method == 'DELETE')) || (request.status == 201 && method == 'POST')))
				{
					BlipFox.log(request.responseText);
					if (typeof callback.success === 'function')
					{
						callback.success.call(BlipFox, request);
					}
				}
				else if (request.readyState == 4 && request.status == 204)
				{
					/* Nic się nie dzieje. Pusta odpowiedź. */
					if (typeof callback.error === 'function')
					{
						callback.error(request);
					}					
				}
				else if (request.readyState == 4 && request.status == 401)
				{
					/* Błędna nazwa użytkownika i/lub hasło. */
					BlipFox.unsetStatus(BlipFoxStatus.AUTHENTICATED);
					throw invalidCredentialsError;
				}
				else if (request.readyState == 4 && request.status == 503)
				{
					BlipFox.log('HTTP: 503');

					/* Błąd sieci. */
					throw networkError;
				}
				else if (request.readyState == 4)
				{
					if (typeof callback.error === 'function')
					{
						callback.error(request);
					}
				}
			}
			catch (ex)
			{
				if (typeof callback.error === 'function')
				{
					callback.error(request, ex);
				}
				else
				{
					if (ex.name == 'NS_ERROR_NOT_AVAILABLE')
					{
						/* TODO: dodać obsługę błędów. */
						BlipFox.log('HTTP: NS_ERROR_NOT_AVAILABLE');
						// BlipFox.destroy();
					}
					else
					{
						if (!(ex instanceof NetworkException)) 
						{
							alert(ex.message);
						}
					}
				}	
			}
		}
		
		if (typeof params === 'null')
		{
			params = null;
		}
		
		request.send(params);
	};

	/**
	 * Metoda pobiera listę obserwowanych.
	 * @param callback Object Obiekt zawierający metody success i error, wywoływane po requeście.
	 * @public
	 */
	this.getFriends = function(callback)
	{
		_sendRequest('friends', callback);
	}

	/**
	 * Metoda pobiera informacje o użytkowniku.
	 * @param username string Nazwa użytkownika.
	 * @param callback Object Obiekt zawierający metody success i error, wywoływane po requeście.
	 * @public
	 */
	this.getUser = function(username, callback)
	{
		_sendRequest('users/' + username + '?include=background,current_status', callback);
	}
	
	/**
	 * Metoda wysyła wiadomość.
	 * @param string message Treść wiadomości.
	 * @param callback Object Obiekt zawierający metody success i error, wywoływane po requeście.
	 * @public
	 */
	this.sendMessage = function(message, callback)
	{
		_sendRequest('updates', callback, 'body=' + encodeURIComponent(message), 'POST', {'Content-Type' : 'application/x-www-form-urlencoded'});
	}

	/**
	 * Metoda usuwa wiadomość.
	 * @param integer messageId Identyfikator wiadomości.
	 * @param string messageType Rodzaj wiadomości.
	 * @param callback Object Obiekt zawierający metody success i error, wywoływane po requeście.
	 * @public
	 */
	this.deleteMessage = function(messageId, messageType, callback)
	{
		switch (messageType)
		{
			case 'PrivateMessage':
				_sendRequest('pm#/' + messageId, callback, '', 'DELETE');
				break;
			default:
				_sendRequest('updates/' + messageId, callback, '', 'DELETE');
				break;
		}
	}
	
	/**
	 * Metoda pobiera zawartość kokpitu.
	 * @param callback Object Obiekt zawierający metody success i error, wywoływane po requeście.
	 * @param integer lastMessage Identyfikator ostatnio pobranej wiadomości.
	 * @public
	 */	
	this.getMessages = function(callback, lastMessage)
	{
		var url = 'dashboard';

		if (BlipFox.getLastMessageId() !== null)
		{
			url += '/since/' + BlipFox.getLastMessageId();
		}
		
		url += '?include=pictures,user,recipient,user[avatar],recipient[avatar]';

		_sendRequest(url, callback);
	}
	
	/**
	 * Metoda pobiera treść linku (rdir.pl).
	 * @param string link Identyfikator shortlinku.
	 * @param callback Object Obiekt zawierający metody success i error, wywoływane po requeście.
	 * @public
	 */	
	this.getUrl = function(link, callback)
	{
		var url = 'shortlinks/' + link;
		_sendRequest(url, callback);
	}
}