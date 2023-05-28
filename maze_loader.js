const fs = require('fs');

const MAZE_SIZE_WIDTH = 32;
const MAZE_SIZE_HEIGHT = 32;

function MazeLoader(str) {
  return new Promise((resolve, reject) => {
    fs.open('./maze/' + str, (err, fd) => {
      if (err) {
        return reject(err);
      }
      fs.read(fd, (err, bytesRead, buffer) => {
        if (err) {
          return reject(err);
        }

        // parseMaze
        let maze_object = {};

        // ClassType = 1 Byte
        switch (buffer[0]) {
          case 0x01:
            maze_object.ClassType = 'Half';
            break;
          case 0x02:
            maze_object.ClassType = 'Classic';
            break;
          default:
            return reject(Error('mazeファイルのClassTypeが不正な値です'));
        }

        // Goal = 1 + length * 4 Bytes
        let goal_size = buffer.readUInt8(1);
        if (buffer.length < 250 + goal_size * 4) {
          // tekito
          return reject(Error('mazeファイルが不正に小さいサイズです'));
        }
        maze_object.goals = [];
        for (let i = 0; i < goal_size; ++i) {
          let x = buffer.readInt16BE(2 + i * 4);
          let y = buffer.readInt16BE(4 + i * 4);
          maze_object.goals.push({
            x: x,
            y: y,
          });
        }

        // initialize maze data
        let startbit = 0x00000001;
        maze_object.data = [];
        for (let x = 0; x < MAZE_SIZE_WIDTH; ++x) {
          maze_object.data[x] = [];
          for (let y = 0; y < MAZE_SIZE_HEIGHT; ++y) {
            maze_object.data[x][y] = {
              east: true,
              west: true,
              south: true,
              north: true,
            };
          }
        }

        // column
        for (let x = 0; x < MAZE_SIZE_WIDTH - 1; ++x) {
          let buf_current_column = buffer.readUInt32BE(
            goal_size * 4 + 2 + x * 4
          );
          for (let y = 0; y < MAZE_SIZE_HEIGHT; ++y) {
            if ((buf_current_column & (startbit << (31 - y))) !== 0) {
              maze_object.data[x][y].east = true;
              maze_object.data[x + 1][y].west = true;
            } else {
              maze_object.data[x][y].east = false;
              maze_object.data[x + 1][y].west = false;
            }
          }
        }

        // row
        for (let y = 0; y < MAZE_SIZE_HEIGHT - 1; ++y) {
          let buf_current_row = buffer.readUInt32BE(
            goal_size * 4 + 2 + 124 + y * 4
          );
          for (let x = 0; x < MAZE_SIZE_WIDTH; ++x) {
            if ((buf_current_row & (startbit << (31 - x))) !== 0) {
              maze_object.data[x][y].north = true;
              maze_object.data[x][y + 1].south = true;
            } else {
              maze_object.data[x][y].north = false;
              maze_object.data[x][y + 1].south = false;
            }
          }
        }

        resolve(maze_object);
      });
    });
  });
}

module.exports = { MazeLoader };
