import * as THREE from '/deps/three/build/three.module.js'
import * as beach_functions from './beach.js'
import * as street_functions from './street.js'
import * as interior_functions from './interior.js'

let module_name = "USES SCRIPTS"
let script_map;


export const LOG_LEVEL = {
    VERBOSE : 0,
    SILENT : 3,
    WARN : 2,
    ERROR: 4
}

let current_log_level = LOG_LEVEL.VERBOSE

export const say = (text, lvl) => {

    if(lvl >= current_log_level) {

        console.log(`${module_name} : ${text}`)
    }

    

}




export const useSceneScripts = (lvl) => {
    current_log_level = lvl
    script_map = new Map ()
    script_map.set("beach",{init : beach_functions.init, animate :beach_functions.animate})
    script_map.set("street",{init : street_functions.init, animate : street_functions.animate})
    script_map.set("interior", {init : interior_functions.init, animate: interior_functions.animate})

    let get_funcs = (scene_name) => {

        if(!script_map.has(scene_name)) return null

        return script_map.get(scene_name)

    }


    return get_funcs

}