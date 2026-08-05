"use strict";
/* ============ app render dispatch ============ */
function renderApp(app){
  if(app==='chat') renderChat();
  else if(app==='mail') renderMail();
  else if(app==='qb') renderQB();
  else if(app==='chart') renderChartLab();
  else if(app==='tasks') renderTasks();
  else if(app==='files') renderFiles();
  else if(app==='ref') renderReference();
  else if(app==='shop') renderShop();
  else if(app==='profile') renderProfile();
}

