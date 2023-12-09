"use strict";
console.log('start 3.8');


//   <<   <  14 15 [16] 17 18   >   >>
//   <<   <  [1] 2 3   >   >>
// 

// Дополнительно 6 - научиться проверять, есть ли интернет у клиента И работает ли нормально сервер
// Если нет, то перекрашивать пагинацию так, чтобы видеть "сохраненные" и "отсутствующие" страницы. В идеале - не давать кликать на те, которых нету


class Pagination {
  constructor(config) {
    this.root = document.querySelector(config.wrapper);
    this.postsWrapper = this.root.querySelector(".postsWrapper");
    this.controls = this.root.querySelector(".controls");
    this.arrows = this.root.querySelector(".arrows");
    this.next = this.root.querySelector("#next");
    this.previos = this.root.querySelector("#previos");
    this.maxItemsPerPage = config.maxItemsPerPage;
    this.maxButtonsInControlPanel = config.maxButtonsInControlPanel;
    this.baseUrl = config.url;
    this.url = config.url + this.maxItemsPerPage;
    this.totalPosts = 100;
    this.downloaded = {};
    this.maxTab = Math.ceil(this.totalPosts / this.maxItemsPerPage);
    this.middleTab = Math.ceil(this.maxButtonsInControlPanel / 2);
    this.amountOfButtonsAroundSelected = Math.floor(this.maxButtonsInControlPanel / 2);
    this.linkBreaker = document.getElementById("linkBreaker");
    this.linkWrapper = document.getElementById("linkWrapper");
    this.linkWrapper.textContent = this.url;
    this.addEventListeners();
    setTimeout(function(){
      if(!window.navigator.onLine){
        this.getDownloadedPages();
      }
    },10000)


    window.addEventListener("offline", (e) => {
      console.warn("offline");
    });
    
    window.addEventListener("online", (e) => {
      console.info("online");
    });



    this.drawCurrentControls();
    console.log(window.navigator.onLine);
  }
  // Test part
  breakLink(){
    if(this.linkBreaker.dataset.state === "break"){
      this.url = "SomeWrongURL";
      this.linkBreaker.dataset.state = "repair";
      this.linkBreaker.textContent = "Repair link";
      this.linkWrapper.textContent = "Current URL: " + this.url;
      this.isBreaked = true;
      this.getDownloadedPages();
    } else if (this.linkBreaker.dataset.state === "repair"){
      const arrayControls = Array.from(this.controls.children);
      this.url = this.baseUrl + this.maxItemsPerPage;
      this.linkBreaker.dataset.state = "break";
      this.linkBreaker.textContent = "Break link";
      this.linkWrapper.textContent = "Current URL: " + this.url;
      console.log(arrayControls);
      arrayControls.forEach((btn) => {
        btn.classList.remove("downloaded");
        btn.classList.remove("unDownloaded");
      })
      this.isBreaked = false;
    }
  }





  //  Main part
  getDownloadedPages(){
    const posts = JSON.parse(localStorage.getItem("newPosts"));
    for(let i = 0; i < this.totalPosts; i = i + this.maxItemsPerPage){
      if (posts[i] != null){
        const postsId = +(posts[i].id);
        this.downloaded[Math.ceil(postsId/this.maxItemsPerPage)] = true;
      } else{
        continue;
      }
    }
    this.markDownloaded();
    console.log(this.downloaded);
  }

  markDownloaded() {
    const controls = Array.from(this.controls.children);

    controls.forEach((btn) => {
      if (this.downloaded.hasOwnProperty(+(btn.textContent))){
        btn.classList.add("downloaded");
      } else{
        btn.classList.add("unDownloaded");
      }
    })
  }

  addPageNumberToUrl(url, page) {
    const urlWithPage = `_page=${page}&`;
    let newUrl = url.replace("_page=&", urlWithPage);
    return newUrl;
  }

  loading() {
    this.loadBg = document.createElement("div");
    this.loadBg.classList.add("loadingBackground");
    this.load = new Image();
    this.load.src = "../img/loading.gif";
    this.load.classList.add("loading");
    this.loadBg.append(this.load);
    document.body.append(this.loadBg);
  }

  startLoad() {
    this.loading();
  }

  stopLoad() {
    this.loadBg.remove();
  }

