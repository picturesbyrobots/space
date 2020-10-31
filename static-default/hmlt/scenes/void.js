
import * as THREE from '/deps/three/build/three.module.js'
import { BufferGeometryUtils } from '/deps/three/examples/jsm/utils/BufferGeometryUtils.js'
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
    scene_root.add(createSky())
    Service.get('knobs', knobs => { 
                                knobs.observe('hmlt_run', msg => {

                                    if(msg === undefined) return
                                    if(msg.cmd === "void::animate"){

                                    console.log(msg)
                                    if(msg.data === "start") 
                                    {
                                        run_move = true;
                                        console.log("Animate Lex")
                                        // save his position for restart KNOBS!!!
                                        if(scene_root.getObjectByName("lex") !== undefined) {
                                            start_pos.copy(scene_root.getObjectByName("lex").position)
                                        }
                                        }
                                        if(msg.data=== "stop") 
                                        {
                                            run_move = false;
                                            scene_root.getObjectByName("lex").position.copy(start_pos)
                                        }
                                    }
                                })
                            })

    
}


export const animate= (scene_root) => 
{

    let lex = scene_root.getObjectByName("lex")
    if(lex !== undefined && run_move) 
    {

        lex.position.add(speed)
    }

}