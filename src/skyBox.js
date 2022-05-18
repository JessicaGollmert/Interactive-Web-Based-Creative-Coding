import * as THREE from "three";

// big textured sphere around the scene to function as bakground
// gives a three dimensional feeling compared to a flat background image
export class SkyBox {
  constructor(scene) {
    let geometry = new THREE.SphereGeometry(150, 32, 32);
    let texture = new THREE.TextureLoader().load("textures/galaxyseamless.jpg");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    let material = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide
    });
    let sky = new THREE.Mesh(geometry, material);
    sky.position.set(0, 0, 0);
    scene.add(sky);
  }
}
