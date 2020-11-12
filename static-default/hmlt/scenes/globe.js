import * as THREE from '/deps/three/build/three.module.js'
import {setRepeat} from '/hmlt/three-utils/textureTools.js'
let duplicates = []

let dup_lookat = new THREE.Vector3(0,0,0)
export const init = (scene_root) => 
{
      const skyGeo = new THREE.SphereBufferGeometry( 3000, 32, 15 );
      const material = new THREE.MeshBasicMaterial( {
                                  side : THREE.DoubleSide,
                                  color: 0x211402} );

      const sky = new THREE.Mesh(skyGeo, material);
      scene_root.add(sky)
      

      

      

}

const up = new THREE.Vector3(0,1,0)
let angle = 0.0;
let rot_speed = .01
const spin = (obj) => {
      switch(obj.userData.axis) {

            case 0 : 
                  obj.rotateY(rot_speed)
                  break; 
            case 1 :
                  obj.rotateX(rot_speed)
                  break
            case 2 :
                  obj.rotateZ(rot_speed)
                  break


      }

}

export const animate= (scene_root) => 
{
      
      
}