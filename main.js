import * as THREE from "three";
import { Player, PlayerController, ThirdPersonCamera } from "./player.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class Main {
  static init() {
    var canvasRef = document.getElementById("canvas");
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: canvasRef,
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Optionally change shadow map type for better quality

    // Plane
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setPath("../resources/");
    textureLoader.load(
      "grass.jpg",
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1000, 1000);
      
        const groundMaterial = new THREE.MeshStandardMaterial({ map: texture });
        const groundGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
      }
    );

    const boundaryMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.1,
    });
    
    const boundaries = [
      // Front
      new THREE.Mesh(new THREE.PlaneGeometry(60, 50), boundaryMaterial),
      // Back
      new THREE.Mesh(new THREE.PlaneGeometry(60, 50), boundaryMaterial),
      // Left
      new THREE.Mesh(new THREE.PlaneGeometry(60, 50), boundaryMaterial),
      // Right
      new THREE.Mesh(new THREE.PlaneGeometry(60, 50), boundaryMaterial),
      // Top
      new THREE.Mesh(new THREE.PlaneGeometry(100, 100), boundaryMaterial),
    ];
    
    boundaries[0].position.set(0, 25, -30);
    boundaries[0].rotation.set(0, 0, 0);
    
    boundaries[1].position.set(0, 25, 30);
    boundaries[1].rotation.set(0, Math.PI, 0);
    
    boundaries[2].position.set(-30, 25, 0);
    boundaries[2].rotation.set(0, Math.PI / 2, 0);
    
    boundaries[3].position.set(30, 25, 0);
    boundaries[3].rotation.set(0, -Math.PI / 2, 0);
    
    boundaries[4].position.set(0, 50, 0);
    boundaries[4].rotation.set(-Math.PI / 2, 0, 0);
    
    boundaries.forEach((boundary) => {
      boundary.receiveShadow = true;
      this.scene.add(boundary);
    });

    // Directional lighting
    var directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.castShadow = true;
    directionalLight.position.set(3, 10, 10);

    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    directionalLight.shadow.bias = -0.01;

    var directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight);
    this.scene.add(directionalLightHelper);
    this.scene.add(directionalLight);

    var thirdPerson = new ThirdPersonCamera(
      this.camera,
      new THREE.Vector3(-5, 5, 0),
      new THREE.Vector3(0, 0, 0)
    );

    var controller = new PlayerController();

    this.player = new Player(
      thirdPerson, controller, this.scene
    );

    // Initialize free camera controls
    this.freeCamera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.freeCamera.position.set(0, 10, 20);
    this.pointerLockControls = new PointerLockControls(this.freeCamera, this.renderer.domElement);
    this.isFreeCamActive = false;

    // Event listeners for pointer lock
    document.addEventListener("click", () => {
      if (this.isFreeCamActive) {
        this.pointerLockControls.lock();
      }
    }, false);

    this.pointerLockControls.addEventListener("lock", () => {
      console.log("Pointer locked");
    }, false);

    this.pointerLockControls.addEventListener("unlock", () => {
      console.log("Pointer unlocked");
    }, false);

    // Variables for movement
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.tiltRight = false;
    this.tiltLeft = false;
    this.moveSpeed = 0.1;
    this.rollSpeed = 0.01;

    // Function to handle key down events
    this.onKeyDown = (event) => {
      switch (event.key) {
        case "w":
          this.moveForward = true;
          break;
        case "s":
          this.moveBackward = true;
          break;
        case "a":
          this.moveLeft = true;
          break;
        case "d":
          this.moveRight = true;
          break;
        case "q":
          this.tiltLeft = true;
          break;
        case "e":
          this.tiltRight = true;
          break;
        case "g":
          this.toggleFreeCam();
          break;
      }
    };

    // Function to handle key up events
    this.onKeyUp = (event) => {
      switch (event.key) {
        case "w":
          this.moveForward = false;
          break;
        case "s":
          this.moveBackward = false;
          break;
        case "a":
          this.moveLeft = false;
          break;
        case "d":
          this.moveRight = false;
          break;
        case "q":
          this.tiltLeft = false;
          break;
        case "e":
          this.tiltRight = false;
          break;
      }
    };

    document.addEventListener("keydown", (event) => this.onKeyDown(event), false);
    document.addEventListener("keyup", (event) => this.onKeyUp(event), false);

    // Function to reset mouse and camera orientation
    this.resetMouseAndCamera = () => {
      this.pointerLockControls.reset();
    };

    // Add event listener for "R" key to reset mouse and camera orientation
    document.addEventListener("keydown", (event) => {
      if (event.key === "r") {
        this.resetMouseAndCamera();
      }
    }, false);
  }

  static toggleFreeCam() {
    this.isFreeCamActive = !this.isFreeCamActive;
    if (this.isFreeCamActive) {
      this.camera = this.freeCamera;
      this.pointerLockControls.lock(); // Lock pointer when toggling to free cam
    } else {
      this.camera = this.player.camera.camera;
      this.pointerLockControls.unlock(); // Unlock pointer when toggling to player cam
    }
  }

  static render(dt) {
    if (this.isFreeCamActive) {
      const moveVector = new THREE.Vector3();
      if (this.moveForward) {
        moveVector.add(this.pointerLockControls.getDirection(new THREE.Vector3()).multiplyScalar(this.moveSpeed));
      }
      if (this.moveBackward) {
        moveVector.add(this.pointerLockControls.getDirection(new THREE.Vector3()).multiplyScalar(-this.moveSpeed));
      }
      if (this.moveLeft) {
        this.pointerLockControls.moveRight(-this.moveSpeed);
      }
      if (this.moveRight) {
        this.pointerLockControls.moveRight(this.moveSpeed);
      }
      if (this.tiltLeft) {
        this.freeCamera.rotation.z += this.rollSpeed;
      }
      if (this.tiltRight) {
        this.freeCamera.rotation.z -= this.rollSpeed;
      }

      this.freeCamera.position.add(moveVector);

      // Ensure camera stays within boundaries
      const boundarySize = 30;
      this.freeCamera.position.x = Math.max(-boundarySize, Math.min(boundarySize, this.freeCamera.position.x));
      this.freeCamera.position.z = Math.max(-boundarySize, Math.min(boundarySize, this.freeCamera.position.z));
      this.freeCamera.position.y = Math.max(this.freeCamera.position.y, 1.5);
    } else {
      this.player.update(dt);
    }
    this.renderer.render(this.scene, this.camera);
  }
}
// enviroment renderering
{//Houses
var barracks = new GLTFLoader();
barracks.load('resources/Enviroment/Barracks.glb', function (gltf) {
  var model = gltf.scene;
  model.position.set(20, 0, 0); // Set position to (0,0,0)
  model.castShadow = true;
  model.receiveShadow = true;
  model.rotation.set(0, -Math.PI / 2.3, 0);
  model.scale.set(6, 6, 6);
  Main.scene.add(model);
}, undefined, function (error) {
  console.error(error);
});

var barracks = new GLTFLoader();
barracks.load('resources/Enviroment/Barracks.glb', function (gltf) {
  var model = gltf.scene;
  model.position.set(20, 0, -27); // Set position to (0,0,0)
  model.castShadow = true;
  model.receiveShadow = true;
  model.rotation.set(0, 31, 0);
  model.scale.set(6, 6, 6);
  Main.scene.add(model);
}, undefined, function (error) {
  console.error(error);
});

var cottage = new GLTFLoader();
cottage.load('resources/Enviroment/Cottage.glb', function (gltf) {
  var model = gltf.scene;
  model.position.set(-10, 0, 0); // Set position to (0,0,0)
  model.castShadow = true;
  model.receiveShadow = true;
  model.rotation.set(0, Math.PI / 9, 0);
  model.scale.set(15, 15, 15);
  Main.scene.add(model);
}, undefined, function (error) {
  console.error(error);
});

var cottage2 = new GLTFLoader();
cottage2.load('resources/Enviroment/Cottage.glb', function (gltf) {
  var model = gltf.scene;
  model.position.set(-12, 0, -21); 
  model.castShadow = true;
  model.receiveShadow = true;
  model.rotation.set(0, Math.PI / 2, 0);
  model.scale.set(15, 15, 15);
  Main.scene.add(model);
}, undefined, function (error) {
  console.error(error);
});

var cottage3 = new GLTFLoader();
cottage3.load('resources/Enviroment/Cottage.glb', function (gltf) {
  var model = gltf.scene;
  model.position.set(12, 0, 21); 
  model.castShadow = true;
  model.receiveShadow = true;
  model.rotation.set(0, Math.PI / 2, 0);
  model.scale.set(15, 15, 15);
  Main.scene.add(model);
}, undefined, function (error) {
  console.error(error);
});

var Prairie = new GLTFLoader();
Prairie.load('resources/Enviroment/Prairie Shed.glb', function (gltf) {
  var model = gltf.scene;
  model.position.set(-5, 2, -10); // Set position to (0,0,0)
  model.castShadow = true;
  model.receiveShadow = true;
  model.rotation.set(0, Math.PI / 4, 0);
  model.scale.set(2, 2, 2);
  Main.scene.add(model);
}, undefined, function (error) {
  console.error(error);
});

var Prairie2 = new GLTFLoader();
Prairie2.load('resources/Enviroment/Prairie Shed.glb', function (gltf) {
  var model = gltf.scene;
  model.position.set(-15, 2, 18); // Set position to (0,0,0)
  model.castShadow = true;
  model.receiveShadow = true;
  model.rotation.set(0, 10, 0);
  model.scale.set(2, 2, 2);
  Main.scene.add(model);
}, undefined, function (error) {
  console.error(error);
});

var Prairie2 = new GLTFLoader();
Prairie2.load('resources/Enviroment/Prairie Shed.glb', function (gltf) {
  var model = gltf.scene;
  model.position.set(16, 2, -18); // Set position to (0,0,0)
  model.castShadow = true;
  model.receiveShadow = true;
  model.rotation.set(0, 10, 0);
  model.scale.set(2, 2, 2);
  Main.scene.add(model);
}, undefined, function (error) {
  console.error(error);
});

}

