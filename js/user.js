"use strict";

// global to hold the User instance of the currently-logged-in user
let currentUser;

/******************************************************************************
 * User login/signup/login
 */

/** Handle login form submission. If login ok, sets up the user instance */

async function login(evt) {
  console.debug("login", evt);
  evt.preventDefault();

  // grab the username and password
  const username = $("#login-username").val();
  const password = $("#login-password").val();

  // User.login retrieves user info from API and returns User instance
  // which we'll make the globally-available, logged-in user.
  currentUser = await User.login(username, password);

  $loginForm.trigger("reset");

  if (currentUser) {
    saveUserCredentialsInLocalStorage();
    updateUIOnUserLogin();
  }
}

$loginForm.on("submit", login);

/** Handle signup form submission. */

async function signup(evt) {
  console.debug("signup", evt);
  evt.preventDefault();

  const name = $("#signup-name").val();
  const username = $("#signup-username").val();
  const password = $("#signup-password").val();

  // User.signup retrieves user info from API and returns User instance
  // which we'll make the globally-available, logged-in user.
  currentUser = await User.signup(username, password, name);

  if (currentUser) {
    saveUserCredentialsInLocalStorage();
    updateUIOnUserLogin();
  }

  $signupForm.trigger("reset");
}

$signupForm.on("submit", signup);

/** Handle click of logout button
 *
 * Remove their credentials from localStorage and refresh page
 */

function logout(evt) {
  console.debug("logout", evt);
  localStorage.clear();
  location.reload();
}

$navLogOut.on("click", logout);

/******************************************************************************
 * Storing/recalling previously-logged-in-user with localStorage
 */

/** If there are user credentials in local storage, use those to log in
 * that user. This is meant to be called on page load, just once.
 */

async function checkForRememberedUser() {
  console.debug("checkForRememberedUser");
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  if (!token || !username) return false;

  // try to log in with these credentials (will be null if login failed)
  currentUser = await User.loginViaStoredCredentials(token, username);
}

/** Sync current user information to localStorage.
 *
 * We store the username/token in localStorage so when the page is refreshed
 * (or the user revisits the site later), they will still be logged in.
 */

function saveUserCredentialsInLocalStorage() {
  console.debug("saveUserCredentialsInLocalStorage");
  if (currentUser) {
    localStorage.setItem("token", currentUser.loginToken);
    localStorage.setItem("username", currentUser.username);
  }
}

/*********************************************************************************
 * Update user info and delete user account
 * 
/** Update user name or password */

async function updateUserInfo(evt) {
  console.debug("updateUserInfo");
  evt.preventDefault();

  const newInfo = { }
  const name = $("#user-name").val();
  const password = $("#user-password").val();

  if (name != '' || password != '') {
    if (name != '') {
      newInfo.name = name;
    }
    if (password != '') {
      newInfo.password = password;
    }
  
    currentUser = await currentUser.updateInfo(newInfo);
  
    if (currentUser) {
      updateUIOnUserLogin();
    }
  
    $userForm.trigger("reset");
  } else {
    alert('No new name or new password found')
  }
}

$userForm.on("submit", updateUserInfo);

/** Delete user account */

async function deleteUserRequested(evt) {
  console.debug("deleteUserRequested");
  evt.preventDefault();

  let choice = confirm('Are you sure you want to delete your account? This action cannot be undone.')

  if (choice) {
    await currentUser.deleteAccount();
    console.log('testing logout');
    localStorage.clear();
    location.reload();
  }
}

$userDeleteForm.on('submit', deleteUserRequested)

/******************************************************************************
 * General UI stuff about users
 */

/** When a user signs up or registers, we want to set up the UI for them:
 *
 * - show the stories list
 * - update nav bar options for logged-in user
 * - generate the user profile part of the page
 */

function updateUIOnUserLogin() {
  console.debug("updateUIOnUserLogin");
  hidePageComponents();
  putStoriesOnPage('all');
  updateUserInfoDisplay();
  updateNavOnLogin();
}

function updateUserInfoDisplay() {
  $userInfo.empty();
  if (currentUser) {
    const {username, name } = currentUser;
    const content = `
    <h4>Your Profile: </h4>
    <ul>
      <li>
        username: ${username}
      </li>
      <li>
        name: ${name}
      </li>
    </ul>
    <hr>
  `
  $userInfo.append(content);
  }
}

$('#cancel-update-profile').on('click', () => {
  console.debug("cancel update profile");
  $userForm.trigger('reset');
  hidePageComponents();
  putStoriesOnPage('all');
})

