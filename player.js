import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"; // Import GLTFLoader

export class Player {
    constructor(camera, controller, scene) {
        this.camera = camera;
        this.controller = controller;
        this.scene = scene;
        this.rotationVector = new THREE.Vector3();
        this.targetRotation = new THREE.Vector3();

        this.animations = {};
        this.state = 'idle';

        this.camera.setup(new THREE.Vector3(0, 0, 0), this.rotationVector);

        this.loadModel();
        for (let i = 0; i < 10; i++) {
            this.createApple();
          }
    }

    loadModel() {
        var loader = new FBXLoader();
        loader.setPath("../resources/Knight/");
        loader.load("Knight idle.fbx", (fbx) => {
            fbx.scale.setScalar(0.01);
            fbx.traverse(c => {
                c.castShadow = true;
            });
            this.mesh = fbx;
            this.scene.add(this.mesh);
            this.mesh.rotation.y = Math.PI / 2;
            this.targetRotation.y = Math.PI / 2;
    
            // Create a bounding box for the player model
            this.boundingBox = new THREE.Box3().setFromObject(this.mesh);
    
            this.mixer = new THREE.AnimationMixer(this.mesh);
            var onLoad = (animName, anim) => {
                var clip = anim.animations[0];
                var action = this.mixer.clipAction(clip);
    
                this.animations[animName] = {
                    clip: clip,
                    action: action
                };
            };
    
            var loader = new FBXLoader();
            loader.setPath("../resources/Knight/");
            loader.load('Knight idle.fbx', (fbx) => { onLoad('idle', fbx); });
            loader.load('Knight run.fbx', (fbx) => { onLoad('run', fbx); });
        });
    }

    createApple(){
        const gltfLoader = new GLTFLoader();
        gltfLoader.setPath("../resources/");
        gltfLoader.load("Apple Green.glb", (gltf) => {
          const model = gltf.scene;
          model.traverse((node) => {
            if (node.isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
            }
          });
          model.type = "apple";
          model.scale.set(0.5, 0.5, 0.5);
          const z = (Math.random() * 2 * Math.PI) / 2;
          model.rotation.z = 0;
          model.rotation.x = 0;
          model.position.set(
            Math.random() * 60 - 30,
            0.5,
            Math.random() * 60 - 30
          );
           // Create a hitbox for the apple (assuming a bounding sphere)
          const appleHitbox = new THREE.Sphere(model.position, 1);
          
          // Add hitbox as userData to the model
          model.userData.hitbox = appleHitbox;
          model.userData.velocity = new THREE.Vector3(
            Math.cos(z) * 0.05,
            0,
            Math.sin(z) * 0.05
          );
          this.scene.add(model);
          if (gltf.animations && gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach((clip) => {
              mixer.clipAction(clip).play();
            });
            mixers.push(mixer);
          }
        });
    }

    detectAppleCollision(playerBoundingBox, scene) {    
        scene.children.forEach((child) => {
            if (child.type === "apple") {
                const appleHitbox = child.userData.hitbox;
    
                // Check for intersection between player's bounding box and apple hitbox
                if (playerBoundingBox.intersectsSphere(appleHitbox)) {
                    // Collision detected!
                    console.log("Apple collected!");
    
                    // Remove the apple from the scene
                    scene.remove(child);
                }
            }
        });
    }

    isPositionWithinBoundaries(position) {
        const boundarySize = 30; // Adjust according to your scene's boundaries
    
        return (
            Math.abs(position.x) <= boundarySize &&
            Math.abs(position.z) <= boundarySize
            // Optionally, add Y-axis boundary checks if needed
            // position.y >= minY && position.y <= maxY
        );
    }
    
