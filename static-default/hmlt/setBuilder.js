import * as THREE from '/deps/three/build/three.module.js'
import Service from '/space/js/Service.js'

import {useSets, LOADER_LOG_LEVEL} from '/hmlt/setLoader.js'
import { createActor } from './three-utils/actorCast.js'

import {makeVideoPlayer} from '/hmlt/video/makeVideoPlayer.js'
import {useSceneScripts, LOG_LEVEL} from '/hmlt/scenes/scenes.js'

var camera, hmlt_root , renderer,clock, controls, transform_controls, panel, gesture_wrangler, audio_listener

let knownStreams = {};
let setStreamFunctions, id_lookup;

let active_model_name = ""
let config = ""



let active_scene = ""; 
let pc;


const createActors = (object, actors) => {
            actors.forEach(actor_data => {

                        let {x,y,z} = actor_data.transform.position;
                        let [sx,sy,sz] = actor_data.transform.scale;
                        let [qx,qy,qz,qw] = actor_data.transform.rotation

                        let crop = actor_data.crop ? actor_data.crop : {cropLeft : 0.0, cropRight : 1.0}

                        let [actor, setStream, getStream] = createActor(object, {  name : actor_data.name, 
                                                                                      listener : audio_listener, 
                                                                                      position : new THREE.Vector3(x,y,z),
                                                                                      crop : crop,
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
                             Service.get('knobs', knobs => { 
                                knobs.observe('hmlt_run', msg => {

                                    // msgs from builder
                                    if(msg === undefined) return
                                    if(msg.cmd === "setScene") 
                                    {
                                        setScene(msg.data)
                                        //setFog(msg.data)
                                    }

                                })
                                knobs.observe('hmlt_scene', msg => {
                                    setScene(msg)
                                })
                            })

                             Service.get('hamlet', show => {

                                show.curtainUp({})

                             })


                    })
        })

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
            


const useVideo = (config_uri) => {
    fetch(`https://hamlet-gl-assets.s3.amazonaws.com/config/${config_uri}`)
        .then(
        response => response.json())
        .then(data =>  { 
            
            let [player, setVideo] = makeVideoPlayer(
                                             pc,
                                            gesture_wrangler,
                                            )
                                            
            player.userData.alwaysRender = true
            Service.get('hamlet', show => { 
                show.observe('play_video', msg => {
                                    if(!Object.keys(data.videos).includes(msg)){
                                        return
                                    }
                                    let uri = `${data.folder}/${data.videos[msg].name}`
                                    setVideo(uri)
                                })
                        })
            hmlt_root.add(player)
        }
        )
}

    
export var initBuilder = (scene,config_uri, k_camera, renderer, gw,al,party_config) => {
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
    useVideo("video_config.js")

    
    

    }
        
    export const useActiveScene = () => {
        let update_scenes = (active_scene_name) => {
            hmlt_root.children.map(child => {
                if(child.name === active_scene_name || child.userData.alwaysRender === true) {
                    if(child.name === active_scene_name)
                    {
                        let actors = child.children.filter(obj => {return obj.userData.isActor})
                        actors.map
                        (actor=> {
                            actor.userData.unmuteSound()
                        })
                    }
                    child.visible = true
                }else {
                    child.visible = false
                        let actors = child.children.filter(obj => {return obj.userData.isActor})
                        actors.map
                        (actor=> {
                            actor.userData.muteSound()
                        })
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
                    const funcs = {...setStreamFunctions.get(actor_name), id : id };
                    setStreamFunctions.set(actor_name, funcs)
                    id_lookup.set(id, actor_name)
                    if (knownStreams[id])
                      funcs.setStream(knownStreams[id])
                }
                const clearActorRole = (id) => {
                    if(!id_lookup.has(id)) {
                        return
                    }
                    setStreamFunctions.get(id_lookup.get(id)).setStream(null)
                  id_lookup.delete(id);
                }

                const updateMediaStream = (id,t) => {
                    if (t)
                      knownStreams[id] = t;
                    else
                      delete knownStreams[id];

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
   

   






