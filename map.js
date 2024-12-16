//map.js

function generateMap() {
  let map = [0,1,2,0,2,1,1,2,1,1,2,2,0,0,0,2,0,-1,1,2,1,2,0,1,1];
  
  for (let i=0;i<100;i++){
    Switch(map, getRandomPair());
  }

  return map;
}

function Switch(map,pair){
  let store =  map[pair[0]];
  map[pair[0]] = map[pair[1]];
  map[pair[1]] = store;
}

function getRandomPair() {
  let v1 = Math.floor(Math.random() * 25);
  let v2 = Math.floor(Math.random() * 25);
  while (v1 == v2) {
    v2 = Math.floor(Math.random() * 25);
  }
  return [v1,v2];
}

module.exports = generateMap;