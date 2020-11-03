import * as THREE from '/deps/three/build/three.module.js'
import {setRepeat} from '/hmlt/three-utils/textureTools.js'
let actor_mesh = undefined
let duplicates = []
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
      actor_mesh = scene_root.getObjectByName("vince")
      if(actor_mesh) 
      {


            const position_offsets =
            [
                  [-10,10,30],
                  [10, 10, 50],
                  [10,10, 30]

            ]
            position_offsets.map(offset => {


                  let [x,y,z] = offset;
                  //  let new_dup = actor_mesh.userData.cloneActor()
                  
                  // scene_root.add(new_dup)
                  // duplicates.push(new_dup)
                  

            })


      }



      

      

}


export const animate= (scene_root) => 
{
      //duplicates.map(dup => dup.visible = actor_mesh.getObjectByName("vince-mesh").visible)
      
}