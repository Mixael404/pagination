"use strict";
console.log('start 3.8');


//   <<   <  14 15 [16] 17 18   >   >>
//   <<   <  [1] 2 3   >   >>
// 


class Pagination {
  constructor(config) {
    this.root = document.querySelector(config.wrapper);
    this.postsWrapper = this.root.querySelector(".postsWrapper");
    this.controls = this.root.querySelector(".controls");
    this.arrows = this.root.querySelector(".arrows");
    this.next = this.root.querySelector("#next");
    this.previos = this.root.querySelector("#previos");
    this.maxItemsPerPage = 8;
    this.maxButtonsInControlPanel = 7;
    this.totalPosts = 100;
    this.maxTab = Math.ceil(this.totalPosts / this.maxItemsPerPage);
    this.middleTab = Math.ceil(this.maxButtonsInControlPanel / 2);
    this.amountOfButtonsAroundSelected = Math.floor(this.maxButtonsInControlPanel / 2);
    this.addEventListeners();
    this.drawCurrentControls();
  }

  getPosts(page) {
    return fetch(`https://jsonplaceholder.typicode.com/posts?_page=${page}&_limit=${this.maxItemsPerPage}`)
      .then(response => response.json())
      .then(response => {
        let state = JSON.parse(localStorage.getItem("newPosts"));

        if (state === null) {
          state = [];
        }
        for (let i = 0; i < response.length; i++) {
          const index = response[i].id - 1;
          state[index] = response[i];
        }
        // state.push(...response);
        // state.sort((a, b) => a.id > b.id ? 1 : -1);
        const strState = JSON.stringify(state);
        localStorage.setItem("newPosts", strState);
      })
  }

  firstInit() {
    return fetch(`https://jsonplaceholder.typicode.com/posts?_page=1&_limit=${this.maxItemsPerPage}`)
      .then(response => response.json())
      .then((response) => {
        const strResponse = JSON.stringify(response);
        localStorage.setItem("postsState", strResponse);
        localStorage.setItem("newPosts", strResponse);
      })
  }

