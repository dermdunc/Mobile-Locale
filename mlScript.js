/* ******************************** */
/* Written by: Dermot Duncan 	    */  
/* 	    HU ID: 70857251      		*/
/*	    Email: dermduncan@gmail.com */
/* ******************************** */

// Method to retrieve the list of previous searches from local storage
function updateGUIWithPreviousSearches() {
	// Retrieve the previous searches
	var existingAddresses = getPreviousSearches();
	if (existingAddresses != null) {
		// Create an array of from the previous searches string
		var listOfPreviousSearches = existingAddresses.split(',');
		// Create a new list item to hold the previous searches
		// and loop through the previous searches array
		var $list = $('<select>').attr('class', 'previousSearchesList');
		$list.attr('id', 'previousSearchesList');
		// Add a change event handler to do a search on the selected value
		$list.change(function() {
			var selectedSearch = $("select option:selected").text();
			// If there's a valid selection update the address text box and do a search 
			if (selectedSearch != '') {
				$("#location").val(selectedSearch);
				ValidateAndProcessAddress(selectedSearch, 'address');
			}
		});
		$.each(listOfPreviousSearches, function(i, search){
			// Add the previous search to the list
			$list.append($('<option>').attr('value', search).text(search));
		});
		
		
		// Add the previous searches list to the GUI
		if ($("#previousSearchesList").length > 0) {
			$('#previousSearchesList').remove();
			$('#searches').append($list);
		}
		else {
			$('#searches').append($list);
		}
		if ($("#location").val().length > 0) {
			$("#previousSearchesList").val($("#location").val());
		}
	}
}

// Method to retrieve the list of previous searches from local storage
// Output - retrievePreviousSearches: list of previous searches or null if list is empty
function getPreviousSearches() {
	// Retrieve the list of previous searches from local storage
	var retrievePreviousSearches = localStorage.getItem('mobilelocaleSearches');
	if (retrievePreviousSearches != null) {
		
		return retrievePreviousSearches;
	}
	return null;
}

// Method to add an address to the local storage
// Inputs - address: last searched address to add to the local storage
function updateLocalStorage(address) {
	// Retrieve the current list of addresses in the local storage
	var existingAddresses = getPreviousSearches(address);
	
	var buildNewList = true;
	// Create a new address list and Add the new address to the front of the list
	var newAddresses = address.replace(/[^\w\s]/gi, '');
	
	// Check to see if there are in fact previous searches stored in local storage
	if (existingAddresses != null) {
		// Check to see if the new address has previously been searched on
		if (existingAddresses.indexOf(newAddresses) != -1) {
			// If the new search has already been searched on we don't want to
			// add a duplicate to the list of previous searches
			buildNewList = false;
		}
		
		// If we don't need to add the most recent search we don't need to build a new list
		if (buildNewList) {
			// Split the previous searches string into an array of searches
			// and loop through the array
			var listOfPreviousSearches = existingAddresses.split(',');
			$.each(listOfPreviousSearches, function(i, search){
				// Limit the number of saved searches to the last 10
				if (i < 9) {
					// Avoid adding a duplicate search
					if (newAddresses.indexOf(search) != -1) {
						// For the first value we don't want to prepend a comma
						if (newAddresses != '') {
							newAddresses = newAddresses + "," + search;
						}
						else {
							newAddresses = search;
						}
						i++;
					}
				}
			});
		}
		else {
			newAddresses = existingAddresses;
		}
	} 
	// Update local storage
	localStorage.setItem('mobilelocaleSearches',newAddresses);
	// Update the GUIs list of prior searches
	updateGUIWithPreviousSearches();

}

// ** Based on code found at http://gabesumner.com/address-validation-using-the-google-maps-api ** //
// Method to validate the address entered is valid
// Inputs - value: 		address to search on
//			lookupType: specifies whether the geocoder is going to search by address if an address is
//						specified or longitude/latitude if using the devices geo location
function ValidateAndProcessAddress(value, lookupType) {

	var CurrentAddress  = value;
    // We only want to check the address if it has been manually entered by the user
	if (lookupType.indexOf("address") != -1) {
		CurrentAddress = checkAddress(value);
	}

    // If the address is blank, then an illegal character was found and we don't want to go any further.
    if (CurrentAddress.length != 0) {	
		// Create a new Google geocoder
		var geocoder = new google.maps.Geocoder();
		// Either going to search by street address or longitude/latitude
		if (lookupType.indexOf("address") != -1) {
			geocoder.geocode({
				'address': CurrentAddress
			}, addressChecked);
		}
		else if (lookupType.indexOf("latlng") != -1) {
				geocoder.geocode({
					'latLng': CurrentAddress
				}, addressChecked);
		}
	}
}

