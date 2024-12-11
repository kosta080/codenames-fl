const fs = require("fs");
const path = require("path");

class Word {
  constructor(index, spell, type, voters) {
    this.index = index;
    this.spell = spell;
    this.voters = voters;
    this.type = type;
  }
}

// Load words from file and shuffle them
function loadWords(filePath) {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const wordList = fileContent.split("\n").map((word) => word.trim()).filter(Boolean);

  // Shuffle the words
  for (let i = wordList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [wordList[i], wordList[j]] = [wordList[j], wordList[i]];
  }

  return wordList;
}

module.exports = { Word, loadWords };
