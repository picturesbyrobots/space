import * as THREE from '/deps/three/build/three.module.js'





export const setRepeat = (mat, repeat_x, repeat_y)  => {

    let cr = new THREE.Vector2(repeat_x, repeat_y)

    Object.values(mat).map(val => {
            
            if (val && val.hasOwnProperty('repeat')) {
            val.wrapS = val.wrapT = THREE.RepeatWrapping
            val.repeat.copy(cr)
            }
            
        })

}