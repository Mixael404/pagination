"use strict";
console.log('start 3.8');


//   <<   <  14 15 [16] 17 18   >   >>
//   <<   <  [1] 2 3   >   >>
// 

class Pagination {
  constructor(config) {
    this.root = document.querySelector(config.wrapper);
    this.postsWrapper = this.root.querySelector(".postsWrapper")
  }
}

// localStorage.removeItem("newPosts");
function pagination() {

  const postsWrapper = document.querySelector(".postsWrapper");
  const controls = document.querySelector(".controls");
  const arrows = document.querySelector(".arrows");
  const maxItemsPerPage = 8;
  const maxButtonsInControlPanel = 5;
  let totalPosts = 100;
  const maxTab = Math.ceil(totalPosts / maxItemsPerPage);


  // 1 - 8   <=======================
  // 9 - 16

  // 11 - 8 = chunck[3]
  // smallIndex = 3
  // newIndex = (currentPage - 1) * pageLimit + smallIndex
  // data[newIndex] = chunck[3] 
  // 31, 32.....64, 65, 64..... 102, 103

  // 17 - 24
  // ....

  // this = {}

  // const state = {
  //   pageLimit: 20,
  //   totalLength: 500,
  //   totalLoaded: 360,
  //   currentPage: 3,
  // };

  // state.pagesAmount = state.totalLength / state.pageLimit;



  // initial value
  // current value
  // saved value -> ls

  // look saved value
  // initial value

  // curent value (null == state.END) -> savedState.END -> initilState.END
  // curent value (null == state.END) -> savedState -> initilState


  // TODO: rename function
  function createListItem(post) {
    if (!post) {
      return "";
    }
    const wrapper = document.createDocumentFragment();
    const title = createEl("h2", "postTitle", post.title);
    const body = createEl("p", "postBody", post.body);
    const id = createEl("h3", "postId", post.id);
    wrapper.append(id);
    wrapper.append(title);
    wrapper.append(body);
    return wrapper;
  }


  function getPosts(page) {
    return fetch(`https://jsonplaceholder.typicode.com/posts?_page=${page}&_limit=${maxItemsPerPage}`)
      // .then(response => console.log(response.headers))
      .then(response => response.json())
      .then(response => {
        // TODO: уменьшить функцию (разбить на мелкие функции)
        // console.trace("Скачал данные");
        let strResponse = JSON.stringify(response);

        let state = JSON.parse(localStorage.getItem("newPosts"));
        if (state === null) {
          state = [];
        }

        const hasObj = state.findIndex((obj) => {
          if (obj.id === response[0].id) {
            return true;
          }
        });
        if (hasObj !== -1) {
          localStorage.setItem("End", false);
          return
        }
        state.push(...response);
        state.sort((a, b) => a.id > b.id ? 1 : -1);
        const strState = JSON.stringify(state);
        localStorage.setItem("newPosts", strState);


        localStorage.setItem("posts", strResponse);
        localStorage.setItem("postsState", strResponse);

      })
  }

  // 
  function drawCurrentState(destination) {
    if (localStorage.postsState) {
      postsWrapper.innerHTML = "";
      const posts = localStorage.getItem("postsState");
      const postsArr = JSON.parse(posts);
      if (destination === "forward") {
        controls.children[0].classList.add("selected");
      }
      if (destination === "back") {
        controls.lastChild.classList.add("selected");
      }
      postsArr.forEach(element => {
        postsWrapper.append(createListItem(element));
      })
    }
  }

  /**
 * Represents buttons of paginatio 
 * @param {number} first - First btn index
 * @param {"forward" | "back"} destination - direction of drawing
 * @param {boolean} start - Is draw after now page loaded
 */
  async function drawControls(first, destination, start) {
    if (destination !== "back" && !start) {
      await getPosts(first);
    }
    localStorage.setItem("End", false);
    controls.innerHTML = "";
    const last = first + 4;
    const posts = JSON.parse(localStorage.getItem("posts"));
    const pagesAmount = Math.ceil(posts.length / maxItemsPerPage);
    for (let i = first; i <= last; i++) {
      const pageBtn = createEl("div", "page", i);
      controls.append(pageBtn);
      if (i === maxTab) {
        break;
      }
    }
    drawCurrentState(destination);
  };
  // Реализовать функцию отрисовки панели управления от начального стейта
  // Взять текущий стейт
  // По последнему посту понять раскладку (разделить на кол-во постов на одной странице)
  // Рассчитать, с какой раскладки должно начинаться
  // Запустить drawControls как ниже, вместо 1 поставить рассчитанную раскладку
  drawControls(1, "forward", true);

  async function list(page) {
    let state = JSON.parse(localStorage.getItem("newPosts"));
    const nextFirstItemId = (page - 1) * maxItemsPerPage + 1;
    if (state === null) {
      state = [];
    }

    // Сделать проверку без цикла, только по первому элементу
    let hasObj = state.findIndex((obj) => {
      if (obj.id == nextFirstItemId) {
        return true
      }
    })


    if (hasObj != -1) {
      localStorage.setItem("End", false);
      const postsToShow = [];
      for (let i = nextFirstItemId; i < nextFirstItemId + maxItemsPerPage; i++) {
        postsToShow.push(state[i - 1]);
      }
      const strPosts = JSON.stringify(postsToShow);
      localStorage.setItem("postsState", strPosts);
      postsWrapper.innerHTML = "";
      for (let i = 0; i < postsToShow.length; i++) {
        postsWrapper.append(createListItem(postsToShow[i]));
      }
    } else {
      await getPosts(page);
      const posts = localStorage.getItem("posts");
      const parsedPosts = JSON.parse(posts);
      postsWrapper.innerHTML = "";
      const currentPostsArr = [];

      for (let i = 0; i < parsedPosts.length; i++) {
        postsWrapper.append(createListItem(parsedPosts[i]));
        currentPostsArr.push(parsedPosts[i])
      }

      // console.log(currentPostsArr);
      const currentPostsString = JSON.stringify(currentPostsArr);
      localStorage.setItem("postsState", currentPostsString);
    }




  }


  controls.addEventListener("click", e => {
    if (e.target.classList.contains("page")) {
      console.log("Нажал на кружочек");
      const arrControls = Array.from(controls.children);
      const newActiveTwo = arrControls.indexOf(e.target);
      // console.log(newActiveTwo);
      const currentPage = +(e.target.textContent);
      changeActiveBtn(newActiveTwo);
      list(currentPage);
    }
  })



  arrows.addEventListener("click", arrowsTab);

  async function arrowsTab(e) {
    if (e.target.classList.contains("arrow")) {
      const posts = localStorage.getItem("postsState");
      const postsArr = JSON.parse(posts);
      const controlButons = Array.from(controls.children);
      const currentBtn = controlButons.findIndex((button) => {
        if (button.classList.contains("selected")) {
          return true;
        }
      })
      const newActiveTwo = +(controlButons[currentBtn].textContent);

      if (e.target.id == "forward") {
        if (newActiveTwo == maxTab) {
          nextControlsPage();
          return;
        }

        await list(newActiveTwo + 1);
        changeActiveBtn(currentBtn + 1);
      }


      if (e.target.id == "back") {
        if (currentBtn == 0) {
          previosControlsPage();
          return;
        }
        changeActiveBtn(currentBtn - 1)
        console.log(newActiveTwo);
        list(newActiveTwo - 1);
      }
    }
  }


  function changeActiveBtn(newActive) {
    const controlButons = Array.from(controls.children);
    controlButons.forEach((button) => {
      button.classList.remove("selected")
    })
    controlButons[newActive].classList.add("selected");
  }


  async function nextControlsPage() {
    let thisPaginationPage = +(controls.lastChild.textContent);
    console.log(thisPaginationPage);
    console.log(maxTab);
    if (maxTab <= thisPaginationPage) {
      console.log("Дальше кнопок нет!");
      return;
    }
    await list(thisPaginationPage + 1);
    drawControls(thisPaginationPage + 1, "forward");
  }


  next.addEventListener("click", nextControlsPage);



  async function previosControlsPage() {
    if (controls.firstChild.textContent == "1") {
      console.log("End");
      return;
    }
    let thisPaginationPage = +(controls.firstChild.textContent);
    console.log(thisPaginationPage);
    await getPosts(thisPaginationPage - 1);
    await list(thisPaginationPage - 1);
    drawControls(thisPaginationPage - 5, "back");
  }


  previos.addEventListener("click", previosControlsPage);

}