  getPosts(page) {
    return fetch(this.addPageNumberToUrl(this.url, page))
      .then(response => {
        if(!response.ok){
          throw new Error("URL doesn't exist!")
        } else{
          return response.json();
        }
      })
      .then(response => {
        let state = JSON.parse(localStorage.getItem("newPosts"));
        this.downloaded[+(response[response.length - 1].id)/this.maxItemsPerPage] = true;
        if (state === null) {
          state = [];
        }
        for (let i = 0; i < response.length; i++) {
          const index = response[i].id - 1;
          state[index] = response[i];
        }

        // response 0 - 30
        // state 0 - 100...     130-60

        const strState = JSON.stringify(state);
        localStorage.setItem("newPosts", strState);
        return true;
      })
      .catch((err) => {
        console.warn("Fatal error: " + err.message);
        // throw new Error("Что-то всё совсем плохо")
        alert("Connection error!");
        console.log("Error");
        return false;
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

  drawControls(first, destination, activeBtn) {
    this.controls.innerHTML = "";
    const last = first + this.maxButtonsInControlPanel - 1;
    for (let i = first; i <= last; i++) {
      const pageBtn = createEl("div", "page", i);
      this.controls.append(pageBtn);
      if (i === this.maxTab) {
        break;
      }
    }
    if(!window.navigator.onLine || this.isBreaked === true){
      this.markDownloaded();
    }
    this.drawCurrentState(destination, activeBtn);
  };

  defineActualPage() {
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
    } else if (lastBorderPages) {
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
      this.startLoad();
      const isOk = await this.getPosts(page);
      // const posts = await this.getPosts(page);
      // try {
      //   this.getPosts(page)
      // } catch(e) {
      //   console.log("Не получилось потому что ");
      //   console.log(e.msg);
      // };
      // await this.getPosts(page);

      /// 80-100 ...... 160-180

      // 2^64

      this.stopLoad();
      // if(!posts || !posts.length || posts.length == 0){
      // if(!posts?.length || posts?.length == 0){
      if(!isOk){
        return false;
      }
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

      const isOk = await this.list(currentPage);
      if(isOk === false){
        return;
      }

      if (isFirstTabs) {
        this.drawControls(1, "", newActiveTwo + 1);
        this.turnOnNecesseryBtn(currentPage);
      } else if (isLastTabs) {
        this.drawControls(this.maxTab - this.maxButtonsInControlPanel + 1, "", newActiveTwo + 1);
        this.turnOnNecesseryBtn(currentPage);
      } else {
        this.drawControls(currentPage - this.amountOfButtonsAroundSelected, "", this.middleTab)
      }
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
          const isOk = await this.list(activeBtn + 1);
          if(isOk === false){
            return;
          }
          this.drawControls(activeBtn - this.amountOfButtonsAroundSelected + 1, "", this.middleTab);
        } else {
          const isOk = await this.list(activeBtn + 1);
          if(isOk === false){
            return;
          }
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
          const isOk = await this.list(activeBtn - 1);
          if(isOk === false){
            return;
          }
          this.drawControls(activeBtn - this.amountOfButtonsAroundSelected - 1, "", this.middleTab);
        } else {
          const isOk = await this.list(activeBtn - 1);
          if(isOk === false){
            return;
          }
          this.changeActiveBtn(activeBtnIndex - 1)
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
    const isOk = await this.list(this.maxTab);
    if(isOk === false){
      return;
    }
    this.drawControls(this.maxTab - this.maxButtonsInControlPanel + 1, "", this.maxButtonsInControlPanel)
  }

  async toFirstPage() {
    const isFirstActive = (this.controls.firstChild.textContent == 1) && (this.controls.firstChild.classList.contains("selected"));
    if (isFirstActive) {
      console.log("Min!");
      return;
    }
    const isOk = await this.list(1);
    if(isOk === false){
      return;
    }
    this.drawControls(1, "", 1);
  }

  addEventListeners() {
    this.controls.addEventListener("click", this.controlsTab.bind(this));
    this.arrows.addEventListener("click", this.arrowsTab.bind(this));
    this.next.addEventListener("click", this.toFinalPage.bind(this));
    this.previos.addEventListener("click", this.toFirstPage.bind(this));
    this.linkBreaker.addEventListener("click", this.breakLink.bind(this));
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
  wrapper: ".pagination1",
  maxItemsPerPage: 8,
  maxButtonsInControlPanel: 7,
  url: "https://jsonplaceholder.typicode.com/posts?_page=&_limit="
}

const pagination1 = new Pagination(cfg);


// GIT

//
// docker -> docker-compose
// migration <--

// [[all_good]].rar



// npm => nodeJS
/// TS => webpack/gulp
// webpack => nodeJS
// nodeJS 
// sass => sass-builder => webpack => npm => nodeJS
// react => webpack => npm => nodeJS