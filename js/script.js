"use strict";
console.log('start 3.8');

const postsWrapper = document.querySelector(".postsWrapper");
const controls = document.querySelector(".controls");
const maxItemsPerPage = 10;







function createEl(tag, className, text) {
  const element = document.createElement(tag);
  element.classList.add(className);
  element.textContent = text;
  return element;
}

function createListItem(post) {
  const wrapper = document.createDocumentFragment();
  const title = createEl("h2", "postTitle", post.title);
  const body = createEl("p", "postBody", post.body);
  const id = createEl("h3", "postId", post.id);
  wrapper.append(id);
  wrapper.append(title);
  wrapper.append(body);
  return wrapper;
}


function getPosts() {
  return fetch("https://jsonplaceholder.typicode.com/posts")
    .then(response => response.json())
    .then(response => {
      console.log("Скачал данные");
      let strResponse = JSON.stringify(response);
      localStorage.setItem("posts", strResponse);
    })
}

function drawCurrentState() {
  if (localStorage.postsState) {
    const posts = localStorage.getItem("postsState");
    const postsArr = JSON.parse(posts);
    const activePage = Math.floor(postsArr[0].id / 10);
    controls.children[activePage].classList.add("selected");
    postsArr.forEach(element => {
      postsWrapper.append(createListItem(element));
    })
  }
}

(async function drawControls() {
  await getPosts();
  const posts = JSON.parse(localStorage.getItem("posts"));
  const pagesAmount = Math.ceil(posts.length / maxItemsPerPage);
  for (let i = 1; i <= pagesAmount; i++) {
    const pageBtn = createEl("div", "page", i);
    controls.append(pageBtn);
  }
  drawCurrentState();
})();


function list(page) {
  // if (localStorage.getItem("posts") == null) {
  //   await getPosts();
  // }
  const posts = localStorage.getItem("posts");
  const parsedPosts = JSON.parse(posts);
  postsWrapper.innerHTML = "";
  const firstItem = (page - 1) * maxItemsPerPage;
  const lastItem = page * maxItemsPerPage - 1;
  const currentPostsArr = [];

  for (let i = firstItem; i <= lastItem; i++) {
    postsWrapper.append(createListItem(parsedPosts[i]));
    currentPostsArr.push(parsedPosts[i])
  }

  // console.log(currentPostsArr);
  const currentPostsString = JSON.stringify(currentPostsArr);
  localStorage.setItem("postsState", currentPostsString);
}

// list(2);
// localStorage.removeItem("postsState");
// localStorage.removeItem("posts");




// function showPostsList(page) {
//   fetch("https://jsonplaceholder.typicode.com/posts")
//     .then(response => response.json())
//     .then(response => {
//       postsWrapper.innerHTML = "";
//       const firstItem = (page - 1) * maxItemsPerPage;
//       const lastItem = page * maxItemsPerPage - 1;
//       for (let i = firstItem; i <= lastItem; i++) {
//         // console.log(response[i]);
//         postsWrapper.append(createListItem(response[i]))
//       }
//     })
// }

// showPostsList();

controls.addEventListener("click", (e) => {
  if (e.target.classList.contains("page")) {
    const controlButons = Array.from(e.currentTarget.children);
    // console.log(controlButons);
    controlButons.forEach((button) => {
      button.classList.remove("selected")
    })
    e.target.classList.add("selected");
    const currentPage = +(e.target.textContent);
    list(currentPage);
  }
})

