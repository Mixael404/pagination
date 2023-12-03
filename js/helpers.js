function createEl(tag, className, text) {
    const element = document.createElement(tag);
    element.classList.add(className);
    element.textContent = text;
    return element;
}
  