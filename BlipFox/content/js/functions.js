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
 * Funkcja przetwarza kod klawiszy z obiektu Event do formy
 * czytelnej dla użytkownika.
 * @param e Event Obiekt Event.
 * @return string Etykieta skrótu klawiszowego.
 */
function humanizeKeyCode(e)
{
	var humanized = [];
	
	if (e.ctrlKey === true)
	{
		humanized[humanized.length] = 'Ctrl';
	}
	
	if (e.shiftKey === true)
	{
		humanized[humanized.length] = 'Shift';
	}
	
	if (e.metaKey === true)
	{
		humanized[humanized.length] = 'Meta';
	}
	
	if (e.altKey === true)
	{
		humanized[humanized.length] = 'Alt';
	}
	
	humanized[humanized.length] = String.fromCharCode(e.keyCode);
	
	return humanized.join(' + ');		
}

/**
 * Funkcja zwraca aktualny skrót klawiszowy na podstawie preferencji użytkownika.
 * return Object Obiekt podobny Event.
 */
function getShortcutPreferences()
{

	var fakeEvent = 
	{
		altKey: BlipFoxPreferencesManager.get('shortcutAlt') == 'true' ? true : false,
		metaKey: BlipFoxPreferencesManager.get('shortcutMeta') == 'true' ? true : false,
		ctrlKey: BlipFoxPreferencesManager.get('shortcutCtrl') == 'true' ? true : false,
		shiftKey: BlipFoxPreferencesManager.get('shortcutShift') == 'true' ? true : false,
		keyCode: BlipFoxPreferencesManager.get('shortcutKey'),				
	}

	return fakeEvent;			
}

/**
  * Funkcja zwraca haslo z menadzera hasel dla danej domeny oraz nazwy uzytkownika
  * @return String Haslo uzytkownika
  */
function getPasswordFromManager(host, username) {
	if (Components.classes["@mozilla.org/passwordmanager;1"]) // Firefox starszy niz 3
	{
		var passwordManager = Components.classes["@mozilla.org/passwordmanager;1"]
			.getService(Components.interfaces.nsIPasswordManager);
		
		var e = passwordManager.enumerator;
		while (e.hasMoreElements()) 
		{
			var login = e.getNext().QueryInterface(Components.interfaces.nsIPassword);
			if (login.host.indexOf(host) != -1 && login.user == username) 
			{
				return login.password;
				break;
			}
		}
	} 
	else if (Components.classes["@mozilla.org/login-manager;1"]) // Firefox 3 i wyzszy
	{
		var loginManager = Components.classes["@mozilla.org/login-manager;1"]
			.getService(Components.interfaces.nsILoginManager);
			
		var logins = loginManager.getAllLogins({});
		for (var i = 0; i < logins.length; i++)
		{
			login = logins[i];
			if (login.hostname.indexOf(host) != -1 && login.username == username) 
			{
				return login.password;
				break;
			}
		}
	}
}