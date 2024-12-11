
function generateMap() {
  let map = new Array(25);
  
  for (let i = 0; i < map.length; i++) {
    map[i] = 0; // Or any other default value
  }
  
  map[0] = 0;
  map[1] = 1
  map[2] = -1
  map[3] = 1
  map[4] = 2
  
  return map;
}

module.exports = generateMap;