import * as THREE from '/deps/three/build/three.module.js'
import {setRepeat} from '/hmlt/three-utils/textureTools.js'
let duplicates = []

let dup_lookat = new THREE.Vector3(0,0,0)
export const init = (scene_root) => 
{
      const skyGeo = new THREE.SphereBufferGeometry( 3000, 32, 15 );
      const material = new THREE.MeshBasicMaterial( {
                                  side : THREE.DoubleSide,
                                  color: 0x101f3c} );

      const sky = new THREE.Mesh(skyGeo, material);
      scene_root.add(sky)
      
      let tile_mat = scene_root.getObjectByName('floor').material

      setRepeat(tile_mat, 24, 10 )
      
      let actor_mesh = scene_root.getObjectByName("vince")

      const  position_offsets =
            [
                  [-13,35, -5],
                  [15, 40, 10],
                  [-12,30, -5],
                  [14,30, -5],


            ]

      position_offsets.map(offset => 
            {
            let [x,y,z] = offset

            let dup = new THREE.Mesh(actor_mesh.geometry, actor_mesh.material)
            dup.position.set(x,y,z)
            dup.lookAt(dup_lookat)
            //scene_root.add(dup)
            duplicates.push(dup)

            })
      
      const chair_offsets =
            [
                  [-0,35, 0],
                  [10, 40,0],
                  [10,20, 0]

            ]

      let axis = 0;
      chair_offsets.map(offset => {
            let [x,y,z] = offset
            let new_dup = scene_root.getObjectByName("chair").clone()

            new_dup.position.add(new THREE.Vector3(x,y,z))
            new_dup.userData = 
            {
                  animate : true,
                  axis : axis
            }
            scene_root.add(new_dup)
            axis = axis == 3 ? 0 : axis + 1;
            




      })



     let chair = scene_root.getObjectByName("chair");
      chair.userData = 
            {
                  animate: true,
                  axis : 0
            } 


      chair.translateY(10)


      

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
      duplicates.map(dup => dup.visible = scene_root.getObjectByName("vince").visible)

      scene_root.children.map(child =>  {
            child.userData.animate && spin(child)

      })
      
}