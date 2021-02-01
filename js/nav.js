"use strict";

/******************************************************************************
 * Handling navbar clicks and updating navbar
 */

/** Show main list of all stories when click site name */

function navAllStories(evt) {
  console.debug("navAllStories", evt);
  hidePageComponents();
  putStoriesOnPage('all');
}

$body.on("click", "#nav-all", navAllStories);

/** Show login/signup on click on "login" */

function navLoginClick(evt) {
  console.debug("navLoginClick", evt);
  hidePageComponents();
  $loginForm.show();
  $signupForm.show();
}

$navLogin.on("click", navLoginClick);

/** Show story submission form on 'submit' */

function navSubmit(evt) {
  console.debug("navSubmit");
  $storyForm.show();
}

$navSubmit.on("click", navSubmit);

/** Show list of favorites on 'favorites' */

function navFavorites(evt) {
  console.debug("navFavorites");
  hidePageComponents();
  putStoriesOnPage('favorites');
}

$navFavorites.on("click", navFavorites);

/** Show story user's own stories on 'my stories' */

function navOwn(evt) {
  console.debug("navOwn");
  hidePageComponents();
  putStoriesOnPage('own');
}

$navOwn.on("click", navOwn);

/** When a user first logins in, update the navbar to reflect that. */

function updateNavOnLogin() {
  console.debug("updateNavOnLogin");
  $(".main-nav-links").show();
  $navLogin.hide();
  $navLogOut.show();
  $navUserProfile.text(`${currentUser.username}`).show();
}