{ // TREE Static
var pine_tree = new GLTFLoader();
pine_tree.load('resources/Enviroment/Pine Tree.glb', function (gltf) {
  var model = gltf.scene;
  model.position.set(0, 3, 7); // Set position to (0,0,0)
  model.castShadow = true;
  model.receiveShadow = true;
  model.rotation.set(0, -Math.PI / 2.3, 0);
  model.scale.set(2, 2, 2);
  Main.scene.add(model);
}, undefined, function (error) {
  console.error(error);
});

var pine_tree2 = new GLTFLoader();
pine_tree2.load('resources/Enviroment/Pine Tree.glb', function (gltf) {
  var model = gltf.scene;
  model.position.set(15, 3, 7); // Set position to (0,0,0)
  model.castShadow = true;
  model.receiveShadow = true;
  model.rotation.set(0, -Math.PI / 2.3, 0);
  model.scale.set(2, 2, 2);
  Main.scene.add(model);
}, undefined, function (error) {
  console.error(error);
});

var pine_tree3 = new GLTFLoader();
pine_tree3.load('resources/Enviroment/Pine Tree.glb', function (gltf) {
  var model = gltf.scene;
  model.position.set(-15, 3, 7); // Set position to (0,0,0)
  model.castShadow = true;
  model.receiveShadow = true;
  model.rotation.set(0, -Math.PI / 2.3, 0);
  model.scale.set(2, 2, 2);
  Main.scene.add(model);
}, undefined, function (error) {
  console.error(error);
});

var pine_tree4 = new GLTFLoader();
pine_tree4.load('resources/Enviroment/Pine Tree.glb', function (gltf) {
  var model = gltf.scene;
  model.position.set(12, 3, -10); // Set position to (0,0,0)
  model.castShadow = true;
  model.receiveShadow = true;
  model.rotation.set(0, -Math.PI / 2.3, 0);
  model.scale.set(2, 2, 2);
  Main.scene.add(model);
}, undefined, function (error) {
  console.error(error);
});

var pine_tree5 = new GLTFLoader();
pine_tree5.load('resources/Enviroment/Pine Tree.glb', function (gltf) {
  var model = gltf.scene;
  model.position.set(6, 3, 19); // Set position to (0,0,0)
  model.castShadow = true;
  model.receiveShadow = true;
  model.rotation.set(0, -Math.PI / 2.3, 0);
  model.scale.set(2, 2, 2);
  Main.scene.add(model);
}, undefined, function (error) {
  console.error(error);
});
}

