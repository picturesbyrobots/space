import * as THREE from '/deps/three/build/three.module.js'
import Service from '/space/js/Service.js'


let defaults = {
    width : 16,
    height : 9,
    position : new THREE.Vector3(0,0,0),
    rotation : new THREE.Quaternion(0,0,0,1),
    scale : new THREE.Vector3(1,1,1),
    stream : null
    
}
let module_name = "aCTOR"

const say = (text) => {

    console.log(`${module_name} : ${text}`)

}
const createChromaKeyMaterial = () => {
  return new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: {
      map: { type: 't' },
      t: { value: 0 },
      aspect: { value: 1 },
      slop: { value: 0.1 },
      crop: { value: 0 },
      cropLeft : {value: 0},
      cropRight : {value: 1.0},
      edgeCorrection: { value: 0.0 },
    },
    vertexShader: `
      varying vec2 p;
      uniform float aspect;
      uniform float crop;

      void main() {
        p = uv*2.-1.;
        p *= 1. - crop;
        // norm = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position * vec3(aspect, 1., 1.), 1.0 );
      }
    `,

    fragmentShader: `
      #include <common>

      uniform float slop;
      uniform float edgeCorrection;
      uniform float cropLeft;
      uniform float cropRight;

      varying vec2 p;
      uniform sampler2D map;

      void main() {
        vec2 uv = p;
        uv = uv/2.+.5;
        vec4 tex = texture2D(map, uv);

        tex *= pow(1.-clamp(tex.g - max(tex.r, tex.b) - slop, 0., 1.), 50.);
        tex.g = min(tex.g, max(tex.r, tex.b) + edgeCorrection);
        tex *= step(cropLeft, uv.x);
        tex *= 1.0 - step(cropRight, uv.x);
        gl_FragColor = tex;
      }
    `,
  });
}


export const createActor = (object, parameters) => {



    // refactor party.html actor functions

    let options = {...defaults, ...parameters}

    if(!options.listener || !options.name || !options.gestureWrangler) {

        say("CAN\'T INITIALIZE ACTOR PANEL. Need a listener and a name") 
        return

    }

    const actor_element = document.createElement('video')
    actor_element.id = `${options.name}-vid-el`
    actor_element.playsInline = true;
    actor_element.muted = true;

    const videoTexture = new THREE.VideoTexture(actor_element);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBFormat

    const chromaMat = createChromaKeyMaterial();


    // const mesh = new THREE.Mesh(
    //     new THREE.PlaneBufferGeometry(options.width, options.height),
    //     new THREE.MeshBasicMaterial({
    //         color : 0xFFFFFF,
    //         side : THREE.DoubleSide,
    //         map : videoTexture
    //     }))


    let scale  = options.scale.x
    const width = options.width * scale
    const height = options.height * scale
    const mesh = new THREE.Mesh(
         new THREE.PlaneBufferGeometry(width, height),
         chromaMat
    )

    const updateScale = (data) => {
      const width = options.width * data.scale
      const height = options.height * data.scale
      mesh.geometry.copy(new THREE.PlaneBufferGeometry(width, height))

    }

    const updateCrop = (cropData) => {

      if(cropData.cropLeft)
        mesh.material.uniforms.cropLeft.value = cropData.cropLeft;

      if(cropData.cropRight) 
        mesh.material.uniforms.cropRight.value = cropData.cropRight;


    }
    mesh.material.uniforms.map.value = videoTexture;
    mesh.material.uniforms.slop.value = 0.05;
    mesh.material.uniforms.edgeCorrection.value = 0.2;
    updateCrop(options.crop)
    


    let sound =  new THREE.Audio(options.listener)


    mesh.add(sound);


    const setStream = newStream => {
        if (newStream) {
          if (!actor_element.srcObject) {
            actor_element.srcObject = new MediaStream(newStream.getTracks());
          } else {
            const stream = actor_element.srcObject;
            const oldTracks = new Set(stream.getTracks());
            for (const track of newStream.getTracks()) {
              if (!oldTracks.has(track))
                stream.addTrack(track);
              else
                oldTracks.delete(track);
            }
            for (const track of oldTracks)
              stream.removeTrack(track);
          }
          mesh.visible = true;
          options.gestureWrangler.playVideo(actor_element);
        } else {
          actor_element.srcObject = null;
          mesh.visible = false;
        }
        try {
          sound.disconnect();
        } catch(e){}
        if (actor_element.srcObject && actor_element.srcObject.getAudioTracks().length)
          sound.setMediaStreamSource(actor_element.srcObject);
    }

    const getStream = () => {
        return options.stream
    }
    mesh.userData.isActor = true

    mesh.userData.muteSound = () => {
      sound.setVolume(0.0);
    }
    mesh.userData.unmuteSound = () => {

      sound.setVolume(1.0);

    }


    

    mesh.name = options.name
    object.add(mesh)
    mesh.rotation.setFromQuaternion(options.rotation)


    mesh.position.copy(options.position)


    Service.get('knobs', knobs => {
      knobs.observe('hmlt_run', msg =>{

        if(msg === undefined) return
        if (msg.cmd === "cropActor") 
        {
          if(mesh.name === msg.data.name)
          {
              updateCrop(msg.data)
          }

        }
        if(msg.cmd === "scaleActor")
        {
          if(mesh.name === msg.data.name)
            {
                updateScale(msg.data)
            }
        }

      })
    })
    return [mesh, setStream, getStream]
    }
