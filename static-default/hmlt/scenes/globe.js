import * as THREE from '/deps/three/build/three.module.js'
let duplicates = []
let start
let uniforms


const makeShader = () => {

      let frag = `

                  float PHI = 1.61803398874989484820459;  // Φ = Golden Ratio   
                  varying vec2 p;
                  uniform float time;
                  varying vec2 vUv;

                  float gold_noise(in vec2 xy, in float seed){
                        return fract(tan(distance(xy*PHI, xy)*seed)*xy.x);
                  }

			void main() {

                        float gn = gold_noise(vUv, time);
				gl_FragColor = vec4( vec3(0.0,gn,.3), 1.0 );


			}
         `
//				gl_FragColor = gl_FragColor * texture2D( pointTexture, gl_PointCoord );


            const shaderMaterial = new THREE.ShaderMaterial( {

                              uniforms: {time : {
                                    type : "f",
                                    value : 0.0
                              }
                              } ,
					vertexShader:`attribute float size;


                              
                                          varying vec2 vUv;
			                        void main() {


                                             vUv = uv/2. + .5;
				                    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );


                                    gl_Position = projectionMatrix * mvPosition;
                                    
                                }

                        `,
					fragmentShader: frag,
					depthTest: true,
					transparent: true,

                } );

            return shaderMaterial

}




export const init = (scene_root) => 
{
      
      if(scene_root.getObjectByName("sky")){
            return
      }
      const skyGeo = new THREE.SphereBufferGeometry( 3000, 32, 15 );
      const material = new THREE.MeshBasicMaterial( {
                                  side : THREE.DoubleSide,
                                  color: 0x0a370b} );

      const sky = new THREE.Mesh(skyGeo, material);
      sky.name = "sky"

      const static_mat = makeShader()

      const staticPlane = new THREE.PlaneBufferGeometry(1200,900, 10)
      const basic_mat =new THREE.MeshBasicMaterial({
            color : 0x303430,
            
      })


      




      const static_bg = new THREE.Mesh(staticPlane, static_mat)
      static_bg.position.copy(new THREE.Vector3(0, 0, -500))
      scene_root.add(sky)
      static_bg.name = "static"
      scene_root.add(static_bg)
      start = Date.now()



      

      

}

const up = new THREE.Vector3(0,1,0)
let angle = 0.0;
let rot_speed = .01
const spin = (obj) => {
      switch(obj.userData.axis) {

            case 0 : 
                  obj.rotateY(rot_speed)
                  break; 
            case 1 :
                  obj.rotateX(rot_speed)
                  break
            case 2 :
                  obj.rotateZ(rot_speed)
                  break


      }

}

let new_val;
export const animate= (scene_root) => 
{
    
      
      new_val = .00025 * ( Date.now() - start );
      if(new_val > 200) {
            start = Date.now()
      }
      scene_root.getObjectByName("static").material.uniforms[ 'time' ].value = new_val;
      
}