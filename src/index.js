import * as THREE from "three";
import * as Tone from "tone";
import { GUI } from "dat.gui";
import "./styles.css";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {Planet, GroundPlanet, Sun, AsteroidOscillator, AsteroidSoundLoader} from "./planets.js";
import { SkyBox } from "./skyBox.js";

let scene, camera, orbit, renderer;
let ground, border, sky;
let light, ambientLight;

let audioPlayer;

let character, characterPosition;
let modelLoaded, loader, mixers;
let idle, run;

let clock, delta, interval;

let sceneHeight, sceneWidth;

let earth, greyPlanet, jupiter, mercury, neptune, uranus, venus, sun;
let asteroid1, asteroid2, asteroid3, asteroid4;

let startButton = document.getElementById("startButton");
startButton.addEventListener("click", init);

function init() {
  let overlay = document.getElementById("overlay");
  overlay.remove();
  let text = document.getElementById("text");
  text.remove();
  let logo = document.getElementById("logo");
  logo.remove();

  mixers = [];
  loadModels();
  modelLoaded = false;

  Tone.start();
  Tone.Transport.start();

  // create clock and set interval
  clock = new THREE.Clock();
  delta = 0;
  interval = 1 / 25;

  // create scene
  scene = new THREE.Scene();

  // initialise window size variables
  sceneWidth = window.innerWidth;
  sceneHeight = window.innerHeight;

  // create renderer to display scene
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // create camera
  camera = new THREE.PerspectiveCamera(
    90,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  // move camera back on z and y axis
  camera.position.z = 2;
  camera.position.y = 3;
  // make camera our listener
  const listener = new THREE.AudioListener();
  camera.add(listener);

  // create orbit controls to use mouse as control
  orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableZoom = true;
  // set camera rotation limits
  orbit.maxPolarAngle = Math.PI / 1.6;
  orbit.minPolarAngle = 0.5;
  // min/max zoom
  orbit.maxDistance = 3.3;
  orbit.minDistance = 1.2;
  // disable orbit keyboard controls
  orbit.enableKeys = false;

  // lighting
  ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  light = new THREE.DirectionalLight(0xffffff, 0.6, 1000);
  scene.add(light);

  // add ground and sky(background)
  ground = new GroundPlanet(scene);
  sky = new SkyBox(scene);

  // add planets
  earth = new Planet(scene, 0.4, "./textures/earth.png");
  greyPlanet = new Planet(scene, 0.8, "./textures/greyPlanet.jpeg");
  jupiter = new Planet(scene, 1, "./textures/jupiter.jpg");
  mercury = new Planet(scene, 1, "./textures/mercury.jpg");
  neptune = new Planet(scene, 1, "./textures/neptune.jpg");
  uranus = new Planet(scene, 1, "./textures/uranus.jpg");
  venus = new Planet(scene, 1, "./textures/venus.jpg");
  sun = new Sun(scene);

  // load asteroid1 (oscillator)
  asteroid1 = new AsteroidOscillator(scene, listener, 16, -16);

  // load asteroids2 - 4  and attach positional audio loader to them
  //Positional Audio Loader code from: https://threejs.org/docs/#api/en/audio/PositionalAudio
  let Bass110bpm = "./sounds/Bassline110bpm.wav"; // leftover from attempts to
  let Bass170bpm = "./sounds/Piano170bpm.mp3"; // change sound played via key press
  asteroid2 = new AsteroidSoundLoader(scene, -16, -16);
  let bassLine = new THREE.PositionalAudio(listener);
  const audioLoader1 = new THREE.AudioLoader();
  audioLoader1.load(Bass170bpm, function (buffer) {
    bassLine.setBuffer(buffer);
    bassLine.loop = true;
    bassLine.setRefDistance(1.5);
    bassLine.play();
  });
  asteroid2.asteroid.add(bassLine);

  let Drums10bpm = "./sounds/Drums110bpm.wav"; // same as above
  let Drums170bpm = "./sounds/Drums170bpm.wav";
  asteroid3 = new AsteroidSoundLoader(scene, 16, 16);
  let drumsound = new THREE.PositionalAudio(listener);
  const audioLoader2 = new THREE.AudioLoader();
  audioLoader2.load(Drums170bpm, function (buffer) {
    drumsound.setBuffer(buffer);
    drumsound.loop = true;
    drumsound.setRefDistance(1.5);
    drumsound.play();
  });
  asteroid3.asteroid.add(drumsound);

  let Guitars110bpm = "./sounds/Guitar110bpm.mp3"; // s.a.a
  let Guitars170bpm = "./sounds/Guitar170bpm.wav";
  asteroid4 = new AsteroidSoundLoader(scene, -16, 16);
  let guitarsound = new THREE.PositionalAudio(listener);
  const audioLoader3 = new THREE.AudioLoader();
  audioLoader3.load(Guitars170bpm, function (buffer) {
    guitarsound.setBuffer(buffer);
    guitarsound.loop = true;
    guitarsound.setRefDistance(1.5);
    guitarsound.play();
  });
  asteroid4.asteroid.add(guitarsound);

  // add ambience track
  audioPlayer = new Tone.Player("./sounds/Ambience.mp3", () => {
    audioPlayer.loop = true;
    audioPlayer.autostart = true;
    audioPlayer.volume.value = -12;
  }).toDestination();

  // add event listeners
  window.addEventListener("resize", onWindowResize, false);
  document.addEventListener("keydown", keyDownHandler, false);
  document.addEventListener("keyup", keyUpHandler, false);

  // GUI controls
  // code adapted from: https://github.com/mrdoob/three.js/blob/master/examples/webaudio_sandbox.html
  const SoundControls = function () {
    this.oscillator = asteroid1.sound.getVolume();
    this.bassline = bassLine.getVolume();
    this.drums = drumsound.getVolume();
    this.guitars = guitarsound.getVolume();
  };

  const OscillatorControls = function () {
    this.frequency = asteroid1.oscillator.frequency.value;
    this.wavetype = asteroid1.oscillator.type;
  };

  const gui = new GUI();
  const ambienceVolume = { ambience: -50 };
  const soundControls = new SoundControls();
  const volumeFolder = gui.addFolder("Volume");
  const oscillatorControls = new OscillatorControls();
  const oscillatorFolder = gui.addFolder("Oscillator Controls");

  volumeFolder
    .add(ambienceVolume, "ambience")
    .setValue(-12.0)
    .min(-50.0)
    .max(-12.0)
    .step(0.001)
    .onChange(function () {
      audioPlayer.volume.value = ambienceVolume.ambience;
    });

  volumeFolder
    .add(soundControls, "bassline")
    .setValue(0.5)
    .min(0.0)
    .max(1.0)
    .step(0.01)
    .onChange(function () {
      bassLine.setVolume(soundControls.bassline);
    });

  volumeFolder
    .add(soundControls, "drums")
    .setValue(0.5)
    .min(0.0)
    .max(1.0)
    .step(0.01)
    .onChange(function () {
      drumsound.setVolume(soundControls.drums);
    });

  volumeFolder
    .add(soundControls, "guitars")
    .setValue(1.5)
    .min(0.0)
    .max(2.0)
    .step(0.01)
    .onChange(function () {
      guitarsound.setVolume(soundControls.guitars);
    });

  volumeFolder
    .add(soundControls, "oscillator")
    .setValue(0.5)
    .min(0.0)
    .max(1.0)
    .step(0.01)
    .onChange(function () {
      asteroid1.sound.setVolume(soundControls.oscillator);
    });

  volumeFolder.open();

  oscillatorFolder
    .add(oscillatorControls, "frequency")
    .min(50.0)
    .max(1500)
    .step(1.0)
    .onChange(function () {
      asteroid1.oscillator.frequency.setValueAtTime(
        oscillatorControls.frequency,
        listener.context.currentTime
      );
    });

  oscillatorFolder
    .add(oscillatorControls, "wavetype", [
      "sine",
      "square",
      "sawtooth",
      "triangle"
    ])
    .onChange(function () {
      asteroid1.oscillator.type = oscillatorControls.wavetype;
    });

  oscillatorFolder.open();

  play();
}

// start animating
function play() {
  renderer.setAnimationLoop(() => {
    update();
    render();
  });
}

// stop animating
function stop() {
  renderer.setAnimationLoop(null);
}

function update() {
  delta += clock.getDelta();
  orbit.update();

  // rotate planets and asteroids
  earth.update();
  greyPlanet.update();
  jupiter.update();
  mercury.update();
  neptune.update();
  uranus.update();
  venus.update();
  sun.update();

  asteroid1.update();
  asteroid2.update();
  asteroid3.update();
  asteroid4.update();

  // call function to reset player if they walk too far
  avoidOutOfBounds(ground.floor);

  if (delta > interval) {
    // time dependent code
    delta = delta % interval;
    // loop for animations
    for (let i = 0; i < mixers.length; i++) {
      mixers[i].update(delta * 3);
    }
  }
}

// simple render function
function render() {
  renderer.render(scene, camera);
}

// function to  update and set window size
function onWindowResize() {
  // resize and allign
  sceneHeight = window.innerHeight;
  sceneWidth = window.innerWidth;
  renderer.setSize(sceneWidth, sceneHeight);
  camera.aspect = sceneWidth / sceneHeight;
  camera.updateProjectionMatrix();
}

// load, scale & position character
function loadModels() {
  loader = new GLTFLoader();
  const onLoadAnimation = function (gltf, position) {
    character = gltf.scene.children[0];
    character.collidable = true;
    character.scale.multiplyScalar(1.1);
    character.position.copy(position);
    orbit.target = character.position;
    light.target = character;
    character.rotateZ(3);
    character.size = 0.5;
    // create animations and add them to mixer array
    const IdleAnimation = gltf.animations[0];
    const RunningAnimation = gltf.animations[1];
    const mixer = new THREE.AnimationMixer(character);
    mixers.push(mixer);
    idle = mixer.clipAction(IdleAnimation);
    run = mixer.clipAction(RunningAnimation);
    // initially play idle animation
    idle.play();

    scene.add(character);
  };

  characterPosition = new THREE.Vector3(0, 0, 0);
  loader.load("./models/stickman/stickman.gltf", function (gltf) {
    onLoadAnimation(gltf, characterPosition);
  });
}

// when key is pressed, move character, camera & moon
// code adapted from https://developer.mozilla.org/en-US/docs/Games/Techniques/Control_mechanisms/Desktop_with_mouse_and_keyboard
function keyDownHandler(event) {
  if (event.keyCode === 39) { // right
    run.play();
    camera.position.x += 0.25;
    character.position.x += 0.25;
    character.rotation.z = 1.5;
    ground.floor.position.x += 0.25;
    ground.floor.rotation.z += 0.1;
  } 
  else if (event.keyCode === 37) { // left
    run.play();
    camera.position.x -= 0.25;
    character.position.x -= 0.25;
    character.rotation.z = -1.5;
    ground.floor.position.x -= 0.25;
    ground.floor.rotation.z -= 0.1;
  }
  if (event.keyCode === 40) { // down
    run.play();
    camera.position.z += 0.25;
    character.position.z += 0.25;
    character.rotation.z = 0;
    ground.floor.position.z += 0.25;
    ground.floor.rotation.x -= 0.1;
  } 
  else if (event.keyCode === 38) { // up
    run.play();
    camera.position.z -= 0.25;
    character.position.z -= 0.25;
    character.rotation.z = 3;
    ground.floor.position.z -= 0.25;
    ground.floor.rotation.x += 0.1;
  }
}

// release key to stop running and play idle animation
function keyUpHandler() {
  run.stop();
  idle.play();
}

// if player moves past a certain point they're reset to (0, 0, 0)
function avoidOutOfBounds(object) {
  if (
    object.position.x === 18 ||
    object.position.z === 18 ||
    object.position.x === -18 ||
    object.position.z === -18
  ) {
    console.log("too far");
  } else if (
    object.position.x > 20 ||
    object.position.z > 20 ||
    object.position.x < -20 ||
    object.position.z < -20
  ) {
    character.position.set(0, 0, 0);
    ground.floor.position.set(0, -1, 0);
    camera.position.set(0, 3, 2);
  }
}
