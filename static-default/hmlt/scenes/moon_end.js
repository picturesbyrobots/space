import * as THREE from '/deps/three/build/three.module.js'
import {LOG_LEVEL, say} from './scenes.js'
import Service from '/space/js/Service.js'




let credits;
let crawling = false ;
let crawl_speed = new THREE.Vector3(0,.25,0);
export const init = (scene_root) => {
      let loader = new THREE.TextureLoader();
      let uri = 'https://hamlet-gl-assets.s3.amazonaws.com/moon/textures/credits_square.png';
      credits = scene_root.getObjectByName("credits")
      if(credits === undefined)
      {
          console.log("can't find credits")
          return
      }
      loader.load(uri, (texture) => {
          let credits_mat = new THREE.MeshBasicMaterial({
                               map: texture,
                               transparent: true,
                               side : THREE.DoubleSide,
                               opacity : 0.0,
                               depthTest : true

          });

         
          credits.material = credits_mat
          Service.get('hamlet', show => { 
            show.observe('roll_credits', msg => {
                console.log("that's all folks")
                crawling = true
                credits.material.opacity = 1.0
            })
            })

        });


}

export const animate = (scene_root) => 
{

    if(crawling)
    {
        credits.position.add(crawl_speed)
    }
}


