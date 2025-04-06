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
  msg += "\n";
  appendScrollBox(consoleBox, msg);
}
// print to dialog box in html
function printDialog(msg) {
  const dialogBox = document.getElementById('mydialog');
  //scroll before print
  msg += "\n";
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
    msg += "\n";
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
    //console.log('appended name', name);
    //console.log('appended data', data);
  }
  push(boardData) {
    this.nameList.push(boardData.name);
    this.dataList.push(boardData.data);
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
      console.log('lines is', lines);
    }
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
  const rand = new randomparam();
  //bdroot.append('board-1', ['3 3','111191111']);
  //bdroot.append('board-2', ['111111','191191','111111','111111','191191','111111']);
  //bdroot.append('board-3', ['10 10 board-10x10-3', '0001110000 0112911110 1292111921 1921112129 1110191011 0112221000 0193910000 0119211110 0011101910 0000001110']);
  //bdroot.append(...generateBoard(4, 4, 3, rand));
  bdroot.push(generateBoard(4, 4, 2, rand));
  bdroot.push(generateBoard(4, 4, 4, rand));
  bdroot.push(generateBoard(5, 5, 3, rand));
  bdroot.push(generateBoard(5, 5, 6, rand));
  bdroot.push(generateBoard(7, 7, 6, rand));
  bdroot.push(generateBoard(7, 7, 12, rand));
  bdroot.push(generateBoard(8, 8, 8, rand));
  bdroot.push(generateBoard(8, 8, 16, rand));
  bdroot.push(generateBoard(10, 10, 12, rand));
  bdroot.push(generateBoard(10, 10, 25, rand));
  bdroot.push(generateBoard(13, 13, 21, rand));
  bdroot.push(generateBoard(13, 13, 42, rand));
  bdroot.push(generateBoard(16, 16, 32, rand));
  bdroot.push(generateBoard(16, 16, 64, rand));
  bdroot.push(generateBoard(10, 20, 30, rand));
  bdroot.push(generateBoard(10, 20, 40, rand));
  bdroot.push(generateBoard(10, 20, 50, rand));
  bdroot.push(generateBoard(10, 20, 60, rand));
  bdroot.push(generateBoard(10, 20, 70, rand));
  return bdroot;
}

function createBoardSelector() {
  BDROOT = createSampleBoardSet();
  const bdsel = document.getElementById('myselect');
  // delete previous options of selector
  const options = bdsel.options;
  while (options.length > 0) options.remove(0);
  for (let bdn = 0; bdn < BDROOT.nameList.length; bdn++) {
    let newopt = document.createElement('option');
    newopt.innerHTML = BDROOT.nameList[bdn];
    bdsel.appendChild(newopt);
  }
  /*
  for (let opt = 0; opt < options.length; opt++) {
    console.log('bdsel opt', opt, options[opt].value);
  }
  */
}

