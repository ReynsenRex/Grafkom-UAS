import * as THREE from "three";
import { Player, PlayerController, ThirdPersonCamera } from "./player.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Main {
  static init() {
    var canvasRef = document.getElementById("canvas");
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      5000
    );
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: canvasRef,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;

    // Load sky texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setPath("../resources/");
    const skyTexture = textureLoader.load("sky.jpg");

    // Create sky dome
    const skyMaterial = new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide });
    const skyGeometry = new THREE.SphereGeometry(1000, 32, 32); 
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(sky);

    // Ground
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

    // Boundaries
    const boundaryMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.1,
    });
    
    const boundaries = [
      { position: [0, 25, -30], rotation: [0, 0, 0] },
      { position: [0, 25, 30], rotation: [0, Math.PI, 0] },
      { position: [-30, 25, 0], rotation: [0, Math.PI / 2, 0] },
      { position: [30, 25, 0], rotation: [0, -Math.PI / 2, 0] },
      { position: [0, 50, 0], rotation: [-Math.PI / 2, 0, 0] },
    ];

    boundaries.forEach(boundary => {
      const boundaryMesh = new THREE.Mesh(new THREE.PlaneGeometry(60, 50), boundaryMaterial);
      boundaryMesh.position.set(...boundary.position);
      boundaryMesh.rotation.set(...boundary.rotation);
      boundaryMesh.receiveShadow = true;
      this.scene.add(boundaryMesh);
    });

    // Directional lighting
    var directionalLight = new THREE.DirectionalLight(0xffffff);
    var directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight);
    var pointlight = new THREE.PointLight(0xffffff);
    var ambient = new THREE.AmbientLight(0xffffff, 0.2);

    directionalLight.castShadow = true;
    directionalLight.position.set(3, 21, 18);
    pointlight.position.set(3, 19, 1);

    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    directionalLight.shadow.bias = -0.01;

    this.scene.add(directionalLight);
    this.scene.add(directionalLightHelper);
    // this.scene.add(pointlight);
    this.scene.add(ambient);

    var thirdPerson = new ThirdPersonCamera(
      this.camera,
      new THREE.Vector3(-10, 5, 0),
      new THREE.Vector3(0, 0, 0)
    );

    var controller = new PlayerController();
    this.player = new Player(thirdPerson, controller, this.scene);

    // Free camera controls
    this.freeCamera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      5000
    );
    this.freeCamera.position.set(0, 10, 20);
    this.pointerLockControls = new PointerLockControls(this.freeCamera, this.renderer.domElement);
    this.isFreeCamActive = false;

    // Event listeners for pointer lock
    document.addEventListener("click", () => {
      if (this.isFreeCamActive) {
        this.pointerLockControls.lock();
      }
    });

    // Variables for movement
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.tiltRight = false;
    this.tiltLeft = false;
    this.moveSpeed = 1;
    this.rollSpeed = 0.01;

    // Event listeners for key down and up
    document.addEventListener("keydown", this.onKeyDown.bind(this));
    document.addEventListener("keyup", this.onKeyUp.bind(this));

  }

  static toggleFreeCam() {
    this.isFreeCamActive = !this.isFreeCamActive;
    if (this.isFreeCamActive) {
      this.camera = this.freeCamera;
      this.pointerLockControls.lock();
    } else {
      this.camera = this.player.camera.camera;
      this.pointerLockControls.unlock();
    }
  }

  static onKeyDown(event) {
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
  }

  static onKeyUp(event) {
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
//rotation: [-10, 0, 0], scale: [1, 1, 1], position: [3, 21, 20]
var sun = new GLTFLoader();
sun.load('resources/realSun.glb', function (gltf) {
  var model = gltf.scene;
  model.position.set(3, 21, 20); // Set position to (16,2,-18)
  model.rotation.set(-10, 0, 0);
  model.scale.set(1, 1, 1);
  Main.scene.add(model);

  // Create a bounding box for the model
  model.traverse(function (child) {
    if (child.isMesh) {
      child.geometry.computeBoundingBox();
      child.geometry.boundingBox.applyMatrix4(child.matrixWorld);
    }
  });

  model.userData.boundingBox = new THREE.Box3().setFromObject(model);

  // Add hemisphere light near the sun model
  const hemiLight = new THREE.SpotLight(0xffffbb, 0x080820, 1);
  hemiLight.position.set(3, 21, 20);
  Main.scene.add(hemiLight);

}, undefined, function (error) {
  console.error(error);
});

{ // Grass spawner
  var grassLoader = new GLTFLoader();

  function getRandomValue(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createRandomGrass() {
    grassLoader.load('resources/Enviroment/grass green.glb', function (gltf) {
      var model = gltf.scene;
      model.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });
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
  for (let i = 0; i < 50; i++) { // Adjust the number of grass instances as needed
    createRandomGrass();
  }
}

Main.init();

var lastTimestamp = 0;
function animate(timestamp) {
  var dt = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  Main.render(dt);
  requestAnimationFrame(animate);
}
animate();
