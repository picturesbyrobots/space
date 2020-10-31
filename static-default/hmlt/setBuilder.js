import * as THREE from '/deps/three/build/three.module.js'
import {GUI} from '/deps/three/examples/jsm/libs/dat.gui.module.js'
import Service from '/space/js/Service.js'

import {useSets, LOADER_LOG_LEVEL} from '/hmlt/setLoader.js'
import { createActor } from './three-utils/actorCast.js'

import {makeVideoArtwork} from '/hmlt/makeVideoArtwork.js'
import {useSceneScripts, LOG_LEVEL} from '/hmlt/scenes/scenes.js'

var camera, hmlt_root , renderer,clock, controls, transform_controls, panel, lighting_panel, gesture_wrangler, audio_listener

let setStreamFunctions, id_lookup;

let active_model_name = ""
let config = ""



let active_scene = ""; 
let pc;

/*
                            let video_data = 
                            {
                                id : "test_video",
                                uri : "https://hamlet-gl-assets.s3.amazonaws.com/misc/video/clouds.mp4"
                            }

                            let parameters = {
                                wallColor : 0xf3f3f3
                            }
                                makeVideoArtwork(pc,audio_listener,gesture_wrangler,video_data,parameters)
                                                .then((results) => {
                                                let [artwork, setVideoSrc] = results
                                                
                                                hmlt_root.add(artwork)
                                                })

*/
const createActors = (object, actors) => {
            actors.forEach(actor_data => {
                        let {x,y,z} = actor_data.transform.position;
                        let [sx,sy,sz] = actor_data.transform.scale;
                        let [qx,qy,qz,qw] = actor_data.transform.rotation
                        let [actor, setStream, getStream] = createActor(object, {  name : actor_data.name, 
                                                                                      listener : audio_listener, 
                                                                                      position : new THREE.Vector3(x,y,z),
                                                                                      scale : new THREE.Vector3(sx,sy,sz),
                                                                                      rotation : new THREE.Quaternion(qx,qy,qz,qw),
                                                                                      gestureWrangler : gesture_wrangler})
                                    
                                                    
                        setStreamFunctions.set(actor.name, {setStream : setStream, id: undefined})
                        

                })

}


export var reload = (scene)  => {
    if(config === "")
        return

    let [getScene, setScene] = useActiveScene()
    let [loadSet] = useSets(LOADER_LOG_LEVEL.VERBOSE)
    
    fetch(`https://hamlet-gl-assets.s3.amazonaws.com/config/${config}`)
        .then(
        response => response.json())
        .then(data =>  {
                   let promises = data.map(set_data => {return loadSet(hmlt_root, set_data, createActors)})
                    Promise.all(promises).then(() => {
                            setScene("street")
                            

                             scene.add(hmlt_root)
                             scene.fog = new THREE.FogExp2(0x2e2e2e, 0.013 );
                             let setFog = useFog(scene)
                             setFog("street")
                             //scene.fog = new THREE.FogExp2(0xcd9c7c, 0.013 );

                            Service.get('knobs', knobs => { 
                                knobs.observe('hmlt_run', msg => {

                                    if(msg === undefined) return
                                    if(msg.cmd === "setScene") 
                                    {
                                        setScene(msg.data)
                                        setFog(msg.data)
                                    }

                                })
                            })
                    })
        })

}




const useFog = (scene) => {
    let lookup = 
    {
        "interior" : [0xebdb9d, 0.029],
        "street" : [0x2e2e2e, 0.013]
    }
    const setFog = (scene_name) =>  {

        if(Object.keys(lookup).includes(scene_name)) 
        {
            return   
        }
        let [c,d] = lookup[scene_name];
        scene.fog.color = c
        scene.fog.density = d
    }
    
    return setFog
    
}