    update(dt) {
        if (!this.mesh) return;
    
        var direction = new THREE.Vector3(0, 0, 0);
        var moveSpeed = 10;
    
        if (this.controller.key['forward']) {
            direction.x += 1;
        }
        if (this.controller.key['backward']) {
            direction.x -= 1;
        }
        if (this.controller.key['left']) {
            direction.z -= 1;
        }
        if (this.controller.key['right']) {
            direction.z += 1;
        }
    
        if (direction.length() === 0) {
            if (this.animations['idle']) {
                if (this.state !== 'idle') {
                    this.mixer.stopAllAction();
                    this.state = 'idle';
                }
                this.mixer.clipAction(this.animations['idle'].clip).play();
                this.mixer.update(dt);
            }
        } else {
            if (this.animations['run']) {
                if (this.state !== 'run') {
                    this.mixer.stopAllAction();
                    this.state = 'run';
                }
                this.mixer.clipAction(this.animations['run'].clip).play();
                this.mixer.update(dt);
            }
    
            direction.normalize();
            direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.camera.rotationAngle.y);
    
            const newPosition = this.mesh.position.clone().add(direction.multiplyScalar(dt * moveSpeed));
    
            // Check boundaries before updating position
            if (this.isPositionWithinBoundaries(newPosition)) {
                this.mesh.position.copy(newPosition);
                if (direction.length() > 0) {
                    this.targetRotation.y = Math.atan2(direction.x, direction.z);
                }
            }
        }
    
        this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, this.targetRotation.y, 0.1);
    
        // Update the bounding box position
        this.boundingBox.setFromObject(this.mesh);
    
        this.camera.updateRotation(this.controller, dt);
        this.camera.setup(this.mesh.position, this.rotationVector);
        this.detectAppleCollision(this.boundingBox, this.scene);
    }
    
    detectAppleCollision(playerBoundingBox, scene) {    
        scene.children.forEach((child) => {
            if (child.type === "apple") {
                const appleHitbox = child.userData.hitbox;
    
                // Check for intersection between player's bounding box and apple hitbox
                if (playerBoundingBox.intersectsSphere(appleHitbox)) {
                    // Collision detected!
                    console.log("Apple collected!");
    
                    // Remove the apple from the scene
                    scene.remove(child);
                }
            }
        });
    }
    
}



export class PlayerController {
    constructor() {
        this.key = {
            "forward": false,
            "backward": false,
            "left": false,
            "right": false,
            "rotateUp": false,
            "rotateDown": false,
            "rotateLeft": false,
            "rotateRight": false,
            "zoom": 0,
            "toggleCamera": false
        };
        this.mousePos = new THREE.Vector2();
        this.mouseDown = false;
        this.deltaMousePos = new THREE.Vector2();

        document.addEventListener("keydown", (e) => this.onKeyDown(e), false);
        document.addEventListener("keyup", (e) => this.onKeyUp(e), false);

        document.addEventListener("mousemove", (e) => this.onMouseMove(e), false);
        document.addEventListener("mousedown", (e) => this.onMouseDown(e), false);
        document.addEventListener("mouseup", (e) => this.onMouseUp(e), false);
        document.addEventListener("wheel", (e) => this.onMouseWheel(e), false);
        document.addEventListener("click", () => this.onPointerLockChange(), false);
        document.addEventListener("pointerlockchange", () => this.onPointerLockChange(), false);
        document.addEventListener("pointerlockerror", () => console.error("Pointer Lock Error"), false);
    }

    onMouseWheel(event) {
        const zoomSpeed = 0.001;
        this.key["zoom"] -= event.deltaY * zoomSpeed;
    }

    onMouseMove(event) {
        if (document.pointerLockElement) {
            this.deltaMousePos.x = event.movementX;
            this.deltaMousePos.y = event.movementY;
        }
    }

    onMouseDown(event) {
        this.mouseDown = true;
        document.body.requestPointerLock();
    }

    onMouseUp(event) {
        this.mouseDown = false;
        this.deltaMousePos.set(0, 0);
        document.exitPointerLock();
    }

    onPointerLockChange() {
        if (document.pointerLockElement) {
            this.mouseDown = true;
        } else {
            this.mouseDown = false;
            this.deltaMousePos.set(0, 0);
        }
    }

