// get board click location
function boardLoc(index) {
  this.x = index % SIZE_X;
  this.y = parseInt(index / SIZE_X);
  // check index (board location) range
  this.checkRange = function() {
    return ((index < 0)||(index > IDX_MAX)) ? 0 : 1;
  }
}
// get three location of cur-1, cur, cur+1
function pibotAdjacent(cur, min, max) {
  this.list = [];
  for (let i=(cur-1); i <= (cur+1); i++) {
    if ((i >= min)&&(i <= max)) {
       this.list.push(i);
    }
  }
}
function cellElem(index, elemList) {
  // array pointer
  this.list = elemList;
  this.index = index;
  this.node = this.list[this.index];
  this.value = this.node.innerHTML;
  this.touch = function() {
    let node = this.node;
    node.classList.add('touch');
  }
  this.untouch = function() {
    let node = this.node;
    node.classList.remove('touch');
  }
  this.isTouch = function() {
    return this.node.classList.contains('touch');
  }
  this.isEmpty = function() {
    return (this.value == 0) ? 1 : 0;
  }
  this.isBomb = function() {
    return (this.value >= 9) ? 1 : 0;
  }
  this.access = function() {
    accessCell(this.index, this.list, this);
  }
}
/*
function touchCell(index, cellElemArray){
  let node = cellElemArray[index];
  node.classList.add('touch');
}
function untouchCell(index, cellElemArray){
  let node = cellElemArray[index];
  node.classList.remove('touch');
}
*/
// access given index (board location) 
function accessCell(index, cellElemArray, cell) {
  //const tableLoc = new boardLoc(index);
  const tableLoc = new boardLoc(cell.index);
  // if (!checkIndexRange(index)){
  if (!tableLoc.checkRange()) {
    // out of range
    console.log('#ER index out of range', index);
    return 0;
  }
  //let node = cellElemLists[index];
  //let node = cellElemArray[index];
  //let node = cell.node;
  //if (node.classList.contains('touch')) {
  if (cell.isTouch()) {
    console.log('skip', index);
  } else {
    //let val = node.innerHTML;
    //node.innerHTML = '(' + val + ')';
    //node.style.backgroundColor = '#f0f0f0';
    //node.style.color = '#0f0';
    //node.classList.add('touch');
    //touchCell(index, cellElemArray);
    cell.touch();
    console.log('touch', index);
    //if (cell.value == 0) {
    if (cell.isEmpty()) {
      console.log('empty', index);
      pivotCell(index, cellElemArray, cell);
    } else if (cell.isBomb()) {
      const consoleBox = document.getElementById('myconsole');
      const tableLoc = new boardLoc(cell.index);
      const msg = `bomb !! (${tableLoc.x},${tableLoc.y})\n`;
      //scroll before print
      consoleBox.scrollTop = consoleBox.scrollHeight;
      consoleBox.value += msg;
    }
  }
  return 1;
}
// pivot around given index (board location)
function pivotCell(index, cellElemArray, cell) {
  //const tableLoc = new boardLoc(index);
  const tableLoc = new boardLoc(cell.index);
  let pivot = [];
  
  const x_idx = new pibotAdjacent(tableLoc.x, 0, SIZE_X-1);
  const y_idx = new pibotAdjacent(tableLoc.y, 0, SIZE_Y-1);
  // console.log('pivot', index, '('+tableLoc.x, tableLoc.y+')');
  // console.log('x_idx', x_idx);
  // console.log('y_idx', y_idx);
  for (let i=0; i < x_idx.list.length; i++) {
    for (let j=0; j < y_idx.list.length; j++) {
      pivot.push(SIZE_X*y_idx.list[j] + x_idx.list[i]);
    }
  }
  for (let i=0; i < pivot.length; i++) {
    if (i!=index) {
      const adjLoc = new boardLoc(pivot[i]);
      const adjCell = new cellElem(pivot[i], cellElemArray);
      console.log('pivot', pivot[i], '('+adjLoc.x, adjLoc.y+')');
      adjCell.access();
      //accessCell(pivot[i], cellElemArray, adjCell);
      //accessCell(pivot[i], cellElemArray);
    }
  }
}
function addResetEventListener(){
  const resetForm = document.getElementById('myform');
  resetForm.addEventListener('reset', function(event) {
    let confirmReset = 0;
    if (confirmReset && !confirm('reset OK ?')) {
      event.preventDefault();
      console.log('reset cancelled');
    } else {
      addCellEventListener();
      console.log('resetting');
    }
  }, {passive: false});
}
function addCellEventListener(){
  const board = document.getElementById('myboard');
  const cellElemLists = board.getElementsByTagName('td');
  //const consoleBox = document.getElementById('myconsole');
  const outputBox = document.getElementById('myoutput');
  //consoleBox.scrollTop = consoleBox.scrollHeight;
  //outputBox.scrollTop = outputBox.scrollHeight;
  //remove previous event on resetting from addResetEventListener()
  for (let i=0; i < cellElemLists.length; i++) {
    // to remove event, clone previous node and replace with it
    const clonedCell = cellElemLists[i].cloneNode(true);
    cellElemLists[i].replaceWith(clonedCell);
  }
  // cellElemLists is NodeList, not Array
  // convert NodeList to Array to use indexOf which supports only an Array
  const cellElemArray = [...cellElemLists];
  // foreach table cell
  for (let i=0; i < cellElemArray.length; i++) {
    const cell = new cellElem(i, cellElemArray);
    // reset touch class from each cell
    cell.untouch();
    //untouchCell(i, cellElemArray);
    // put click event on each cell
    // cellElemLists[i].addEventListener('click', function(){
    cellElemArray[i].addEventListener('click', function(){
      // const cellElemArray = [...cellElemLists];
      // get click position. upper left is 0 and start from 0,1,2,..IDX_MAX
      const tableIndex = cellElemArray.indexOf(this);
      const cell = new cellElem(tableIndex, cellElemArray);
      //console.log(cellElemArray);
      //const tableLoc = new boardLoc(tableIndex);
      const tableLoc = new boardLoc(cell.index);
      console.log('click', tableIndex, '('+tableLoc.x, tableLoc.y+')');
      const msg = `(${tableLoc.x},${tableLoc.y})\n`;
      //scroll before print
      outputBox.scrollTop = outputBox.scrollHeight;
      outputBox.value += msg;
      //outputBox.scrollTop = outputBox.scrollHeight;
      //outputBox.value = outputBox.value + msg;
      //outputBox.value = `touch (${tableLoc.x},${tableLoc.y})`
      //accessCell(tableIndex, cellElemArray);
      cell.access();
    }, {once: true});
  }
}
function createBoard(lines){
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
      tchar.className = 'init';
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

function fileChanged(input) {
  console.log(input);
  for (let i = 0; i < input.files.length; i++) {
    //console.log(input.files[i]);
    reader.readAsText(input.files[i]); // reading file
  }
}
