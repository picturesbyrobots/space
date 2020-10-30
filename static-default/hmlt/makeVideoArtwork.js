import * as THREE from '/deps/three/build/three.module.js'

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
                 id - a unique id for this video object
                 uri - where this object can be found in the browser
    parameters - javascript object with three.js parameters
                    screenWidth : width of the screen of the video
                    wallWidth : width of the "wall" the video will be hung on
                    wallHeight : height of the "wall" the video will be hung on
                    screenZOffset : how far off the wall
                    wallColor : color to set the wall
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
    wallWidth : 60,
    wallHeight : 40,
    screenZOffset : 2.55,
    wallColor : 0xffffff,
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

export const makeVideoArtwork = (config, listener, gestureWrangler, video_data, parameters) => {

 return new Promise(resolve => {

    let options = {...defaults, ...parameters}
    console.log(config)
    let textureCreated = false;

 // create the screen that will hold the video
    const screen = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(10, 10),
        new THREE.MeshPhongMaterial()
      );

    // video element. set the cross origin in case we want to load from different sources
    const videoEl = document.createElement('video')
    videoEl.playsInline = true;
    videoEl.crossOrigin = "anonymous";

    videoEl.loop = true;
    videoEl.src = video_data.uri;
    videoEl.id =  `video_data.id-src`
    videoEl.load();


      const resizeScreen = () => {
        screen.geometry = new THREE.PlaneBufferGeometry(40, 40 / (videoEl.videoWidth / videoEl.videoHeight));
        screen.position.y = options.wallHeight / 2;
        screen.visible =  true

      }



      // play the video, resize, and add positional audio once we get meta.

      videoEl.addEventListener('loadedmetadata', e => {

        gestureWrangler.playVideo(videoEl);
      });

        const posSound = new THREE.PositionalAudio(listener);
    
        posSound.setRefDistance(50);
        posSound.setRolloffFactor(4);
        posSound.setDistanceModel('exponential');
        posSound.setDirectionalCone(120, 230, 0.1);
        posSound.rotation.y = Math.PI;

        screen.add(posSound)

      // syncing taken from buildSummerHouse in main party space
      // I also create the video material  to avoid scenarios where the texture is created before the video element loads.
      // which sometimes leads to difficult to debug conditions.
      
      videoEl.addEventListener('playing', e => {
        if(!textureCreated) {

            const videoTexture = new THREE.VideoTexture(videoEl);
            videoTexture.minFilter = THREE.LinearFilter;
            videoTexture.magFilter = THREE.LinearFilter;
            videoTexture.format = THREE.RGBFormat;

            screen.material = withMat(options.material_type , {
                                                                map : videoTexture,
                                                                transparent : true,
                                                                opacity : 1,
                                                                side : THREE.DoubleSide
            })

            resizeScreen();

            textureCreated = true;
        }



      const wantTime = (+new Date() - config.zeroTime) / 1000 % videoEl.duration;
      if (Math.abs(wantTime - videoEl.currentTime) > 0.5)
        videoEl.currentTime = wantTime;
      });


    // create the wall that the video will hang on
    const wall = new THREE.Mesh(
          new THREE.BoxBufferGeometry(options.wallWidth,options.wallHeight, 1),
          new THREE.MeshPhongMaterial({ color: options.wallColor})
    );
    
    // move the wall up by half it's height
    wall.position.y += options.wallHeight / 2

    // put it all together
    const group = new THREE.Group();
    group.add(screen);
    group.add(wall)
    group.name = video_data.id
    screen.position.z += options.screenZOffset

    // helper function to set a new source
    let setVideoSrc = (new_src) => {
        videoEl.src = new_src
        videoEl.load()
    }
    


    resolve([group, setVideoSrc])
      
    })

}