// ** Based on code found at http://gabesumner.com/address-validation-using-the-google-maps-api ** //
// Event Handler which is called once the google lookup of the address returns
// Inputs - results: payload returned by the google geocoder api
//			status:  specifies whether the lookup returned a valid address or not
function addressChecked (results, status) {
	// The code below only gets run after a successful Google service call has completed.
        // Because this is an asynchronous call, the validator has already returned a 'true' result
        // to supress an error message and then cancelled the form submission.  The code below
        // needs to fetch the true validation from the Google service and then re-execute the
        // jQuery form validator to display the error message.  Futhermore, if the form was
        // being submitted, the code below needs to resume that submit.

        // Google reported a valid geocoded address
		if (status == google.maps.GeocoderStatus.OK) {

            // Get the formatted Google result
			// When searching on certain zip codes the formatted address cannot be used
			// with the google news service so need to build up a valid address object
            // var address = checkAddress(results[0].formatted_address);

			var zipCode = "";
			var city = "";
			var state = "";
			var country = "";
			
			// Loop through and parse the address payload
			$.each(results[0].address_components, function(i, component){
				if (component["types"] == "postal_code") {
					zipCode = component["short_name"];
				}
				if (component["types"].indexOf("locality") != -1) {
					city = component["short_name"];
				}
				if (component["types"].indexOf("administrative_area_level_1") != -1) {
					state = component["short_name"];
				}
				if (component["types"].indexOf("country") != -1) {
					country = component["short_name"];
				}
			});

			// As the formatted address can not be used for all address types we create our
			// own address. As news and weather does not vary by zip code, if a zip code is
			// available then we use this, otherwise we create an address out of the city, state
			// and country combo 
			if (zipCode != "") {
				address = zipCode;
			}
			// Some countries don't have the concept of States so a city and state are the same.
			// In this scenario we only want to use the city and country in our lookup
			else if (state.indexOf(city) != -1) {
				address = city + "+" + country;
			} 
			else {
				address = city + "+" + state + "+" + country;
			}

            // Create the YQL News url and use getJSON to retrieve the payload
            var newsUrl = createNewsUrl(address);			
			$.getJSON(newsUrl, setupNews);
			
			// Create the YQL Weather url and use getJSON to retrieve the payload		
			var weatherUrl = createWeatherUrl(address);
			$.getJSON(weatherUrl, setupWeather);

			// If case the user is just using their current location then we
			// want to store the reverse geocoded address as the last search
			if ($("#location").val().length > 0) {
				updateLocalStorage($("#location").val());
			}
			else {
				updateLocalStorage(address);
			}
			
            // Otherwise the address is invalid
        } else {
			displayError("Google could not find this address. Please try a different address");
        }

}

// Method to create yql url
// Inputs - yql: 	 yql query
// Output - fullUrl: yql url to retrieve JSONP payload
function generateYQLUrl (yql) {
	// Base URI for Web service  
	var yql_base_uri = 'http://query.yahooapis.com/v1/public/yql?q=';
	
	// Response format
	var yql_format = '%22&format=json';
	// Put the full url together
	var fullUrl = yql_base_uri + yql + yql_format;
	
	return fullUrl;
}

// Method to create google news yql url
// Inputs - address: address to use to get local news
// Output - newsUrl: yql url to retrieve google news JSONP payload
function createNewsUrl (address) {
	// Alternative method to generate url
	// var yql = 'select * from rss where url="http://news.google.com/news?geo=' + address + '"';
	// var url = generateYQLUrl(encodeURIComponent(yql));

	var newsUrl = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20rss%20where%20url%20%3D%20'http%3A%2F%2Fnews.google.com%2Fnews%3Fgeo%3D" + encodeURIComponent(address) + "%26output%3Drss'&format=json";
	return newsUrl;

}

// Method to create google news yql url
// Inputs - address: 	address to use to get local weather
// Output - weatherUrl: yql url to retrieve google weather JSONP payload
function createWeatherUrl (address) {
 	// Alternative yahoo weather api
    // var query = "SELECT item.condition FROM weather.forecast WHERE location='" + locationType + "'";
	
	// Alternative method to generate url
	// var yql = "select weather.current_conditions from xml where url = 'http://www.google.com/ig/api?weather=" + locationType + "'";
	// var url = generateYQLUrl(encodeURIComponent(address));
	
	var weatherUrl = "http://query.yahooapis.com/v1/public/yql?q=select%20weather.current_conditions%20from%20xml%20where%20url%3D'http%3A%2F%2Fwww.google.com%2Fig%2Fapi%3Fweather%3D" + encodeURIComponent(address) + "'&format=json";
	return weatherUrl;
}

