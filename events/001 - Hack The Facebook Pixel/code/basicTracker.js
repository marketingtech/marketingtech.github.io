/**************************
**
** Explanation of what we are doing here:
** 1. Every day a user visits our site, we store it in a cookie. That cookie is an array of Julian Days
**    Here's what julian days are: https://en.wikipedia.org/wiki/Julian_day
**
** 2. We then check to see if they've visited the minimum number of days. If they have, we add them to our Facebook audience
**    More details on Facebook's Tag API here: https://developers.facebook.com/docs/ads-for-websites/tag-api
**
** 3. We clean out the cookie, and resave it (removing old data)
**
** In the end, we want to be able to add the following code and it will automatically add someone to
** our Facebook audience if they are a frquent visitor:
**
** frequentVisitorTracker( expire = 186, min_num_days = 2, first_time_days = 180 );
**
***************************/

// Date info that we'll need to use later
var todayJulian = Math.floor(new Date().getTime()/86400000 + 2440587.5); //get Julian counterpart

// Have a way to save the cookie to the user's browser
function saveCookie(name, value, days) {
    var date, expires;
    if (days) {
        date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        expires = "; expires="+date.toGMTString();
    } else {
        expires = "";
    }
    document.cookie = name+"="+value+expires+"; path=/";
}

// The tracker function
function frequentVisitorTracker(expire, min_num_days, first_time_days){
  // 1. Every time a user visits our site, we store it in a cookie
  /*****
  **
  ** COOKIE CODE!!
  **
  ******/
  var COOKIE_NAME = '_fbtcookie';

  // Tracker is an array of Julian days that the user has visited
  // We will store it as JSON in a cookie
  var tracker = [];
  var cookieRegex = new RegExp( COOKIE_NAME + '=([^;]+)' );
  var result = document.cookie.match( cookieRegex );
	if( result ){
    // If they do, get the data
    tracker = JSON.parse(result[1]);
  }
  // Add today to the visits tracker
  tracker.push(todayJulian);

  /*****
  **
  ** Check to see if they visited the minimum number of times
  **
  ******/
  var isFrequentVisitor = true;
  // Make sure the first time they visited was at least first_time_days ago
  var first_day = parseInt(tracker[0],10);
  if( todayJulian - first_day < first_time_days ) {
    isFrequentVisitor = false;
  }

  // Make sure they've visited the minimum required days
  if( tracker.length < min_num_days ) {
    isFrequentVisitor = false;
  }

  if( isFrequentVisitor === true ) {
    // Add them to our custom audience
    fbq('trackCustom', 'BecameFrequentVisitor', {
      min_num_days: min_num_days,
      first_time_days: first_time_days,
      expire: expire });
  }

  /*****
  **
  ** Clean out the cookie and re-save it
  **
  ******/

  // Remove any days older than `expire`
  for( var i = 0; i < tracker.length; i++ ){
    var day = parseInt(tracker[i]);
    // If the day is past the max number of days we are tracking, remove it!
    if( day < todayJulian - expire )
      tracker.splice(i,1);
  }

  // Save the cookie
  saveCookie( COOKIE_NAME, JSON.stringify(tracker), expire );
}
