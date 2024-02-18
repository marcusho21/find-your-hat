const prompt = require('prompt-sync')({ sigint: true });
const { EventEmitter } = require('events');

const hat = '^';
const hole = 'O';
const fieldCharacter = '░';
const pathCharacter = '*';

class Field {
  constructor(fields) {
    this.fields = fields;
    this.currentTile = [0, 0];

    this.currentTileUpdate = new EventEmitter();
    this.fieldUpdate = new EventEmitter();

    this.currentTileUpdate.on('update-current', this.updateField);
  }

  print() {
    console.log(this.fields.map((row) => row.join(' ')).join('\n\n'));
  }

  updateCurrentTile(direction) {
    switch (direction.toLowerCase()) {
      case 'u':
      case 'up':
        this.currentTile[1] -= 1;
        break;
      case 'd':
      case 'down':
        this.currentTile[1] += 1;
        break;
      case 'l':
      case 'left':
        this.currentTile[0] -= 1;
        break;
      case 'r':
      case 'right':
        this.currentTile[0] += 1;
        break;
      default:
        throw new Error('Invalid direction');
    }

    this.currentTileUpdate.emit('update-current', this.currentTile);
  }

  updateField = (currentPosition) => {
    const [x, y] = currentPosition;
    const currentTile = this.fields[y][x];

    if (currentTile === undefined) {
      this.fieldUpdate.emit('out-of-bounds');
      return;
    }

    if (currentTile === hole) {
      this.fieldUpdate.emit('fall-in-hole');
      return;
    }

    if (currentTile === hat) {
      this.fieldUpdate.emit('found-hat');
      return;
    }

    this.fields[y][x] = pathCharacter;
    this.print();
  };

  cleanup() {
    this.currentTileUpdate.removeAllListeners();
    this.fieldUpdate.removeAllListeners();
  }
}

class Game {
  inProgress = true;

  constructor(field) {
    this.field = field;
    this.field.print();

    this.field.fieldUpdate.on('fall-in-hole', this.lose);
    this.field.fieldUpdate.on('found-hat', this.win);
    this.field.fieldUpdate.on('out-of-bounds', this.outOfBounds);
  }

  move(direction) {
    this.field.updateCurrentTile(direction);
  }

  win = () => {
    this.inProgress = false;
    console.log('You found the hat! You won!');
  };

  lose = () => {
    this.inProgress = false;
    console.log('You fall in a hole! You lose!');
  };

  outOfBounds = () => {
    this.inProgress = false;
    console.log('You went out of bounds! You lose!');
  };

  cleanup() {}
}

const myField = new Field([
  [pathCharacter, fieldCharacter, hole, fieldCharacter],
  [fieldCharacter, hole, fieldCharacter, fieldCharacter],
  [fieldCharacter, hat, fieldCharacter, fieldCharacter],
  [fieldCharacter, hole, fieldCharacter, hole],
  [fieldCharacter, fieldCharacter, hole, fieldCharacter],
]);
const game = new Game(myField);

while (game.inProgress) {
  const direction = prompt('Which way? ');
  game.move(direction);
}
