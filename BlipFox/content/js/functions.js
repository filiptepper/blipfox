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

if (typeof BlipFox === "undefined") { var BlipFox = {}; }

/**
 * Funkcja przetwarza kod klawiszy z obiektu Event do formy
 * czytelnej dla użytkownika.
 * @param e Event Obiekt Event.
 * @return string Etykieta skrótu klawiszowego.
 */
BlipFox.humanizeKeyCode = function(e)
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
 * @return Object Obiekt podobny Event.
 */
BlipFox.getShortcutPreferences = function()
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
BlipFox.getPasswordFromManager = function(host, username) {
  lowerCaseUsername = username.toLowerCase();

  if (Components.classes["@mozilla.org/passwordmanager;1"]) // Firefox starszy niz 3
  {
    var passwordManager = Components.classes["@mozilla.org/passwordmanager;1"]
      .getService(Components.interfaces.nsIPasswordManager);

    var e = passwordManager.enumerator;
    while (e.hasMoreElements())
    {
      var login = e.getNext().QueryInterface(Components.interfaces.nsIPassword);
      if (login.user.toLowerCase() == lowerCaseUsername && login.host.indexOf(host) != -1)
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
      if (login.username.toLowerCase() == lowerCaseUsername && login.hostname.indexOf(host) != -1)
      {
        return login.password;
        break;
      }
    }
  }

  return '';
}


/**
 * Funkcja dzieląca słowa na części.
 * @param string input string
 * @param int max długość stringu
 * @param string separator
 * @param boolean ucinanie słowa
 * @return string
 */
BlipFox.wordwrap = function( str, int_width, str_break, cut ) {
    // http://kevin.vanzonneveld.net
    // +   original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
    // +   improved by: Nick Callen
    // +    revised by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: Sakimori
    // +   bugfixed by: Michael Grier
    // *     example 1: wordwrap('Kevin van Zonneveld', 6, '|', true);
    // *     returns 1: 'Kevin |van |Zonnev|eld'
    // *     example 2: wordwrap('The quick brown fox jumped over the lazy dog.', 20, '<br />\n');
    // *     returns 2: 'The quick brown fox <br />\njumped over the lazy<br />\n dog.'
    // *     example 3: wordwrap('Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.');
    // *     returns 3: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod \ntempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim \nveniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea \ncommodo consequat.'

    // PHP Defaults
    var m = ((arguments.length >= 2) ? arguments[1] : 75   );
    var b = ((arguments.length >= 3) ? arguments[2] : "\n" );
    var c = ((arguments.length >= 4) ? arguments[3] : false);

    var i, j, l, s, r;

    str += '';

    if (m < 1) {
        return str;
    }

    for (i = -1, l = (r = str.split(/\r\n|\n|\r/)).length; ++i < l; r[i] += s) {
        for(s = r[i], r[i] = ""; s.length > m; r[i] += s.slice(0, j) + ((s = s.slice(j)).length ? b : "")){
            j = c == 2 || (j = s.slice(0, m + 1).match(/\S*(\s)?$/))[1] ? m : j.input.length - j[0].length || c == 1 && m || j.input.length + (j = s.slice(m).match(/^\S*/)).input.length;
        }
    }

    return r.join("\n");
}
