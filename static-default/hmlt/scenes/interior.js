import * as THREE from '/deps/three/build/three.module.js'

export const init = (scene_root) => 
{
      const skyGeo = new THREE.SphereBufferGeometry( 3000, 32, 15 );
      const material = new THREE.MeshBasicMaterial( {
                                  side : THREE.DoubleSide,
                                  color: 0xffde59} );

      const sky = new THREE.Mesh(skyGeo, material);
      scene_root.add(sky)

}


export const animate= (scene_root) => 
{
}