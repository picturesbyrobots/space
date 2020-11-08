import * as THREE from '/deps/three/build/three.module.js'
import {TransformControls} from '/deps/three/examples/jsm/controls/TransformControls.js'
import {OrbitControls} from '/deps/three/examples/jsm/controls/OrbitControls.js'
import {GUI} from '/deps/three/examples/jsm/libs/dat.gui.module.js'

import {loadSet} from '/hmlt/spaceLoader.js'
import {createActor} from '/hmlt/three-utils/actorPlace.js'
var camera, hmlt_root , renderer,clock, controls, transform_controls, panel, lighting_panel, actor_panel

var scene_position
let active_model_name = ""
let conn;
let socket;
let config ;
let config_data;
let active_scene
let root_scene;


export var init = ( kconn, config_uri, k_socket) => {

    conn = kconn
    socket = k_socket
    


    scene_position = new THREE.Vector3(0,0,0)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.01, 3000);


    camera.position.set( 0,40, 100 );
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    hmlt_root = new THREE.Scene();
    root_scene = new THREE.Scene();

    clock = new THREE.Clock();
    renderer = new THREE.WebGLRenderer({antialias : true})
    renderer.setSize( window.innerWidth, window.innerHeight )
      renderer.physicallyCorrectLights = true;

     const DPR = (window.devicePixelRatio) ? window.devicePixelRatio : 1;
    renderer.setPixelRatio(DPR);

    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);
    initBuilder(hmlt_root,config_uri, camera, renderer)
   window.addEventListener('resize', (evt) => {


        let newWidth = window.innerWidth;
        let newHeight = window.innerHeight;

        camera.aspect =  newWidth / newHeight
        camera.updateProjectionMatrix();


        renderer.setSize(newWidth, newHeight)

        
   })
   animate()
}
export const useActiveScene = () => {
        let update_scenes = (active_scene_name) => {
            console.log("update scene")
            hmlt_root.children.map(child => {
                if(child.name === active_scene_name) {
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

const guis = () => {

    buildGui(active_scene)
    buildLightGui(hmlt_root.getObjectByName(active_scene))
    buildActorGui(hmlt_root.getObjectByName(active_scene))

}
export var reload = (scene)  => {
    if(config === "")
        return

    let [getScene, setScene] = useActiveScene()

    fetch(`https://hamlet-gl-assets.s3.amazonaws.com/config/${config}`)
        .then(
        response => response.json())
        .then(data =>  {
                  config_data = data
                  let promises = data.map(set => {
                                       return loadSet(hmlt_root, set, (obj, actor_data)=> {
                                             actor_data.forEach(actor => {
                                                let {x,y,z} = actor.transform.position;
                                                let [sx,sy,sz] = actor.transform.scale;
                                                let [qx,qy,qz,qw] =actor.transform.rotation
                                                let crop = actor_data.crop ? actor_data.crop : {cropLeft : 1.0, cropRight : 1.0}
                                                
                                                createActor(obj, { name : actor.name,
                                                                    position : new THREE.Vector3(x,y,z),
                                                                    crop : crop,
                                                                    scale : new THREE.Vector3(sx,sy,sz),
                                                                    rotation : new THREE.Quaternion(qx,qy,qz,qw)
                                                                 })

                                             })}
                                            )
                        })
                    Promise.all(promises).then(() => {
                            setScene("beach")
                            scene.add(hmlt_root)
                            guis()

                            
                    })
        })

                // loadSet(hmlt_root, data, (hmlt_root,data) => {

                // // load the actors and set stream functions
}


    
export var initBuilder = (scene,config_uri, k_camera, renderer) => {
    config = config_uri
    panel = new GUI({width : 310})
    lighting_panel = new GUI({width: 300})
    actor_panel = new GUI({width: 300})


    clock = new THREE.Clock();

    camera = k_camera

    console.log(renderer.domElement)

    controls = new OrbitControls(camera, renderer.domElement);
    transform_controls = new TransformControls(camera, renderer.domElement);
    transform_controls.addEventListener( 'change', (event) => {

            }
        );
    transform_controls.addEventListener('objectChange', (event) => {

        let mode = transform_controls.getMode()
        let which_data = {
            "translate" : hmlt_root.getObjectByName(active_scene).getObjectByName(active_model_name).position,
            "scale" : hmlt_root.getObjectByName(active_scene).getObjectByName(active_model_name).scale,
            "rotate" : hmlt_root.getObjectByName(active_scene).getObjectByName(active_model_name).quaternion,
        }
        conn && conn.send('setKnob', {name : "hmlt_build", value : {
            obj: active_model_name, 
            cmd : "transform_update",
            mode : mode,
            data : which_data[mode]}}
          )
        console.log(mode)

        

    })
    transform_controls.addEventListener( 'dragging-changed', function ( event ) 
                {
					controls.enabled = ! event.value;
				} );

     const DPR = (window.devicePixelRatio) ? window.devicePixelRatio : 1;


    hmlt_root.add(transform_controls)
    reload(root_scene)

    

   

   window.top.addEventListener('keyup', (event) => {

        
        switch(event.key) {
            case 't' :
                transform_controls.setMode('translate')
                break;

            case 's' :
                transform_controls.setMode('scale')
                break
            case 'r' :
                transform_controls.setMode('rotate')
                break

            case 'p' : 
                addPointLight()
                break

            case 'o' : 
                addSpotLight()
                break

            case 'l' : 
                addDirectionalLight()
                break



            case 'x' :
                deleteSelectedObject(hmlt_root)
                break

            case 'd' : 
                duplicateSelectedObject(hmlt_root)
                break


        }

   })
}

   var scene_file = null;
   const createFile = (json_obj) => 
   {

        var data = new Blob([JSON.stringify(json_obj,null,2)], {type: 'text/plain'});

        if (scene_file !== null) {

            window.URL.revokeObjectURL(scene_file)
        }
        scene_file = window.URL.createObjectURL(data)
        return scene_file

    }


    
   const deleteSelectedObject = (scene) => {

    if(active_model_name === "") return 

        let obj = hmlt_root.getObjectByName(active_model_name)
        hmlt_root.remove(obj)
        transform_controls.detach()
         conn && conn.send('setKnob', {name : "hmlt_build", value : {
            obj: active_model_name, 
            cmd : "delete-obj"
            }}
          )

        buildGui(hmlt_root)


   }

   const duplicateSelectedObject = (hmlt_root) => {

    if(active_model_name === "")
    {
        return
    }
    let parent_obj = hmlt_root.getObjectByName(active_model_name) 
    if(parent_obj) 
    {
        // check to see if we're cloning a duplicate
        if(parent_obj.userData.isClone) 
        {
            // if we're cloning a duplicate set the parent to the master
            parent_obj = hmlt_root.getObjectByName(parent_obj.userData.master)
        }

        // clone the object
        let new_object = parent_obj.clone();

        // we should make a sane name for our new object
        let object_name = parent_obj.name

        // how many objects are duplicates of this object?
        let num_dups = hmlt_root.children.filter((child) => {return child.userData.isClone && child.userData.master === parent_obj.name}).length

        object_name = `${object_name}.00${num_dups + 1}`;
        new_object.name = object_name

        
        // set userdata to make reduplications easier
        new_object.userData = 
        {
            isClone : true,
            master : parent_obj.name
        }

        hmlt_root.add(new_object)
        conn && conn.send('setKnob', {name : "hmlt_build", value : {
            obj: active_model_name, 
            cmd : "duplicate-obj"
            }}
          )
        buildGui(hmlt_root)

    }


   }

   const addDirectionalLight = () => {

        var dlight = new THREE.DirectionalLight(0xff00ff, 1)
        if(hmlt_root.getObjectByName(active_scene).getObjectByName("dlight")) 
        {

            let suf = hmlt_root.getObjectByName(active_scene).children.filter(child => child.name.includes("pointlight")).length
            dlight.name = `dlight.00${suf}`

        }else {
            dlight.name = "dlight"
        }


        let light_target = new THREE.Object3D();

        light_target.name = `${dlight.name} - target`
        light_target.userData = 
        {
            isTarget : true,
            targetOf : dlight.name
        }
            
        dlight.target = light_target

        console.log(dlight)
        hmlt_root.getObjectByName(active_scene).add(dlight)
        hmlt_root.getObjectByName(active_scene).add(light_target)
        guis()



   }

   const addPointLight = () => {
        var plight = new THREE.PointLight( 0xff0000, 1, 100, 2 );

        if(hmlt_root.getObjectByName(active_scene).getObjectByName("pointlight")) 
        {

            let suf = hmlt_root.getObjectByName(active_scene).children.filter(child => child.name.includes("pointlight")).length
            plight.name = `pointlight.00${suf}`

        }else {
            plight.name = "pointlight"
        }
        hmlt_root.getObjectByName(active_scene).add(plight)
        guis()
   }

   const addSpotLight = () => {

    var slight = new THREE.SpotLight(0xff00ff, 1)
    if(hmlt_root.getObjectByName(active_scene).getObjectByName("spotlight")) 
        {

            let suf = hmlt_root.getObjectByName(active_scene).children.filter(child => child.name.includes("spotlight")).length
            slight.name = `spotlight.00${suf}`

        }else {
            slight.name = "spotlight"
        }

        let light_target = new THREE.Object3D();

        light_target.name = `${slight.name} - target`
        light_target.userData = 
        {
            isTarget : true,
            targetOf : slight.name
        }
            
        slight.target = light_target

        hmlt_root.getObjectByName(active_scene).add(slight)
        hmlt_root.getObjectByName(active_scene).add(light_target)
        
        guis()
   }

   const exportTransform = (export_data , o) => {

            let model_export = export_data

            // if we don't have a transform object already(lights. duplicates) create it.
            if(model_export.transform === undefined) 
            {
                model_export.transform = {}
                model_export.transform.position = {}
            }
            
            model_export.transform.position.x = o.position.x
            model_export.transform.position.y = o.position.y
            model_export.transform.position.z = o.position.z

            model_export.transform.scale = o.scale.toArray()
            model_export.transform.rotation = o.quaternion.toArray()
            return model_export


   }
   const getSceneData = (target_object) => {

        let export_data = {}
        export_data.models = []

        // first we get the updated transforms for the loaded models
        let scene_data = config_data.filter(scene => {return scene.sceneName === target_object.name})[0]

        if(scene_data === undefined ) {
            return 
        }
        
        scene_data.models.forEach(model_data => {

            let o = target_object.getObjectByName(model_data.name)

            // bail early if the object has been deleted
            if(o === undefined) return

            // copy the model data from the config. this insures all materials and settings are maintined
            let model_export = model_data
            
            //update the transform
            model_export =  exportTransform(model_data, o)

            
            export_data.models.push(model_export)

        })


        // now we need the added lighting 
        let validLights = ["DirectionalLight", "PointLight", "SpotLight"] 
        let light_data = target_object.children.filter(
                                        child =>  {return validLights.indexOf(child.type) !== -1 && !child.userData.isClone})
                                          .map(light_obj => {

                                            
                                            let light_data = {}
                                            light_data.name = light_obj.name;
                                            light_data.type = light_obj.type;
                                            light_data.color = light_obj.color.getStyle()

                                            if(light_obj.type !== "DirectionalLight") {
                                                light_data.distance = light_obj.distance
                                                light_data.power = light_obj.power; 
                                            }
                                            if(light_obj.type === "SpotLight") 
                                            {
                                                 light_data.angle = light_obj.angle
                                                 light_data.penumbra = light_obj.penumbra

                                            }
                                            if(light_obj.type === "DirectionalLight") 
                                            {
                                                 light_data.intensity = light_obj.intensity

                                            }
                                            if(light_obj.type === "SpotLight" || light_obj.type === "DirectionalLight") 
                                            {

                                                light_data.targetName = light_obj.target.name
                                                light_data.targetName = light_obj.target.name
                                            }
                                            

                                            light_data = exportTransform(light_data, light_obj)

                                            return light_data

                                          })
        

        export_data.lights = light_data


        // we need all the duplicates. this helps cut down on loading time
        let duplicate_data = target_object.children.filter( child => {return child.userData.isClone})
                                            .map(dup_obj => {

                                                let dup_data = {}
                                                dup_data.name = dup_obj.name
                                                dup_data.master = dup_obj.userData.master
                                                return dup_data

                                            })
                                            


        export_data.duplicates = duplicate_data


        // target data. 
        let targets_data = target_object.children.filter( child => {return child.userData.isTarget})
                                            .map(target_obj => {

                                                let target_data = {}
                                                target_data.name = target_obj.name

                                                Object.keys(target_obj.userData).forEach( (key) => {

                                                    target_data[key] = target_obj.userData[key]

                                                })

                                                target_data= exportTransform(target_data, target_obj)
                                                return target_data 

                                            })
         

        export_data.targets = targets_data



        // actor data
        let actors_data = target_object.children.filter(child =>  {return child.userData.isActor})
                                                  .map(actor_obj => {
                                                      let actor_data = {}
                                                      actor_data.name = actor_obj.name;
                                                      actor_data.crop = {}
                                                      actor_data = exportTransform(actor_data, actor_obj)
                                                        if(actor_obj.userData.cropLeft) 
                                                        {
                                                            actor_data.crop.cropLeft= actor_obj.userData.cropLeft
                                                        }
                                                        if(actor_obj.userData.cropRight) 
                                                        {
                                                            actor_data.crop.cropRight = actor_obj.userData.cropRight
                                                        }
                                                        // camera hack
                                                        if(actor_obj.userData.scale)
                                                        {
                                                            let s = actor_obj.userData.scale
                                                            actors_data.transform.scale = [s,s,s]
                                                        }

                                                      return actor_data
                                                  })
        

        export_data.actors = actors_data
        // export the overall position of the scene

        export_data.scene_position = scene_position
        export_data.sceneName = target_object.name


        return export_data


   }

   const sendNameUpdate = (obj, new_name) => 
   {
        conn && conn.send('setKnob', {name : "hmlt_build", value : {
            obj: active_model_name, 
            cmd : "name-update",
            obj : obj,
            data : new_name}}
          )

   }

   

   const buildLightGui = () => {

        let validLights = ["DirectionalLight", "PointLight", "SpotLight"] 
        // bail if we have no objects
        if(active_model_name === "") return;

        
        let selected_obj = hmlt_root.getObjectByName(active_scene).getObjectByName(active_model_name);

        if(selected_obj === undefined) return
        if(!validLights.includes(selected_obj.type)) return


        if(Object.keys(lighting_panel.__folders).includes('Active Light')) {
+
              // remove all child folders
              Object.keys(lighting_panel.__folders).forEach((folder_name)=> {
                  let folder = lighting_panel.__folders[folder_name]
                  lighting_panel.removeFolder(folder)


              })
              
        }
        var active_light_folder = lighting_panel.addFolder('Active Light')
        let light_settings;
        let default_settings = {
                    'light name' : selected_obj.name,
                    'light color' : selected_obj.color.getHex(),
                    power : selected_obj.power,
                    distance : selected_obj.distance,
                    decay : selected_obj.decay
                }

        const sendLightInfo  = (prop, val) => {
            conn && conn.send('setKnob', {name : "hmlt_build", value : {
            obj: active_model_name, 
            cmd : "light-update",
            prop : prop,
            data : val}}
          )
        }
        const addDefaults = () => 
        {
                active_light_folder.add(default_settings, 'light name').onChange(
                    (new_name) => {

                        if(selected_obj.type === "SpotLight" || selected_obj.type === "DirectionalLight") 
                        {

                            let new_target_name = `${new_name} - target`
                            sendNameUpdate(selected_obj.target.name, new_target_name)
                            selected_obj.target.name = new_target_name
                            selected_obj.target.userData.targetOf = new_name

                        }
                        sendNameUpdate(selected_obj.name, new_name)
                        selected_obj.name= new_name
                        
                        buildGui(hmlt_root)


                    })
                    active_light_folder.addColor(default_settings, 'light color').onChange(
                        (val) => {
                            selected_obj.color.setHex(val); 
                            render()
                    })


                    

                    
                    if(selected_obj.type !== "DirectionalLight") {
                        active_light_folder.add(default_settings, 'power', 0, 2000).onChange(
                            (val) => {
                                selected_obj.power= val
                                sendLightInfo("power", val)
                                render()
                            }
                        )
                        active_light_folder.add(default_settings, 'distance',0, 2000).onChange(
                        (val) => {
                            selected_obj.distance= val
                            sendLightInfo("distance", val)
                            render()
                        }
                    )
                    }

        }
        switch(selected_obj.type) 
        {

            case "PointLight" :
                light_settings = default_settings
                addDefaults()
                break;

            case "SpotLight" :
                let spotlight_settings = 
                {

                    angle : selected_obj.angle,
                    penumbra : selected_obj.penumbra,


                }
                light_settings = {...default_settings , ...spotlight_settings }
                addDefaults();
                active_light_folder.add(light_settings, 'angle',0, Math.PI /3).onChange(
                    (val)=> {
                        selected_obj.angle = val
                        render()
                })

                active_light_folder.add(light_settings, 'penumbra', 0 , 1.0).onChange(
                    (val)=> {
                        selected_obj.penumbra= val
                        render()
                })

                break;
            case "DirectionalLight" :
                let directional_settings = 
                {
                    intensity : selected_obj.intensity
                }
                
                light_settings = {...default_settings, ...directional_settings}
                addDefaults();
                active_light_folder.add(light_settings, 'intensity', 0, 300.0).onChange(
                    (val) => {
                        selected_obj.intensity = val
                        render()
                    }
                )



                
        }

        active_light_folder.open()

        
   }

   const buildActorGui = (hmlt_root) => {

        let selected_obj = hmlt_root.getObjectByName(active_scene).getObjectByName(active_model_name);

        if(selected_obj === undefined) return
        if(!selected_obj.userData.isActor) return


        
        if(Object.keys(actor_panel.__folders).includes('Create Actor')) {
+
+             actor_panel.removeFolder(actor_panel.__folders['Create Actor'])
        }

        const sendCropInfo = (val) => {
            conn && conn.send('setKnob', {name : "hmlt_run", value : {
            cmd : "cropActor",
            data : val}
        })
        }

        const sendSizeInfo = (val) => {
           conn && conn.send('setKnob', {name : "hmlt_run", value : {
                cmd : "scaleActor",
                data : val}
            })

        }
        let actor_folder = actor_panel.addFolder('Create Actor')
        let actorController = {
            name : selected_obj.name,
            cropLeft : 0.0,
            cropRight : 1.0,
            scale : 1.0
        }

        actor_folder.add(actorController, 'name')
        actor_folder.add(actorController, 'cropLeft', 0, 1.0).onChange(
            val => {
                actorController.cropLeft = val;

                selected_obj.userData.cropLeft = val
                sendCropInfo(
                {
                 "cropLeft" : val,
                 "cropRight" : actorController.cropRight,
                 "name" : selected_obj.name
                 })
            }
        )

       actor_folder.add(actorController, 'cropRight', 0, 1.0).onChange(
            val => {
                actorController.cropRight= val;
                selected_obj.userData.cropRight = val
                sendCropInfo( 
                {"cropRight" : val,
                 "cropLeft" : actorController.cropLeft,
                 "name" : selected_obj.name
                 })
            }
        ) 

        actor_folder.add(actorController, 'scale', 0.0, 2.0).onChange(
            val => {
                actorController.scale = val;
                selected_obj.userData.scale
                sendSizeInfo(
                    {
                     scale : val,
                     name : selected_obj.name
                    })
            }
        )


        actor_folder.open()

       

   }


    const buildGui = (scene_name) => {
        let target_scene = hmlt_root.getObjectByName(scene_name)
        let validObject = ["Mesh"]
        let panelSettings = {}

        let selectModelControls = []
         if(Object.keys(panel.__folders).includes('Models')) {
+
+             panel.removeFolder(panel.__folders['Models'])
        }

        var model_folder = panel.addFolder('Models')

        let model_names= target_scene.children.filter(
                                        child =>  {return child.type === "Mesh"})

                                        .map(child => { return child.name})

        model_names.forEach(name => {

                panelSettings[name] = () => {
                    active_model_name = name
                    let obj = target_scene.getObjectByName(active_model_name) 
                    if(obj)
                    {

                        if(transform_controls.object !== undefined) {
                            transform_controls.detach()
                        }
                        transform_controls.attach(obj)
                        buildActorGui(hmlt_root)
                    }
                        
                }
            selectModelControls.push(model_folder.add(panelSettings, name))

        })

        model_folder.open()

    

         let validLights = ["DirectionalLight", "PointLight", "SpotLight"] 
         let selectLightControls = []
         if(Object.keys(panel.__folders).includes('Lights')) 
         {
+
+             panel.removeFolder(panel.__folders['Lights'])
         }

         var  light_folder = panel.addFolder('Lights')
         
          let light_names = target_scene.children.filter(
                                        child =>  {return validLights.indexOf(child.type) !== -1})

                                        .map(child => { return child.name})



        light_names.forEach(name => {

                panelSettings[name] = () => {
                    active_model_name = name
                    let obj = target_scene.getObjectByName(active_model_name) 
                    if(obj)
                    {

                        if(transform_controls.object !== undefined) {
                            transform_controls.detach()
                        }

                        transform_controls.attach(obj)
                        buildLightGui(hmlt_root)
                    }
                        
                }
            selectLightControls.push(light_folder.add(panelSettings, name))

        })

        
        
        light_folder.open()


        let lightTargetControls = []
            if(Object.keys(panel.__folders).includes('Light Targets')) 
            {
                panel.removeFolder(panel.__folders['Light Targets']) 

            }

        let targets_folder = panel.addFolder('Light Targets') 
        let target_names = target_scene.children.filter(
                            child => {return child.userData.isTarget}
                            )
                            .map(targ_obj => {return targ_obj.name})
                            .forEach(name => {
                                panelSettings[name] = () => {

                                    active_model_name = name
                                    let obj =hmlt_root.getObjectByName(active_model_name) 
                                    if(obj)
                                    {

                                        if(transform_controls.object !== undefined) {
                                            transform_controls.detach()
                                        }

                                        transform_controls.attach(obj)
                

                                }}
                                
                                lightTargetControls.push(targets_folder.add(panelSettings, name))
                            })


       let sceneControls = []
            if(Object.keys(panel.__folders).includes('Scene Controls')) 
            {
                panel.removeFolder(panel.__folders['Scene Controls']) 

            }


        let scene_folder = panel.addFolder('Scene Controls')
        let scene_names  = hmlt_root.children.map((child => {return child.name}))
        scene_names.forEach(name => {

                panelSettings[name] = () => {
                    let obj =hmlt_root.getObjectByName(name) 
                    if(obj)
                    {
                            let [getScene, setScene] = useActiveScene()
                            conn && conn.send('setKnob', {name : "hmlt_run", value : {
                                cmd : "setScene",
                                data : name
                                }
                            })
                            setScene(name)
                            guis()
                    }
                        
                }
            sceneControls.push(scene_folder.add(panelSettings, name))

            })
        
        


        if(Object.keys(panel.__folders).includes('File')) {
            panel.removeFolder(panel.__folders['File'])
        }
        
        let export_folder = panel.addFolder('File')


        // build download link
        panelSettings["export"] = () => {


            let export_data = hmlt_root.children
               .filter(child => {return child.type === "Group"})
               .map(child =>{
                        return getSceneData(child)
                    }

                )

                console.log(export_data)

            var link = document.createElement('a')

            link.setAttribute('download', 'config.js');

            link.href = createFile(export_data)
            document.body.appendChild(link)
            window.requestAnimationFrame(() => {

                var event = new MouseEvent('click')
                link.dispatchEvent(event)
                document.body.removeChild(link)

            });

        }

        export_folder.add(panelSettings, "export")


    }



var render = () => {

        renderer.render(root_scene,camera)
}



var animate = () => {

        render()
        requestAnimationFrame(animate)

    }







