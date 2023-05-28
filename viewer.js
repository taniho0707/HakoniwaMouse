import * as THREE from './node_modules/three/build/three.module.js';

import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { GUI } from './node_modules/lil-gui/dist/lil-gui.esm.js';

let camera, scene, renderer, controls;

// 座標軸
let axes;
function showAxis(scene) {
  axes = new THREE.AxesHelper(1);
  scene.add(axes);
}

// 床
let mesh_floor;
function showFloor(scene) {
  let geometry = new THREE.BoxGeometry(2.892, 2.892, 0.05);
  let material = new THREE.MeshBasicMaterial({ color: 0x333333 });
  mesh_floor = new THREE.Mesh(geometry, material);
  mesh_floor.position.set(2.892 / 2 - 0.006, 2.892 / 2 - 0.006, -0.05 / 2);
  scene.add(mesh_floor);
}

// 背景
function showBackground(scene) {
  scene.background = new THREE.Color(0xaddaff);
}

// 柱
function showPillars(scene, game_class) {
  let geometry;
  let materials = [
    new THREE.MeshBasicMaterial({ color: 0xeeeeee }),
    new THREE.MeshBasicMaterial({ color: 0xeeeeee }),
    new THREE.MeshBasicMaterial({ color: 0xeeeeee }),
    new THREE.MeshBasicMaterial({ color: 0xeeeeee }),
    new THREE.MeshBasicMaterial({ color: 0xee0000 }),
    new THREE.MeshBasicMaterial({ color: 0xeeeeee }),
  ];

  if (game_class === 'Half') {
    geometry = new THREE.BoxGeometry(0.006, 0.006, 0.025);
    for (let x = 0; x < 33; ++x) {
      for (let y = 0; y < 33; ++y) {
        let mesh_pillar = new THREE.Mesh(geometry, materials);
        mesh_pillar.position.set(0.09 * x, 0.09 * y, 0.025 / 2);
        scene.add(mesh_pillar);
      }
    }
  } else if (game_class === 'Classic') {
    geometry = new THREE.BoxGeometry(0.012, 0.012, 0.05);
    for (let x = 0; x < 17; ++x) {
      for (let y = 0; y < 17; ++y) {
        let mesh_pillar = new THREE.Mesh(geometry, materials);
        mesh_pillar.position.set(0.18 * x, 0.18 * y, 0.05 / 2);
        scene.add(mesh_pillar);
      }
    }
  } else {
    return false;
  }
}

// 壁
function showWalls(scene, game_class, wall_data) {
  if (!wall_data) {
    return;
  }

  let geometry_row, geometry_column;
  let materials = [
    new THREE.MeshBasicMaterial({ color: 0xeeeeee }),
    new THREE.MeshBasicMaterial({ color: 0xeeeeee }),
    new THREE.MeshBasicMaterial({ color: 0xeeeeee }),
    new THREE.MeshBasicMaterial({ color: 0xeeeeee }),
    new THREE.MeshBasicMaterial({ color: 0xee0000 }),
    new THREE.MeshBasicMaterial({ color: 0xeeeeee }),
  ];

  if (game_class === 'Half') {
    debugger;
    geometry_row = new THREE.BoxGeometry(0.09, 0.006, 0.025);
    for (let x = 0; x < 32; ++x) {
      for (let y = 0; y < 33; ++y) {
        if (y === 32 || wall_data[x][y].south) {
          let mesh_wall = new THREE.Mesh(geometry_row, materials);
          mesh_wall.position.set(0.09 * x + 0.045, 0.09 * y, 0.025 / 2);
          scene.add(mesh_wall);
        }
      }
    }
    geometry_column = new THREE.BoxGeometry(0.006, 0.09, 0.025);
    for (let x = 0; x < 33; ++x) {
      for (let y = 0; y < 32; ++y) {
        if (x === 32 || wall_data[x][y].west) {
          let mesh_wall = new THREE.Mesh(geometry_column, materials);
          mesh_wall.position.set(0.09 * x, 0.09 * y + 0.045, 0.025 / 2);
          scene.add(mesh_wall);
        }
      }
    }
  } else if (game_class === 'Classic') {
    // geometry = new THREE.BoxGeometry(0.012, 0.012, 0.05);
    // for (let x = 0; x < 17; ++x) {
    //   for (let y = 0; y < 17; ++y) {
    //     let mesh_pillar = new THREE.Mesh(geometry, materials);
    //     mesh_pillar.position.set(0.18 * x, 0.18 * y, 0.05 / 2);
    //     scene.add(mesh_pillar);
    //   }
    // }
  } else {
    return false;
  }
}

function clearMeshes(scene) {
  scene = new THREE.Scene();
  console.log('All meshes cleared');
}

function reloadMaze(maze) {
  showBackground(scene);
  showAxis(scene);
  showFloor(scene);
  showPillars(scene, maze.ClassType);
  showWalls(scene, maze.ClassType, maze.data);
}

// マウス

function setCamera() {
  camera = new THREE.OrthographicCamera(
    ((-2.892 / 2) * window.innerWidth) / window.innerHeight,
    ((2.892 / 2) * window.innerWidth) / window.innerHeight,
    2.892 / 2,
    -2.892 / 2
  );
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, document.body);
  controls.target = new THREE.Vector3(2.892 / 2, 2.892 / 2, 0);

  camera.position.set(2.892 / 2, 2.892 / 2, 5);
  camera.lookAt(2.892 / 2 - 0.006, 2.892 / 2 - 0.006, 0);
}

function init() {
  const gui = new GUI();
  // gui.add(mesh, 'count', 0, count);

  scene = new THREE.Scene();

  setCamera();

  showBackground(scene);
  showAxis(scene);
  showFloor(scene);
  showPillars(scene, 'Half');
  showWalls(scene, 'Half', null);

  window.addEventListener('resize', onWindowResize);

  window.electronAPI.onMazeLoad((_event, arg) => {
    clearMeshes(scene);
    reloadMaze(arg);
  });
}

function onWindowResize() {
  // camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  render();
}

function render() {
  renderer.render(scene, camera);
}

// Main process

init();
animate();
