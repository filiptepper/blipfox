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

window.addEventListener('load', function(e)
{
  BlipFox.Application.onLoad(e);
}, false);

window.addEventListener('keydown', function(e)
{
  var shortcutPreferences = BlipFox.Helpers.getShortcutPreferences();
  if (e.shiftKey === shortcutPreferences.shiftKey && e.ctrlKey === shortcutPreferences.shiftKey && e.altKey === shortcutPreferences.altKey && e.metaKey === shortcutPreferences.metaKey && e.keyCode == shortcutPreferences.keyCode)
  {
    BlipFox.Application.togglePopup();
  }
}, false);

window.addEventListener('click', function(e)
{
  if (BlipFoxPreferencesManager.get('hideOnClick') == 'true' && BlipFox.Application.checkStatus(BlipFox.Status.VISIBLE) === true && BlipFox.Application.checkStatus(BlipFox.Status.INITIALIZED) === true)
  {
    var panel = window.document.getElementById('blipfox-panel').boxObject;

    /* Zabezpieczenie przed ukrywaniem okienka podczas akcji. */
    if (e.screenX < panel.screenX || e.screenX > panel.screenX + panel.width || e.screenY < panel.screenY || e.screenY > panel.screenY + panel.height)
    {
      if (e.target.id != 'blipfox-text-context-copyToClipboard' && e.target.id != 'blipfox-permalink-context-copyToClipboard' && e.target.id != 'blipfox-link-context-copyToClipboard')
      {
        BlipFox.Application.togglePopup();
      }
    }
  }
}, false);