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
 * Obiekt obsługuje okienko preferencji.
 */
var Preferences = (function()
{
  /**
   * Metoda zamyka okienko preferencji.
   * @private
   */
  var _close = function()
  {
    window.close();
  }

  /**
   * Metoda weryfikuje poprawność formularza preferencji.
   * Tu pewnie coś powinno być.
   * @return boolean Poprawność formularza.
   * @private
   */
  var _validateSave = function()
  {
    return true;
  }

  /**
   * Metoda odczytuje wartość z pola checkbox formularza preferencji.
   * @param string elementId Identyfikator obiektu.
   * @return string Wartość obiektu.
   * @private
   */
  var _getCheckboxPreference = function(elementId)
  {
    return window.document.getElementById(elementId).checked === true ? 'true' : 'false';
  }

  /**
   * Metoda zapisuje wartość formularza preferencji.
   * @param string preference Nazwa preferencji.
   * @param string value Wartość preferencji.
   * @private
   */
  var _savePreference = function(preference, value)
  {
    BlipFoxPreferencesManager.set(preference, value);
  }

  /**
   * Metoda zapisuje wszystkie preferencje z formularza.
   * @private
   */
  var _savePreferences = function()
  {
    var preferences =
    {
      'username': window.document.getElementById('blipfox-preferences-username').value,
      'password': window.document.getElementById('blipfox-preferences-password').value,
      'passwordFromPM': _getCheckboxPreference('blipfox-preferences-passwordFromPM'),
      'autoLogin': _getCheckboxPreference('blipfox-preferences-autoLogin'),
      'shortcutKey': window.document.getElementById('blipfox-preferences-shortcut').getAttribute('shortcut'),
      'shortcutMeta': window.document.getElementById('blipfox-preferences-shortcut').getAttribute('metaKey'),
      'shortcutAlt': window.document.getElementById('blipfox-preferences-shortcut').getAttribute('altKey'),
      'shortcutCtrl': window.document.getElementById('blipfox-preferences-shortcut').getAttribute('ctrlKey'),
      'shortcutShift': window.document.getElementById('blipfox-preferences-shortcut').getAttribute('shiftKey'),
      'noDashboardBackground': _getCheckboxPreference('blipfox-preferences-noDashboardBackground'),
      'markNewMessages': _getCheckboxPreference('blipfox-preferences-markNewMessages'),
      'soundNewMessages': _getCheckboxPreference('blipfox-preferences-soundNewMessages'),
      'hideOnClick': _getCheckboxPreference('blipfox-preferences-hideOnClick'),
      'notifyStatuses': _getCheckboxPreference('blipfox-preferences-notifyStatuses'),
      'notifyMessages': _getCheckboxPreference('blipfox-preferences-notifyMessages'),
      'showNotifications': _getCheckboxPreference('blipfox-preferences-showNotifications'),
      'notifyNotifications': _getCheckboxPreference('blipfox-preferences-notifyNotifications'),
      'useSpellchecker': _getCheckboxPreference('blipfox-preferences-useSpellchecker'),
      'soundFile': (window.document.getElementById('blipfox-preferences-soundFile').value == BlipFoxLocaleManager.getLocaleString('noFile') ? '' : window.document.getElementById('blipfox-preferences-soundFile').value)
    };

    if (preferences['passwordFromPM'] === 'true')
    {
      preferences['password'] = '';
    }

    for (var i in preferences)
    {
      _savePreference(i, preferences[i]);
    }
  }

  return {
    /**
     * Metoda zapisuje wartość skrótu klawiszowego do zamykania/otwierania okienka.
     * @param Object element Obiekt elementu formularza preferencji.
     * @param Event e Obiekt Event.
     * @public
     */
    setShortcut: function(element, e)
    {
      element.value = humanizeKeyCode(e);
      element.setAttribute('shortcut', e.keyCode);
      element.setAttribute('metaKey', e.metaKey);
      element.setAttribute('altKey', e.altKey);
      element.setAttribute('ctrlKey', e.ctrlKey);
      element.setAttribute('shiftKey', e.shiftKey);
    },

    /**
     * Metoda ładuje preferencje użytkownika i umieszcza je w formularzu.
     * @public
     */
    loadPreferences: function()
    {
      if (BlipFoxPreferencesManager.get('soundFile') === '')
      {
        window.document.getElementById('blipfox-preferences-soundFile').value = BlipFoxLocaleManager.getLocaleString('noFile');
      }
      else
      {
        window.document.getElementById('blipfox-preferences-soundFile').value = BlipFoxPreferencesManager.get('soundFile');
      }

      window.document.getElementById('blipfox-preferences-username').value = BlipFoxPreferencesManager.get('username');
      window.document.getElementById('blipfox-preferences-password').value = BlipFoxPreferencesManager.get('password');
      window.document.getElementById('blipfox-preferences-passwordFromPM').checked = BlipFoxPreferencesManager.get('passwordFromPM') === 'true' ? true : false;
      window.document.getElementById('blipfox-preferences-autoLogin').checked = BlipFoxPreferencesManager.get('autoLogin') === 'true' ? true : false;
      this.updatePasswordField(window.document.getElementById('blipfox-preferences-passwordFromPM'));
      this.setShortcut(window.document.getElementById('blipfox-preferences-shortcut'), getShortcutPreferences());
      window.document.getElementById('blipfox-preferences-noDashboardBackground').checked = BlipFoxPreferencesManager.get('noDashboardBackground') === 'true' ? true : false;
      window.document.getElementById('blipfox-preferences-markNewMessages').checked = BlipFoxPreferencesManager.get('markNewMessages') === 'true' ? true : false;
      window.document.getElementById('blipfox-preferences-soundNewMessages').checked = BlipFoxPreferencesManager.get('soundNewMessages') === 'true' ? true : false;
      window.document.getElementById('blipfox-preferences-hideOnClick').checked = BlipFoxPreferencesManager.get('hideOnClick') === 'true' ? true : false;
      window.document.getElementById('blipfox-preferences-notifyStatuses').checked = BlipFoxPreferencesManager.get('notifyStatuses') === 'true' ? true : false;
      window.document.getElementById('blipfox-preferences-notifyMessages').checked = BlipFoxPreferencesManager.get('notifyMessages') === 'true' ? true : false;
      window.document.getElementById('blipfox-preferences-showNotifications').checked = BlipFoxPreferencesManager.get('showNotifications') === 'true' ? true : false;
      window.document.getElementById('blipfox-preferences-notifyNotifications').checked = BlipFoxPreferencesManager.get('notifyNotifications') === 'true' ? true : false;
      window.document.getElementById('blipfox-preferences-useSpellchecker').checked = BlipFoxPreferencesManager.get('useSpellchecker') === 'true' ? true : false;
    },

    /**
     * Metoda zapisuje wartość okienka preferencja i zamyka okno.
     * Wywoływana przyciskiem Save.
     * @public
     */
    save: function()
    {
      if (_validateSave())
      {
        _savePreferences();
        _close();
      }
    },

    /**
     * Metoda zamyka okienko preferecji.
     * Wywoływana przyciskiem Cancel.
     * @public
     */
    cancel: function()
    {
      _close();
    },

    /**
     * Metoda ukrywa/pokazuje elementy formularza w zależności od wybranej opcji
     * informowania dźwiękiem o nowych wiadomościach.
     * @param Object element Pole formularza preferencji.
     * @param boolean onload Informacja, czy formularzy pokazywany jest w momencie otwierania okna preferencji.
     * @public
     */
    toggleSoundSelect: function(element, onload)
    {
      if (element.checked === true)
      {
        window.document.getElementById('blipfox-preferences-soundFile').style.display = 'block';
        window.document.getElementById('blipfox-preferences-soundSelect').style.display = 'block';
        window.resizeBy(0, 50);
      }
      else if (onload !== true)
      {
        window.document.getElementById('blipfox-preferences-soundFile').style.display = 'none';
        window.document.getElementById('blipfox-preferences-soundSelect').style.display = 'none';
        window.resizeBy(0, -50);
      }
    },

    /**
     * Metoda obsługuje wybór pliku do powiadamiania dźwiękiem.
     * @public
     */
    selectSound: function()
    {
      netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
      var nsIFilePicker = Components.interfaces.nsIFilePicker;
      var fp = Components.classes['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);
      fp.init(window, BlipFoxLocaleManager.getLocaleString('selectFile'), nsIFilePicker.modeOpen);
      fp.appendFilters('Audio', '*.wav', '*.aiff');
      var res = fp.show();
      if (res == nsIFilePicker.returnOK)
      {
        window.document.getElementById('blipfox-preferences-soundFile').value = fp.file.path;
      }
      else
      {
        window.document.getElementById('blipfox-preferences-soundFile').value = '';
      }
    },

    /**
     * Metoda blokuje pole na haslo uzytkownika jesli ustawione jest pobieranie
     * hasla z Menadzera Hasel.
     * @param Object element Pole formularza preferencji.
     * @public
     */
    updatePasswordField: function(element)
    {
      if (element.checked)
      {
        window.document.getElementById('blipfox-preferences-password').disabled = true;
      }
      else
      {
        window.document.getElementById('blipfox-preferences-password').disabled = false;
      }
    }

  }
})();

window.addEventListener('load', function(e)
{
  /* Sprawdzenie, czy dostępna jest usługa powiadamiania użytkownika - jeżeli nie, to ukrywane są elementy formularza. */
  try
  {
    var _notificationService = Components.classes["@mozilla.org/alerts-service;1"].getService(Components.interfaces.nsIAlertsService);
  }
  catch (ex)
  {
    window.document.getElementById('blipfox-preferences-notify').style.display = 'none';
  }

  Preferences.loadPreferences();

  /* A tu mały hack - inaczej okienko znika. */
  setTimeout(function()
  {
    Preferences.toggleSoundSelect(window.document.getElementById('blipfox-preferences-soundNewMessages'), true);
  }, 1);
}, false);
