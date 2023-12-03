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
  const maxItemsPerPage = 10;
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
      .then(response => response.json())
      .then(response => {
        let state = JSON.parse(localStorage.getItem("newPosts"));

        if (state === null) {
          state = [];
        }

        state.push(...response);
        state.sort((a, b) => a.id > b.id ? 1 : -1);
        const strState = JSON.stringify(state);
        localStorage.setItem("newPosts", strState);
      })
  }

  // 
  function drawCurrentState(destination, activeBtn) {
    if (localStorage.postsState) {
      postsWrapper.innerHTML = "";
      const posts = localStorage.getItem("postsState");
      const postsArr = JSON.parse(posts);
      if (activeBtn) {
        controls.children[activeBtn - 1].classList.add("selected");
      } else if (destination === "forward") {
        controls.children[0].classList.add("selected");
      } else if (destination === "back") {
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
 * @param {number} index - Which button to make "selected"
 */
  async function drawControls(first, destination, activeBtn) {
    controls.innerHTML = "";
    const last = first + 4;
    for (let i = first; i <= last; i++) {
      const pageBtn = createEl("div", "page", i);
      controls.append(pageBtn);
      if (i === maxTab) {
        break;
      }
    }
    drawCurrentState(destination, activeBtn);
  };

  function firstInit(){
    return fetch(`https://jsonplaceholder.typicode.com/posts?_page=1&_limit=${maxItemsPerPage}`)
      .then(response => response.json())
      .then((response) => {
        const strResponse = JSON.stringify(response);
        localStorage.setItem("postsState", strResponse);
        localStorage.setItem("newPosts", strResponse);
      })
  }

  async function drawCurrentControls() {
    if(!localStorage.getItem("postsState")){
      await firstInit();
    }
    const currentState = JSON.parse(localStorage.getItem("postsState"));
    const currentPage = currentState[maxItemsPerPage - 1].id / maxItemsPerPage;
    let firstPage;
    let currentIndex;
    if (currentPage <= 5) {
      currentIndex = currentPage;
      firstPage = 1;
    } else {
      currentIndex = currentPage % maxButtonsInControlPanel;
      firstPage = currentPage - currentIndex + 1;
    }
    drawControls(firstPage, "", currentIndex);
  }

  drawCurrentControls();


  // Реализовать функцию отрисовки панели управления от начального стейта
  // Взять текущий стейт
  // По последнему посту понять раскладку (разделить на кол-во постов на одной странице)
  // Рассчитать, с какой раскладки должно начинаться
  // Запустить drawControls как ниже, вместо 1 поставить рассчитанную раскладку
  // drawControls(1, "forward", true);



  function checkStateOnNextObject(arr, itemId) {
    let res = arr.some((obj) => {
      if (obj.id === itemId) {
        return true
      }
    })
    return res;
  }

  function drawPosts(state, nextItem) {
    const postsToShow = getNecesaryPostsFromState(state, nextItem);

    const strPosts = JSON.stringify(postsToShow);
    localStorage.setItem("postsState", strPosts);

    postsWrapper.innerHTML = "";

    for (let i = 0; i < postsToShow.length; i++) {
      postsWrapper.append(createListItem(postsToShow[i]));
    }
  }


  function getNecesaryPostsFromState(state, nextItem) {
    const postsToShow = [];
    for (let i = nextItem; i < nextItem + maxItemsPerPage; i++) {
      postsToShow.push(state[i - 1]);
    }
    return postsToShow;
  }



  async function list(page) {
    let state = JSON.parse(localStorage.getItem("newPosts"));
    const nextFirstItemId = (page - 1) * maxItemsPerPage + 1;
    if (state === null) {
      state = [];
    }

    let hasObj = checkStateOnNextObject(state, nextFirstItemId);

    if (hasObj) {
      drawPosts(state, nextFirstItemId);
    } else {
      await getPosts(page);
      const newState = JSON.parse(localStorage.getItem("newPosts"));
      drawPosts(newState, nextFirstItemId);
    }




  }


  controls.addEventListener("click", e => {
    if (e.target.classList.contains("page")) {
      const arrControls = Array.from(controls.children);
      const newActiveTwo = arrControls.indexOf(e.target);
      const currentPage = +(e.target.textContent);
      changeActiveBtn(newActiveTwo);
      list(currentPage);
    }
  })


  arrows.addEventListener("click", arrowsTab);


  function findActiveBtn(controlButons) {
    const currentBtn = controlButons.findIndex((button) => {
      if (button.classList.contains("selected")) {
        return true;
      }
    })
    return currentBtn;
  }

  async function arrowsTab(e) {
    if (e.target.classList.contains("arrow")) {
      const controlButons = Array.from(controls.children);
      const activeBtnId = findActiveBtn(controlButons);
      const activeBtn = +(controlButons[activeBtnId].textContent);

      if (e.target.id == "forward") {
        if (activeBtnId == maxButtonsInControlPanel - 1) {
          nextControlsPage();
          return;
        }

        if(activeBtn > 2){
          await list(activeBtn + 1);
          drawControls(activeBtn - 1, "", 3); // TODO: "-1" при максимальном значении 5 -> заменить на универсальный подсчёт, тоже для последнего аргумента
          return;
        }

        if (activeBtn !== maxTab) {
          await list(activeBtn + 1);
          changeActiveBtn(activeBtnId + 1);
        } else {
          console.log("Дальше пусто!");
        }
      }

      
      if (e.target.id == "back") {
        if(activeBtn > 3){
          await list(activeBtn - 1);
          drawControls(activeBtn - 3, "", 3); // TODO: "-1" при максимальном значении 5 -> заменить на универсальный подсчёт, тоже для последнего аргумента
          return;
        }

        console.log(activeBtn);
        if (activeBtnId == 0) {
          previosControlsPage();
          return;
        }
        changeActiveBtn(activeBtnId - 1)
        list(activeBtn - 1);
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