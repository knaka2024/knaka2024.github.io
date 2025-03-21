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
  checkRange() {
    return ((this.index < 0)||(this.index > IDX_MAX)) ? 0 : 1;
  }
  init() {
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
  isEmpty() {
    return (this.value == 0) ? 1 : 0;
  }
  isBomb() {
    return (this.value >= 9) ? 1 : 0;
  }
  access(source) {
    if (source == 'primary') {
      if (!this.isTouch()) {
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
  if (score < 0) {
    msg += ' => count as 0';
  }
  resultBox.value = msg;  
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
  } else {
    cell.touch();
    console.log('touch', index);
    //if (cell.value == 0) {
    if (cell.isEmpty()) {
      console.log('empty', index);
      pivotCell(index, cellElemArray, cell);
    } else if (cell.isBomb()) {
      cell.bomb();
      const [x, y] = cell.location();
      printConsole(`bomb!! (${x},${y})`);
    }
    // count score
    countScore(cell, 'obtain');
    // check all alive cells touched
    const remains = foreachUntouchCells('countAlive');
    console.log('remains', remains);
    if (remains == 0) {
      finishSelection();
    }
  }
  return 1;
}
// pivot around given index (board location)
function pivotCell(index, cellElemArray, cell) {
  let pivot = [];
  const [x, y] = cell.location();
  const x_idx = pibotAdjacent(x, 0, SIZE_X-1);
  const y_idx = pibotAdjacent(y, 0, SIZE_Y-1);
  for (let i=0; i < x_idx.length; i++) {
    for (let j=0; j < y_idx.length; j++) {
      pivot.push(SIZE_X*y_idx[j] + x_idx[i]);
    }
  }
  for (let i=0; i < pivot.length; i++) {
    if (i!=index) {
      const adjCell = new cellElem(pivot[i], cellElemArray);
      const [adjx, adjy] = adjCell.location();
      console.log('pivot', pivot[i], '('+adjx, adjy+')');
      adjCell.access('secondary');
    }
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
    const header = data[0].match(/^\s*(\d+)\s+(\d+)\s*$/);
    if (header!=null) {
        // 1st line is (size_x, size_y)
        this.size_x = Number(header[1]);
        this.size_y = Number(header[2]);
        // remove all spaces or newlines
        let trimdata = data[1].replace(/\s|\r|\n/g,'');
        for (let i = 0; i < trimdata.length; i+=this.size_x) {
          let line = trimdata.slice(i, i+this.size_x);
          lines.push(line);
          //console.log('line', i, 'is', line);
        }
    } else {
      //console.log('data is', data, data.length);
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
  bdroot.append('board-1', ['3 3','111191111']);
  bdroot.append('board-2', ['111111','191191','111111','111111','191191','111111']);
  bdroot.append('board-3', ['10 10', '0001110000 0112911110 1292111921 1921112129 1110191011 0112221000 0193910000 0119211110 0011101910 0000001110']);
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
    printConsole(`select ${bdname}`);
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
          }
          break;
      }
    }
  }
  switch (task) {
    case 'toggleVisibility': VISIBILITY=!VISIBILITY; break;
    case 'countAlive': return counter; break;
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
function addfinishEventListener2() {
  const button = document.getElementById('myfinish');
  button.addEventListener('click', function(){
    console.log('finish score is', SCORE);
    foreachUntouchCells('countPenalty');
    foreachUntouchCells('closure');
    printResult(SCORE);
    // clear board event listener
    removeEventListener();
  }, {once: true});  
}