// Method to check for any illegal characters entered in the address
// Inputs - address: address to check for illegal characters
// Output - address: empty string if illegal characters were found, otherwise the address passed in
function checkAddress(address) {
	// Check the address for illegal characters
	if (address.match(/[\<\>!@#\$%^&\*,]+/i)) {
		displayError('Illegal characters found! Please remove these to do a valid search');
		return '';
	}
	return address;
}

// Method to parse the weather json response and output it to the GUI
// Inputs - response: Google Weather API JSONP payload
function setupWeather(response) {
	// Check if we received any results from the google weather API
	// Note, google restricts the number or requests from a specific IP in a 24hour period
	if (response.query.count > 0) {
		// Setup some variables to hold the weather attributes
		var iconUrl = "";
		var condition = "";
		var tempC = "";
		var tempF = "";
		
		// Parse the response and pull out the required attributes
		var currentWeather = response.query.results.xml_api_reply.weather.current_conditions;
		iconUrl = ("http://google.com" + (currentWeather.icon.data));
		condition = (currentWeather.condition.data);
		tempC = (currentWeather.temp_c.data);
		wind_condition = (currentWeather.wind_condition.data);

		if ($('#weatherIcon').length > 0){
			$('#weatherIcon').remove();
		}
		
		//	Create a new image tag to hold the weather icon
		var img = new Image();	
		$(img) // once the image has loaded, execute this code
		.load(function(){
			// set the image hidden by default    
			$(this).hide();
			
			$('#weather').append(this);
			
			// fade our image in to create a nice effect
			$(this).fadeIn();
		}) // if there was an error loading the image, react accordingly
		.error(function(){
			// notify the user that the image could not be loaded
			displayError("Error loading weather image from google weather");
		})	// *finally*, set the src attribute of the new image to our image
		.attr('src', encodeURI(iconUrl))
		.attr('id', 'weatherIcon');
		
		//ToDo - Trying to use table for formatting purposes but having issues getting it
		// to appear. Will forgo the formatting for the moment
		//var $wrap = $('<div>').attr('id', 'tableWrap');
		//var $tbl = $('<table>').attr('id', 'weatherTable').attr('class', 'weatherTable')
		//$tbl.append($('<td>').append($img));
		//$tbl.append($('<td>').append($weatherList));
		//$wrap.append($tbl);
		//$('#weather').html($wrap);

		// Create a list to hold the weather attributes and populate it
		var $weatherList = $('<ul>').attr('id', 'weatherTable').attr('class', 'weatherTable');

		$weatherList.append($('<li>').text(condition));
		$weatherList.append($('<li>').text(tempC + 'C'));	
		$weatherList.append($('<li>').text(wind_condition));				

		// Remove the table from the dom if it already exists
		if ($('#weatherTable').length > 0){
			$('#weatherTable').remove();
		}

		$('#weather').append($weatherList);
	}
	else {
		displayError("The google weather API returned no results for this address");
	}
}

// Method to parse the news json response and output it to the GUI
// Inputs - response: Google News API JSONP payload
function setupNews(response) {
	// Check if we received any results from the google news API
	// Note, google restricts the number or requests from a specific IP in a 24hour period
	if (response.query.count > 0) {
		// Create a new list item to hold the news stories
		var $list = $('<ul>').attr('id', 'newsList').attr('class', 'newsList');
		// Loop through each news item and add it to the list
		$.each(response.query.results.item, function(i, item){
			var $newsItem = $('<li>')
								.click(function() {
								    window.location=$(this).find("a").attr("href");return false;
								})
								.text(item.title);
			var $newsLink = $('<a>').attr('href', item.link);
			$newsItem.append($newsLink);
			$list.append($newsItem);
		});
		// Add the news list to the news section
		$('#news').html($list);
	}
	else {
		displayError("The google news API returned no results for this address");
	}
}

// Method to lookup an address based on the devices geo location
function lookupBasedOnGeo() {
	// set some geo options
	var opts = {
	   enableHighAccuracy: true,
	   timeout: 60000,
	   maximumAge: 60000
	 };

     // perform geo lookup, but only if the geolocation object exists
     if(navigator.geolocation)
        navigator.geolocation.getCurrentPosition(processGeoAddress, geoHandler, opts);
     else
        displayError("Geolocation not supported by your browser!");
}

// Method to handle errors using devices geo location
// Inputs - err: caught error
function geoHandler(err) {
    switch(err.code) {
        case err.PERMISSION_DENIED:
            displayError("This page is not allowed to view your position. Message: " + err.message);
            break;
        case err.POSITION_UNAVAILABLE:
            displayError("Your position is not available. Message: " + err.message);
            break;
        case err.TIMEOUT:
            displayError("Timeout when determining your location.");
            break; 
        default:
            displayError("Unknown error occurred! Message: " + err.message);
     }
}

// Event handler called when use of devices geo location is successful which then parses
// the devices location and passes it on to get the news and weather for that location
// Inputs - pos: devices geo location      
function processGeoAddress(pos) {
	// Create a latlng object out of the latitude and longitude
	var latlng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
	ValidateAndProcessAddress(latlng, 'latlng');

}

// Method for outputting errors to the GUI
// Inputs - errorMsg: message to be displayed to the user
function displayError(errorMsg) {
	// Create a new paragraph attribute to hold the error message
	var $txt = $('<p>').attr('id', 'errorMsg');
	$txt.attr('class', 'errorMsg');
	$txt.text(errorMsg);
	// Add the error message to the GUI
	$('#errors').append($txt);
}

// Method for removing the error section on a clean search
function removeErrorMsg() {
	if ($("#errorMsg").length > 0) {
		$('#errorMsg').remove();
	}
}
