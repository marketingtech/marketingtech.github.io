// Facebook Pixel reference: https://developers.facebook.com/docs/ads-for-websites/tag-api

/**************************
**
** Explanation of what we are doing here:
** 1. Every time a user visits our site, we store it in a cookie
** 2. We then check to see if they've visited the minimum number of times. If they have, we add them to our Facebook audience
** 3. We clean out the cookie, and resave it (removing old data)
**
***************************/

// We wrap our code in an anonymous function to avoid namespace clashes
(function(){
	// We've added a julian date function to calculate what days a visitor comes to the site
	// More on the julian calendar here: https://en.wikipedia.org/wiki/Julian_day
	Date.prototype.getJulian = function() {
		return Math.floor((this / 86400000) - (this.getTimezoneOffset()/1440) + 2440587.5);
	};

	var today = new Date(); //set any date
	var todayJulian = today.getJulian(); //get Julian counterpart

	//
	var Tracker = {
		init: function(opts){
			// Validate and initialize options
			if( typeof opts != "object" ) // Here we are ensuring that the argument passed is an object
				return false;

			// Verify that the Facebook pixel ID was passed
			if(!("facebook_pixel" in opts))
				return false;

			// Set the default options (will be available via this.opts)
			this.initOpts( opts );

			// Initialize tracker object (will be available via this.tracker)
			this.initTracker.bind(this);

			// Run the tracker
			this.runTracker.bind(this);
		},

		initTracker: function(){
			// Set this.tracker to an empty array by default
			this.tracker = [];

			// Check to see if the user has been cookied before
			var cookieRegex = new RegExp( this.opts.cookie_name + '=([^;]+)' );
			var result = document.cookie.match( cookieRegex );

			// If they have been cookied, get the information
			if( result ) {
				// TODO: Verify that it's JSON
				// One option: result && (result = JSON.parse(result[1]));
				// Assign the value
				this.tracker = JSON.parse(result[1]);
			}
		},

		runTracker: function(){
			// Track the page view
			this.trackPageview();

			// Remove expired data
			this.cleanTracker();

			// Save the cleaned data to the cookie
			this.saveCookie();

			// If the user is a frequent visitor, trigger the Facebook pixel
			if( this.isFrequentVisitor() )
			{
				this.remarketWithPixel( this.opts.facebook_pixel );
			}
		},

		// This function sets the default options for the tracker
		initOpts: function( opts ){
			this.opts = {
				cookie_name: ("cookie_name" in opts) ? opts.cookie_name : "_vft",
				// expire: this.getNumOption('expire', opts.expire, 30),
				expire: ( parseInt(opts.expire,10) && "expire" in opts ) ? parseInt(opts.expire,10) : 30,
				min_num_days: (parseInt(opts.min_num_days,10) && "min_num_days" in opts) ? parseInt(opts.min_num_days,10) : 3,
				first_time_days: (parseInt(opts.first_time_days,10) && 'first_time_days' in opts) ? parseInt(opts.first_time_days,10) : 0
			};
		},

		// getNumOption: function( key, val, defaultVal ){
		// 	return ( parseInt(val,10) && key in opts ) ? parseInt(val,10) : defaultVal;
		// },

		// Write the cookie to the user's browser
		saveCookie: function(){
      var date = new Date();
      date.setTime(date.getTime()+(this.opts.expires*24*60*60*1000));
      expires = "; expires="+date.toGMTString();
	    
	    document.cookie = this.opts.cookie_name + "=" + JSON.stringify( this.tracker ) + expires + "; path=/";
		},

		// Remove old data (expired days)
		cleanTracker: function(){
			for( var i = 0; i < this.tracker.length; i++ ){
				var day = parseInt(this.tracker[i]);
				// If the day is past the max number of days we are tracking, remove it!
				if( day < todayJulian - this.opts.expire )
					this.tracker.splice(i,1);
			}
		},

		// Add today to the array if it isn't already in it
		trackPageview: function(){
			if( this.tracker.indexOf(todayJulian) === -1 ) {
				this.tracker.push(todayJulian);
			}
		},

		remarketWithPixel: function(){
			// !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
			// n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
			// n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
			// t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
			// document,'script','//connect.facebook.net/en_US/fbevents.js');
			// Insert Your Facebook Pixel ID below.
			// fbq('init', pixel);
			fbq('trackCustom', 'BecameFrequentVisitor', {
				cookie_name: this.opts.cookie_name,
				min_num_days: this.opts.min_num_days,
				first_time_days: this.opts.first_time_days,
				expire: this.opts.expire });
		},

		isFrequentVisitor: function(){
			// var days = this.tracker.sort(function(a,b){return parseInt(a,10)-parseInt(b,10);});

			// Make sure the first time they visited was at least first_time_days ago
			var first_day = parseInt(this.tracker[0],10);
			if( todayJulian - first_day > this.opts.first_time_days ) {
				return false;
			}

			// Make sure they've visited the minimum required times
			if( this.tracker.length < this.opts.min_num_visits ) {
				return false;
			}

			return true;
		}
	};

	window.FrequentVisitorTracker = Tracker;
})();

//Consider frequent if they visited over 6 months ago and are visiting now
// FrequentVisitorTracker.init({
// 	expire: 186, // keep for 186 days so we have 6 months of visitrs tracked
// 	min_num_days: 2, // visited on two separate days
// 	first_time_days: 180 //Visited at least 180 days ago
// });
