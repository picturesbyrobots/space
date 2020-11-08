import * as THREE from '/deps/three/build/three.module.js'


let defaults = {
    width : 16,
    height : 9,
    position : new THREE.Vector3(0,0,0),
    rotation :new THREE.Quaternion(0,0,0,1),
    scale : new THREE.Vector3(1,1,1),
    stream : null
}
let module_name = "ACTOR"

const say = (text) => {

    console.log(`${module_name} : ${text}`)

}
export const createActor = (object, parameters) => {



    // refactor party.html actor functions

    let options = {...defaults, ...parameters}


    if( !options.name) {

        say("CAN\'T INITIALIZE ACTOR PANEL. Need a listener and a name") 
        return

    }

        const mesh = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(options.width, options.height),
        new THREE.MeshBasicMaterial({
            color : 0xFF00,
            side : THREE.DoubleSide,
        }))


        mesh.userData = 
        {
            isActor : true
        }


    mesh.userData.crop = options.crop
    mesh.name = options.name
    object.add(mesh)

    mesh.rotation.setFromQuaternion(options.rotation)
    mesh.scale.copy(options.scale)
    mesh.position.copy(options.position)

    return [mesh]
}