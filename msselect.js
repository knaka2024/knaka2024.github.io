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
  location() {
    const x = this.index % SIZE_X;
    const y = parseInt(this.index / SIZE_X);
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
    return (this.value >= 9) ? 1 : 0;
  }
  access(source) {
    if (source == 'primary') {
      if (!this.isTouch() && !this.isFlag() && !FLAG) {
        const [x, y] = this.location();
        printDialog(`(${x},${y})`);
      }
    }
    accessCell(this.index, this.list, this);
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
  printConsole(`toggle ${msg}`);
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
function accessCell(index, cellElemArray, cell) {
  if (!cell.checkRange()) {
    // out of range
    console.log('#ER index out of range', index);
    return 0;
  }
  if (cell.isTouch()) {
    console.log('skip', index);
    console.log('classname', cell.node.className, cell.index);
  } else if (FLAG) {
    if (cell.isFlag()) {
      cell.unflag();
      addEachCellEventListener(cell);
    } else {
      cell.flag();
    }
    // exit from flag update mode
    flagUpdate('off');
  } else if (cell.isFlag()) {
    console.log('skip flag', index);
    console.log('classname', cell.node.className, cell.index);
  } else {
    cell.touch();
    // remove flag automatically
    cell.unflag();
    console.log('touch', index);
    console.log('classname', cell.node.className, cell.index);
    //bug both lines
    //console.log('check array 15(ary)', cellElemArray[15]);
    //console.log('check array 15(lst)', cell.list[15]);
    //foreachUntouchCells('countAlive');
    //bug
    console.log('check array 15-2', cellElemArray[15]);
    //if (cell.value == 0) {
    if (cell.isEmpty()) {
      console.log('empty', index);
      pivotCell(index, cellElemArray, cell, 'expand_region');
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
// pivot around given index (board location)
function pivotCell(index, cellElemArray, cell, task) {
  let pivot = [];
  const [x, y] = cell.location();
  const x_idx = pibotAdjacent(x, 0, SIZE_X-1);
  const y_idx = pibotAdjacent(y, 0, SIZE_Y-1);
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
      switch (task) {
        case 'expand_region': adjCell.access('secondary'); break;
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
  fetch(name) {
    const idx = this.nameList.indexOf(name);
    return (idx < 0) ? "undef" : this.dataList[idx];
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
    let lines = [];
    // header is size_x size_y board_name
    // \s matches newline !!
    const header = data[0].match(/^[ ]*(\d+)[ ]+(\d+)/);
    const itemList = data[0].split(/[ ]+/);
    //console.log('header is', header);
    if (header!=null) {
      // 1st line is (size_x, size_y)
      this.size_x = Number(header[1]);
      this.size_y = Number(header[2]);
      // read board name from 3rd item
      if (itemList.length >= 3) {
        BOARD_NAME = itemList[2];
      } else {
        BOARD_NAME = name;
      }
      // remove all spaces or newlines into 1 line
      let trimdata = data[1].replace(/\s|\r|\n/g,'');
      for (let i = 0; i < trimdata.length; i+=this.size_x) {
        let line = trimdata.slice(i, i+this.size_x);
        lines.push(line);
        //console.log('line', i, 'is', line);
      }
    } else {
      // header is not given
      BOARD_NAME = name;
      // console.log('data is', data, data.length);
      if (data.length == 1) {
        // board data is fetched from file including newlines
        lines = removeEmptyItems(data[0].split(/\r\n|\n/));
        //console.log('lines is', lines, 'lines[0].length', lines[0].length);
      } else {
        lines = data;
      }
      // board data is an array of ['y0-data','y1-data','y2-data'..]
      this.size_x = lines[0].length;
      this.size_y = lines.length;
    }
    this.check_lines(lines);
    return [...lines];
  }
  load(name) {
    const lines = this.get_lines(name);
    printConsole(`board ${BOARD_NAME}`);
    resetBoardForm();
    createBoard(lines);
    initializeBoard();
    removeEventListener();
    addCellEventListener();
    addfinishEventListener();
  }
  reset() {
    resetBoardForm();
    initializeBoard();
    removeEventListener();
    addCellEventListener();
    addfinishEventListener();
    printConsole('resetting board');
  }
}

function removeEmptyItems(array) {
  let newarray = [];
  for (let i = 0; i < array.length; i++) {
    if (array[i].match(/^\s*$/) == null) {
      newarray.push(array[i]);
    }
  }
  return [...newarray];
}
function loadSampleBoard() {
  const bdroot = new Board();
  const rand = new randomparam();
  //bdroot.append('board-1', ['3 3','111191111']);
  //bdroot.append('board-2', ['111111','191191','111111','111111','191191','111111']);
  //bdroot.append('board-3', ['10 10 board-10x10-3', '0001110000 0112911110 1292111921 1921112129 1110191011 0112221000 0193910000 0119211110 0011101910 0000001110']);
  //bdroot.append(...generateBoard(4, 4, 3, rand));
  bdroot.append(...generateBoard(4, 4, 2, rand));
  bdroot.append(...generateBoard(8, 8, 8, rand));
  bdroot.append(...generateBoard(16, 16, 32, rand));
  return bdroot;
}
function readSampleBoard(name) {
  const bdroot = loadSampleBoard();
  bdroot.load(name);
}
function createBoardSelector() {
  bdroot = loadSampleBoard();
  const bdsel = document.getElementById('myselect');
  // delete previous options of selector
  const options = bdsel.options;
  while (options.length > 0) options.remove(0);
  for (let bdn = 0; bdn < bdroot.nameList.length; bdn++) {
    let newopt = document.createElement('option');
    newopt.innerHTML = bdroot.nameList[bdn];
    bdsel.appendChild(newopt);
  }
  /*
  for (let opt = 0; opt < options.length; opt++) {
    console.log('bdsel opt', opt, options[opt].value);
  }
  */
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
function addFileLoadEventListener(reader, fileName) {
  reader.addEventListener("load", function(){
    const bdroot = new Board();
    //console.log(fileName, this.result);
    bdroot.append(fileName, [ this.result ]);
    bdroot.load(fileName);
  });
}
function addSelectEventListener() {
  const button = document.getElementById('mybtn');
  const bdsel = document.getElementById('myselect');
  button.addEventListener('click', function(){
    // const bdidx = bdsel.selectedIndex;
    const bdname = bdsel.value;
    // printConsole(`select ${bdname}`);
    readSampleBoard(bdname);
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
      //toggleFlagCellEventListener('disable');
      break;
    case 'toggle':
      FLAG = !FLAG;
      if (FLAG) {
        toggleFlagCellEventListener('enable');
      } else {
        foreachUntouchCells('removeEvents');
        //toggleFlagCellEventListener('disable');
      }
      break;
  }
  printStatus();
}
function toggleFlagCellEventListener(task) {
  const board = document.getElementById('myboard');
  const cellElemLists = board.getElementsByTagName('td');
  const cellElemArray = [...cellElemLists];
  // foreach table cell
  for (let i=0; i < cellElemArray.length; i++) {
    const cell = new cellElem(i, cellElemArray);
    if (cell.isFlag()) {
      let bindedHandler = startSelection.bind(cellElemArray[i], cellElemArray, i);
      switch (task) {
        case 'enable' :
          // put event listener for flagged cells
          cellElemArray[i].addEventListener('click', bindedHandler, {once: true});
          break;
        case 'disable' :
          // doesn't work
          cellElemArray[i].removeEventListener('click', bindedHandler);
          break;
      }
    }
  }
}
function toggleFlagCellEventListener3(task) {
  const board = document.getElementById('myboard');
  const cellElemLists = board.getElementsByTagName('td');
  const cellElemArray = [...cellElemLists];
  // foreach table cell
  for (let i=0; i < cellElemArray.length; i++) {
    const cell = new cellElem(i, cellElemArray);
    if (cell.isFlag()) {
      switch (task) {
        case 'enable' :
          // put event listener for flagged cells
          cellElemArray[i].addEventListener('click', function(){
            const tableIndex = cellElemArray.indexOf(this);
            const cell = new cellElem(tableIndex, cellElemArray);
            cell.access('primary');
          }, {once: true});
          break;
        case 'disable' :
          console.log('class name0', i, cell.node.className);
          // remove event listener from flagged cells
          // to remove event, clone previous node and replace with it
          const clonedCell = cellElemArray[i].cloneNode(true);
          cellElemArray[i].replaceWith(clonedCell);
          console.log('class name1', i, cell.node.className);
          break;
      }
    }
  }
}
function toggleFlagCellEventListener2() {
  const board = document.getElementById('myboard');
  const cellElemLists = board.getElementsByTagName('td');
  const cellElemArray = [...cellElemLists];
  // foreach table cell
  for (let i=0; i < cellElemArray.length; i++) {
    const cell = new cellElem(i, cellElemArray);
    if (cell.isFlag()) {
      if (FLAG) {
        // put event listener for flagged cells
        //cellElemArray[i].addEventListener('click', function(event) {
       //  startSelection(cellElemArray, i);
        //}, {once: true});
        cellElemArray[i].addEventListener('click', function(){
          const tableIndex = cellElemArray.indexOf(this);
          const cell = new cellElem(tableIndex, cellElemArray);
          console.log('check array 13 before cell.access(529)', tableIndex, cellElemArray[13]);
          console.log('check array 14 before cell.access(529)', tableIndex, cellElemArray[14]);
          console.log('check array 15 before cell.access(529)', tableIndex, cellElemArray[15]);
          cell.access('primary');
        }, {once: true});
      } else {
        console.log('class name0', i, cell.node.className);
        // remove event listener from flagged cells
        // to remove event, clone previous node and replace with it
        const clonedCell = cellElemLists[i].cloneNode(true);
        cellElemLists[i].replaceWith(clonedCell);
        console.log('class name1', i, cell.node.className);
      }
    }
  }
}
function startSelection(cellElemArray, index, event) {
  console.log('binded args', index, cellElemArray.length);
  const cell = new cellElem(index, cellElemArray);
  cell.access('primary');
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
    //untouchCell(i, cellElemArray);
    // put click event on each cell
    // cellElemLists[i].addEventListener('click', function(){
    cellElemArray[i].addEventListener('click', function(){
      // const cellElemArray = [...cellElemLists];
      // get click position. upper left is 0 and start from 0,1,2,..IDX_MAX
      const tableIndex = cellElemArray.indexOf(this);
      const cell = new cellElem(tableIndex, cellElemArray);
      for (let j=0; j < cellElemArray.length; j++) {
        console.log('check array', j,'before cell.access(570)', tableIndex, cellElemArray[j]);
      }
      cell.access('primary');
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
  console.log('check array 15-3', cellElemArray[15]);
  console.log('check array 15-4', cellElemLists[15]);
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
        case 'removeEvents':
          if (cell.isFlag()) {
            const clonedCell = cellElemArray[i].cloneNode(true);
            cellElemArray[i].replaceWith(clonedCell);
          }
          break;
      }
    }
    //console.log('class name (foreach)', i, cell.node.className);
  }
  switch (task) {
    case 'toggleVisibility': VISIBILITY = !VISIBILITY; break;
    case 'countAlive':
      console.log('alives', alives);
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
function createMines(rand, cellCount, minesCount) {
  let mines = [];
  for (let i=0; i < minesCount; i++) {
    let value = 0;
    do {
      value = parseInt(rand.next() * cellCount);
    } while (mines.indexOf(value) >= 0);
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
      value = 9;
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
  SIZE_X = size_x;
  SIZE_Y = size_y;
  // skip the first rand to generate rand.iterate
  const discard = rand.next();
  const boardId = rand.iterate;
  const cellSize = size_x * size_y;
  const mines = createMines(rand, cellSize, minesCount);
  const cellElemArray = createCellElemArray(cellSize, mines);
  const boardName = `board_${size_x}x${size_y}_${minesCount}_${boardId}`;
  let data = [];
  data[0] = `${size_x} ${size_y} ${boardName}`;
  data[1] = '';
  for (let i=0; i < cellElemArray.length; i++) {
    const cell = new cellElem(i, cellElemArray);
    if (!cell.isBomb()) {
      let mcount = pivotCell(i, cellElemArray, cell, 'count_mines');
      //console.log('pivotCell', i, mcount);
    }
    cell.update();
    data[1] += cell.value;
    if (((i+1) % size_x)==0) {
      data[1] += '\n';
    }
  }
  //console.log(data);
  //console.log(cellElemArray);
  let boardData = [boardName, data];
  //console.log(boardData);
  return [...boardData];
}
