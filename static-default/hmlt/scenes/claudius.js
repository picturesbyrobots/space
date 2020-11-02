import * as THREE from '/deps/three/build/three.module.js'

import {LOG_LEVEL, say} from './scenes.js'


export const init = (scene_root) => {

    // set the cone material to backside
    let cone = scene_root.getObjectByName("cone")

    if(cone !== undefined) {
        cone.material.side = THREE.DoubleSide
    }

    return 1

}


export const animate = (scene_root) => {

}

