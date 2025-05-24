/*!
 * Start Bootstrap - Personal v1.0.1 (https://startbootstrap.com/template-overviews/personal)
 * Copyright 2013-2023 Start Bootstrap
 * Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-personal/blob/master/LICENSE)
 */
// This file is intentionally blank
// Use this file to add JavaScript to your project

//Variables
const dwnld_btn = document.querySelector("#dwnld_resume");

//Functions
function printResume() {
  window.print();
}

//Listeners
dwnld_btn.addEventListener("click", printResume);