const URL1 = `https://jsonplaceholder.typicode.com/posts?_page=1&_limit=20`;
// const URL2 = `https://jsonplaceholder.typicode.com/comments?_page=1&_limit=20`;
pagination(URL1);
// pagination(URL2);

// Как сделать скачивание сразу нескольких страниц?
// Сохранять все посты из раскладки
//





// TODO сделать динамическое скачивание вкладки на основе функции ниже

// const arr = [];

// async function test(id) {
// const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`)
// const parsedRes = await response.json();
// console.log(parsedRes);
// return parsedRes;
// };

// async function getData(){
//   for(let i = 1; i <= 7; i++){
//     let post = await test(i);
//     arr.push(post);
//   }
// }

// getData();
// console.log(arr);







// pagination();
// // pagination();

// const pariInctance = new Pari();


// const betInstance = new Bet(params);

// betInstance.doBet = function() {
//   // this.bet;
//   pariInctance.add(this.bet)
// }

// window.addEventListener('click', betInstance.doBet)

// const myP = new Pagination();
// const myPag = new Pagination();

// myP.nextPage();
// myP.reset();
// myP.dataLength;

// const dan:human = {
//   age: 23,
//   name: "Danil",
//   isMarried: true
// }

// const car = {
//   age: 40,
//   model: "BWM"
// }

// type human {
//   age: number,
//   name: string,
//   isMarried: Boolean,
// }