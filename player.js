import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

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

    update(dt) {
        if (!this.mesh) return;

        var direction = new THREE.Vector3(0, 0, 0);
        if (this.controller.key['forward']) {
            direction.x = 1;
            this.mesh.rotation.y = Math.PI / 2;
            this.targetRotation.y = Math.PI / 2;
        }
        if (this.controller.key['backward']) {
            direction.x = -1;
            this.mesh.rotation.y = -Math.PI / 2;
            this.targetRotation.y = -Math.PI / 2;

        }
        if (this.controller.key['left']) {
            direction.z = -1;
            this.mesh.rotation.y = Math.PI;
            this.targetRotation.y = Math.PI;


        }
        if (this.controller.key['right']) {
            direction.z = 1;
            this.mesh.rotation.y = 0;
            this.targetRotation.y = 0;


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

            // Normalize the direction vector to ensure consistent movement speed in all directions
            direction.normalize();
            this.mesh.position.add(direction.multiplyScalar(dt * 10));
        }

        // Smooth rotation
        this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, this.targetRotation.y, 0.1);

        // Update camera rotation
        this.camera.updateRotation(this.controller, dt);

        this.camera.setup(this.mesh.position, this.rotationVector);
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
            "rotateRight": false
        };
        this.mousePos = new THREE.Vector2();
        this.mouseDown = false;
        this.deltaMousePos = new THREE.Vector2();

        document.addEventListener("keydown", (e) => this.onKeyDown(e), false);
        document.addEventListener("keyup", (e) => this.onKeyUp(e), false);

        document.addEventListener("mousemove", (e) => this.onMouseMove(e), false)
        document.addEventListener("mousedown", (e) => this.onMouseDown(e), false)
        document.addEventListener("mouseup", (e) => this.onMouseUp(e), false)
    }

    // onMouseDown(event) {
    //     this.mouseDown = true;
    // }

    // onMouseUp(event) {
    //     this.mouseDown = false;
    // }

    // onMouseMove(event) {
    //     var currentMousePos = new THREE.Vector2(
    //         (event.clientX / window.innerWidth) * 2 - 1,
    //         -(event.clientY / window.innerHeight) * 2 + 1
    //     );

    //     this.deltaMousePos.addVectors(currentMousePos, this.mousePos.multiplyScalar(-1));
    //     this.mousePos.copy(currentMousePos);
    // }

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
        this.rotationAngle = new THREE.Vector2(0, 0);
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
            this.rotationAngle.y -= rotationSpeed * dt;
        }
        if (controller.key["rotateRight"]) {
            this.rotationAngle.y += rotationSpeed * dt;
        }

        // Clamp the x rotation to avoid flipping the camera
        this.rotationAngle.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotationAngle.x));
    }

    setup(target, angle) {
        var temp = new THREE.Vector3();
        temp.copy(this.positionOffset);
        temp.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle.y + this.rotationAngle.y);
        temp.applyAxisAngle(new THREE.Vector3(1, 0, 0), angle.x + this.rotationAngle.x);
        temp.addVectors(target, temp);
        this.camera.position.copy(temp);

        temp = new THREE.Vector3();
        temp.addVectors(target, this.targetOffset);
        this.camera.lookAt(temp);
    }
}
