import * as THREE from '/deps/three/build/three.module.js'
import {LOG_LEVEL, say} from './scenes.js'


let rainGeo;
let rainCount
let street_uniforms
const particles = 100000;
let particleSystem, uniforms, geometry;


export const init = (scene_root) => {

    say('STREET INIT', LOG_LEVEL.VERBOSE)
    rainGeo = new THREE.BufferGeometry()
    const positions = [];
    const colors = [];
    const sizes = [];

	const radius = 200;

    street_uniforms = {


				};

let vert = `attribute float size;

			varying vec3 vColor;

			void main() {

				vColor = color;

				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

				gl_PointSize = size * ( 300.0 / -mvPosition.z );

				gl_Position = projectionMatrix * mvPosition;

            `
            
let frag = `

			varying vec3 vColor;

			void main() {

				gl_FragColor = vec4( vColor, 1.0 );


			}
         `
//				gl_FragColor = gl_FragColor * texture2D( pointTexture, gl_PointCoord );


const shaderMaterial = new THREE.ShaderMaterial( {

					uniforms: uniforms,
					vertexShader:`attribute float size;

			                      varying vec3 vColor;

			                        void main() {

				                    vColor = color;

				                    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

				                    gl_PointSize = size * ( 300.0 / -mvPosition.z );

                                    gl_Position = projectionMatrix * mvPosition;
                                    
                                }

                        `,
					fragmentShader: frag,
					blending: THREE.AdditiveBlending,
					depthTest: false,
					transparent: true,
					vertexColors: true

                } );

   const color = new THREE.Color();

   for ( let i = 0; i < particles; i ++ ) {

        positions.push( ( Math.random() * 2 - 1 ) * radius );
        positions.push( ( Math.random() * 2 - 1 ) * radius );
        positions.push( ( Math.random() * 2 - 1 ) * radius );

        color.setHSL( 360, 1.0, 0.5 );

        colors.push( color.r, color.g, color.b );

        sizes.push(.1);

				}

       geometry = new THREE.BufferGeometry();
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
        geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
        geometry.setAttribute( 'size', new THREE.Float32BufferAttribute( sizes, 1 ).setUsage( THREE.DynamicDrawUsage ) );


      particleSystem = new THREE.Points( geometry, shaderMaterial );

      scene_root.add(particleSystem)


    return 1

}


export const animate = (scene_root) => {
    say('BEACH ANIMATE', LOG_LEVEL.VERBOSE)

}