const useKnobs = () => {
       Service.get('knobs', knobs => {
                    knobs.observe('hmlt_build', msg => {

                        if(msg === undefined) return; 

                        switch(msg.cmd) {
                        case "transform_update" :
                        {

                            let active_obj = hmlt_root.getObjectByName(active_scene).getObjectByName(msg.obj)
                            if(active_obj === undefined) 
                            {
                                return
                            }

                            let dispatch = {
                                "translate" : () => {
                                                let {x,y,z} = msg.data
                                                active_obj.position.copy(new THREE.Vector3(x,y,z))
                                                },
                               "scale" : () => {
                                                let {x,y,z} = msg.data
                                                active_obj.scale.copy(new THREE.Vector3(x,y,z))
                                                },
                               "rotate" : () => {
                                                let {_x,_y,_z,_w} = msg.data
                                                active_obj.quaternion.copy(new THREE.Quaternion(_x,_y,_z,_w))
                                                }
                               
 
                            }

                        

                            if(!Object.keys(dispatch).includes(msg.mode))
                                return
                            dispatch[msg.mode]()
                            break
                        }
                    }
                })
       })
}       
            



    
export var initBuilder = (scene,config_uri, k_camera, renderer, gw,al,party_config) => {
    lighting_panel = new GUI({width: 300})


    config = config_uri
    gesture_wrangler = gw,
    audio_listener = al

    hmlt_root = new THREE.Scene();

    clock = new THREE.Clock();

    camera = k_camera

    setStreamFunctions = new Map()
    id_lookup = new Map()
    pc = party_config

    reload(scene)
    useKnobs()

    
    

    }
        
    export const useActiveScene = () => {
        let update_scenes = (active_scene_name) => {
            hmlt_root.children.map(child => {
                if(child.name === active_scene_name || child.userData.alwaysRender === true) {
                    child.visible = true
                }else {
                    child.visible = false
                }
            })
        }

        const setActiveScene = (new_scene_name) => {
            update_scenes(new_scene_name)
            active_scene = new_scene_name
        }
        const getActiveSceneName  = () => {
            return active_scene
        }
        

        return [getActiveSceneName , setActiveScene]
    }


   export const useActors = () => {
               const hasId = (id) => {
                    return id_lookup.has(id)
                }
                const setActorId = (actor_name, id) => {
                    if(!setStreamFunctions.has(actor_name))
                    {
                        return
                    }
                    setStreamFunctions.set(actor_name, {...setStreamFunctions.get(actor_name), id : id })
                    id_lookup.set(id, actor_name)
                }
                const clearActorRole = (id) => {
                    if(!id_lookup.has(id)) {
                        return
                    }
                    setStreamFunctions.get(id_lookup.get(id)).setStream(null)
                  id_lookup.delete(id);
                }

                const updateMediaStream = (id,t) => {

                    if(!id_lookup.has(id)) {
                        return
                    }
                    setStreamFunctions.get(id_lookup.get(id)).setStream(t)
                }


        return [hasId, setActorId, clearActorRole, updateMediaStream]
    }

    export const useAnimation = () => {

        let getFuncs = useSceneScripts(LOG_LEVEL.VERBOSE)

        let animate = () => {
            let animate_script = getFuncs(active_scene)
            if(animate_script) 
            {
                animate_script.animate(hmlt_root.getObjectByName(active_scene))
            }
        }

        return animate

    }
   

   

//    const addPointLight = (hmlt_root) => {
//         var plight = new THREE.PointLight( 0xff0000, 1, 100, 2 );
//         if(hmlt_root.getObjectByName("pointlight")) 
//         {

//             let suf = hmlt_root.children.filter(child => child.name.includes("pointlight")).length
//             plight.name = `pointlight.00${suf}`

//         }else {
//             plight.name = "pointlight"
//         }
//         hmlt_root.add(plight)
//         buildGui(hmlt_root)
//    }

   

//    const addSpotLight = (hmlt_root) => {

//     var slight = new THREE.SpotLight(0xff00ff, 1)
//     if(hmlt_root.getObjectByName("spotlight")) 
//         {

//             let suf = hmlt_root.children.filter(child => child.name.includes("spotlight")).length
//             slight.name = `spotlight.00${suf}`

//         }else {
//             slight.name = "spotlight"
//         }

//         let light_target = new THREE.Object3D();

//         light_target.name = `${slight.name} - target`
//         light_target.userData = 
//         {
//             isTarget : true,
//             targetOf : slight.name
//         }
            
//         slight.target = light_target

//         hmlt_root.add(slight)
//         hmlt_root.add(light_target)
        
//    }

//   const duplicateSelectedObject = (hmlt_root, obj_name) => {
    
//     let parent_obj = hmlt_root.getObjectByName(obj_name) 
//     if(parent_obj) 
//     {
//         // check to see if we're cloning a duplicate
//         if(parent_obj.userData.isClone) 
//         {
//             // if we're cloning a duplicate set the parent to the master
//             parent_obj = hmlt_root.getObjectByName(parent_obj.userData.master)
//         }

//         // clone the object
//         let new_object = parent_obj.clone();

//         // we should make a sane name for our new object
//         let object_name = parent_obj.name

//         // how many objects are duplicates of this object?
//         let num_dups = hmlt_root.children.filter((child) => {return child.userData.isClone && child.userData.master === parent_obj.name}).length

//         object_name = `${object_name}.00${num_dups + 1}`;
//         new_object.name = object_name

        
//         // set userdata to make reduplications easier
//         new_object.userData = 
//         {
//             isClone : true,
//             master : parent_obj.name
//         }

//         hmlt_root.add(new_object)

//     }


//    } 








