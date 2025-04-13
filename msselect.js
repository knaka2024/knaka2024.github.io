// Minesweeper control program by keisuke Nakamura (2025/3/23)
// dummy cell element node
class cellElemNode {
  constructor(value) {
    this.innerHTML = value;
  }
}
class cellElem {
  constructor(index, elemList) {
    // array pointer
    this.list = elemList;
    this.index = index;
    this.node = this.list[this.index];
    this.value = this.node.innerHTML;
  }
  location(givenIndex) {
    let myindex = (givenIndex !== undefined) ? givenIndex : this.index;
    const x = myindex % SIZE_X;
    const y = parseInt(myindex / SIZE_X);
    return [x,y];
  }
  update() {
    this.value = this.node.innerHTML;
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
  }
  bomb() {
    let node = this.node;
    node.classList.add('bomb');
  }
  untouch() {
    let node = this.node;
    node.classList.remove('touch');
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
  access(source) {
    if (source.slice(-1).shift() == 'primary') {
      if (!this.isTouch() && !this.isFlag() && !FLAG) {
        const [x, y] = this.location();
        printDialog(`${x} ${y}`);
      }
    }
    accessCell(this.index, this.list, this, source);
  }
  score() {
      let incr = Number(this.value);
      if (this.isBomb()) {
        incr = -20;
      }
      return incr;
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
  resultBox.value = msg;  
  // print to console
  printConsole(`score ${finalScore} ${BOARD_NAME}`);
}
function printStatus() {
  const statusBox = document.getElementById('mystatus');
  let msg = FLAG ? 'on' : 'off';
  statusBox.value = msg;  
  // print to console
  printConsole(`flag ${msg}`);
}
function printRemain(msg) {
  const remainBox = document.getElementById('myremain');
  remainBox.value = msg;  
  // print to console
  printConsole(`remaining ${msg}`);
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
function accessCell(index, cellElemArray, cell, source) {
  if (!cell.checkRange()) {
    // out of range
    console.log('#ER index out of range', index);
    return 0;
  }
  if (cell.isTouch()) {
    console.log('skip', index, source);
  } else if (FLAG) {
    if (cell.isFlag()) {
      console.log('flag off', index, source);
      cell.unflag();
      addEachCellEventListener(cell);
    } else {
      console.log('flag on', index, source);
      cell.flag();
    }
    // exit from flag update mode
    flagUpdate('toggle');
  } else if (cell.isFlag() && (source.slice(-1).shift == 'primary')) {
    console.log('skip flag', index, source);
  } else {
    cell.touch();
    // remove flag automatically
    cell.unflag();
    console.log('touch', index, source);
    if (cell.isEmpty()) {
      console.log('empty', index, source);
      // pivot to expand reagion
      pivotCell(index, cellElemArray, cell, 'expand_region', source);
    } else if (cell.isBomb()) {
      cell.bomb();
      const [x, y] = cell.location();
      printConsole(`bomb!! (${x},${y})`);
    }
    // count score
    countScore(cell, 'obtain');
    // check all alive cells touched
    const remains = foreachUntouchCells('countAlive');
    printRemain(remains);
    if (remains == 0) {
      finishSelection();
    }
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
// pivot around given index (board location)
function pivotCell(index, cellElemArray, cell, task, source) {
  const SKIP_SAME_LOC_AS_SOURCE = 1;
  let pivot = [];
  const [x, y] = cell.location();
  let x_idx = pibotAdjacent(x, 0, SIZE_X-1);
  let y_idx = pibotAdjacent(y, 0, SIZE_Y-1);
  if (SKIP_SAME_LOC_AS_SOURCE && (source !== undefined)) {
    // Cut the first 'primary' and choose the last index (previous index)
    const traced = source.slice(1).slice(-1);
    for (let i=0; i < traced.length; i++) {
      const [tx, ty] = cell.location(traced[i]);
      //console.log('pivot', index, 'traced', traced, `(${tx}, ${ty})`, 'x_idx', x_idx, 'y_idx', y_idx);
      const tx_idx = x_idx.indexOf(tx);
      const ty_idx = y_idx.indexOf(ty);
      // remove previous tx or ty from pivot list when location changed from previous
      // x=3, tx=2, x_idx=[2,3,4], but previous tx=2 already traced
      if ((tx != x) && (tx_idx >= 0)) {
        x_idx.splice(tx_idx, 1);
      }
      if ((ty != y) && (ty_idx >= 0)) {
        y_idx.splice(ty_idx, 1);
      }
      //console.log('modified', 'x_idx', x_idx, 'y_idx', y_idx);
    }
  }
  for (let i=0; i < x_idx.length; i++) {
    for (let j=0; j < y_idx.length; j++) {
      pivot.push(SIZE_X*y_idx[j] + x_idx[i]);
    }
  }
  //console.log('pivot', index, 'are', pivot);
  let mines = 0;
  for (let i=0; i < pivot.length; i++) {
    if (pivot[i]!=index) {
      const adjCell = new cellElem(pivot[i], cellElemArray);
      const [adjx, adjy] = adjCell.location();
      //console.log('pivot', pivot[i], '('+adjx, adjy+')', 'value', adjCell.value, 'i', i, 'index', index);
      //console.log('pivot from', index, 'to', pivot[i],'('+i+'/'+pivot.length+')');
      switch (task) {
        case 'expand_region':
          adjCell.access(source.concat([index]));
          break;
        case 'count_mines':
          if (adjCell.isBomb()) {
            // bomb cell count
            mines++;
          }
          break;
      }
    }
  }
  switch (task) {
    case 'count_mines':
      cell.node.innerHTML = mines;
      return mines;
      break;
  }
}
// define board bank
class Board {
  constructor() {
    this.nameList = [];
    this.dataList = [];
    this.size_x = 0;
    this.size_y = 0;
  }
  append(name, data) {
    this.nameList.push(name);
    this.dataList.push(data);
  }
  append_head(name, data) {
    this.nameList.unshift(name);
    this.dataList.unshift(data);
  }
  push(boardData) {
    if (boardData !== undefined) {
      this.nameList.push(boardData.name);
      this.dataList.push(boardData.data);
    }
  }
  unshift(boardData) {
    if (boardData !== undefined) {
      this.nameList.unshift(boardData.name);
      this.dataList.unshift(boardData.data);
    }
  }
  fetch(name) {
    const idx = this.nameList.indexOf(name);
    //console.log('fetch', name, idx, this.dataList[idx]);
    return (idx < 0) ? undefined : this.dataList[idx];
  }
  merge(newbd) {
    while (newbd.nameList.length >0) {
      this.append(newbd.nameList.shift(),newbd.dataList.shift());
    }
  }
  merge_head(newbd) {
    while (newbd.nameList.length >0) {
      this.append_head(newbd.nameList.shift(),newbd.dataList.shift());
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
  //const rand = new randomparam();
  const rand = BOARD_RAND;
  bdroot.push(generateBoardData(4, 4, 2, rand));
  bdroot.push(generateBoardData(4, 4, 4, rand));
  bdroot.push(generateBoardData(5, 5, 3, rand));
  bdroot.push(generateBoardData(5, 5, 6, rand));
  bdroot.push(generateBoardData(7, 7, 6, rand));
  bdroot.push(generateBoardData(7, 7, 12, rand));
  bdroot.push(generateBoardData(8, 8, 8, rand));
  bdroot.push(generateBoardData(8, 8, 16, rand));
  bdroot.push(generateBoardData(9, 9, 10, rand));
  bdroot.push(generateBoardData(9, 9, 20, rand));
  bdroot.push(generateBoardData(9, 12, 13, rand));
  bdroot.push(generateBoardData(9, 12, 26, rand));
  bdroot.push(generateBoardData(9, 15, 16, rand));
  bdroot.push(generateBoardData(9, 15, 33, rand));
  bdroot.push(generateBoardData(10, 10, 12, rand));
  bdroot.push(generateBoardData(10, 10, 25, rand));
  bdroot.push(generateBoardData(13, 13, 21, rand));
  bdroot.push(generateBoardData(13, 13, 42, rand));
  bdroot.push(generateBoardData(16, 16, 32, rand));
  bdroot.push(generateBoardData(16, 16, 64, rand));
  bdroot.push(generateBoardData(17, 17, 36, rand));
  bdroot.push(generateBoardData(17, 17, 72, rand));
  bdroot.push(generateBoardData(10, 20, 30, rand));
  bdroot.push(generateBoardData(10, 20, 40, rand));
  bdroot.push(generateBoardData(10, 20, 50, rand));
  bdroot.push(generateBoardData(10, 20, 60, rand));
  bdroot.push(generateBoardData(10, 20, 70, rand));
  return bdroot;
}
function updateSampleBoardSet() {
  const bdroot = new Board();
  const bdfile = new boardFile('','','');
  const rand = BOARD_RAND;
  // read all current BDROOT boards 
  for (let bdn = 0; bdn < BDROOT.nameList.length; bdn++) {
    const bdname = BDROOT.nameList[bdn];
    //console.log('current bdn', bdn, bdname);
    const bdprop = bdfile.boardProperty(bdname);
    if (bdprop === undefined) {
      printConsole(`skip ${bdname}`);
    } else {
      // skip unknown board name to be updated
      const boardData = generateBoardData(bdprop.x, bdprop.y, bdprop.mines, rand);
      if (boardData === undefined) {
        printConsole(`skip ${bdname}`);
      } else {
        bdroot.push(boardData);
      }
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
      newopt.innerHTML = bdroot.nameList[bdn];
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
class boardFile {
  constructor(fileData, fileName, boardId) {
    //console.log('fileData',fileData,'fileName',fileName);
    this.lines = removeEmptyItems(fileData.split(/\r\n|\n/));
    this.fileName = (fileName == null) ? 'dummy' : fileName;
    this.header = '';
    this.fnidx = (boardId == null) ? 1 : boardId;
    this.size = [];
    this.mines = 0;
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
      fname.push(itemList[2]);
    } else {
      fname.push(this.baseFileName());
      fname.push(this.size.join('x'));
      fname.push(this.mines);
      fname.push(this.fnidx++);
    }
    return fname.join('_');;
  }
  boardProperty(bdname) {
    // board_7x7_12_31
    let propList = bdname.split(/[_x]/);
    if (propList.length >= 5) {
      const boardProp = {
        name: propList.shift(),
        x: propList.shift(),
        y: propList.shift(),
        mines: propList.shift(),
        id: propList.shift()
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
function fileChanged(input) {
  const reader = new FileReader(); // FileReader object
  //console.log(input);
  const fileNode = input.files[0];
  const fileName = fileNode.name;
  addFileLoadEventListener(reader, fileName);
  /*
  for (let i = 0; i < input.files.length; i++) {
    console.log(input.files[i]);
  }
  */
  printConsole(`read ${fileName}`);
  reader.readAsText(fileNode); // reading file
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
    BDROOT.merge_head(bdroot);
    updateBoardSelector();
  }
}
function addFileLoadEventListener(reader, fileName) {
  //console.log('addFileLoadEventListener', fileName, reader);
  //bind the first reader is referenced as this on readBoardFile
  const bindedHandler = readBoardFile.bind(reader, fileName);
  reader.addEventListener('load', bindedHandler);
}
function createCustomBoard() {
  const bdroot = new Board();
  const rand = BOARD_RAND;
  const cstmx = document.getElementById('mycstmx');
  const cstmy = document.getElementById('mycstmy');
  const cstmm = document.getElementById('mycstmmines');
  if ((cstmx.value != '') && (cstmy.value != '') && (cstmm.value != '')) {
    //console.log('x', cstmx.value, 'y', cstmy.value, 'm', cstmm.value);
    bdroot.unshift(generateBoardData(cstmx.value, cstmy.value, cstmm.value, rand));
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
function getBoardConfig() {
  // CSS selector = #<id_name>
  const bdconfig = document.querySelector('#mybdconfig').bdconfig.value;
  //console.log('bdconfig', bdconfig);
  return bdconfig;
}
function resetBoardForm() {
  const resetForm = document.getElementById('myform');
  resetForm.reset();
}
// reset event listener is defined in html when start-up
function addResetEventListener() {
  //const resetForm = document.getElementById('myform');
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
// cell selection log download
function addDownloadEventListener() {
  const dlBtn1 = document.getElementById('mydownloadbd');
  const dlBtn2 = document.getElementById('mydownloadlog');
  const statusBox1 = document.getElementById('mydownloadbdstatus');
  const statusBox2 = document.getElementById('mydownloadlogstatus');
  const bindedHandler1 = downloadBoard.bind(dlBtn1, statusBox1);
  const bindedHandler2 = downloadDialog.bind(dlBtn2, statusBox2);
  dlBtn1.addEventListener('click', bindedHandler1);
  dlBtn2.addEventListener('click', bindedHandler2);
}
function addUploadEventListener() {
  const ulBtn = document.getElementById('myupload');
  const listInput = document.getElementById('mylist');
  ulBtn.addEventListener('click', function(){
    listInput.click();
  });
  listInput.addEventListener('change', function(){
    const fileNode = this.files[0];
   // const fileName = fileNode.name;
    //console.log('Input list', fileNode);
  });
}
function initializeBoard() {
  //reset score and visibility
  SCORE = 0;
  VISIBILITY = 0;
  flagUpdate('init');
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
function addEachCellEventListener(cell) {
  const board = document.getElementById('myboard');
  const cellElemLists = board.getElementsByTagName('td');
  // put event listener for flagged cells
  cellElemLists[cell.index].addEventListener('click', function(event) {
    startSelection(cell.list, cell.index);
  }, {once: true});  
}
function flagUpdate(task) {
  switch (task) {
    case 'init': FLAG = 0; break;
    case 'on': FLAG = 1; break;
    case 'off':
      FLAG = 0;
      break;
    case 'toggle':
      FLAG = !FLAG;
      if (FLAG) {
        foreachUntouchCells('addFlagEventListener');
      } else {
        foreachUntouchCells('removeAllEvents');
        // refresh needed because node pointer changed by removing events using cloneNode()
        foreachUntouchCells('refreshAddEventListener');
      }
      break;
  }
  printStatus();
}
function startSelection(cellElemArray, index, event) {
  //console.log('binded args', index, cellElemArray.length);
  const cell = new cellElem(index, cellElemArray);
  cell.access(['primary']);
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
    cellElemArray[i].addEventListener('click', function(){
      // const cellElemArray = [...cellElemLists];
      // get click position. upper left is 0 and start from 0,1,2,..IDX_MAX
      const tableIndex = cellElemArray.indexOf(this);
      const cell = new cellElem(tableIndex, cellElemArray);
      cell.access(['primary']);
    }, {once: true});
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
    //tline.innerHTML = lines[line];
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
      tchar.innerHTML = chars[char];
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

function foreachUntouchCells(task) {
  const board = document.getElementById('myboard');
  const cellElemLists = board.getElementsByTagName('td');
  const cellElemArray = [...cellElemLists];
  let counter = 0;
  let alives = [];
  for (let i=0; i < cellElemArray.length; i++) {
    const cell = new cellElem(i, cellElemArray);
    //console.log('change visibility', i);
    if (!cell.isTouch()) {
      switch (task) {
        case 'toggleVisibility':
          if (VISIBILITY) {
            //console.log('visible-off', i);
            cell.invisible();
          } else {
            //console.log('visible-on', i);
            cell.visible();
          }
          break;
        case 'countPenalty':
          countScore(cell, 'penalty');
          break;
        case 'closure':
          cell.close();
          break;
        case 'countAlive':
          if (!cell.isBomb()) {
            counter++;
            alives.push(i);
          }
          break;
        case 'removeEventListener':
          // doesn't work
          if (cell.isFlag()) {
            const bindedHandler = startSelection.bind(cellElemArray[i], cellElemArray, i);
            cellElemArray[i].removeEventListener('click', bindedHandler);
          }
          break;
        case 'removeFlagEvents':
          if (cell.isFlag()) {
            const clonedCell = cellElemArray[i].cloneNode(true);
            cellElemArray[i].replaceWith(clonedCell);
          }
          break;
        case 'removeAllEvents':
          const clonedCell = cellElemArray[i].cloneNode(true);
          cellElemArray[i].replaceWith(clonedCell);
          break;
        case 'addFlagEventListener':
          if (cell.isFlag()) {
            const bindedHandler = startSelection.bind(cellElemArray[i], cellElemArray, i);
            // put event listener for flagged cells
            cellElemArray[i].addEventListener('click', bindedHandler, {once: true});
          }
          break;
        case 'refreshAddEventListener':
          if (!cell.isFlag()) {
            const bindedHandler = startSelection.bind(cellElemArray[i], cellElemArray, i);
            // put event listener for flagged cells
            cellElemArray[i].addEventListener('click', bindedHandler, {once: true});
          }
          break;
        case 'addFlagEventListenerByNonameFunction':
          if (!cell.isFlag()) {
            cellElemArray[i].addEventListener('click', function(){
              const tableIndex = cellElemArray.indexOf(this);
              const cell = new cellElem(tableIndex, cellElemArray);
              cell.access(['primary']);
            }, {once: true});
          }
          break;
      }
    }
    //console.log('class name (foreach)', task, i, cell.node.className);
  }
  switch (task) {
    case 'toggleVisibility': VISIBILITY = !VISIBILITY; break;
    case 'countAlive':
      //console.log('alives', alives);
      return counter;
      break;
  }
}
function finishSelection() {
  //console.log('finish score is', SCORE);
  foreachUntouchCells('countPenalty');
  foreachUntouchCells('closure');
  printResult(SCORE);
  // clear board event listener
  removeEventListener();
  printConsole('selection finished');
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
    return normalize;
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
  config() {
    const BDCONFIG = getBoardConfig();
    if (/auto/.test(BDCONFIG)) {
        const oddBoard = ((this.prop.xs % 2) && (this.prop.ys % 2)) ? true : false;
        this.enable = {corner: !oddBoard, center: oddBoard}
    } else {
      this.enable.corner = (/corner|both/.test(BDCONFIG)) ? true : false;
      this.enable.center = (/center|both/.test(BDCONFIG)) ? true : false;
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
function createSafeCells(size_x, size_y, mcount) {
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
  sfz.config();
  //const locCorner = sfz.points_corner();
  //const locCenter = sfz.points_center();
  //console.log('locCorner', locCorner);
  //console.log('locCenter', locCenter);

  // corner SAFE_CELL
  sfz.untouch.min = untouchCellMin1;
  sfz.points_corner().test_points();
  
  // 3-side SAFE_CELL of corner SAFE_CELL
  sfz.untouch.min = untouchCellMin2;
  sfz.points_corner().pivot_test_points();
  /*
  for (let i=0; i < locCorner.length; i++) {
    const locPvt = sfz.points_pivot(locCorner[i]);
    sfz.test_points(locPvt);
  }
*/
  // center SAFE CELL
  // when enable, even size will use 2-center cells of each x and y
  // when x is even, y is odd, use x is 2-center, y is 1-center
  sfz.untouch.min = untouchCellMin1;
  sfz.points_center().test_points();

  // 8-side SAFE_CELL of center SAFE_CELL
  sfz.untouch.min = untouchCellMin2;
  sfz.points_center().pivot_test_points();
  /*
  for (let i=0; i < locCenter.length; i++) {
    const locPvt = sfz.points_pivot(locCenter[i]);
    sfz.test_points(locPvt);
  }
  */
  return sfz.cells.sort(compNum);
}
/*
function createSafeCells(size_x, size_y, mcount) {
  const BDCONFIG = getBoardConfig();
  const USE_CENTER_SAFE_CELL = 1;
  const USE_ADJCELL_WIDTH_MIN = 6;
  // MINES : UNTOUCH = 1 : 1
  const USE_SAFECELL_MINE_RATIO_MIN = 1.0;
  // MINES : UNTOUCH = 1 : 2.5
  const USE_ADJCELL_MINE_RATIO_MIN = 2.5;
  const xmax = size_x-1;
  const ymax = size_y-1;
  const cellSize = size_x * size_y;
  // SAFE_CELL + MINES + UNTOUCH = cellSize
  // untouchCellMin1 is corner SAFE_CELL count max
  // SAFE_CELL(max) = cellSize - MINES - UNTOUCH(=MINES * USE_SAFECELL_MINE_RATIO_MIN)
  //                = cellSize - MINES * (1 + USE_SAFECELL_MINE_RATIO_MIN)
  const untouchCellMin1 = parseInt(mcount * USE_SAFECELL_MINE_RATIO_MIN);
  // untouchCellMin2 is 3-side SAFE_CELL count max of corner SAFE_CELL
  // SAFE_CELL(max) = cellSize - MINES - UNTOUCH(=MINES * USE_ADJCELL_MINE_RATIO_MIN)
  //                = cellSize - MINES * (1 + USE_ADJCELL_MINE_RATIO_MIN)
  const untouchCellMin2 = parseInt(mcount * USE_ADJCELL_MINE_RATIO_MIN);
  const untouchCellSizeInitial = cellSize - mcount;
  let safeCell = [];
  // threshold is untouch cell count lower limit
  // when safe cell +1, untouch cell -1
  let threshold = {
    min: 0,
    cur: untouchCellSizeInitial,
    test_and_push: function(x,y) {
      const index = size_x*y + x;
      //console.log('untouchCellMin', this.min, 'untouchCellSizeInitial', this.cur, 'index', index);
      if (this.cur > this.min) {
        if (safeCell.indexOf(index) < 0) {
          // skip already existing safe cell
          safeCell.push(index);
          this.cur--;
        }
      }
    }
  }
  let enableCornerSC = false;
  let enableCenterSC = false;
  switch (BDCONFIG) {
    case 'auto':
      enableCornerSC = (!USE_CENTER_SAFE_CELL || !(size_x % 2) || !(size_y % 2));
      enableCenterSC = (USE_CENTER_SAFE_CELL && (size_x % 2) && (size_y % 2));
      break;
    case 'corner':
      enableCornerSC = true;
      enableCenterSC = false;
      break;
    case 'center':
      enableCornerSC = false;
      enableCenterSC = true;
      break;
    case 'both':
      enableCornerSC = true;
      enableCenterSC = true;
      break;
    case 'none':
    default:
      enableCornerSC = false;
      enableCenterSC = false;
      break;
  }
  // corner SAFE_CELL
  threshold.min = untouchCellMin1;
  if (enableCornerSC) {
    for (let y=0; y < size_y; y+=ymax) {
      for (let x=0; x < size_x; x+=xmax) {
        threshold.test_and_push(x, y);
      }
    }
  }
  // 3-side SAFE_CELL of corner SAFE_CELL
  threshold.min = untouchCellMin2;
  if (enableCornerSC) {
    for (let y=0; y < size_y; y+=ymax) {
      for (let x=0; x < size_x; x+=xmax) {
        const x_idx = (size_x > USE_ADJCELL_WIDTH_MIN) ? pibotAdjacent(x, 0, xmax) : [x];
        const y_idx = (size_y > USE_ADJCELL_WIDTH_MIN) ? pibotAdjacent(y, 0, ymax) : [y];
        for (let i=0; i < x_idx.length; i++) {
          for (let j=0; j < y_idx.length; j++) {
            threshold.test_and_push(x_idx[i], y_idx[j]);
          }
        }
      }
    }
  }
  // center SAFE CELL
  // when enable, even size will use 2-center cells of each x and y
  // when x is even, y is odd, use x is 2-center, y is 1-center
  if (enableCenterSC) {
   threshold.min = untouchCellMin1;
    for (let y=parseInt((size_y-0.1) / 2); y <= parseInt(size_y / 2); y++) {
      for (let x=parseInt((size_x-0.1) / 2); x <= parseInt(size_x / 2); x++) {
        threshold.test_and_push(x, y);
      }
    }
    // 8-side SAFE_CELL of center SAFE_CELL
    threshold.min = untouchCellMin2;
    for (let y=parseInt((size_y-0.1) / 2); y <= parseInt(size_y / 2); y++) {
      for (let x=parseInt((size_x-0.1) / 2); x <= parseInt(size_x / 2); x++) {
        const x_idx = (size_x > USE_ADJCELL_WIDTH_MIN) ? pibotAdjacent(x, 0, xmax) : [];
        const y_idx = (size_y > USE_ADJCELL_WIDTH_MIN) ? pibotAdjacent(y, 0, ymax) : [];
        for (let i=0; i < x_idx.length; i++) {
          for (let j=0; j < y_idx.length; j++) {
            threshold.test_and_push(x_idx[i], y_idx[j]);
          }
        }
      }
    }
  }
  return safeCell.sort(compNum);
}
*/
function createMines(rand, cellCount, minesCount, safeCell) {
  if (minesCount > cellCount) {
    // mines count is limited by cell count (-1)
    minesCount = cellCount -1;
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
function generateBoardData(size_x, size_y, minesCount, rand) {
  // avoid mines to be put at 4-corner reagion
  const USE_SAFE_ZONE = 1;
  const MIN_SIZE = 4;
  if ((size_x < MIN_SIZE) || (size_y < MIN_SIZE)) {
    return undefined;
  }
  SIZE_X = size_x;
  SIZE_Y = size_y;
  // skip the first rand to generate rand.iterate
  const discard = rand.next();
  const boardId = rand.iterate;
  const cellSize = size_x * size_y;
  const safeCell = USE_SAFE_ZONE ? createSafeCells(size_x, size_y, minesCount) : [];
  console.log('safeCell', `${size_x}x${size_y}_${minesCount}`, getBoardConfig(), safeCell);
  const mines = createMines(rand, cellSize, minesCount, safeCell);
  //console.log('mines', mines);
  const cellElemArray = createCellElemArray(cellSize, mines);
  cellData = '';
  for (let i=0; i < cellElemArray.length; i++) {
    const cell = new cellElem(i, cellElemArray);
    if (!cell.isBomb()) {
      let mcount = pivotCell(i, cellElemArray, cell, 'count_mines', undefined);
      //console.log('pivotCell', i, mcount);
    }
    cell.update();
    cellData += cell.value;
    // append newline at the tail of size_x
    if (((i+1) % size_x)==0) {
      cellData += '\n';
    }
  }
  const bdfile = new boardFile(cellData, 'board', boardId);
  const boardData=bdfile.popData();
  //console.log(boardData);
  //return [...boardData];
  return boardData;
}