    onKeyDown(event) {
        switch (event.key) {
            case "W":
            case "w": this.key["forward"] = true; break;
            case "S":
            case "s": this.key["backward"] = true; break;
            case "A":
            case "a": this.key["left"] = true; break;
            case "D":
            case "d": this.key["right"] = true; break;
            case "I":
            case "i": this.key["rotateUp"] = true; break;
            case "K":
            case "k": this.key["rotateDown"] = true; break;
            case "J":
            case "j": this.key["rotateLeft"] = true; break;
            case "L":
            case "l": this.key["rotateRight"] = true; break;
            case "C":
            case "c": this.key["toggleCamera"] = !this.key["toggleCamera"]; break;
        }
    }

    onKeyUp(event) {
        switch (event.key) {
            case "W":
            case "w": this.key["forward"] = false; break;
            case "S":
            case "s": this.key["backward"] = false; break;
            case "A":
            case "a": this.key["left"] = false; break;
            case "D":
            case "d": this.key["right"] = false; break;
            case "I":
            case "i": this.key["rotateUp"] = false; break;
            case "K":
            case "k": this.key["rotateDown"] = false; break;
            case "J":
            case "j": this.key["rotateLeft"] = false; break;
            case "L":
            case "l": this.key["rotateRight"] = false; break;
        }
    }
}

export class ThirdPersonCamera {
    constructor(camera, positionOffset, targetOffset) {
        this.camera = camera;
        this.positionOffset = positionOffset;
        this.targetOffset = targetOffset;
        this.rotationAngle = new THREE.Vector3(0, 0, 0);
        this.zoomLevel = 1;
        this.targetZoomLevel = 1;

        // Set the camera's up vector to prevent unintended roll
        this.camera.up.set(0, 1, 0);
    }

    updateRotation(controller, dt) {
        const rotationSpeed = 1;

        if (controller.key["rotateUp"]) {
            this.rotationAngle.x -= rotationSpeed * dt;
        }
        if (controller.key["rotateDown"]) {
            this.rotationAngle.x += rotationSpeed * dt;
        }
        if (controller.key["rotateLeft"]) {
            this.rotationAngle.y += rotationSpeed * dt;
        }
        if (controller.key["rotateRight"]) {
            this.rotationAngle.y -= rotationSpeed * dt;
        }

        // Adjust target zoom level
        if (controller.key["zoom"]) {
            this.targetZoomLevel -= controller.key["zoom"];
            this.targetZoomLevel = Math.max(0.1, Math.min(10, this.targetZoomLevel));
            controller.key["zoom"] = 0; // Reset zoom input
        }

        // Toggle camera view
        if (controller.key["toggleCamera"]) {
            this.isFirstPerson = !this.isFirstPerson;
            controller.key["toggleCamera"] = false; // Reset toggle input
        }

        // Update rotation based on mouse movements
        if (controller.mouseDown && document.pointerLockElement) {
            const mouseSpeed = 0.002;
            this.rotationAngle.y -= controller.deltaMousePos.x * mouseSpeed;
            this.rotationAngle.x -= controller.deltaMousePos.y * mouseSpeed;

            // Clamp the vertical rotation angle to prevent flipping
            this.rotationAngle.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotationAngle.x));

            // Reset delta mouse position after applying it
            controller.deltaMousePos.set(0, 0);
        }
    }

    setup(target, angle) {
        // Smoothly transition zoom level
        this.zoomLevel = THREE.MathUtils.lerp(this.zoomLevel, this.targetZoomLevel, 0.1);

        var temp = new THREE.Vector3();
        temp.copy(this.positionOffset);
        temp.multiplyScalar(this.zoomLevel);
        temp.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle.y + this.rotationAngle.y);

        temp.addVectors(target, temp);
        this.camera.position.copy(temp);

        temp = new THREE.Vector3();
        temp.addVectors(target, this.targetOffset);
        this.camera.lookAt(temp);
    }
}
