import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js"

//Load variables
const bgColor = getComputedStyle(document.getElementById('canvas-container'))
  .backgroundColor; 

const bhColor = getComputedStyle(document.getElementById('canvas-container'))
  .getPropertyValue('--bhcolor').trim();

//Setup Renderer
const w = window.innerWidth;
const h = window.innerHeight;
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(w,h);
renderer.setClearColor(new THREE.Color(bgColor), 1);
document.getElementById('canvas-container').appendChild(renderer.domElement);

//Setup camera
const fov = 60;
const aspect = w/h;
const near = 0.01;
const far = 10000;
const camera = new THREE.PerspectiveCamera(fov, aspect , near , far );
camera.position.z = 30;

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
let distance = 20;
let autoRotate = true;
const autoRotateSpeed = 0.001;

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
    autoRotate = false;
    previousMousePosition = { x: e.clientX, y: e.clientY };
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;
    theta -= deltaX * 0.005;
    phi -= deltaY * 0.005;
    previousMousePosition = { x: e.clientX, y: e.clientY };
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    setTimeout(() => { autoRotate = true; }, 200);
});

document.addEventListener('wheel', (e) => {
    e.preventDefault();
    distance += e.deltaY * 0.01;
    distance = Math.max(2, Math.min(2000, distance));
}, { passive: false });

function updateCamera() {
    if (autoRotate) theta += autoRotateSpeed;
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
  0,                // x offset
  0.1*fullHeight,   // y offset
  fullWidth,
  fullHeight
);

//------------------------------------
// Setup objects and scene
//-----------------------------------

//Define Nuclear Star cluster size and integration schemes
const bhRadius   = 2;
const iscoRadius = 0;
const numStars = 800;
const starSize = 0.5

const simSize = 500
const avgVelocity = 10
const dt = 0.01

//Add Black Hole
const bhGeometry = new THREE.SphereGeometry(bhRadius, 64, 64);
const bhMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(bhColor),
    opacity: 0.9,
    transparent: false
});

const bhMesh = new THREE.Mesh(bhGeometry, bhMaterial);
scene.add(bhMesh);

//Add ISCO region
const iscoGeometry = new THREE.SphereGeometry(iscoRadius, 64, 64);
const iscoMaterial = new THREE.MeshStandardMaterial({
    color: 0x41006f,
    // opacity: 1.0,
    // transparent: true
});

const iscoMesh = new THREE.Mesh(iscoGeometry, iscoMaterial);
// bhMesh.add(iscoMesh);

//Gravitational constant
const mu = avgVelocity**2 * (simSize / 10);
const minPeriapsis = 5*bhRadius

//Add stars 
const stars = [];

for (let i = 0; i < numStars; i++) {

    //Define initial positions
    const x = (Math.random() - 0.5) * simSize;
    const y = (Math.random() - 0.5) * simSize;
    const z = (Math.random() - 0.5) * simSize;
    
    const vx = (Math.random()-0.5) * avgVelocity;
    const vy = (Math.random()-0.5) * avgVelocity;
    const vz = (Math.random()-0.5) * avgVelocity;

    // Orbital energy
    const r_mag = Math.sqrt(x**2 + y**2 + z**2);
    const v_sq  = vx**2 + vy**2 + vz**2;

    const T   = 0.5 * v_sq;
    const V   = -mu / r_mag;          // fixed: potential is -mu/r not -mu/r^2
    const E   = T + V;

    // Reject unbound orbits (E >= 0 means the star escapes to infinity)
    if (E >= 0) continue;

    // Semi-major axis from vis-viva: E = -mu / 2a
    const sma = -mu / (2 * E);

    // Specific angular momentum vector h = r × v
    const hx = y * vz - z * vy;
    const hy = z * vx - x * vz;
    const hz = x * vy - y * vx;
    const h_mag = Math.sqrt(hx**2 + hy**2 + hz**2);

    // Semi-latus rectum and eccentricity
    const p = h_mag**2 / mu;
    const e = Math.sqrt(1 - p / sma);   // fixed: e = sqrt(1 - p/a)

    // Periapsis distance
    const peri = sma * (1 - e);

    // Loss cone condition — reject if periapsis is too small
    if (peri < minPeriapsis) continue;

    //Add star geometry
    const starGeometry = new THREE.SphereGeometry(starSize, 16, 16);
    const starMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(bhColor) });
    const star = new THREE.Mesh(starGeometry, starMaterial);

    //Runge Kutta / Euler positions
    star.RKpos = { x, y, z };
    star.RKvel = { vx, vy, vz };
    
    star.position.set(x,y,z);
    
    stars.push(star);
    scene.add(star);
}

//Add light
const hemiLight = new THREE.HemisphereLight(0x8329c4, 0x33ad65)
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

    renderer.render(scene, camera);
    controls.update()

}

animate();