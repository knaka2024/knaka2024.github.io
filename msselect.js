function msstep(){
  const board = document.getElementById('myboard');
  const cellElemLists = board.getElementsByTagName('td');
  const outputBox = document.getElementById('myoutput');
  //tableの全てにclickイベントを付与する
  for (let $i=0; $i < cellElemLists.length; $i++) {
    //cellElemLists is NodeList, not Array
    cellElemLists[$i].addEventListener('click', function(){
      // 配列に変換。indexOfを使うには配列化
      const cellElemArray = [...cellElemLists];
      // クリックした位置。先頭が0
      const tableIndex = cellElemArray.indexOf(this);
      //console.log(cellElemArray);
      const location = new boardLoc(tableIndex);
      console.log('tableIndex', tableIndex, 'x', location.x, 'y', location.y);
      outputBox.scrollTop = outputBox.scrollHeight;
      const msg = `touch (${location.x},${location.y})\n`;
      outputBox.value = outputBox.value + msg;
      //outputBox.value = `touch (${location.x},${location.y})`
      accessCell(tableIndex);
    }, {once: true});
  }
  function boardLoc(index) {
    this.x = index % SIZE_X;
    this.y = parseInt(index / SIZE_X);
  }
  function checkIndexRange(index) {
    return ((index < 0)||(index > IDX_MAX)) ? 0 : 1;
  }
  function pivotCell(index) {
    let pivot = [];
    let x_idx = [];
    let y_idx = [];
    const x_loc = index % SIZE_X;
    const y_loc = parseInt(index / SIZE_X);
    const x_loc_max = SIZE_X-1;
    const y_loc_max = SIZE_Y-1;

    for (let i=(x_loc-1); i <= (x_loc+1); i++) {
      if ((i >= 0)&&(i <= x_loc_max)) {
        x_idx.push(i);
      }
    }
    for (let j=(y_loc-1); j <= (y_loc+1); j++) {
      if ((j >= 0)&&(j <= y_loc_max)) {
        y_idx.push(j);
      }
    }
    console.log('x_loc', x_loc, 'x_loc_max', x_loc_max, 'x_idx', x_idx);
    console.log('y_loc', y_loc, 'y_loc_max', y_loc_max, 'y_idx', y_idx);
    for (let i=0; i < x_idx.length; i++) {
      for (let j=0; j < y_idx.length; j++) {
        pivot.push(SIZE_X*y_idx[j] + x_idx[i]);
      }
    }
    for (let i=0; i < pivot.length; i++) {
      if (i!=index) {
        console.log('pivot',pivot[i],'x_loc',x_loc,'y_loc',y_loc);
        accessCell(pivot[i]);
      }
    }
  }
  function accessCell(index) {
    if (!checkIndexRange(index)){
      // out of range
      return 0;
    }
    //cellElemLists[index].innerHTML = othelloColor;
    let node = cellElemLists[index];
    if (node.classList.contains('touch')) {
      console.log('skip', index);
    } else {
      let val = node.innerHTML;
      node.innerHTML = '(' + val + ')';
      //node.style.backgroundColor = '#f0f0f0';
      //node.style.color = '#0f0';
      node.classList.add('touch');
      console.log('touch', index);
      if (val == 0) {
        console.log('empty', index);
        console.log('size_X', SIZE_X);
        console.log('size_Y', SIZE_Y);
        
        pivotCell(index);
      }
    }
    return 1;
  }
}
