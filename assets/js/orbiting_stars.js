import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js"

//Setup Renderer
const w = window.innerWidth;
const h = window.innerHeight;
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(w,h);
renderer.setClearColor( 0xffffff, 1 );
//renderer.setClearColor(0x00000f);
//document.body.append(renderer.domElement);
document.getElementById('canvas-container').appendChild(renderer.domElement);

//Setup camera
const fov = 75;
const aspect = w/h;
const near = 0.01;
const far = 10000;
const camera = new THREE.PerspectiveCamera(fov, aspect , near , far );
camera.position.z = 30;

// camera.position.z = -300;

//Setup scene
const scene = new THREE.Scene();

//Define orbit controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.03

//Update window size
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let theta = 0; // Horizontal rotation
let phi = 0;   // Vertical rotation
let distance = 14;

window.addEventListener( 'resize', onWindowResize );

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

document.addEventListener('mousedown', (e) => {
    // Don't interfere with link clicks
    if (e.target.tagName === 'A') return;
    
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        
        theta -= deltaX * 0.005;
        phi -= deltaY * 0.005;
        
        previousMousePosition = { x: e.clientX, y: e.clientY };
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

document.addEventListener('wheel', (e) => {
    e.preventDefault();
    distance += e.deltaY * 0.01;
    distance = Math.max(2, Math.min(2000, distance));
}, { passive: false });

function updateCamera() {
    camera.position.x = distance * Math.sin(theta) * Math.cos(phi);
    camera.position.y = distance * Math.sin(phi);
    camera.position.z = distance * Math.cos(theta) * Math.cos(phi);
    camera.lookAt(0, 0, 0);
}

const fullWidth = window.innerWidth;
const fullHeight = window.innerHeight;

// shift camera view down by 100 pixels
camera.setViewOffset(
  fullWidth,
  fullHeight,
  0,   // x offset
  0.14*fullHeight, // y offset
  fullWidth,
  fullHeight
);


//------------------------------------
// Setup objects and scene
//-----------------------------------

//Define Nuclear Star cluster size and integration schemes
const bhRadius   = 2;
const iscoRadius = 0;
const numStars = 500;
const starSize = 0.5

const simSize = 500
const avgVelocity = 10
const dt = 0.01

//Add Black Hole
const bhGeometry = new THREE.SphereGeometry(bhRadius, 64, 64);
const bhMaterial = new THREE.MeshStandardMaterial({
    color: 0x00000,
    opacity: 0.9,
    transparent: false
});

const bhMesh = new THREE.Mesh(bhGeometry, bhMaterial);
scene.add(bhMesh);

//Add ISCO region
const iscoGeometry = new THREE.SphereGeometry(iscoRadius, 64, 64);
const iscoMaterial = new THREE.MeshStandardMaterial({
    color: 0x00000,
    opacity: 0.2,
    transparent: true
});

const iscoMesh = new THREE.Mesh(iscoGeometry, iscoMaterial);
bhMesh.add(iscoMesh);


//Add stars 
const stars = [];

for (let i = 0; i < numStars; i++) {

    //Add star geometry
    const starGeometry = new THREE.SphereGeometry(starSize, 16, 16);
    const starMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const star = new THREE.Mesh(starGeometry, starMaterial);

    //Define initial positions
    const x = (Math.random() - 0.5) * simSize;
    const y = (Math.random() - 0.5) * simSize;
    const z = (Math.random() - 0.5) * simSize;
    
    const vx = (Math.random()-0.5) * avgVelocity;
    const vy = (Math.random()-0.5) * avgVelocity;
    const vz = (Math.random()-0.5) * avgVelocity;

    //Runge Kutta / Euler positions
    star.RKpos = { x, y, z };
    star.RKvel = { vx, vy, vz };
    
    star.position.set(x,y,z);
    
    stars.push(star);
    scene.add(star);
}

//Add light
const hemiLight = new THREE.HemisphereLight(0x0099ff, 0xaa5500)
scene.add(hemiLight)

//Animate
function animate(t=0){
    
    updateCamera()
    requestAnimationFrame(animate);

    for (const star of stars) {
    
        const r = star.RKpos.x**2 + star.RKpos.y**2 + star.RKpos.z**2; 
        const a = 0.0001*r**(3/2);
        const ax = -star.RKpos.x/a; 
        const ay = -star.RKpos.y/a; 
        const az = -star.RKpos.z/a; 
    
        star.RKvel.vx += ax*dt;
        star.RKvel.vy += ay*dt;
        star.RKvel.vz += az*dt;

        star.RKpos.x  += star.RKvel.vx*dt;
        star.RKpos.y  += star.RKvel.vy*dt;
        star.RKpos.z  += star.RKvel.vz*dt;

        star.position.x = star.RKpos.x;
        star.position.y = star.RKpos.y;
        star.position.z = star.RKpos.z;
    };

    //blackHole.scale.setScalar( 0.2+0.05*Math.cos(t*0.001));
    //blackHole.rotation.x = t*0.001;
    renderer.render(scene, camera);
    controls.update()

}

animate();