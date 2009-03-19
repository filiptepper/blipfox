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

/* Obiekt obsługujący preferencje. */
var BlipFoxPreferencesManager = {};

BlipFoxPreferencesManager = (function()
{
	/**
	 * Usługa przeglądarki do obsługi dostępu do preferencji.
	 * @var Object
	 * @private
	 */
	var preferencesService = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('extensions.blipfox.'); 
	
	/**
	 * Obiekt zawierające domyślne preferencje.
	 * @var Object
	 * @private
	 */
	var defaults =
	{
		username: '',
		password: '',
		passwordFromPM: 'true',
		shortcutKey: '66',
		shortcutMeta: 'false',
		shortcutAlt: 'false',
		shortcutCtrl: 'true',
		shortcutShift: 'true',
		noDashboardBackground: 'false',
		showTagsIn: 'blipcast',
		markNewMessages: 'false',
		soundNewMessages: 'false',
		hideOnClick: 'false',
		useSpellchecker: 'false',
		showEmbeds: 'true',
		notifyMessages: 'false',
		notifyStatuses: 'false'
	};

	
	return {
		/**
		 * Metoda pobiera preferencję użytkownika.
		 * @param string preference Nazwa.
		 */
		get: function(preference)
		{
			var value = null;
			try
			{
				value = preferencesService.getCharPref(preference);
			}
			catch (ex)
			{
				value = defaults[preference];
			}
			
			return value;
		},
		
		/**
		 * Metoda ustawia preferencję użytkownika.
		 * @param string preference Nazwa.
		 * @param string value Wartość.
		 */
		set: function(preference, value)
		{
			return preferencesService.setCharPref(preference, value);
		},
		
		/**
		 * Metoda zwraca zapisana nazwe uzytkownika (dla zgodnosci z getPassword())
		 */
		getUsername: function()
		{
			return this.get('username');
		},
		
		/**
		 * Metoda zwraca zapisane haslo uzytkownika
		 */
		 getPassword: function()
		 {
		 	if (this.get('passwordFromPM'))
		 	{
		 		return getPasswordFromManager('blip.pl', this.getUsername());
		 	}
		 	else
		 	{
		 		return this.get('password');
		 	}
		 }
	}
})();
