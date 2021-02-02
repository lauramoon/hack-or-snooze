"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  // retrieves existing story data by id and returns Story object
  static async getStory(storyId) {
    const response = await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: "GET",
    });

    return new Story(response.data.story);
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() {
    try {
      const url = new URL(this.url);
      return url.hostname;
    } catch (e) {
      // console.log(e)
      return ""
    }

  }
}


/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user, newStory) {
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "POST",
      data: {
        token: user.loginToken,
        story: newStory
      }
    })

    const finishedStory = new Story(
      response.data.story
    );

    // put at top of all story list; bottom of 'my stories' list
    storyList.stories.unshift(finishedStory);
    currentUser.ownStories.push(finishedStory);

    return finishedStory;
  }
}


/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({
                username,
                name,
                createdAt,
                favorites = [],
                ownStories = []
              },
              token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    try {
      const response = await axios({
        url: `${BASE_URL}/signup`,
        method: "POST",
        data: { user: { username, password, name } },
      });
  
      const { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        response.data.token
      );
    } catch(e) {
      console.log(e);
      let alertMsg = 'unable to create account';
      if (e.response && e.response.status === 409) {
        alertMsg += ' - username already taken';
      }
      alert(alertMsg);
    }

  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    try {
      const response = await axios({
        url: `${BASE_URL}/login`,
        method: "POST",
        data: { user: { username, password } },
      });
  
      let { user } = response.data;
  
      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        response.data.token
      );
    } catch(e) {
      console.log(e);
      let alertMsg = 'unable to login';
      if (e.response) {
        if (e.response.status === 404) {
          alertMsg += ' - invalid username';
        }
        if (e.response.status === 401) {
          alertMsg += ' - password incorrect';
        }
      }
      alert(alertMsg);
    }
    
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }

  //** Update user's name and/or password */

  async updateInfo(newInfo) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${this.username}`,
        method: "PATCH",
        data: { token: this.loginToken, user: newInfo },
      });

      let { user } = response.data;

      alert('account successfully updated')

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        this.loginToken
      );
    } catch (err) {
      console.error("user account update failed", err);
      alert('account update failed')
      return null;
    }
  }

  //** Delete account */
  async deleteAccount() {
    console.log('in delete account function')
    try{
      const response = await axios({
        url: `${BASE_URL}/users/${this.username}`,
        method: "DELETE",
        data: { token: this.loginToken },
      });
      alert('account has been deleted');
    } catch(e) {
      console.log(e);
      alert('account delete unsuccessful');
    }
  }

  /** Toggle whether story is in user's favorites list */

  async toggleUserFavorite(storyId, action) {
    const method = action;
    const response = await axios({
      url: `${BASE_URL}/users/${this.username}/favorites/${storyId}`,
      method: action,
      data: {
        token: this.loginToken
      }
    })

    // if adding to favorites, add locally as well
    if (action === "POST") {
      const story = await Story.getStory(storyId);
      currentUser.favorites.push(story);
    }

    // if un-favoriting, delete from local favorites
    if (action === "DELETE") {
      currentUser.favorites = currentUser.favorites.filter((story) => story.storyId != storyId);
    }
  }

  async updateStory(storyId, updateInfo) {
    try {
      const response = await axios({
        url: `${BASE_URL}/stories/${storyId}`,
        method: "PATCH",
        data: {
          token: this.loginToken,
          story: updateInfo
        }
      })
      // console.log(response)
  
      const updatedStory = new Story(response.data.story);
  
      // update local list.
      currentUser.ownStories = currentUser.ownStories.map((story) => {
        return (story.storyId != storyId) ? story : updatedStory;
      });
      currentUser.favorites = currentUser.favorites.map((story) => {
        return (story.storyId != storyId) ? story : updatedStory;
      });
      storyList.stories = storyList.stories.map((story) => {
        return (story.storyId != storyId) ? story : updatedStory;
      });
    } catch(e) {
      console.log(e);
      alert('unable to update story');
    }
  }

  async deleteStory(storyId) {
    const response = await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: "DELETE",
      data: {
        token: this.loginToken
      }
    })
    // console.log(response)

    // delete from each local list
    currentUser.ownStories = currentUser.ownStories.filter((story) => story.storyId != storyId);
    currentUser.favorites = currentUser.favorites.filter((story) => story.storyId != storyId);
    storyList.stories = storyList.stories.filter((story) => story.storyId != storyId);
  }
}
