import * as THREE from "three";
import { Player, PlayerController, ThirdPersonCamera } from "./player.js";

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

    this.renderer.setSize(800, 600);
    this.renderer.setClearColor(0x00000); // Change background color for better visibility
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Optionally change shadow map type for better quality




    // Plane
    var plane = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshPhongMaterial({ color: 0xffffff })
    );

    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    this.scene.add(plane);

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
  }

  static render(dt) {
    this.player.update(dt);
    this.renderer.render(this.scene, this.camera);
  }
}

var clock = new THREE.Clock();
Main.init();

function animate() {
  Main.render(clock.getDelta());
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
