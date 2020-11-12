import * as THREE from '/deps/three/build/three.module.js'
import Service from '/space/js/Service.js';
/*  
=========
makeVideoArtwork.js
=========
.. module : makeVideoArtwork.js

function:: makeVideoArtwork

makes a video artwork object
args
    config - @s4y space config
    listener - audio listener for a space
    gestureWrangler - gestureWrangler for a space
    video_data - javascript object containing two fields 
                 uri - where this object can be found in the browser
    parameters - javascript object with three.js parameters
                    screenWidth : width of the screen of the video
                    material_type : 'PHONG' for lighting response materials. 'BASIC' for non lighting response


returns 
    an array with two elements. 
    first element is a THREE.Group containing the video
    second element is a function that will set the video element to a new source


*/





export const MAT_TYPE = {
    PHONG : 'PHONG',
    BASIC : 'BASIC'
}


let defaults = {

    screenWidth : 40,
    material_type : MAT_TYPE.BASIC


}


// quick dispatch to allow for different materials
const withMat = (type, mat_options) => {

    let dispatch = {

         'PHONG': (opts) => {return new THREE.MeshPhongMaterial({...opts})},
         'BASIC' : (opts) => {return new THREE.MeshBasicMaterial({...opts})}
        
    }

    return dispatch[type](mat_options)

}

export const makeVideoPlayer = (config, gestureWrangler, parameters) => {



  
    let options = {...defaults, ...parameters}
    let textureCreated = false;

 // create the screen that will hold the video
    const screen = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(10, 10),
        new THREE.MeshPhongMaterial({visible: false})
      );

    

    // video element. set the cross origin in case we want to load from different sources
    let video_el_id = "videoPLayerElement"


    const makeVideoEl = (uri) => {

      
      let videoTexture;
      let videoMat; 

      const videoEl = document.createElement('video')
      videoEl.playsInline = true;
      videoEl.crossOrigin = "anonymous";
      videoEl.id = video_el_id
      videoEl.loop = false;
      videoEl.src = uri
      videoEl.load()

      videoEl.addEventListener('loadedmetadata', e => {

        gestureWrangler.playVideo(videoEl);
      });

      videoEl.addEventListener('ended', e => {

        if(textureCreated) 
        {
          screen.material.visible = false
          videoTexture.dispose()
          videoMat.dispose()
        }

      })
      videoEl.addEventListener('playing', e => {
        if(!textureCreated) {

            
            videoTexture = new THREE.VideoTexture(videoEl);
            videoTexture.minFilter = THREE.LinearFilter;
            videoTexture.magFilter = THREE.LinearFilter;
            videoTexture.format = THREE.RGBFormat;

            videoMat = withMat(options.material_type , {
                                                            map : videoTexture,
                                                            transparent : true,
                                                            opacity : 1,
                                                            side : THREE.DoubleSide
            })

            screen.material = videoMat

            resizeScreen(videoEl);

            screen.material.visible = true
            textureCreated = true;
            console.log("playing")
        }



      const wantTime = (+new Date() - config.zeroTime) / 1000 % videoEl.duration;
      if (Math.abs(wantTime - videoEl.currentTime) > 0.5)
        videoEl.currentTime = wantTime;
      });
      return videoEl

    }
    
      const resizeScreen = (videoEl) => {
        screen.geometry = new THREE.PlaneBufferGeometry(60, 40 / (videoEl.videoWidth / videoEl.videoHeight));

      }



      // play the video, resize, and add positional audio once we get meta.



        // const posSound = new THREE.PositionalAudio(listener);
        // posSound.panner.panningModel = 'equalpower';
    
        // posSound.setRefDistance(50);
        // posSound.setRolloffFactor(4);
        // posSound.setDistanceModel('exponential');
        // posSound.setDirectionalCone(120, 230, 0.1);
        // posSound.rotation.y = Math.PI;

        // screen.add(posSound)

      // syncing taken from buildSummerHouse in main party space
      // I also create the video material  to avoid scenarios where the texture is created before the video element loads.
      // which sometimes leads to difficult to debug conditions.
      
      

    // put it all together
    const group = new THREE.Group();
    group.add(screen);
    group.name = "videoPlayer"
    
    const player_pos = new THREE.Vector3(0.0, 0.0, 0.0)


    // TODO: add tanget functions
    const offset = new THREE.Vector3(0.0, 10, -19.0)



    Service.get('room', room => {

        const setPos = () => {
          let [x,y,z] = room.player.position

            // z is up for the player. three thinks y is. 
            // SWAP THIS per decisions about the truth of up
          let {role} = room.player.meta
          
          if(role && role.includes("actor"))
          {
            screen.material.opacity = .5
          }else 
          {
            screen.material.opacity = 1.0

          }

          player_pos.set(x,z, -1.0 * y)
          group.position.copy(player_pos.clone().add(offset))
        }
        setPos()



        room.observe('update', () => {
            setPos()
        })
      })



    // helper function to set a new source
    let setVideoSrc = (new_src) => {
        textureCreated = false
        makeVideoEl(new_src)
     }
    


    return [group, setVideoSrc]
      

}
