"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage('all');
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, star, own) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  let starSpan = "";
  let editSpan = "";

  if (star != "none") {
    const starStyle = (star === "solid") ? 'fas' : 'far';
    starSpan = `
      <span class="star">
      <i class="fa-star ${starStyle}"></i> 
      </span>
      `
  }

  if (own) {
    editSpan = `
    <span class="story-update">
    <i class="fas fa-pencil-alt"></i>
    </span>
    <span class="story-delete">
    <i class="fas fa-trash-alt"></i> 
    </span>
    `
  }

  return $(`
      <li id="${story.storyId}">
        ${starSpan}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        ${editSpan}
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage(whichList) {
  console.debug("putStoriesOnPage - ", whichList);

  $allStoriesList.empty();

  let list;
  // determine which story list to use
  if (whichList === 'favorites') {
    list = currentUser.favorites;
  } else if (whichList === 'own') {
    list = currentUser.ownStories;
  } else {
    list = storyList.stories
  }

  // if user is logged in, get list of ids of favorite stories
  const favoriteIds = (currentUser) ? currentUser.favorites.map((obj) =>  obj.storyId) : "";
  const ownIds = (currentUser) ? currentUser.ownStories.map((obj) => obj.storyId) : "";

  // loop through all of our stories and generate HTML for them
  for (let story of list) {
    // determine if star needed and if so, which one
    let star;
    let own;
    if (currentUser) {
      star = (favoriteIds.includes(story.storyId)) ? 'solid' : 'empty';
      own = (ownIds.includes(story.storyId)) ? true : false;
    } else {
      star = 'none';
      own = false;
    }
    const $story = generateStoryMarkup(story, star, own)
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

/** Handles new story submission, adds the new story to the story list, puts it on the page */

async function storySubmission(evt) {
  console.debug("storySubmission");
  evt.preventDefault();

  const title = $("#submit-title").val();
  const author = $("#submit-author").val();
  const url = $('#submit-url').val();

  const newStory = await storyList.addStory(currentUser, { 
    title: title, 
    author: author, 
    url: url 
  });

  $storyForm.trigger("reset");
  $storyForm.hide();
  putStoriesOnPage('all');
}

$storyForm.on('submit', storySubmission);

$('#cancel-story').on('click', () => {
  $storyForm.trigger("reset");
  $storyForm.hide();
  });

async function storyUpdate(evt) {
  console.debug("storyUpdate", evt);
  evt.preventDefault();

  const title = $("#update-title").val();
  const author = $("#update-author").val();
  const url = $('#update-url').val();
  const storyId = $('#update-title').parent().attr('id');

  const updatedStory = await currentUser.updateStory(storyId, { 
    title: title, 
    author: author, 
    url: url 
  });
  // console.log(updatedStory);

  $updateForm.trigger("reset");
  $updateForm.hide();
  putStoriesOnPage('all');
}

$updateForm.on('submit', storyUpdate);

$('#cancel-update').on('click', () => {
  $updateForm.trigger("reset");
  $updateForm.hide();
  });

async function handleClick(evt) {
  const $target = $(evt.target)
  if ($target.hasClass('fa-pencil-alt')) {
    console.log("handleClick - update");
    const storyId = $target.parent().parent().attr('id');
    const story = await Story.getStory(storyId);
    $("#update-title").val(story.title);
    $("#update-author").val(story.author);
    $('#update-url').val(story.url);
    $('#update-title').parent().attr('id', storyId);
    $updateForm.show();
  }
  if ($target.hasClass('fa-trash-alt')) {
    console.debug("handleClick - trash");
    const storyId = $target.parent().parent().attr('id');
    let choice = confirm("Are you sure you want to delete that story?");
    if (choice) {
      await currentUser.deleteStory(storyId);
      $target.parent().parent().remove();
    }
  }
  if ($target.hasClass('fa-star')) {
    console.debug("handleClick - star");
    const storyId = $target.parent().parent().attr('id');
    const method = ($target.hasClass('fas')) ? "DELETE" : "POST";
    await currentUser.toggleUserFavorite(storyId, method);
    $target.toggleClass("fas far");
  }
}

$body.on('click', handleClick);