{// tree spawner
var pine_tree_loader = new GLTFLoader();

function getRandomValue(min, max) {
  return Math.random() * (max - min) + min;
}

function createRandomTree() {
  pine_tree_loader.load('resources/Enviroment/Pine Tree.glb', function (gltf) {
    var model = gltf.scene;
    
    // Random position
    var x = getRandomValue(-100, 100);
    var z = getRandomValue(-100, 100);
    model.position.set(x, 3, z);

    
    // Random scale
    model.scale.set(2, 2, 2);
    
    model.castShadow = true;
    model.receiveShadow = true;
    Main.scene.add(model);
  }, undefined, function (error) {
    console.error(error);
  });
}
// Create multiple random trees
for (let i = 0; i < 40; i++) { // Adjust the number of trees as needed
  createRandomTree();
}
}

{ // Grass spawner
  var grassLoader = new GLTFLoader();

function getRandomValue(min, max) {
  return Math.random() * (max - min) + min;
}

function createRandomGrass() {
  grassLoader.load('resources/Enviroment/grass green.glb', function (gltf) {
    var model = gltf.scene;
    
    // Random position
    var x = getRandomValue(-40, 40);
    var y = 0; // Assuming grass is on the ground, y can be 0
    var z = getRandomValue(-40, 40);
    model.position.set(x, y, z);
    
    // Random rotation
    var rotationY = getRandomValue(-Math.PI, Math.PI);
    model.rotation.set(0, rotationY, 0);
    
    // Random scale
    var scale = getRandomValue(4, 4); // Grass typically varies less in size
    model.scale.set(scale, scale, scale);
    
    model.castShadow = true;
    model.receiveShadow = true;
    Main.scene.add(model);
  }, undefined, function (error) {
    console.error(error);
  });
}

// Create multiple random grass instances
for (let i = 0; i < 200; i++) { // Adjust the number of grass instances as needed
  createRandomGrass();
}

}

var clock = new THREE.Clock();
Main.init();

function animate() {
  Main.render(clock.getDelta());
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
