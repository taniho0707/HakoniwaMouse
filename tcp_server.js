const net = require('net');
const { Buffer } = require('node:buffer');
const { EventEmitter } = require('stream');

class TcpServer extends EventEmitter {
  buf_uncompleted;

  constructor() {
    super();

    this.buf_uncompleted = Buffer.alloc(0);

    this.server = net.createServer(this.onConnection.bind(this));

    this.server.on('error', (err) => {
      console.error(err);
    });
  }

  onConnection(socket) {
    console.log('Client connected');

    socket.on('end', () => {
      console.log('Client disconnected');
    });

    // クライアントから受信したデータを処理する
    // 先頭 1Byte によって後続の処理が変わるため、振りわけを行う
    socket.on('data', (data) => {
      this.buf_uncompleted = Buffer.concat([
        this.buf_uncompleted,
        Buffer.from(data),
      ]);

      while (
        this.buf_uncompleted.length >= 4 &&
        this.buf_uncompleted.length >= this.buf_uncompleted.readUInt32BE()
      ) {
        let len = this.buf_uncompleted.readUInt32BE();
        let buf_trimmed = Buffer.alloc(len);
        this.buf_uncompleted.subarray(4, len + 4).copy(buf_trimmed);

        // console.log(buf_trimmed);

        switch (buf_trimmed[0]) {
          case 0x01: // マウス座標/向き設定 float型
            this.setMousePosition(buf_trimmed.subarray(1));
            break;
          case 0x80: // 迷路タイトル設定
            this.setMazeTitle(buf_trimmed.subarray(1));
            break;
          case 0x90: // 迷路マスにマーカー設置
            this.setMazeMarker(buf_trimmed.subarray(1));
            break;
          case 0xa0: // パス描画 マス基準指定
            this.setPathByGrid(buf_trimmed.subarray(1));
            break;
          case 0xa1: // パス描画 float座標指定
            this.setPathByFloat(buf_trimmed.subarray(1));
            break;
          default:
            console.error(
              '無効なデータ 0x' +
                buf_trimmed.toString('hex', 0, 1) +
                ' を受信しました。'
            );
            break;
        }

        this.buf_uncompleted = this.buf_uncompleted.subarray(len + 4);
      }
    });
  }

  setMousePosition(buf) {
    let x = buf.readFloatBE(0);
    let y = buf.readFloatBE(4);
    let a = buf.readFloatBE(8);
    console.log('setMousePosition x:' + x + ', y:' + y + ', a:' + a);
    this.emit('set_mouse_position', x, y, a);
  }

  setMazeTitle(buf) {
    let str = buf.toString();
    console.log('setMazeTitle ' + str);
    this.emit('set_maze_title', str);
  }

  setMazeMarker(buf) {
    let len = buf.length;
    if (len % 3 === 0) {
      let loop = len / 3;
      console.log('setMazeMarker num:' + loop);
      let arr = [];
      for (let i = 0; i < loop; i++) {
        let x = buf.readUInt8(i * 3);
        let y = buf.readUInt8(i * 3 + 1);
        let mark = buf.readUInt8(i * 3 + 2);
        console.log('    x:' + x + ', y:' + y + ', mark:' + mark);
        arr.push({
          x: x,
          y: y,
          m: mark,
        });
      }
      this.emit('set_maze_marker', arr);
    } else {
      console.error(
        '有効なデータ長は 3 の倍数です。受信データ長は ' + len + 'でした。'
      );
    }
  }

  setPathByGrid(buf) {
    let len = buf.length;
    if (len % 2 === 1) {
      let loop = (len - 1) / 2;
      let type = buf.readUInt8(0);
      console.log('setPathByGrid num:' + loop + ', type:' + type);
      let arr = [];
      for (let i = 0; i < loop; i++) {
        let x = buf.readUInt8(i * 2);
        let y = buf.readUInt8(i * 2 + 1);
        console.log('    x:' + x + ', y:' + y);
        arr.push({
          x: x,
          y: y,
        });
      }
      this.emit('set_path_by_grid', arr);
    } else {
      console.error(
        '有効なデータ長は奇数です。受信データ長は ' + len + 'でした。'
      );
    }
  }

  setPathByFloat(buf) {
    let len = buf.length;
    if (len % 8 === 1) {
      let loop = (len - 1) / 8;
      let type = buf.readUInt8(0);
      console.log('setPathByFloat num:' + loop + ', type:' + type);
      let arr = [];
      for (let i = 0; i < loop; i++) {
        let x = buf.readUInt8(i * 8);
        let y = buf.readUInt8(i * 8 + 4);
        console.log('    x:' + x + ', y:' + y);
        arr.push({
          x: x,
          y: y,
        });
      }
      this.emit('set_path_by_float', arr);
    } else {
      console.error(
        '有効なデータ長は 8の倍数+1 です。受信データ長は ' + len + 'でした。'
      );
    }
  }

  handlePoint(point) {
    // handle point logic here
  }

  listen(port) {
    this.server.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  }

  close() {
    this.server.close((err) => {
      if (err) {
        console.error(err);
      } else {
        console.log('Server closed');
      }
    });
  }
}

module.exports = { TcpServer };
