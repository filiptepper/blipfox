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

BlipFox.EventUtilities = (function()
{
  /* Metody publiczne. */
  return {
    /**
     * Stała określająca lewy przycisk myszki.
     * @const
     */
    LEFT_MOUSE_BUTTON: 1,

    /**
     * Stała określająca prawy przycisk myszki.
     * @const
     */
    RIGHT_MOUSE_BUTTON: 2,

    /**
     * Funkcja zwraca przycisk myszy związany z przekazanym zdarzeniem.
     * @param Event e Obiekt Event JavaScript.
     * @return integer Przycisk myszy określony przez stałą lub null.
     * @public
     */
    getMouseButton: function(e)
    {
      switch (e.button)
      {
        case 0:
          return BlipFox.EventUtilities.LEFT_MOUSE_BUTTON;
          break;
        case 2:
          return BlipFox.EventUtilities.RIGHT_MOUSE_BUTTON;
          break;
      }

      return null;
    }
  }
})();
