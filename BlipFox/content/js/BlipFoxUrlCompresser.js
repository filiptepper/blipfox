/**
 * Copyright (c) 2009 Kacper Kwapisz (KKKas)
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

const IS_GD_API_URL = 'http://is.gd/api.php?longurl=';

function BlipFoxUrlCompresser()
{

	this.sendGetRequest = function(url, callback, param)
	{
		var request = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);

		request.open('GET', url, true);
		request.onreadystatechange = function()
		{
 			
			try
			{
				if (request.readyState == 4 && request.status == 200)
				{
					if (typeof callback.success === 'function')
					{
						callback.success.call(BlipFox, request, param);
					}
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
			};
		}		
		
		request.send(null);	
	},
	
	this.compressUrl = function(url, callback)
	{
		return this.sendGetRequest(IS_GD_API_URL + url, callback, url);
	}
}