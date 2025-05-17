// Minesweeper control program by keisuke Nakamura (2025/3/23)
// dummy cell element node
class cellElemNode {
  constructor(value) {
    this.innerText = value;
  }
}
//
// HTML table cell element
//
class cellElem {
  constructor(index, elemList) {
    // array pointer
    this.list = elemList;
    this.index = index;
    this.node = this.list[this.index];
    this.value = this.node.innerText;
    this.queue = [];
  }
  location(givenIndex) {
    let myindex = (givenIndex !== undefined) ? givenIndex : this.index;
    const x = myindex % SIZE_X;
    const y = parseInt(myindex / SIZE_X);
    return [x,y];
  }
  update() {
    this.value = this.node.innerText;
  }
  checkRange() {
    return ((this.index < 0)||(this.index > IDX_MAX)) ? 0 : 1;
  }
  init() {
    // initialize cell. clear all classes and reset
    let node = this.node;
    node.className = 'init invisible';
  }
  touch() {
    let node = this.node;
    node.classList.add('touch');
    //BDROOT.touchList[this.index] = true;
  }
  bomb() {
    let node = this.node;
    node.classList.add('bomb');
  }
  untouch() {
    let node = this.node;
    node.classList.remove('touch');
    //BDROOT.touchList[this.index] = false;
  }
  flag() {
    let node = this.node;
    node.classList.add('flag');
  }
  unflag() {
    let node = this.node;
    node.classList.remove('flag');
  }
  close() {
    let node = this.node;
    if (!this.isTouch()) {
      if (this.isBomb()) {
        node.classList.add('safe');
      } else if (this.isEmpty()) {
        node.classList.add('touch');
        //BDROOT.touchList[this.index] = true;
      } else {
        node.classList.add('penalty');
      }
    }
  }
  visible() {
    let node = this.node;
    node.classList.remove('invisible');
  }
  invisible() {
    let node = this.node;
    //console.log('class name0', node.className);
    node.classList.add('invisible');
    //console.log('class name1', node.className);
  }
  isTouch() {
    return this.node.classList.contains('touch');
    //return (BDROOT.touchList[this.index]) ? 1:0;
  }
  isFlag() {
    return this.node.classList.contains('flag');
  }
  isEmpty() {
    return (this.value == 0) ? 1 : 0;
  }
  isBomb() {
    return (this.value >= MINES_VALUE) ? 1 : 0;
  }
  isPrimary(source) {
    // source is ['primary', 14, 13, 12, 11, 10,...]
    // primary source is only ['primary']
    return (source.slice(-1).shift() == 'primary') ? 1:0;
  }
  isSelectable() {
    // stop cell.access while FLAG_UPDATE (=1) mode
    // only untouch and non-flagged cell can be accessed
    return (!this.isTouch() && !this.isFlag() && !FLAG_UPDATE) ? 1:0;
  }
  putQueue(reserveList) {
    this.queue = [];
    if (reserveList !== undefined) {
      this.queue = [...reserveList];
    }
    // reserve = {index:index, source:source}
    return this;
  }
  evalQueue() {
    const SOURCE_KEEP_ALL_RECURSIVE_CELLS = 0;
    const QUIET = 1;
    const showMsg = (stage) => {
      if (!QUIET) {
        console.log(stage, this.index);
      }
    }
    let newList = [];
    for (let i=0; i < this.queue.length; i++) {
      const reserve = this.queue[i];
      showMsg(`reserve ${i} is (${reserve.index}, ${reserve.source}) of`);
      const adjCell = new cellElem(reserve.index, this.list);
      const newSrc = reserve.source;
      if (!SOURCE_KEEP_ALL_RECURSIVE_CELLS) {
        const rem = newSrc.length -2;
        // preserve only top and tail items
        // ['primary', 1, 2, 3] -> ['primary', 3]
        newSrc.splice(1, rem);
      }
      showMsg(`new source ${i} is ${newSrc} of`);
      adjCell.access(newSrc);
      // new pivot cells are collected and update this primary cell queue after all pivot cells are accessed
      for (let j=0; j < adjCell.queue.length; j++) {
        newList.push(adjCell.queue[j]);
      }
    }
    // update queue
    // if no newList, remove current queue
    this.putQueue(newList);
    return this;
  }
  count_and_put_mines() {
    let mines = 0;
    for (let i=0; i < this.queue.length; i++) {
      const index = this.queue[i].index;
      const adjCell = new cellElem(index, this.list);
      if (adjCell.isBomb()) {
        // bomb cell count
         mines++;
      }
    }
    let node = this.node;
    node.innerText = mines;
    return this;
  }
  access(source) {
    const isPrimary = this.isPrimary(source);
    if (isPrimary) {
      (async () => {
        await new Promise((resolve_acc) => {
          wrapaccess(source, this);
          resolve_acc();
        });
      })();
    } else {
      // don't use promise to prevent promise stack overflow
      wrapaccess(source, this);
    }
  }
  score() {
      let incr = Number(this.value);
      if (this.isBomb()) {
        incr = -20;
      }
      return incr;
  }
  hover() {
    const [x, y] = this.location();
    printLocation(x, y);
  }
  addEventListener() {
    const bindedHandler1 = cellAccessPrimary.bind(this.node, this);
    const bindedHandler2 = cellMouseHover.bind(this.node, this);
    this.node.addEventListener('click', bindedHandler1, {once: true});  
    this.node.addEventListener('mouseover', bindedHandler2);
  }
}
async function wrapaccess(source, cell) {
  const isPrimary = cell.isPrimary(source);
  const start = performance.now();
  let timer;
  if (isPrimary) {
    if (cell.isSelectable()) {
      const [x, y] = cell.location();
      printDialog(`${x} ${y}`);
    }
  }
  if (isPrimary) {
    await new Promise((resolve_wa1) => {
      loadingAnimation(resolve_wa1);
    });
  }
  if (isPrimary) {
    await new Promise((resolve_wa2) => {
      accessCell(cell.index, cell.list, cell, source);
      // don't use recursive call to prevent promise stack overflow
      const USE_PIVOT_QUEUE = 1;
      if (USE_PIVOT_QUEUE) {
        while (cell.queue.length > 0) {
          // cell.queue will be updated inside evalQueue()
          cell.evalQueue();
        }
      }
      // after accessCell
      checkRemains();
      removeAnimation();
      showElapsed(start);
      resolve_wa2();
    });
  } else {
    // don't use promise to prevent promise stack overflow
    accessCell(cell.index, cell.list, cell, source);
    // new pivot cells are collected by cell.evalQueue of primary cell while loop
  }
}
function cellAccessPrimary(cell, event) {
  cell.access(['primary']);
}
function cellMouseHover(cell, event) {
  cell.hover();
}
async function redraw() {
  for (let i = 0; i < 2; i++) {
    await new Promise((resolve_redraw) => {
      requestAnimationFrame(resolve_redraw);
    });
  }
}
async function loadingAnimation(resolve_loading) {
  createAnimation();
  await redraw();
  //console.log('start loading animation');
  resolve_loading();
}
function createAnimation() {
  const USE_CREATE_ELEMENT = 0;
  if (USE_CREATE_ELEMENT) {
    const layer = document.getElementById('mycoverall');
    const div1 = document.createElement('div');
    const div2 = document.createElement('div');
    div1.className = 'circleball';
    div2.className = 'loadtext';
    div2.innerText = 'loading...';
    div2.id = 'myloading';
    layer.appendChild(div1);
    layer.appendChild(div2);
  } else {
    const layer = document.getElementById('mycoverall');
    layer.classList.remove('invisible');
    //console.log('create animation');
  }
}
function removeAnimation() {
  const layer = document.getElementById('mycoverall');
  if (layer != null) {
    layer.classList.add('invisible');
    //console.log('remove loading animation');
  }
}
function extendAnimation() {
  const layer = document.getElementById('mycoverall');
  if (layer != null) {
    layer.classList.add('extend');
    //console.log('extend loading animation');
  }
}
function suspendAnimation() {
  const layer = document.getElementById('mycoverall');
  if (layer != null) {
    layer.classList.remove('extend');
    //console.log('suspend loading animation');
  }
}
// don't work in this thread
/*
async function startCountLoading(ldcnt) {
  if (ldcnt === undefined) {
    ldcnt = 1;
  }
  const loading = document.getElementById('myloading');
  const event = () => {
    ldcnt++;
    console.log('conut up event', ldcnt);
  }
  let timer;
  await new Promise((resolve_scl) => {
    timer = setInterval(event, 1000);
    resolve_scl();
  });
  return timer;
}
function removeCountLoading(timer) {
  //clearInterval(timer);
}
*/
function checkRemains() {
  // check all alive cells touched
  const cells = new untouchCellTask();
  const remains = cells.countAlive();
  //console.log('count alive', remains);
  printRemains(remains);
  if (remains == 0) {
    finishSelection();
  }
}
function appendScrollBox(box, msg) {
  box.scrollTop = box.scrollHeight;
  box.value += msg;  
}
// print to console box in html
function printConsole(msg) {
  const consoleBox = document.getElementById('myconsole');
  //scroll before print
  msg += '\n';
  appendScrollBox(consoleBox, msg);
}
// print to dialog box in html
function printDialog(msg) {
  const dialogBox = document.getElementById('mydialog');
  //scroll before print
  msg += '\n';
  appendScrollBox(dialogBox, msg);
}
// print to dialog box in html
function printScore(cell, incr, type) {
  const scoreBox = document.getElementById('myscore');
  if (incr != 0) {
    let delta = (incr > 0) ? '+' : '';
    let msg = `(${delta}${incr}) ${SCORE}`;
    if (type == 'penalty') {
      const [x, y] = cell.location();
      msg += ` (${x},${y})`;
    }
    //scroll before print
    msg += '\n';
    appendScrollBox(scoreBox, msg); 
  }
}
// print to result in html
function printResult(score) {
  const resultBox = document.getElementById('myresult');
  let msg = `${score}`;
  let finalScore = score;
  if (score < 0) {
    msg += ' => count as 0';
    finalScore = 0;
  }
  msg += ` (${BOARD_NAME})`
  resultBox.value = msg;  
  // print to console
  printConsole(`score ${finalScore} ${BOARD_NAME}`);
}
// flag update mode status
function printFUstatus() {
  const statusBox = document.getElementById('mystatus');
  let msg = FLAG_UPDATE ? 'on' : 'off';
  statusBox.value = msg;  
  // print to console
  //printConsole(`flag ${msg}`);
}
function printRemains(msg) {
  const remainsBox = document.getElementById('myremains');
  remainsBox.value = msg;  
  // print to console
  //printConsole(`remaining ${msg}`);
}
function printLocation(x, y) {
  const locationBox = document.getElementById('mylocation');
  locationBox.value = `(${x}, ${y})`;
}
function countScore(cell, type) {
  let score = cell.score();
  let incr = 0;
  switch (type) {
    case 'penalty' :
      incr = (score <= 0) ? 0 : (-1*score);
      break;
    case 'obtain' :
    default :
      incr = score;
      break;
  }
  SCORE += incr;
  printScore(cell, incr, type);
}
// access given index (board location) 
async function accessCell(index, cellElemArray, cell, source) {
  const USE_PIVOT_QUEUE = 1;
  const QUIET = 1;
  const showMsg = (stage) => {
    if (!QUIET) {
      console.log(stage, index, source);
    }
  }
  if (!cell.checkRange()) {
    // out of range
    showMsg('#ER index out of range');
    return 0;
  }
  if (cell.isTouch()) {
    showMsg('skip');
  } else if (FLAG_UPDATE) {
    // reach here when flag on/off update mode enabled
    if (cell.isFlag()) {
      showMsg('flag off');
      cell.unflag();
      cell.addEventListener();
    } else {
      showMsg('flag on');
      cell.flag();
    }
    // exit from flag update mode
    flagUpdate('toggle');
  } else if (cell.isFlag() && (source.slice(-1).shift == 'primary')) {
    showMsg('skip flag');
  } else {
    cell.touch();
    // remove flag automatically
    cell.unflag();
    showMsg('touch');
    if (cell.isEmpty()) {
      showMsg('empty');
      // pivot to expand reagion
      // source is updated to 'new source' by appending current index
      const pbtcells = new pibotCellList(cell, source.concat([index]));
      const pbtIndex = pbtcells.region().regionShrink().pivotLocation().pivotIndex();
      // put pivot cells index to current cell queue
      cell.putQueue(pbtIndex);
      const idxlist = cell.queue.map((x) => {return x.index});
      const srclist = cell.queue.map((x) => {return x.source});
      showMsg(`${idxlist} is index queue of`);
      showMsg(`${srclist} is source queue of`);
      if (USE_PIVOT_QUEUE) {
        // cell.queue has reserve list (index, source)
      } else {
        cell.evalQueue();
      }
    } else if (cell.isBomb()) {
      cell.bomb();
      const [x, y] = cell.location();
      printConsole(`bomb!! (${x},${y})`);
    }
    // count score
    countScore(cell, 'obtain');
  }
  return 1;
}
// get three location of cur-1, cur, cur+1
function pibotAdjacent(cur, min, max) {
  let list = [];
  for (let i=(cur-1); i <= (cur+1); i++) {
    if ((i >= min)&&(i <= max)) {
       list.push(i);
    }
  }
  return [...list];
}
class boardIndex {
  constructor(cidx, min, max) {
    this.cur = Number(cidx);
    this.min = Number(min);
    this.max = Number(max);
    this.list = [];
  }
  pibot_adj() {
    this.list = [];
    for (let i=(this.cur-1); i <= (this.cur+1); i++) {
      if ((i >= this.min)&&(i <= this.max)) {
         this.list.push(i);
      }
    }
    return this;    
  }
  remove_source(srcidx) {
    const j = this.list.indexOf(srcidx);
    // remove previous tx or ty from pivot list when location changed from previous
    // x=3, tx=2, x_idx=[2,3,4], but previous tx=2 already traced
    if ((srcidx != this.cur) && (j >= 0)) {
      this.list.splice(j, 1);
    }
  }
}
class pibotCellList {
  constructor(pcell, source) {
    this.locList = [];
    this.pcell = pcell;
    this.source = source;
    const [x, y] = this.pcell.location();
    // traced is cut 0 and fetch tail
    // if one item list, traced = []
    this.prop = {
      xs: SIZE_X,
      ys: SIZE_Y,
      xmax: SIZE_X -1,
      ymax: SIZE_Y -1,
      traced: source.slice(1).slice(-1),
      x: x,
      y: y
    }
    this.x_idx = new boardIndex(this.prop.x, 0, this.prop.xmax);
    this.y_idx = new boardIndex(this.prop.y, 0, this.prop.ymax);
  }
  region() {
    this.x_idx.pibot_adj();
    this.y_idx.pibot_adj();
    return this;
  }
  regionShrink() {
    if (this.prop.traced.length > 0) {
      const [tx, ty] = this.pcell.location(this.prop.traced.shift());
      this.x_idx.remove_source(tx);
      this.y_idx.remove_source(ty);
    }
    return this;
  }
  pivotLocation() {
    for (let i=0; i < this.x_idx.list.length; i++) {
      for (let j=0; j < this.y_idx.list.length; j++) {
        const loc = {x:this.x_idx.list[i], y:this.y_idx.list[j]}
        if ((loc.x != this.prop.x) || (loc.y != this.prop.y)) {
          this.locList.push(loc);
        }
      }
    }    
    return this;
  }
  pivotIndex() {
    let plist = [];
    for (let i=0; i < this.locList.length; i++) {
      const loc = this.locList[i];
      const index = this.prop.xs*loc.y + loc.x;
      const reserve = {index:index, source:this.source}
      plist.push(reserve);
    }
    return plist;
  }
}
//
// define board bank
//
class Board {
  constructor() {
    this.nameList = [];
    this.dataList = [];
    this.size_x = 0;
    this.size_y = 0;
    this.boardData = undefined;
    this.closed = false;
    //this.touchList = [];
  }
  append(name, data) {
    this.nameList.push(name);
    this.dataList.push(data);
  }
  append_top(name, data) {
    this.nameList.unshift(name);
    this.dataList.unshift(data);
  }
  push(boardData) {
    if (boardData !== undefined) {
      this.nameList.push(boardData.name);
      this.dataList.push(boardData.data);
    }
  }
  push_tail(boardData) {
    if (boardData === undefined) {
      boardData = this.boardData;
    }
    this.nameList.push(boardData.name);
    this.dataList.push(boardData.data);
    return this;
  }
  push_top(boardData) {
    if (boardData === undefined) {
      boardData = this.boardData;
    }
    this.nameList.unshift(boardData.name);
    this.dataList.unshift(boardData.data);
    return this;
  }
  idx(name) {
    const idx = this.nameList.indexOf(name);
    return idx;
  }
  fetch(name) {
    const idx = this.idx(name);
    //console.log('fetch', name, idx, this.dataList[idx]);
    return (idx < 0) ? undefined : this.dataList[idx];
  }
  merge(newbd) {
    while (newbd.nameList.length >0) {
      this.append(newbd.nameList.shift(),newbd.dataList.shift());
    }
  }
  merge_top(newbd) {
    while (newbd.nameList.length >0) {
      this.append_top(newbd.nameList.shift(),newbd.dataList.shift());
    }
  }
  last_name() {
    const bdName = this.nameList.slice(-1).shift();
    return bdName;
  }
  first_name() {
    const bdName = this.nameList[0];
    return bdName;
  }
  check_lines(lines) {
    for (let i = 0; i < this.size_y; i++) {
      if (lines[i] == undefined) {
        printConsole(`#ER no data at line ${i}`);
      } else if (lines[i].length != this.size_x) {
        printConsole(`#ER x-size ${lines[i].length} not match ${this.size_x} at line ${i}`);
        //console.log('lines is', lines, 'i', i, 'lines[i].length', lines[i].length);
      } else if (lines[i].match(/^\d+$/) == null) {
        printConsole(`#ER non numeric exists in ${lines[i]} at line ${i}`);
      }
    }
    if (lines.length != this.size_y) {
      printConsole(`#ER y-size ${lines.length} not match ${this.size_y}`);
      //console.log('lines is', lines);
    }
  }
  get_data(name) {
    const data = this.fetch(name);
    const bdfile = new boardFile(data.join('\n'));
    const boardData=bdfile.popData();
    return boardData.data;
  }
  get_lines(name) {
    const data = this.fetch(name);
    //console.log(data);
    const bdfile = new boardFile(data.join('\n'));
    const boardData=bdfile.popData();
    [this.size_x, this.size_y] = [...bdfile.size]
    BOARD_NAME = boardData.name;
    BOARD_HEADER = bdfile.header;
    //BOARD_NAME = bdfile.boardName();
    //const lines = boardData[1][1].split(/\r\n|\n/);
    const lines = boardData.data.slice(-1).shift().split(/\r\n|\n/);
    this.check_lines(lines);
    return [...lines];
  }
  new_board(x, y, m, iterate, safeCellLoc) {
    const rand = BOARD_RAND;
    if (iterate === undefined) {
      rand.use_last_record();
    } else if (iterate == 0) {
      rand.use_current();
    } else {
      // iterate should be >= 1 (rand.seek(0) is equal to rand.seek(1))
      rand.seek(iterate);
      //console.log('new board iterate', iterate, 'found rand iterate (should be iterate-1)', rand.iterate);
    }
    this.boardData = generateBoardData(x, y, m, rand, safeCellLoc);
    return this;
  }
  new_size_mines(step) {
    const bdcfg = getBoardConfig('mybdpackconfig');
    const ratioLowerMap = {low: 0.05, middle: 0.08, high: 0.10, dangerous: 0.13, serious: 0.15, ultra: 0.18}
    const ratioUpperMap = {low: 0.10, middle: 0.15, high: 0.20, dangerous: 0.25, serious: 0.30, ultra: 0.35}
    const SIZE_XY_LOWER = 4;
    const SIZE_XY_UPPER = 20;
    const MINES_RATIO_LOWER = ratioLowerMap[bdcfg.minesRatio];
    const MINES_RATIO_UPPER = ratioUpperMap[bdcfg.minesRatio];
    const MINES_LOWEST = 3;
    const SIZE_X_SLICE = 41;
    const SIZE_Y_SLICE = 23;
    const MINES_SLICE = 11;
    const swvar_x = new swingVar(SIZE_X_SLICE);
    const swvar_y = new swingVar(SIZE_Y_SLICE);
    const swvar_m = new swingVar(MINES_SLICE);
    const size_x = swvar_x.range(SIZE_XY_LOWER, SIZE_XY_UPPER).step(step);
    const size_y = swvar_y.range(SIZE_XY_LOWER, SIZE_XY_UPPER).step(step);
    const size = size_x * size_y;
    const mines_lower = size * MINES_RATIO_LOWER;
    const mines_upper = size * MINES_RATIO_UPPER;
    const mines = swvar_m.range(mines_lower, mines_upper).step(step);
    const prop = {
      size: parseInt(size_x) * parseInt(size_y),
      xs: parseInt(size_x),
      ys: parseInt(size_y),
      ms: parseInt(mines)
    }
    // avoid too small mines
    if (prop.ms < MINES_LOWEST) {
      prop.ms = MINES_LOWEST;
    }
    return prop;
  }
  load(name) {
    const lines = this.get_lines(name);
    printConsole(`load ${BOARD_NAME}`);
    resetBoardForm();
    createBoard(lines);
    initializeBoard();
    removeEventListener();
    addCellEventListener();
    addfinishEventListener();
    printDialog(BOARD_HEADER);
  }
  reset() {
    // without createBoard()
    printConsole('resetting board');
    resetBoardForm();
    initializeBoard();
    removeEventListener();
    addCellEventListener();
    addfinishEventListener();
    printDialog(BOARD_HEADER);
  }
}
class swingVar {
  constructor(step_per_cycle) {
    this.omega = 2.0 * Math.PI / step_per_cycle;
    this.swing = 0.0;
    this.value0 = 0.0;
    this.theta0 = - Math.PI / 2;
  }
  range(upper, lower) {
    this.swing = Math.abs(upper - lower) / 2.0;
    this.value0 = (upper + lower) / 2.0;
    return this;
  }
  step(step) {
    const value = this.swing * Math.sin(this.omega * step + this.theta0) + this.value0;
    return value;
  }
}
function checkSwingVar(step_per_cycle, loopMax) {
  const swvar = new swingVar(step_per_cycle);
  let asin0 = 0;
  for (let i = 0; i < loopMax; i++) {
    const value = swvar.range(10, 20).step(i);
    const sin = (value - 15) / 5;
    const asin = Math.asin(sin)/Math.PI;
    const dasin = asin - asin0;
    asin0 = asin;
    console.log(i, value, parseInt(asin*1000)/10, parseInt(dasin*1000)/10);
  }  
}
function removeEmptyItems(array) {
  let newarray = [];
  for (let i = 0; i < array.length; i++) {
    if (array[i].match(/^\s*$/) == null) {
      // remove head and tail spaces
      newarray.push(array[i].trim().replace(/\s+/g,' '));
    }
  }
  return [...newarray];
}
function createSampleBoardSet() {
  const bdroot = new Board();
  const bdcfg = getBoardConfig('mybdconfig');
  const iterate = undefined;
  const propList = [];
  // x, y, mines
  propList.push([4, 4, 2]);
  propList.push([4, 4, 4]);
  propList.push([5, 5, 3]);
  propList.push([5, 5, 6]);
  propList.push([7, 7, 6]);
  propList.push([7, 7, 12]);
  propList.push([8, 8, 8]);
  propList.push([8, 8, 16]);
  propList.push([9, 9, 10]);
  propList.push([9, 9, 20]);
  propList.push([9, 12, 13]);
  propList.push([9, 12, 26]);
  propList.push([9, 15, 16]);
  propList.push([9, 15, 33]);
  propList.push([10, 10, 12]);
  propList.push([10, 10, 25]);
  propList.push([13, 13, 21]);
  propList.push([13, 13, 42]);
  propList.push([16, 16, 32]);
  propList.push([16, 16, 64]);
  propList.push([17, 17, 36]);
  propList.push([17, 17, 72]);
  propList.push([10, 20, 30]);
  propList.push([10, 20, 40]);
  propList.push([10, 20, 50]);
  propList.push([10, 20, 60]);
  propList.push([10, 20, 70]);
  for (let i = 0; i < propList.length; i++) {
    const argList = propList[i].concat([iterate, bdcfg.safeCellLoc]);
      bdroot.new_board(...argList).push_tail();
  }
  return bdroot;
}
function updateSampleBoardSet() {
  const bdroot = new Board();
  const bdfile = new boardFile('');
  const bdcfg = getBoardConfig('mybdconfig');
  // read all current BDROOT boards 
  for (let bdn = 0; bdn < BDROOT.nameList.length; bdn++) {
    const bdname = BDROOT.nameList[bdn];
    //console.log('current bdn', bdn, bdname);
    const bdprop = bdfile.boardProperty(bdname);
    const iterate = undefined;
    if (bdprop === undefined) {
      printConsole(`skip ${bdname}`);
    } else {
      bdroot.new_board(bdprop.x, bdprop.y, bdprop.mines, iterate, bdcfg.safeCellLoc).push_tail();
    }
  }
  return bdroot;
}
class BoardSelector {
  constructor() {
    this.body = document.getElementById('myselect');
  }
  clean() {
    const options = this.body.options;
    // remove all current selector contents
    while (options.length > 0) options.remove(0);
    return this;
  }
  import(bdroot) {
    for (let bdn = 0; bdn < bdroot.nameList.length; bdn++) {
      let newopt = document.createElement('option');
      newopt.innerText = bdroot.nameList[bdn];
      this.body.appendChild(newopt);
    }
    return this;
  }
}
function createBoardSelector() {
  if (BDROOT.nameList.length > 0) {
    BDROOT = updateSampleBoardSet();
  } else {
    BDROOT = createSampleBoardSet();
  }
  updateBoardSelector();
}
function updateBoardSelector() {
  const bdsel = new BoardSelector();
  bdsel.clean().import(BDROOT);
}
//
// board file
//
class boardFile {
  // filename, boardId, and safeCellLoc can be undefined
  constructor(fileData, fileName, boardId, safeCellLoc) {
    //console.log('fileData',fileData,'fileName',fileName, 'boardId', boardId, 'safeCellLoc', safeCellLoc);
    this.lines = removeEmptyItems(fileData.split(/\r\n|\n/));
    this.fileName = (fileName === undefined) ? 'dummy' : fileName;
    this.header = '';
    this.fnidx = (boardId === undefined) ? 1 : boardId;
    this.size = [];
    this.mines = 0;
    this.safeCellLoc = (safeCellLoc === undefined) ? 'u' : safeCellLoc; // 'u' is unknown or undefined
  }
  isHeader() {
    return (this.lines[0].match(/^(\d+)[ ]+(\d+)/) == null) ? 0 : 1;
  }
  baseFileName() {
    // get basename without extension
    const basenamelist = this.fileName.split('.');
    return (basenamelist.length >= 2) ? basenamelist.slice(0,-1).join('.') : this.fileName;
  }
  boardName() {
    let fname = [];
    const itemList = this.header.split(/[ ]+/);
    if (itemList.length >= 3) {
      // header is <size_x> <size_y> <boardName>
      fname.push(itemList[2]);
    } else {
      // boardName is <size_x>x<size_y>_<mines>_<boardId>_<safeCellLoc>
      fname.push(this.baseFileName());
      fname.push(this.size.join('x'));
      fname.push(this.mines);
      fname.push(this.fnidx++);
      fname.push(this.safeCellLoc);
    }
    // check board name
    if (!/^[a-z]/g.test(fname[0])) {
      printConsole(`#ER board name format error: ${fname[0]}`);
    }
    if (/^[0-9]/.test(fname[0])) {
      printConsole(`#ER board name should not start 0-9 char: ${fname[0]}`);
    }
    return fname.join('_');;
  }
  boardProperty(bdname) {
    // board_7x7_12_31_a
    let propList = bdname.split(/[_x]/);
    if (propList.length >= 6) {
      // id is iterate of rand
      const boardProp = {
        name: propList.shift(),
        x: propList.shift(),
        y: propList.shift(),
        mines: propList.shift(),
        id: propList.shift(),
        safeCellLoc: propList.shift()
      }
      return boardProp;
    } else {
      return undefined;
    }
  }
  boardSize(cellData) {
    //console.log('cellData', cellData);
    let size = [];
    if (this.header != '') {
      size = this.header.split(/[ ]+/).slice(0, 2).map(Number);
      //console.log('size(1)', size);
    } else {
      size = [cellData[0].length, cellData.length];
      //console.log('size(2)', size);
    }
    return [...size];
  }
  boardData(boardName, header, cellData) {
    const data = [header, cellData.join('\n')];
    //const boardData = [boardName, data];
    //console.log('boardData(popData)', boardData);
    //return [...boardData];
    const boardData = {name: boardName, data: data}
    return boardData;
  }
  cat_and_split(dataList) {
    let lines = [];
    const [size_x, size_y] = this.size;
    //console.log('dataList', dataList, 'size_x', size_x, 'size_y', size_y);
    const catdata = String(dataList.join('').replace(/\s|\r|\n/g,''));
    //console.log('catdata', catdata, 'length', catdata.length);
    for (let i = 0; i < catdata.length; i+=size_x) {
      let line = catdata.slice(i, i+size_x);
      //console.log('char', i, 'line', line);
      lines.push(line);
    }
    //console.log('lines', lines);
    return [...lines];
  }
  count_mines(dataList) {
    const catdata = String(dataList.join('').replace(/\s|\r|\n/g,''));
    const regexp = new RegExp(MINES_VALUE, 'g');
    return (catdata.match(regexp) || []).length;
  }
  popData() {
    let cellData = [];
    this.header = '';
    while (this.lines.length > 0) {
      if (this.isHeader()) {
        if (cellData.length == 0) {
          // the 1st line must be a header
          // skip empty board header (header exists, but no cellData)
          this.header = this.lines.shift();
        } else {
          // break at the 2nd met header
          break;
        }
      } else {
        cellData.push(this.lines.shift());
      }
      // next line
    }
    // size determined
    this.size = this.boardSize(cellData);
    // count mines
    this.mines = this.count_mines(cellData);
    // board name determined
    const bdname = this.boardName();
    // header updated by size and bdname
    this.header = [...this.size, bdname].join(' ');
    cellData = this.cat_and_split(cellData);
    return this.boardData(bdname, this.header, cellData);
  }
}
function fileChanged(input, what) {
  const reader = new FileReader(); // FileReader object
  //console.log(input);
  const fileNode = input.files[0];
  if (fileNode !== undefined) {
    // reading file
    const fileName = fileNode.name;
    addFileLoadEventListener(reader, fileName, what);
    reader.readAsText(fileNode);
    printConsole(`read ${fileName}`);
  }
}
function readBoardFile(fileName) {
  // 'this' is binded to reader
  const bdroot = new Board();
  const fileData = this.result;
  const bdfile = new boardFile(fileData, fileName);
  // board file may have many boards
  let boardFound = false;
  while (bdfile.lines.length > 0) {
    let boardData=bdfile.popData();
    printConsole(`found ${boardData.name}`);
    bdroot.push(boardData);
    boardFound = true;
  }
  // choose the first board described in given board file
  if (boardFound) {
    loadfirstBoardandMergeRoot(bdroot);
  }
}
class cellListFile extends boardFile {
  isHeader() {
    // header is <x_size> <y_size> <board_name>
    return (this.lines[0].match(/^(\d+)[ ]+(\d+)[ ]+(\w+)/) == null) ? 0 : 1;
  }
  popData() {
    let cellData = [];
    this.header = '';
    while (this.lines.length > 0) {
      if (this.isHeader()) {
        if (this.header == '') {
          // the 1st line must be a header
          this.header = this.lines.shift();
        } else {
          // break at the 2nd met header
          // break when header exists, but no cellData         
          break;
        }
      } else {
        cellData.push(this.lines.shift());
      }
      // next line
    }
    return cellData;
  }
}
class cellList {
  constructor(lines, bdsize) {
    if (bdsize !== undefined) {
      this.size = {x: bdsize[0], y:bdsize[1]};
    }
    this.locList = [];
    while (lines.length > 0) {
      const eachline = lines.shift();
      const itemList = eachline.split(/[ ]+/);
      //console.log('itemList', itemList);
      if (itemList.length >= 2) {
        const loc = {x:Number(itemList[0]), y:Number(itemList[1])}
        if (bdsize !== undefined) {
          if (!this.check_loc(loc)) {
            this.locList = undefined;
            printConsole('#ER location range error');
            break;
          }
        }
        this.locList.push(loc);
      } else {
        printConsole(`#ER cell list format error: ${eachline}`);
        printConsole('#ER location should be two items <x> <y>');
        // break and clear locList
        this.locList = undefined;
        break;
      }
    }
  }
  check_loc(loc) {
    const ret = ['x', 'y'].find((xy) => {
      if (!this.check_loc_xy(loc, xy)) {
        printConsole(`#ER <${xy}> out of range: (${loc.x}, ${loc.y})`);
        return true;
      }
    });
    return (ret === undefined);
  }
  check_loc_xy(loc, xy) {
    return ((/^[0-9]+$/.test(loc[xy])) && (loc[xy] >= 0) && (loc[xy] < this.size[xy])) ? true:false;
  }
  continue_or_finish() {
    const RDCONFIG = getReadListConfig();
    if (/finish/.test(RDCONFIG)) {
      return false;
    } else {
      return true;
    }
  }
  startSelection(resolve_ss) {
    const board = document.getElementById('myboard');
    const cellElemLists = board.getElementsByTagName('td');
    const cellElemArray = [...cellElemLists];
    (async () => {
      for (let i=0; i < this.locList.length; i++) {
        const index = SIZE_X*this.locList[i].y + this.locList[i].x;
        const cell = new cellElem(index, cellElemArray);
        await wrapaccess(['primary'], cell);
      }
      resolve_ss();
    })();
    return this;
  }
  evalBoard(bdname) {
    if (this.continue_or_finish()) {
      // skip after 2nd board when continue mode selected
      printConsole(`break after reading ${bdname} cell list`);
    } else {
      // finish after all cell lists are accessed
      finishSelection();
    }
    return this;
  }
}
async function evalCellList(bdname, cldata) {
  if (BDROOT.idx(bdname) >= 0) {
    BDROOT.load(bdname);
    //console.log(bdname, 'cell list', cldata.locList);
    await new Promise((resolve_ecl) => {
      cldata.startSelection(resolve_ecl);
    });
    cldata.evalBoard(bdname);
    return true;
  } else {
    printConsole(`#ER no board data found ${bdname}, aborted`);
    return false;
  }
}
function checkCellListFile(fileData, prop) {
  const SHOW_PROGRESS_MIN = 400;
  const clfile = new cellListFile(fileData);
  //let pgCnt = SHOW_PROGRESS_MIN;
  let bdc = 0;
  while (clfile.lines.length > 0) {
    const cellListData = clfile.popData();
    const bdsize = clfile.boardSize();
    const cldata = new cellList(cellListData, bdsize);
    const bdname = clfile.boardName();
    if (cldata.locList === undefined) {
      printConsole(`#ER failed to read ${bdname} cell list, aborted`);
      return false;
    }
    //printConsole(`found ${bdname} cell list`);
    bdc++;
    /*
    if (pgCnt-- <= 0) {
      printConsole(`${bdc} boards found, still reading...`);
      pgCnt = SHOW_PROGRESS_MIN;
    }
    */
    if (BDROOT.idx(bdname) < 0) {
      // generate board data
      const bdfile = new boardFile('');
      const bdprop = bdfile.boardProperty(bdname);
      if (bdprop === undefined) {
        printConsole(`#ER failed to generate ${bdname} board data, aborted`);
        printConsole(`update board name format or input data file including ${bdname}`);
        return false;
      }
      //console.log('new_board prop', bdprop);
      BDROOT.new_board(bdprop.x, bdprop.y, bdprop.mines, bdprop.id, bdprop.safeCellLoc).push_tail();
      updateBoardSelector();
    }
  }
  printConsole(`total ${bdc} board(s) found`);
  prop.bdc = bdc;
  return true;
}
function redrawInterval(step) {
  const MAX_INTVAL = 50;
  const STEP_COEF = 0.5;
  // abs(INIT_TAN / STEP_COEF) = MAX_INTVAL/2 point step
  // step == 0 is tan(x) = INIT_TAN
  const INIT_TAN = -3;
  // full swing is PI/2 * 2 = PI
  const nom_swing = 1/Math.PI;
  const tan = STEP_COEF * step + INIT_TAN;
  return parseInt(MAX_INTVAL * nom_swing * (Math.atan(tan) + Math.PI/2));
}
function printProgress(current, total) {
  const percent = parseInt(current/total * 100);
  printConsole(`${current}/${total} (${percent}%) done`);  
}
async function runCellListFile(fileData, prop) {
  const clfile = new cellListFile(fileData);
  let readEnable = true;
  let redStep = 0;
  let redCnt = redrawInterval(redStep++);
  let bdc = 0;
  while ((clfile.lines.length > 0) && readEnable) {
    const cellListData = clfile.popData();
    const cldata = new cellList(cellListData);
    const bdname = clfile.boardName();
    console.log('bdname', bdname);
    const ret = await evalCellList(bdname, cldata);
    bdc++;
   //console.log('await return', ret);
    if (redCnt-- <= 0) {
      printProgress(bdc, prop.bdc);
      await redraw();
      redCnt = redrawInterval(redStep++);
    }
    if (!ret) {
      // aborted
      readEnable = false;
    }
    if (cldata.continue_or_finish()) {
      // continue (don't finish)
      readEnable = false;
    }
  }
}
async function showElapsed(start, wait) {
  const SHOW_MIN = 1;
  if (wait === undefined) {
    wait = SHOW_MIN;
  }
  await new Promise((resolve_se) => {
    const end = performance.now();
    const elapsed = parseInt(parseInt(end - start) / 100) /10;
    // print message larger than wait
    if (elapsed > wait) {
      printConsole(`elapsed ${elapsed} sec`);
    }
    resolve_se();
  });
}
async function readCellListFile(fileName) {
  // 'this' is binded to reader
  const fileData = this.result;
  const start = performance.now();
  let prop = new Object();
  printConsole(`checking ${fileName} contents`);
  await redraw();
  if (!checkCellListFile(fileData, prop)) {
    return false;
  }
  //console.log('board count', prop.bdc);
  extendAnimation();
  await redraw();
  await runCellListFile(fileData, prop);
  suspendAnimation();
  showElapsed(start);
  return true;
}
function loadLastBoardandMergeRoot(bdroot) {
  if (bdroot.nameList.length > 0) {
    const bdName = bdroot.last_name();
    bdroot.load(bdName);
    // merge new boards to BDROOT
    BDROOT.merge(bdroot);
    updateBoardSelector();
  }
}
function loadfirstBoardandMergeRoot(bdroot) {
  if (bdroot.nameList.length > 0) {
    const bdName = bdroot.first_name();
    bdroot.load(bdName);
    // merge new boards to BDROOT
    BDROOT.merge_top(bdroot);
    updateBoardSelector();
  }
}
function addFileLoadEventListener(reader, fileName, what) {
  //console.log('addFileLoadEventListener', fileName, reader);
  //bind the first reader is referenced as this on calling function
  let bindedHandler = undefined;
  switch (what) {
    case 'board': bindedHandler = readBoardFile.bind(reader, fileName); break;
    case 'cellList': bindedHandler = readCellListFile.bind(reader, fileName); break;
  }
  reader.addEventListener('load', bindedHandler);
}
function createCustomBoard() {
  const bdroot = new Board();
  const bdcfg = getBoardConfig('mybdconfig');
  const iterate = undefined;
  const cstmx = document.getElementById('mycstmx');
  const cstmy = document.getElementById('mycstmy');
  const cstmm = document.getElementById('mycstmmines');
  if ((cstmx.value != '') && (cstmy.value != '') && (cstmm.value != '')) {
    bdroot.new_board(cstmx.value, cstmy.value, cstmm.value, iterate, bdcfg.safeCellLoc).push_top();
    //console.log('x', cstmx.value, 'y', cstmy.value, 'm', cstmm.value);
    const bdName = bdroot.first_name();
    printConsole(`create ${bdName}`);
    // choose the first board described in given board file
    loadfirstBoardandMergeRoot(bdroot);
  }
}
function addSelectEventListener() {
  const bdsel = document.getElementById('myselect');
  const loadbtn = document.getElementById('myselectload');
  const configbtn = document.getElementById('myselectreconfig');
  const cstmbtn = document.getElementById('mycstmload');
  
  // board selection from select tag
  loadbtn.addEventListener('click', function(){
    const bdname = bdsel.value;
    printConsole(`select ${bdname}`);
    BDROOT.load(bdname);
  });
  // board selection from safe cell configuration
  configbtn.addEventListener('click', function(){
    printConsole('update board selector');
    createBoardSelector();
    if (BDROOT.nameList.length > 0) {
      const bdName = BDROOT.first_name();
      BDROOT.load(bdName);
    }
  });
  // board selection from custom size
  cstmbtn.addEventListener('click', function(){
    createCustomBoard();
  });
}
// formid is mybdconfig or mybdpackconfig
function getBoardConfig(formid) {
  // CSS selector = #<id_name>
  const confForm = document.querySelector(`#${formid}`);
  const safeCellLoc = (confForm.bdsafe !== undefined) ? confForm.bdsafe.value : 'auto';
  const minesRatio = (confForm.bdmsratio !== undefined) ? confForm.bdmsratio.value : 'low';
  const bdconfig = {safeCellLoc: safeCellLoc, minesRatio: minesRatio}
  //console.log('bdconfig', formid, bdconfig);
  return bdconfig;
}
function getReadListConfig() {
  // CSS selector = #<id_name>
  const rdconfig = document.querySelector('#mybdconfig').readlist.value;
  //console.log('rdconfig', rdconfig);
  return rdconfig;
}
function getBoardPackSize() {
  const bdcount = document.getElementById('mybdcount').value;
  //console.log('bdcount', bdcount);
  return bdcount;
}
function resetBoardForm() {
  const resetForm = document.getElementById('mybdplay');
  resetForm.reset();
}
// reset event listener is defined in html when start-up
function addResetEventListener() {
  //const resetForm = document.getElementById('mybdplay');
  //resetForm.addEventListener('reset', function(event) {
  const resetBtn = document.getElementById('myreset');
  resetBtn.addEventListener('click', function(){
    const bdroot = new Board();
    bdroot.reset();
    //console.log('resetting');
  });
}
function downloadText(text, statusBox, fname) {
  if (text == '') {
    statusBox.value = 'empty';
  } else {
    const blob = new Blob([text], {type:'text/plain'});
    const dllink = document.createElement('a');
    dllink.download = fname;    
    dllink.href = URL.createObjectURL(blob);
    dllink.click();
    // Android Chrome is error when empty log. time out avoids the error
    setTimeout(() => {
	URL.revokeObjectURL(dllink.href)
	}, 5000);
    statusBox.value = fname;
  }
}
function findBoardName() {
  return (!BOARD_NAME.match(/unknown/) && (BOARD_NAME !== undefined));
}
function fetchBoardData() {
  const lines = (findBoardName()) ? BDROOT.get_data(BOARD_NAME) : ['<no_board_data>'];
  return (lines.join('\n') + '\n');
}
function fetchDialogMsg() {
  const dialogBox = document.getElementById('mydialog');
  const msg = (dialogBox.value == '') ? '<no_dialog_data>' : dialogBox.value;
  return (msg + '\n');
}
function fetchSummary() {
  const table = document.getElementById('mysummary');
  const cells = table.querySelectorAll('td');
  let msg = (cells.length == 0) ? '<no_summary_data>' : '';
  for (let row of table.rows) {
    let line = [];
    for(let cell of row.cells){
      console.log(cell.innerText);
      line.push(cell.innerText);
    }
    msg += line.join(',');
    msg += '\n';
  }
  return msg
}
function fetchBoardDataPack() {
  const bdc = getBoardPackSize();
  const lines = generateBoardDataPack(bdc);
  return (lines.join('\n') + '\n');
}
function fetchBoardDataList() {
  const bdc = getBoardPackSize();
  const lines = generateBoardDataList(bdc);
  return (lines.join('\n') + '\n');
}
function downloadBoard(statusBox, event) {
  const text = fetchBoardData();
  //console.log('text', text);
  const bdname = (findBoardName()) ? BOARD_NAME : 'board';
  const fname = `${bdname}.txt`
  downloadText(text, statusBox, fname);
}
function downloadDialog(statusBox, event) {
  const text = fetchDialogMsg();
  //console.log('text', text);
  const bdname = (findBoardName()) ? BOARD_NAME : 'cell';
  const fname = `select_${bdname}.txt`
  downloadText(text, statusBox, fname);
}
function dateStr() {
  const today = new Date();
  const yymmdd = today.toLocaleDateString('ja-JP',{
    year: '2-digit',
    month: '2-digit',
    day: '2-digit'
  }).replaceAll('/','');
  const hhmmss = today.toLocaleTimeString('ja-JP',{
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replaceAll(':','');
  return `${yymmdd}_${hhmmss}`;
}
function downloadSummary(statusBox, event) {
  const text = fetchSummary();
  //console.log('text', text);
  const datetime = dateStr();
  const fname = `score_summary_${datetime}.csv`
  downloadText(text, statusBox, fname);
}
function boardPackName(data) {
  const bdc = getBoardPackSize();
  const bdcfg = getBoardConfig('mybdpackconfig');
  const fname = `board_${data}_${bdc}_${bdcfg.safeCellLoc}_${bdcfg.minesRatio}.txt`;
  return fname;
}
function downloadPack(statusBox, event) {
  const text = fetchBoardDataPack();
  const fname = boardPackName('pack');
  downloadText(text, statusBox, fname);
}
function downloadList(statusBox, event) {
  const text = fetchBoardDataList();
  const fname = boardPackName('list');
  downloadText(text, statusBox, fname);
}
// cell selection log download
function addDownloadEventListener() {
  const dlBtn1 = document.getElementById('mydownloadbd');
  const dlBtn2 = document.getElementById('mydownloadlog');
  const dlBtn3 = document.getElementById('mydownloadsummary');
  const dlBtn4 = document.getElementById('mydownloadpack');
  const dlBtn5 = document.getElementById('mydownloadlist');
  const statusBox1 = document.getElementById('mydownloadbdstatus');
  const statusBox2 = document.getElementById('mydownloadlogstatus');
  const statusBox3 = document.getElementById('mydownloadsummarystatus');
  const statusBox4 = document.getElementById('mydownloadpackstatus');
  const statusBox5 = document.getElementById('mydownloadliststatus');
  const bindedHandler1 = downloadBoard.bind(dlBtn1, statusBox1);
  const bindedHandler2 = downloadDialog.bind(dlBtn2, statusBox2);
  const bindedHandler3 = downloadSummary.bind(dlBtn3, statusBox3);
  const bindedHandler4 = downloadPack.bind(dlBtn4, statusBox4);
  const bindedHandler5 = downloadList.bind(dlBtn5, statusBox5);
  dlBtn1.addEventListener('click', bindedHandler1);
  dlBtn2.addEventListener('click', bindedHandler2);
  dlBtn3.addEventListener('click', bindedHandler3);
  dlBtn4.addEventListener('click', bindedHandler4);
  dlBtn5.addEventListener('click', bindedHandler5);
}
function addUploadEventListener() {
  const ulBtn = document.getElementById('myupload');
  const listInput = document.getElementById('mylist');
  ulBtn.addEventListener('click', function(){
    listInput.click();
  });
  listInput.addEventListener('change', function(){
    fileChanged(this, 'cellList');
    // remove value to trigger event when the same file reading
    listInput.value = '';
  });
}
function initializeBoard() {
  //reset score and visibility
  SCORE = 0;
  VISIBILITY = 0;
  flagUpdate('init');
  BDROOT.closed = false;
  //BDROOT.touchList = [];
}
function removeEventListener() {
  const board = document.getElementById('myboard');
  const cellElemLists = board.getElementsByTagName('td');
  const button = document.getElementById('myfinish');
  //remove previous event on adding from addCellEventListener()
  for (let i=0; i < cellElemLists.length; i++) {
    // to remove event, clone previous node and replace with it
    const clonedCell = cellElemLists[i].cloneNode(true);
    cellElemLists[i].replaceWith(clonedCell);
  }
  //remove previous event on adding from addfinishEventListener()
  {
    const clonedCell = button.cloneNode(true);
    button.replaceWith(clonedCell);
  }
}
function flagUpdate(task) {
  switch (task) {
    case 'init': FLAG_UPDATE = 0; break;
    case 'on': FLAG_UPDATE = 1; break;
    case 'off': FLAG_UPDATE = 0; break;
    case 'toggle':
      FLAG_UPDATE = !FLAG_UPDATE;
      const cells = new untouchCellTask();
      if (FLAG_UPDATE) {
        // enter flag update mode
        // recover flagged cell event listener from access lock
        cells.addFlagEventListener();
      } else {
        // exit flag update mode
        cells.removeAllEvents();
        // previous cells are destroyed, dont' use cells
        // refresh needed because node pointer changed by removing events using cloneNode()
        const cells2 = new untouchCellTask();
        cells2.refreshAddEventListener();
      }
      break;
  }
  printFUstatus();
}
function addCellEventListener() {
  const board = document.getElementById('myboard');
  const cellElemLists = board.getElementsByTagName('td');
  // cellElemLists is NodeList, not Array
  // convert NodeList to Array to use indexOf which supports only an Array
  const cellElemArray = [...cellElemLists];
  // foreach table cell
  for (let i=0; i < cellElemArray.length; i++) {
    const cell = new cellElem(i, cellElemArray);
    // reset touch class from each cell
    cell.init();
    cell.addEventListener();
    /*
    cellElemArray[i].addEventListener('click', function(){
      // const cellElemArray = [...cellElemLists];
      // get click position. upper left is 0 and start from 0,1,2,..IDX_MAX
      //const tableIndex = cellElemArray.indexOf(this);
      //const cell = new cellElem(tableIndex, cellElemArray);
      //use above cell object created by for loop, instead of creating inside function
      cell.access(['primary']);
    }, {once: true});
    */
  }
}
function createBoard(lines) {
  const board = document.getElementById('myboard');
  let count_x = 0;
  let count_y = 0;
  // reset global
  SIZE_Y = 0;
  SIZE_X = 0;
  IDX_MAX = 0;
  // delete previous table row
  while (board.rows.length > 0) board.deleteRow(0);
  // console.log(lines);
  for (let line = 0; line < lines.length; line++) {
    // console.log(line + ' --> ' + lines[line]);
    let tline = document.createElement('tr');
    //tline.innerText = lines[line];
    const chars = lines[line].split('');
    if (chars.length == 0) {
      // skip empty line
      continue;
    } else {
      count_y++;
    }
    count_x=0;
    for (let char = 0; char < chars.length; char++) {
      // console.log('(' + char + ')' + ' --> ' + chars[char]);
      if (!/[0-9]/.test(chars[char])) {
        // skip non number
        continue;
      } else {
        count_x++;
      }
      let tchar = document.createElement('td');
      tchar.innerText = chars[char];
      tchar.className = 'init invisible';
      tline.appendChild(tchar);
    }
    // append one row at the end of table
    board.appendChild(tline);
    if (SIZE_X == 0) {
      // horizontal size
      SIZE_X = count_x;
    }
  }
  // vertical size
  SIZE_Y = count_y;
  // the last index of table cell
  IDX_MAX = SIZE_X * SIZE_Y -1;
}
class untouchCellTask {
  constructor() {
    this.untouchCells = [];
    const board = document.getElementById('myboard');
    const cellElemLists = board.getElementsByTagName('td');
    const cellElemArray = [...cellElemLists];
    for (let i=0; i < cellElemArray.length; i++) {
      const cell = new cellElem(i, cellElemArray);
      if (!cell.isTouch()) {
        this.untouchCells.push(cell);
      }
    }
  }
  foreach(task) {
    for (let i=0; i < this.untouchCells.length; i++) {
      task(this.untouchCells[i])
    }
    return this;
  }
  toggleVisibility() {
    const task = (cell) => {
      if (VISIBILITY) {
        //console.log('visible-off', i);
        cell.invisible();
      } else {
        //console.log('visible-on', i);
        cell.visible();
      }
    }
    this.foreach(task);
    VISIBILITY = !VISIBILITY;
    return this;
  }
  countPenalty() {
    const task = (cell) => { countScore(cell, 'penalty'); }
    return this.foreach(task);
  }
  closure() {
    const task = (cell) => { cell.close(); }
    return this.foreach(task);
  }
  countAlive() {
    let counter = 0;
    const task = (cell) => {
      if (!cell.isBomb()) {
        counter++;
      }
    }
    this.foreach(task);
    return counter;
  }
  addFlagEventListener() {
    const task = (cell) => {
      if (cell.isFlag()) {
        // put event listener for flagged cells
        // listening event of removing flag
        cell.addEventListener();
      }
    }
    return this.foreach(task);
  }
  removeAllEvents() {
    const task = (cell) => {
      const clonedCell = cell.node.cloneNode(true);
      cell.node.replaceWith(clonedCell);
    }
    // event listener of previous cell.list are destroyed, renew cell.list to access event listener
    return this.foreach(task);
  }
  refreshAddEventListener() {
    const task = (cell) => {
      //console.log('refresh', cell);
      if (!cell.isFlag()) {
        // put event listener for un-flagged cells
        cell.addEventListener();
      }
    }
    return this.foreach(task);
  }
}
function toggleVisibility() {
  const cells = new untouchCellTask();
  cells.toggleVisibility();
}
class SummaryTable {
  constructor() {
    this.body = document.getElementById('mysummary');
    if (this.body.rows.length == 0) {
      this.title();
    }
    this.total = 0;
    this.trial = 1;
  }
  clean() {
    // delete previous table row
    while (this.body.rows.length > 0) this.body.deleteRow(0);
    return this;
  }
  title() {
    this.append(['trial','board name', 'score', 'total']);
  }
  append(items) {
    const tline = document.createElement('tr');
    // items[0] depends on title()
    const ttag = (items[0] == 'trial') ? 'th' : 'td';
    const align =[ 'right', 'left', 'right', 'right'];
    for (let i = 0; i < items.length; i++) {
      const tdata = document.createElement(ttag);
      tdata.innerText = items[i];
      tdata.className = 'mssummary ' + align[i];
      tline.appendChild(tdata);
    }
    this.body.appendChild(tline);
    return this;
  }
  put(board_name, score) {
    score = Number(score);
    const scoreStr = (score < 0) ? `(${score}) 0` : score;
    if (score > 0) {
      this.total += score;      
    }
    const trial = this.trial++;
    const totalStr = this.total;
    const items = [trial, board_name, scoreStr, totalStr];
    this.append(items);
    return this;
  }
}
function finishSelection() {
  if (!BDROOT.closed) {
    const cells = new untouchCellTask();
    cells.countPenalty().closure();
    printResult(SCORE);
    // clear board event listener
    removeEventListener();
    printConsole('selection finished');
    // create summary table
    if (SUMMARY === undefined) {
      SUMMARY = new SummaryTable();
    }
    SUMMARY.put(BOARD_NAME, SCORE);
    // board closed
    BDROOT.closed = true;
  }
}
function addfinishEventListener() {
  const button = document.getElementById('myfinish');
  button.addEventListener('click', finishSelection, {once: true});  
}
class randomparam {
  constructor() {
    /*
    this.a = 373;
    this.b = 1779;
    this.m = 52397;
    this.seed = [3456];
    */
    // these are prime number of YYYYMMDD
    this.a = 20250101;
    this.b = 20250413;
    this.m = 20250809;
    this.seed = [20251229];    
    this.bp = 0;
    this.value = this.seed[0];
    this.iterate = 0;
    this.hist = [];
    // record the first data set
    this.record();
  }
  update(newValue) {
    let loop = 0;
    for (let j=0; j < this.seed.length; j++) {
      if (newValue == this.seed[j]) {
        loop = 1;
        break;
      }
    }
    if (loop) {
      // use the last updated seed
      newValue = this.seed[0];
      newValue++;
      this.bp++;
      this.seed.unshift(newValue);
      //console.log('update seed', this.seed);
    }
    return newValue;
  }
  next() {
    let newValue = (this.a*this.value + this.b + this.bp) % this.m;
    this.value = this.update(newValue);
    this.iterate++;
    let normalize = this.value / this.m;
    //console.log('random value', this.value, 'iterate', this.iterate);
    if (this.iterate % 100 == 0) {
      // record from the first rand whose this.iterate is 1
      this.record();
    }
    return normalize;
  }
  record() {
    // record larger internal data than hist
    if ((this.hist.length == 0) || (this.hist[0].iterate < this.iterate)) {
      const rd = {a:this.a, b:this.b, m:this.m, seed:[...this.seed], bp:this.bp, value:this.value, iterate:this.iterate}
      this.hist.unshift(rd);
      //console.log('record (',this.hist.length,')', this.hist[0]);
    }
  }
  use_current() {
    // nothing done
    return this;
  }
  use_last_record() {
    if ((this.hist.length > 0) && (this.hist[0].iterate > this.iterate)) {
      this.use_record(0);
    }
    return this;
  }
  use_nearest_record(iterate) {
    //console.log('use nearest iterate', iterate, 'hist top', this.hist[0].iterate, 'current iterate', this.iterate);
    if ((this.hist.length > 0) && (this.hist[0].iterate >= iterate)) {
      const idnear = this.hist.findIndex(function(rd){
        //console.log('seek iterate', iterate, 'hist iterate', rd.iterate);
        return rd.iterate <= iterate;
      });
      if (idnear >= 0) {
        this.use_record(idnear);
      }
      //console.log('idnear', idnear, 'hist length', this.hist.length);
    }
    return this;
  }
  use_record(histId) {
    if (this.hist.length > 0) {
      const rd = this.hist[histId];
      //console.log('assign record', histId, rd);
      Object.assign(this, rd);
    }
    return this;
  }
  seek(iterate) {
    // generateBoardData discards the first rand
    // seek (iterate -1)
    //console.log('seek hist', iterate, 'hist top', this.hist[0].iterate);
    // record current date set when rewinding iterate
    if ((this.hist.length > 0) && (this.hist[0].iterate > iterate)) {
      this.record();
    }
    // find iterate -1
    if (iterate > 0) {
      iterate--;
    }
    this.use_nearest_record(iterate);
    // stop when equivalent iterate
    while (this.iterate < iterate) {
      this.next();
    }
    return this;
  }
}
// check randomparam distribution
// checkRandDist(100000, 10);
function checkRandDist(loop, binSize) {
  const LOOP_MAX = 1.0e+6;
  const rand = BOARD_RAND;
  let bin = [];
  for (let i=0; i < binSize; i++) {
    bin[i] = 0;
  }
  if (loop > LOOP_MAX) {
    let choise = confirm(`loop ${loop} should be limited to ${LOOP_MAX} for browser performance`);
    if (!choise) {
      return false;
    }
  }
  for (let i=0; i < loop; i++) {
    const nomval = rand.next();
    const slice = parseInt(nomval * binSize);
    //console.log('nomval', nomval);
    bin[slice]++;
  }
  for (let i=0; i < binSize; i++) {
    console.log('%d %d %f', i, bin[i], parseInt(bin[i]/loop*100*100)/100);
  }
  return true;
}
function compNum(a,b) {return (a-b);}
class safeZone {
  constructor(size_x, size_y, mcount) {
    this.cells = [];
    this.prop = {
      size: size_x * size_y,
      xs: size_x,
      ys: size_y,
      xmax: size_x-1,
      ymax: size_y-1
    }
    this.enable = {corner: false, center: false}
    this.untouch = {min: 0, cur: this.prop.size - mcount}
    this.locList = [];
  }
  test_and_push(loc) {
    const index = this.prop.xs*loc.y + loc.x;
    //console.log('untouchCellMin', this.untouch.min, 'untouchCellSizeInitial', this.untouch.cur, 'index', index);
    if (this.untouch.cur > this.untouch.min) {
      // threshold is untouch cell count lower limit
      // when safe cell +1, untouch cell -1
      if (this.cells.indexOf(index) < 0) {
        // skip already existing safe cell
        this.cells.push(index);
        this.untouch.cur--;
      }
    }
  }
  enable_safe_cell(safeCellLoc) {
    if (/auto/.test(safeCellLoc)) {
      const oddBoard = ((this.prop.xs % 2) && (this.prop.ys % 2)) ? true : false;
      this.enable = {corner: !oddBoard, center: oddBoard}
    } else {
      this.enable.corner = (/corner|both/.test(safeCellLoc)) ? true : false;
      this.enable.center = (/center|both/.test(safeCellLoc)) ? true : false;
    }
  }
  points_corner() {
    this.locList = [];
    if (this.enable.corner) {
      for (let y=0; y < this.prop.ys; y+=this.prop.ymax) {
        for (let x=0; x < this.prop.xs; x+=this.prop.xmax) {
          const loc = {x:x, y:y}
          this.locList.push(loc);
        }
      }
    }
    return this;
  }
  points_center() {
    this.locList = [];
    if (this.enable.center) {
      for (let y=parseInt((this.prop.ys-0.1) / 2); y <= parseInt(this.prop.ys / 2); y++) {
        for (let x=parseInt((this.prop.xs-0.1) / 2); x <= parseInt(this.prop.xs / 2); x++) {
          const loc = {x:x, y:y}
          this.locList.push(loc);
        }
      }
    }
    return this;
  }
  points_pivot(loc) {
    this.locList = [];
    const USE_ADJCELL_WIDTH_MIN = 6;
    const x_idx = (this.prop.xs > USE_ADJCELL_WIDTH_MIN) ? pibotAdjacent(loc.x, 0, this.prop.xmax) : [loc.x];
    const y_idx = (this.prop.ys > USE_ADJCELL_WIDTH_MIN) ? pibotAdjacent(loc.y, 0, this.prop.ymax) : [loc.y];
    for (let i=0; i < x_idx.length; i++) {
      for (let j=0; j < y_idx.length; j++) {
        const loc = {x:x_idx[i], y:y_idx[j]}
        this.locList.push(loc);
      }
    }
    return this;
  }
  pivot_test_points() {
    const origLocList = [...this.locList];
    for (let i=0; i < origLocList.length; i++) {
      this.points_pivot(origLocList[i]).test_points();
    }
    return this;
  }
  test_points() {
    for (let i=0; i < this.locList.length; i++) {
      this.test_and_push(this.locList[i]);
    }
    return this;
  }
}
function createSafeCells(size_x, size_y, mcount, safeCellLoc) {
  // MINES : UNTOUCH = 1 : 1
  const USE_SAFECELL_MINE_RATIO_MIN = 1.0;
  // MINES : UNTOUCH = 1 : 2.5
  const USE_ADJCELL_MINE_RATIO_MIN = 2.5;
  // SAFE_CELL + MINES + UNTOUCH = cellSize
  // untouchCellMin1 is corner SAFE_CELL count max
  // SAFE_CELL(max) = cellSize - MINES - UNTOUCH(=MINES * USE_SAFECELL_MINE_RATIO_MIN)
  //                = cellSize - MINES * (1 + USE_SAFECELL_MINE_RATIO_MIN)
  const untouchCellMin1 = parseInt(mcount * USE_SAFECELL_MINE_RATIO_MIN);
  // untouchCellMin2 is 3-side SAFE_CELL count max of corner SAFE_CELL
  // SAFE_CELL(max) = cellSize - MINES - UNTOUCH(=MINES * USE_ADJCELL_MINE_RATIO_MIN)
  //                = cellSize - MINES * (1 + USE_ADJCELL_MINE_RATIO_MIN)
  const untouchCellMin2 = parseInt(mcount * USE_ADJCELL_MINE_RATIO_MIN);
  const sfz = new safeZone(size_x, size_y, mcount);
  sfz.enable_safe_cell(safeCellLoc);

  // corner SAFE_CELL
  sfz.untouch.min = untouchCellMin1;
  sfz.points_corner().test_points();
  
  // 3-side SAFE_CELL of corner SAFE_CELL
  sfz.untouch.min = untouchCellMin2;
  sfz.points_corner().pivot_test_points();

  // center SAFE CELL
  // when enable, even size will use 2-center cells of each x and y
  // when x is even, y is odd, use x is 2-center, y is 1-center
  sfz.untouch.min = untouchCellMin1;
  sfz.points_center().test_points();

  // 8-side SAFE_CELL of center SAFE_CELL
  sfz.untouch.min = untouchCellMin2;
  sfz.points_center().pivot_test_points();

  return sfz.cells.sort(compNum);
}
function createMines(rand, cellCount, minesCount, safeCell) {
  if (minesCount >= cellCount) {
    // mines count is limited by cell count (-1)
    minesCount = cellCount -1;
    printConsole(`limit mines to ${minesCount}`);
  }
  let mines = [];
  for (let i=0; i < minesCount; i++) {
    let value = 0;
    do {
      while (mines.length > (cellCount - safeCell.length)) {
        safeCell.pop();
      } 
      value = parseInt(rand.next() * cellCount);
    } while ((mines.indexOf(value) >= 0) || (safeCell.indexOf(value) >= 0));
    mines.push(value);
  }
  //console.log('mines', mines);
  return [...mines];
}
function createCellElemArray(cellSize, mines) {
  const cellElemArray = []; 
  for (let i=0; i < cellSize; i++) {
    let value = 0;
    if (mines.indexOf(i) >= 0) {
      value = MINES_VALUE;
    }
    const node = new cellElemNode(value);
    cellElemArray.push(node);
  }
  //console.log(cellElemArray);
  return [...cellElemArray];
}
// generate board. return 'boardName' 'dataList...'
// distroy SIZE_X and SIZE_Y
function generateBoardData(size_x, size_y, minesCount, rand, safeCellLoc) {
  // avoid mines to be put at 4-corner reagion
  const USE_SAFE_ZONE = 1;
  const MIN_SIZE = 2;
  if ((size_x < MIN_SIZE) || (size_y < MIN_SIZE)) {
    return undefined;
  }
  SIZE_X = size_x;
  SIZE_Y = size_y;
  // skip the first rand to generate rand.iterate
  const discard = rand.next();
  const boardId = rand.iterate;
  const cellSize = size_x * size_y;
  const safeCell = USE_SAFE_ZONE ? createSafeCells(size_x, size_y, minesCount, safeCellLoc) : [];
  //console.log('safeCell', `${size_x}x${size_y}_${minesCount}`, getBoardConfig(), safeCell);
  const mines = createMines(rand, cellSize, minesCount, safeCell);
  //console.log('mines', mines);
  const cellElemArray = createCellElemArray(cellSize, mines);
  let cellData = '';
  for (let i=0; i < cellElemArray.length; i++) {
    const cell = new cellElem(i, cellElemArray);
    if (!cell.isBomb()) {
      // count around bomb and write its count to innerText of cell
      const pbtcells = new pibotCellList(cell, ['primary']);
      const pbtIndex = pbtcells.region().pivotLocation().pivotIndex();
      cell.putQueue(pbtIndex).count_and_put_mines();
    }
    // update cell.value to cell.node.innerText
    cell.update();
    cellData += cell.value;
    // append newline at the tail of size_x
    if (((i+1) % size_x)==0) {
      cellData += '\n';
    }
  }
  const bdfile = new boardFile(cellData, 'board', boardId, safeCellLoc);
  const boardData=bdfile.popData();
  //console.log(boardData);
  //return [...boardData];
  return boardData;
}
function createParamBoard(step, bdconfig) {
  const bdroot = new Board();
  const prop = bdroot.new_size_mines(step);
  // iterate 0 means to use current iterate following previous
  const iterate = 0;
  bdroot.new_board(prop.xs, prop.ys, prop.ms, iterate, bdconfig.safeCellLoc).push_top();
  const bdName = bdroot.first_name();
  const lines = bdroot.get_data(bdName);
  return lines;
}
function generateBoardDataPack(count, start_iterate) {
  const USE_RANDOM_STEP = 1;
  const STEP_RANGE = 7;
  const step_rand = new randomparam();
  const rand = BOARD_RAND;
  // use different bdconfig from playing form mybdplay which uses mybdconfig
  const bdcfg = getBoardConfig('mybdpackconfig');
  if (start_iterate === undefined) {
    start_iterate = 1;
  }
  rand.seek(start_iterate);
  let lines = [];
  let step = 0;
  for (let i=0; i < count; i++) {
    if (USE_RANDOM_STEP) {
      step = step + 1 + parseInt(STEP_RANGE * step_rand.next());
    } else {
      step = STEP_RANGE * i;
    }
    const newlines = createParamBoard(step, bdcfg);
    const newdata = newlines.join('\n') + '\n';
    lines.push(newdata);
  }
  return lines;
}
function generateBoardDataList(count, start_iterate) {
  let USE_HEADER = 1;
  let lists = [];
  const lines = generateBoardDataPack(count, start_iterate);
  for (let i=0; i < lines.length; i++) {
    const bdfile = new boardFile(lines[i]);
    bdfile.popData();
    if (USE_HEADER) {
      lists.push(bdfile.header);
    } else {
      const bdname = bdfile.boardName();
      lists.push(bdname);
    }
  }
  return lists;
}
// doesn't work while await accessCell()
/*
async function countUpLoading(ldcnt) {
  // use as countUpLoading(+1);
  const layer = document.getElementById('mycoverall');
  const loading = document.getElementById('myloading');
  const isInvisible = layer.classList.contains('invisible');
  console.log('invisible', isInvisible, 'ldcnt', ldcnt);
  await repaint();
  if (!isInvisible) {
*/
//    const newtext = loading.innerText.replace(/\s+.*/, '') + ` ${ldcnt}`;
/*
    loading.innerText = newtext;
    console.log('innerText', loading.innerText);
    return new Promise((resolve_cul) => {
      setTimeout(() => {
        let int = Number(ldcnt) +1;
        countUpLoading(int);
        resolve_cul();
      }, 1000);
    });
  }
}
*/