function appendBoardSelector(bdroot) {
  const bdsel = document.getElementById('myselect');
  // append selector
  for (let bdn = 0; bdn < bdroot.nameList.length; bdn++) {
    let newopt = document.createElement('option');
    newopt.innerHTML = bdroot.nameList[bdn];
    bdsel.appendChild(newopt);
  }
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
    while (bdfile.lines.length > 0) {
      let boardData=bdfile.popData();
      printConsole(`found ${boardData.name}`);
      bdroot.push(boardData);
    }
    if (bdroot.nameList.length > 0) {
      let bdName = bdroot.nameList.slice(-1).shift();
      bdroot.load(bdName);
      appendBoardSelector(bdroot);
    }
    // merge new boards to BDROOT
    BDROOT.merge(bdroot);
    //bdroot.append(fileName, this.result);
    //bdroot.load(fileName);
}
function addFileLoadEventListener(reader, fileName) {
  //console.log('addFileLoadEventListener', fileName, reader);
  //bind the first reader is referenced as this on readBoardFile
  const bindedHandler = readBoardFile.bind(reader, fileName);
  reader.addEventListener('load', bindedHandler);
}
function addSelectEventListener() {
  const button = document.getElementById('mybtn');
  const bdsel = document.getElementById('myselect');
  button.addEventListener('click', function(){
    // const bdidx = bdsel.selectedIndex;
    const bdname = bdsel.value;
    // printConsole(`select ${bdname}`);
    BDROOT.load(bdname);
  });
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
function addDownloadEventListener() {
  const dlBtn = document.getElementById('mydownload2');
  dlBtn.addEventListener('click', function(){
    const blob = new Blob(['sample'], {type:'text/plain'});
    dlBtn.href = URL.createObjectURL(blob);
  });
}
// cell selection log download
function addDownloadEventListener2() {
  const dlBtn = document.getElementById('mydownload');
  dlBtn.addEventListener('click', function(){
    const data = fetchDialogMsg();
    const blob = new Blob([data], {type:'text/plain'});
    const dllink = document.createElement('a');
    let fname = 'select_cell.txt';
    if (!BOARD_NAME.match(/unknown/) && (BOARD_NAME !== undefined)) {
      fname = fname.replace(/cell/, BOARD_NAME);
    }
    dllink.download = fname;    
    dllink.href = URL.createObjectURL(blob);
    dllink.click();
    //console.log('download', dllink);
    URL.revokeObjectURL(dllink.href);
    const statusBox = document.getElementById('mydownloadstatus');
    statusBox.value = fname;
  });
}
function fetchDialogMsg() {
  const dialogBox = document.getElementById('mydialog');
  return dialogBox.value;
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
  console.log('binded args', index, cellElemArray.length);
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
  console.log('finish score is', SCORE);
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
    this.a = 373;
    this.b = 1779;
    this.m = 52397;
    this.seed = [3456];
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
function createSafeCells(size_x, size_y, mcount) {
  const USE_ADJCELL_WIDTH_MIN = 6;
  // MINES : UNTOUCH = 10 : 10
  const USE_SAFECELL_MINE_RATIO_MIN = 1.0;
  // MINES : UNTOUCH = 10 : 25
  const USE_ADJCELL_MINE_RATIO_MIN = 2.5;
  const xmax = size_x-1;
  const ymax = size_y-1;
  const cellSize = size_x * size_y;
  const untouchCellMin1 = parseInt(mcount * USE_SAFECELL_MINE_RATIO_MIN);
  const untouchCellMin2 = parseInt(mcount * USE_ADJCELL_MINE_RATIO_MIN);
  let untouchCellSize = cellSize - mcount;
  let safeCell = [];
  let threshold = {
    min: 0,
    cur: untouchCellSize,
    test_and_push: function(x,y) {
      const index = size_x*y + x;
      //console.log('untouchCellMin', this.min, 'untouchCellSize', this.cur, 'index', index);
      if (this.cur > this.min) {
        if (safeCell.indexOf(index) < 0) {
          safeCell.push(index);
          this.cur--;
        }
      }
    }
  }
  threshold.min = untouchCellMin1;
  for (let y=0; y < size_y; y+=ymax) {
    for (let x=0; x < size_x; x+=xmax) {
      threshold.test_and_push(x, y);
    }
  }
  threshold.min = untouchCellMin2;
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
  return safeCell;
}
function createMines(rand, cellCount, minesCount, safeCell) {
  if (minesCount > cellCount) {
    minesCount = cellCount;
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
function generateBoard(size_x, size_y, minesCount, rand) {
  // avoid mines to be put at 4-corner reagion
  const USE_SAFE_ZONE = 1
  SIZE_X = size_x;
  SIZE_Y = size_y;
  // skip the first rand to generate rand.iterate
  const discard = rand.next();
  const boardId = rand.iterate;
  const cellSize = size_x * size_y;
  const safeCell = USE_SAFE_ZONE ? createSafeCells(size_x, size_y, minesCount) : [];
  //console.log('safeCell', safeCell);
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
