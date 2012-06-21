Mobile-Locale
=============
This is a mobile app which returns the weather and local news based on a users gps location or a specified location.

************************************************************************
- Index.html: includes the HTML5 skeleton for the app
************************************************************************

	- validated using validator.w3.org at 
	 http://validator.w3.org/check?uri=http%3A%2F%2Fmorpheus.dce.harvard.edu%2F%7Edduncan%2FMobileApps%2FMobileLocale%2Findex.html&charset=%28detect+automatically%29&doctype=Inline&group=0

************************************************************************	
- mlScript.js: includes the majority of the javascript used in the app
************************************************************************

A rough workflow of the code is as follows
	- New Search
		ValidateAndProcessAddress
			-> addressChecked
				-> createNewsUrl
				-> setupNews
				-> createWeatherUrl
				-> setupWeather
				-> updateLocalStorage
					-> getPreviousSearches
					-> updateGUIWithPreviousSearches
					
	- Search By Geo Location
		lookupBasedOnGeo
			-> processGeoAddress
				-> ValidateAndProcessAddress
				-> *continues as above*
				
	- Get list of previous searches
		updateGUIWithPreviousSearches
		 -> getPreviousSearches
		
************************************************************************
- mlCss.cs: includes the limited styling used on the app
************************************************************************

The application is available online at

http://morpheus.dce.harvard.edu/~dduncan/MobileApps/MobileLocale/