import * as THREE from '/deps/three/build/three.module.js'
import { BufferGeometryUtils } from '/deps/three/examples/jsm/utils/BufferGeometryUtils.js'
import {setRepeat} from '/hmlt/three-utils/textureTools.js'
import Service from '/space/js/Service.js'

let motion = 0;
const createSky = () => {
  const sky = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const opacity = 1.0;
    const starGeometries = [];
    for (let j = 0; j < 200; j++){
      const starGeometry = new THREE.SphereBufferGeometry(Math.random() * 1.5 + 0.5);
      const angle = Math.random() * Math.PI * 2;
      const distanceFromCenter = Math.random() * 2000;
      starGeometry.translate(
        Math.cos(angle) * distanceFromCenter,
        Math.random() * 107,
        Math.sin(angle) * distanceFromCenter,
      );
      starGeometries.push(starGeometry);
    }

    const starMaterial = new THREE.MeshBasicMaterial( {color:0xeba800, transparent: true, opacity : 1.0 } );
    const starGroup = new THREE.Mesh(BufferGeometryUtils.mergeBufferGeometries(starGeometries), starMaterial);

    starGroup.onBeforeRender = () => {
      //starMaterial.opacity = (opacity + motion * (Math.sin(performance.now() / 1000 + i / 2.) * 0.5));
    };

    sky.add(starGroup);
  }
  sky.position.y = 100;
  return sky;
};

let run_move = false
const speed = new THREE.Vector3(0, 0, -.3);
let start_pos = new THREE.Vector3(0,0,0)

export const init = (scene_root) => 
{

    const skyGeo = new THREE.SphereBufferGeometry(3200, 32, 15 );
      const material = new THREE.MeshBasicMaterial( {
                                  side : THREE.DoubleSide,
                                  color: 0xc5e6f9} );

      const sky = new THREE.Mesh(skyGeo, material);
      scene_root.add(sky)

     let cm = scene_root.getObjectByName("grassfloor").material
      setRepeat(cm, 24, 10)

            let loader = new THREE.TextureLoader();
        let uri = 'https://hamlet-gl-assets.s3.amazonaws.com/street/textures/smoke-1.png'
      loader.load(uri, (texture) => {
          let cloudGeo = new THREE.PlaneBufferGeometry(140,140);
          let cloudMaterial = new THREE.MeshLambertMaterial({
                               map: texture,
                               transparent: true,
                               side : THREE.DoubleSide,
                               opacity : .6,
                               depthTest : true

        });

        let maxX = 500;
        let minX = -500;
        let rand_range = (min,max) => {
          return Math.random() * (max - min) + min  
        }
        
    })
    
}


export const animate= (scene_root) => 
{

    

}