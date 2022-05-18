import * as THREE from "three";

// Planet -> textured sphere with randomised position
export class Planet {
  constructor(scene, radius, filePath) {
    let geometry = new THREE.SphereGeometry(radius, 32, 32);
    let texture = new THREE.TextureLoader().load(filePath);
    let material = new THREE.MeshStandardMaterial({
      map: texture
    });
    let x = getRandomNumber(-30, 30);
    // keep randomising until y > 3.5 && y < - 3.5 to avoid planets loading at player's height
    let y = getRandomNumber(-13, 11);
    while (y <= 3.5 && y >= -3.5) {
      y = getRandomNumber(-13, 11);
    }
    let z = getRandomNumber(-30, 30);
    this.planet = new THREE.Mesh(geometry, material);
    this.planet.position.set(x, y, z);
    scene.add(this.planet);
  }

  // plnaet's roatation is randomised each time
  update() {
    let speed = getRandomNumber(0.01, 0.02);
    this.planet.rotation.y += speed;
  }
}

// similar to Planet class, but with a set position and no automatic rotation
export class GroundPlanet {
  constructor(scene) {
    let geometry = new THREE.SphereGeometry(1, 32, 32);
    let texture = new THREE.TextureLoader().load("./textures/moon.jpg");
    let material = new THREE.MeshStandardMaterial({
      map: texture
    });
    this.floor = new THREE.Mesh(geometry, material);
    this.floor.position.set(0, -1, 0);
    scene.add(this.floor);
  }
}

// Again similar to Planet, but with set position and set rotation
export class Sun {
  constructor(scene) {
    let geometry = new THREE.SphereGeometry(3, 32, 32);
    let texture = new THREE.TextureLoader().load("./textures/sun.jpg");
    let material = new THREE.MeshStandardMaterial({
      map: texture
    });
    this.sun = new THREE.Mesh(geometry, material);
    this.sun.position.set(0, 15, 0);
    scene.add(this.sun);
  }
  update() {
    this.sun.rotation.y += 0.004;
  }
}

// Asteroids are positional audio players, this one uses an oscillator
export class AsteroidOscillator {
  constructor(scene, listener, x, z) {
    let geometry = new THREE.OctahedronBufferGeometry(1, 1);
    let texture = new THREE.TextureLoader().load("./textures/lava.jpg");
    let material = new THREE.MeshStandardMaterial({
      map: texture
    });
    this.asteroid = new THREE.Mesh(geometry, material);
    this.asteroid.position.set(x, getRandomNumber(-0.7, 0.4), z);
    this.asteroid.collidable = true;
    scene.add(this.asteroid);

    // oscillator
    this.sound = new THREE.PositionalAudio(listener);
    this.oscillator = listener.context.createOscillator();
    this.oscillator.type = "sine";
    this.oscillator.frequency.setValueAtTime(
      440,
      this.sound.context.currentTime
    );
    this.oscillator.start(0);
    this.sound.setNodeSource(this.oscillator);
    this.sound.setRefDistance(1);
    this.sound.setVolume(0.25);
    this.asteroid.add(this.sound);
  }

  update() {
    this.asteroid.rotation.x += 0.003;
    this.asteroid.rotation.y -= 0.003;
    this.asteroid.rotation.z += 0.003;
  }
}

// second kind of asteroid has an audio loader attached to it (seeindex.js)
export class AsteroidSoundLoader {
  constructor(scene, x, z) {
    let geometry = new THREE.OctahedronBufferGeometry(1, 1);
    let texture = new THREE.TextureLoader().load("./textures/lava.jpg");
    let material = new THREE.MeshStandardMaterial({
      map: texture
    });
    this.asteroid = new THREE.Mesh(geometry, material);
    this.asteroid.position.set(x, getRandomNumber(-0.7, 0.4), z);
    this.asteroid.collidable = true;
    scene.add(this.asteroid);
  }

  update() {
    this.asteroid.rotation.x += 0.003;
    this.asteroid.rotation.y -= 0.003;
    this.asteroid.rotation.z += 0.003;
  }
}

// function used to randomise planet's position and rotation
function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}
