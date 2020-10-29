import * as THREE from '/deps/three/build/three.module.js'

let module_name = "SCENE MANAGER"
let script_map;


export const LOG_LEVEL = {
    VERBOSE : 0,
    SILENT : 3,
    WARN : 2,
    ERROR: 4
}

let current_log_level = LOG_LEVEL.VERBOSE

const say = (text, lvl) => {

    if(lvl >= current_log_level) {

        console.log(`${module_name} : ${text}`)
    }

    

}

const beach_init = (hmlt_root) => {

    say('BEACH INIT')

}


const beach_animate = (hmlt_root) => {
    say('BEACH ANIMATE')

}


export const useSceneScripts = (lvl) => {
    current_log_level = lvl
    script_map = new Map ()
    script_map.set("beach",[beach_init, beach_animate])
    let get_funcs = (func_name) => {

        if(!script_map.has(func_name)) 
        {
            say(`Can't a find functions for : ${func_name}`, LOG_LEVEL.WARN)
            return
        }
        return script_map.get(name)

    }

    return [get_funcs]

}