  createListItem(post) {
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

  drawCurrentState(destination, activeBtn) {
    if (localStorage.postsState) {
      this.postsWrapper.innerHTML = "";
      const posts = localStorage.getItem("postsState");
      const postsArr = JSON.parse(posts);
      if (activeBtn) {
        this.controls.children[activeBtn - 1].classList.add("selected");
      } else if (destination === "forward") {
        this.controls.children[0].classList.add("selected");
      } else if (destination === "back") {
        this.controls.lastChild.classList.add("selected");
      }
      postsArr.forEach(element => {
        this.postsWrapper.append(this.createListItem(element));
      })
    }
  }

  async drawControls(first, destination, activeBtn) {
    this.controls.innerHTML = "";
    const last = first + this.maxButtonsInControlPanel - 1;
    for (let i = first; i <= last; i++) {
      const pageBtn = createEl("div", "page", i);
      this.controls.append(pageBtn);
      if (i === this.maxTab) {
        break;
      }
    }
    this.drawCurrentState(destination, activeBtn);
  };

  defineActualPage(){
    const currentState = JSON.parse(localStorage.getItem("postsState"));
    let currentPage;

    // Will work in case of reload while last page in postsState and last element is null
    if (currentState[this.maxItemsPerPage - 1] == null) {
      currentPage = this.maxTab;
    } else {
      currentPage = currentState[this.maxItemsPerPage - 1].id / this.maxItemsPerPage;
    }
    return currentPage;
  }

  async drawCurrentControls() {
    if (!localStorage.getItem("postsState")) {
      await this.firstInit();
    }

    let currentPage = this.defineActualPage();

    let firstPage;
    let currentIndex;

    const firstBorderPages = currentPage < this.middleTab;
    const lastBorderPages = currentPage > this.maxTab - this.amountOfButtonsAroundSelected;

    if (firstBorderPages) {
      currentIndex = currentPage;
      firstPage = 1;
      this.drawControls(firstPage, "", currentIndex);
    } else if(lastBorderPages){
      currentIndex = currentPage % this.maxButtonsInControlPanel;
      firstPage = this.maxTab - 2 * this.amountOfButtonsAroundSelected;
      this.drawControls(firstPage, "", currentIndex + 1);
    } else {
      firstPage = currentPage - this.amountOfButtonsAroundSelected;
      this.drawControls(firstPage, "", this.middleTab);
    }
  }

  checkStateOnNextObject(arr, itemId) {
    let res = arr.some((obj) => {
      if (!obj) {
        return;
      } else if (obj.id === itemId) {
        return true
      }
    })
    return res;
  }

  getNecesaryPostsFromState(state, nextItem) {
    const postsToShow = [];
    for (let i = nextItem; i < nextItem + this.maxItemsPerPage; i++) {
      postsToShow.push(state[i - 1]);
    }
    return postsToShow;
  }

  drawPosts(state, nextItem) {
    const postsToShow = this.getNecesaryPostsFromState(state, nextItem);

    const strPosts = JSON.stringify(postsToShow);
    localStorage.setItem("postsState", strPosts);

    this.postsWrapper.innerHTML = "";

    for (let i = 0; i < postsToShow.length; i++) {
      this.postsWrapper.append(this.createListItem(postsToShow[i]));
    }
  }

  async list(page) {
    let state = JSON.parse(localStorage.getItem("newPosts"));
    const nextFirstItemId = (page - 1) * this.maxItemsPerPage + 1;
    if (state === null) {
      state = [];
    }

    let hasObj = this.checkStateOnNextObject(state, nextFirstItemId);
    if (hasObj) {
      this.drawPosts(state, nextFirstItemId);
    } else {
      await this.getPosts(page);
      const newState = JSON.parse(localStorage.getItem("newPosts"));
      this.drawPosts(newState, nextFirstItemId);
    }
  }

  turnOnNecesseryBtn(currentPage) {
    const newControls = Array.from(this.controls.children);
    const buttonIndex = newControls.findIndex((btn) => {
      if (btn.textContent == currentPage) {
        return true;
      }
    })
    this.changeActiveBtn(buttonIndex);
  }

  async controlsTab(e) {
    if (e.target.classList.contains("page")) {
      const arrControls = Array.from(this.controls.children);
      const newActiveTwo = arrControls.indexOf(e.target);
      const currentPage = +(e.target.textContent);

      const isFirstTabs = currentPage < this.middleTab;
      const isLastTabs = currentPage > this.maxTab - this.amountOfButtonsAroundSelected;

      if (isFirstTabs) {
        this.drawControls(1, "", newActiveTwo + 1);
        this.turnOnNecesseryBtn(currentPage);
      } else if (isLastTabs) {
        this.drawControls(this.maxTab - this.maxButtonsInControlPanel + 1, "", newActiveTwo + 1);
        this.turnOnNecesseryBtn(currentPage);
      } else {
        this.drawControls(currentPage - this.amountOfButtonsAroundSelected, "", this.middleTab)
      }
      await this.list(currentPage);
    }
  }

  findActiveBtn(controlButons) {
    const currentBtn = controlButons.findIndex((button) => {
      if (button.classList.contains("selected")) {
        return true;
      }
    })
    return currentBtn;
  }

  async arrowsTab(e) {
    if (e.target.classList.contains("arrow")) {
      const controlButons = Array.from(this.controls.children);
      const activeBtnIndex = this.findActiveBtn(controlButons);
      const activeBtn = +(controlButons[activeBtnIndex].textContent);

      if (e.target.id == "forward") {
        if (activeBtn == this.maxTab) {
          console.log("That's all");
          return;
        }
        const isBorderTabs = activeBtn > this.amountOfButtonsAroundSelected && activeBtn < this.maxTab - this.amountOfButtonsAroundSelected;
        if (isBorderTabs) {
          await this.list(activeBtn + 1);
          this.drawControls(activeBtn - this.amountOfButtonsAroundSelected + 1, "", this.middleTab);
        } else {
          await this.list(activeBtn + 1);
          this.changeActiveBtn(activeBtnIndex + 1);
        }
      }


      if (e.target.id == "back") {
        if (activeBtn == 1) {
          console.log("already min!");
          return;
        }

        const isBorderTabs = activeBtn > this.amountOfButtonsAroundSelected + 1 && activeBtn < this.maxTab - this.amountOfButtonsAroundSelected + 1;
        if (isBorderTabs) {
          await this.list(activeBtn - 1);
          this.drawControls(activeBtn - this.amountOfButtonsAroundSelected - 1, "", this.middleTab);
        } else{
          this.changeActiveBtn(activeBtnIndex - 1)
          this.list(activeBtn - 1);
        }
        
      }
    }
  }

  changeActiveBtn(newActive) {
    const controlButons = Array.from(this.controls.children);
    controlButons.forEach((button) => {
      button.classList.remove("selected")
    })
    controlButons[newActive].classList.add("selected");
  }

  async toFinalPage() {
    const isFinalActive = (this.controls.lastChild.textContent == this.maxTab) && (this.controls.lastChild.classList.contains("selected"));
    if (isFinalActive) {
      console.log("Max!");
      return;
    }
    await this.list(this.maxTab);
    this.drawControls(this.maxTab - this.maxButtonsInControlPanel + 1, "", this.maxButtonsInControlPanel)
  }

  async toFirstPage() {
    const isFirstActive = (this.controls.firstChild.textContent == 1) && (this.controls.firstChild.classList.contains("selected"));
    if (isFirstActive) {
      console.log("Min!");
      return;
    }
    await this.list(1);
    this.drawControls(1, "", 1);
  }

  addEventListeners() {
    this.controls.addEventListener("click", this.controlsTab.bind(this));
    this.arrows.addEventListener("click", this.arrowsTab.bind(this));
    this.next.addEventListener("click", this.toFinalPage.bind(this));
    this.previos.addEventListener("click", this.toFirstPage.bind(this));
  }
}

// localStorage.removeItem("newPosts");
// function pagination() {

//   const postsWrapper = document.querySelector(".postsWrapper");
//   const controls = document.querySelector(".controls");
//   const arrows = document.querySelector(".arrows");
//   const maxItemsPerPage = 8;
//   const maxButtonsInControlPanel = 7;
//   let totalPosts = 100;
//   const maxTab = Math.ceil(totalPosts / maxItemsPerPage);
//   const middleTab = Math.ceil(maxButtonsInControlPanel / 2);
//   const amountOfButtonsAroundSelected = Math.floor(maxButtonsInControlPanel / 2);


//   // 1 - 8   <=======================
//   // 9 - 16

//   // 11 - 8 = chunck[3]
//   // smallIndex = 3
//   // newIndex = (currentPage - 1) * pageLimit + smallIndex
//   // data[newIndex] = chunck[3] 
//   // 31, 32.....64, 65, 64..... 102, 103

//   // 17 - 24
//   // ....

//   // this = {}

//   // const state = {
//   //   pageLimit: 20,
//   //   totalLength: 500,
//   //   totalLoaded: 360,
//   //   currentPage: 3,
//   // };

//   // state.pagesAmount = state.totalLength / state.pageLimit;



//   // initial value
//   // current value
//   // saved value -> ls

//   // look saved value
//   // initial value

//   // curent value (null == state.END) -> savedState.END -> initilState.END
//   // curent value (null == state.END) -> savedState -> initilState


//   // TODO: rename function
//   function createListItem(post) {
//     if (!post) {
//       return "";
//     }
//     const wrapper = document.createDocumentFragment();
//     const title = createEl("h2", "postTitle", post.title);
//     const body = createEl("p", "postBody", post.body);
//     const id = createEl("h3", "postId", post.id);
//     wrapper.append(id);
//     wrapper.append(title);
//     wrapper.append(body);
//     return wrapper;
//   }


//   function getPosts(page) {
//     return fetch(`https://jsonplaceholder.typicode.com/posts?_page=${page}&_limit=${maxItemsPerPage}`)
//       .then(response => response.json())
//       .then(response => {
//         let state = JSON.parse(localStorage.getItem("newPosts"));

//         if (state === null) {
//           state = [];
//         }
//         for (let i = 0; i < response.length; i++) {
//           const index = response[i].id - 1;
//           state[index] = response[i];
//         }
//         // state.push(...response);
//         // state.sort((a, b) => a.id > b.id ? 1 : -1);
//         const strState = JSON.stringify(state);
//         localStorage.setItem("newPosts", strState);
//       })
//   }

//   // 
//   function drawCurrentState(destination, activeBtn) {
//     if (localStorage.postsState) {
//       postsWrapper.innerHTML = "";
//       const posts = localStorage.getItem("postsState");
//       const postsArr = JSON.parse(posts);
//       if (activeBtn) {
//         controls.children[activeBtn - 1].classList.add("selected");
//       } else if (destination === "forward") {
//         controls.children[0].classList.add("selected");
//       } else if (destination === "back") {
//         controls.lastChild.classList.add("selected");
//       }
//       postsArr.forEach(element => {
//         postsWrapper.append(createListItem(element));
//       })
//     }
//   }

//   /**
//  * Represents buttons of paginatio 
//  * @param {number} first - First btn index
//  * @param {"forward" | "back"} destination - direction of drawing
//  * @param {number} index - Which button to make "selected"
//  */
//   async function drawControls(first, destination, activeBtn) {
//     controls.innerHTML = "";
//     const last = first + maxButtonsInControlPanel - 1;
//     for (let i = first; i <= last; i++) {
//       const pageBtn = createEl("div", "page", i);
//       controls.append(pageBtn);
//       if (i === maxTab) {
//         break;
//       }
//     }
//     drawCurrentState(destination, activeBtn);
//   };

//   function firstInit() {
//     return fetch(`https://jsonplaceholder.typicode.com/posts?_page=1&_limit=${maxItemsPerPage}`)
//       .then(response => response.json())
//       .then((response) => {
//         const strResponse = JSON.stringify(response);
//         localStorage.setItem("postsState", strResponse);
//         localStorage.setItem("newPosts", strResponse);
//       })
//   }

//   async function drawCurrentControls() {
//     if (!localStorage.getItem("postsState")) {
//       await firstInit();
//     }
//     const currentState = JSON.parse(localStorage.getItem("postsState"));
//     let currentPage;
//     // Will work in case of reload while last page in postsState and last element is null
//     if (currentState[maxItemsPerPage - 1] == null) {
//       currentPage = maxTab;
//     } else {
//       currentPage = currentState[maxItemsPerPage - 1].id / maxItemsPerPage;
//     }
//     let firstPage;
//     let currentIndex;
//     if (currentPage <= 5) {
//       currentIndex = currentPage;
//       firstPage = 1;
//     } else {
//       currentIndex = currentPage % maxButtonsInControlPanel;
//       firstPage = currentPage - currentIndex + 1;
//     }
//     drawControls(firstPage, "", currentIndex);
//   }

//   drawCurrentControls();


//   // Реализовать функцию отрисовки панели управления от начального стейта
//   // Взять текущий стейт
//   // По последнему посту понять раскладку (разделить на кол-во постов на одной странице)
//   // Рассчитать, с какой раскладки должно начинаться
//   // Запустить drawControls как ниже, вместо 1 поставить рассчитанную раскладку
//   // drawControls(1, "forward", true);



//   function checkStateOnNextObject(arr, itemId) {
//     let res = arr.some((obj) => {
//       if (!obj) {
//         return;
//       } else if (obj.id === itemId) {
//         return true
//       }
//     })
//     return res;
//   }

//   function drawPosts(state, nextItem) {
//     const postsToShow = getNecesaryPostsFromState(state, nextItem);

//     const strPosts = JSON.stringify(postsToShow);
//     localStorage.setItem("postsState", strPosts);

//     postsWrapper.innerHTML = "";

//     for (let i = 0; i < postsToShow.length; i++) {
//       postsWrapper.append(createListItem(postsToShow[i]));
//     }
//   }


//   function getNecesaryPostsFromState(state, nextItem) {
//     const postsToShow = [];
//     for (let i = nextItem; i < nextItem + maxItemsPerPage; i++) {
//       postsToShow.push(state[i - 1]);
//     }
//     return postsToShow;
//   }



//   async function list(page) {
//     let state = JSON.parse(localStorage.getItem("newPosts"));
//     const nextFirstItemId = (page - 1) * maxItemsPerPage + 1;
//     if (state === null) {
//       state = [];
//     }

//     let hasObj = checkStateOnNextObject(state, nextFirstItemId);
//     if (hasObj) {
//       drawPosts(state, nextFirstItemId);
//     } else {
//       await getPosts(page);
//       const newState = JSON.parse(localStorage.getItem("newPosts"));
//       drawPosts(newState, nextFirstItemId);
//     }
//   }


//   controls.addEventListener("click", controlsTab);

//   function turnOnNecesseryBtn(currentPage) {
//     const newControls = Array.from(controls.children);
//     const buttonIndex = newControls.findIndex((btn) => {
//       if (btn.textContent == currentPage) {
//         return true;
//       }
//     })
//     changeActiveBtn(buttonIndex);
//   }

//   async function controlsTab(e) {
//     if (e.target.classList.contains("page")) {
//       const arrControls = Array.from(controls.children);
//       const newActiveTwo = arrControls.indexOf(e.target);
//       const currentPage = +(e.target.textContent);
//       if (currentPage < middleTab) {

//         // Как "зажечь" нужную кнопку и избежать конфликта индексов до/после отрисовки(при пограничных случаях)?
//         // В данный момент есть таргет-кнопка
//         // 1) Выполнить отрисовку
//         // 2) Зажечь вручную кнопку, на которую был клик -> провести поиск нужной кнопки по текст контенту(он не изменился после отрисовки)

//         drawControls(1, "", newActiveTwo + 1);
//         turnOnNecesseryBtn(currentPage);
//       } else if (currentPage > maxTab - amountOfButtonsAroundSelected) {
//         drawControls(maxTab - maxButtonsInControlPanel + 1, "", newActiveTwo + 1);
//         turnOnNecesseryBtn(currentPage);
//       } else {
//         drawControls(currentPage - amountOfButtonsAroundSelected, "", middleTab)
//       }
//       await list(currentPage);
//     }
//   }

//   arrows.addEventListener("click", arrowsTab);


//   function findActiveBtn(controlButons) {
//     const currentBtn = controlButons.findIndex((button) => {
//       if (button.classList.contains("selected")) {
//         return true;
//       }
//     })
//     return currentBtn;
//   }

//   async function arrowsTab(e) {
//     if (e.target.classList.contains("arrow")) {
//       const controlButons = Array.from(controls.children);
//       const activeBtnIndex = findActiveBtn(controlButons);
//       const activeBtn = +(controlButons[activeBtnIndex].textContent);

//       if (e.target.id == "forward") {
//         if (activeBtn == maxTab) {
//           console.log("That's all");
//           return;
//         }
//         if (activeBtn > amountOfButtonsAroundSelected && activeBtn < maxTab - amountOfButtonsAroundSelected) {
//           await list(activeBtn + 1);
//           drawControls(activeBtn - amountOfButtonsAroundSelected + 1, "", middleTab); // TODO: "-1" при максимальном значении 5 -> заменить на универсальный подсчёт, тоже для последнего аргумента
//           return;
//         }

//         if (activeBtn !== maxTab) {
//           await list(activeBtn + 1);
//           changeActiveBtn(activeBtnIndex + 1);
//         } else {
//           console.log("Дальше пусто!");
//         }
//       }


//       if (e.target.id == "back") {
//         if (activeBtn > amountOfButtonsAroundSelected + 1 && activeBtn < maxTab - amountOfButtonsAroundSelected + 1) {
//           await list(activeBtn - 1);
//           drawControls(activeBtn - amountOfButtonsAroundSelected - 1, "", middleTab); // TODO: "-1" при максимальном значении 5 -> заменить на универсальный подсчёт, тоже для последнего аргумента
//           return;
//         }

//         if (activeBtn == 1) {
//           console.log("already min!");
//           return;
//         }
//         changeActiveBtn(activeBtnIndex - 1)
//         list(activeBtn - 1);
//       }
//     }
//   }


//   function changeActiveBtn(newActive) {
//     const controlButons = Array.from(controls.children);
//     controlButons.forEach((button) => {
//       button.classList.remove("selected")
//     })
//     controlButons[newActive].classList.add("selected");
//   }

//   next2.addEventListener("click", toFinalPage);

//   async function toFinalPage() {
//     const isFinalActive = (controls.lastChild.textContent == maxTab) && (controls.lastChild.classList.contains("selected"));
//     if (isFinalActive) {
//       console.log("Max!");
//       return;
//     }
//     await list(maxTab);
//     drawControls(maxTab - maxButtonsInControlPanel + 1, "", maxButtonsInControlPanel)
//   }

//   async function toFirstPage() {
//     const isFirstActive = (controls.firstChild.textContent == 1) && (controls.firstChild.classList.contains("selected"));
//     if (isFirstActive) {
//       console.log("Min!");
//       return;
//     }
//     await list(1);
//     drawControls(1, "", 1);
//   }

//   previos2.addEventListener("click", toFirstPage);


// }

// const URL1 = `https://jsonplaceholder.typicode.com/posts?_page=1&_limit=20`;
// pagination(URL1);

const cfg = {
  wrapper: ".pagination1"
}

const pagination1 = new Pagination(cfg);