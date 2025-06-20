import './style.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import gsap from 'gsap'
import LocomotiveScroll from 'locomotive-scroll';
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const scroll = new LocomotiveScroll({
    el: document.querySelector('.main'),
    smooth: true,
    lerp: 0.07
});

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(15, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.z = 13

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#canvas'),
    antialias: true,
    alpha: true
})

renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1
renderer.outputEncoding = THREE.sRGBEncoding

const pmremGenerator = new THREE.PMREMGenerator(renderer)
pmremGenerator.compileEquirectangularShader()

const rgbeLoader = new RGBELoader()
rgbeLoader.load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/pond_bridge_night_1k.hdr', function(texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping
    const envMap = pmremGenerator.fromEquirectangular(texture).texture
    scene.environment = envMap
    texture.dispose()
    pmremGenerator.dispose()
})

const loader = new GLTFLoader()
let model

loader.load(
    './DamagedHelmet.gltf',
    function (gltf) {
        model = gltf.scene
        scene.add(model)
        modelMove()
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded')
    },
    function (error) {
        console.error('An error occurred:', error)
    }
)

const composer = new EffectComposer(renderer)
const renderPass = new RenderPass(scene, camera)
composer.addPass(renderPass)

const rgbShiftPass = new ShaderPass(RGBShiftShader)
rgbShiftPass.uniforms['amount'].value = 0.0025
composer.addPass(rgbShiftPass)

let time = 0
function animate() {
    time += 0.01
    window.requestAnimationFrame(animate)
    if (model) {
        rgbShiftPass.uniforms['amount'].value = 0.002 + Math.sin(time) * 0.001
    }
    composer.render()
}
animate()

const arrPositionDesktop = [
    { id: 'hero', position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } },
    { id: 'about', position: { x: -1.5, y: 0, z: 1.5 }, rotation: { x: 0, y: 0.5, z: 0 } },
    { id: 'community', position: { x: 1.5, y: 0, z: 1.5 }, rotation: { x: 0, y: -0.5, z: 0 } },
    { id: 'support', position: { x: 0, y: 0, z: 1.5 }, rotation: { x: 0, y: 0, z: 0 } },
    { id: 'newsletter', position: { x: 0, y: 0, z: 15 }, rotation: { x: 0, y: 0, z: 0 } }
]

const arrPositionMobile = [
    { id: 'hero', position: { x: 0, y: 0, z: -5 }, rotation: { x: 0, y: 0, z: 0 } },
    { id: 'about', position: { x: 0.2, y: 0, z: 2 }, rotation: { x: 0.12, y: 0.5, z: 0 } },
    { id: 'community', position: { x: -0.2, y: -0.7, z: 2 }, rotation: { x: 0, y: -0.5, z: 0 } },
    { id: 'support', position: { x: -1, y: -0.8, z: -5 }, rotation: { x: 0, y: 0.5, z: 0 } },
    { id: 'newsletter', position: { x: 0, y: 0, z: 25 }, rotation: { x: 0, y: 0, z: 0 } }
]

function getCurrentPositions() {
    return window.innerWidth < 768 ? arrPositionMobile : arrPositionDesktop;
}

function modelMove() {
    const positions = getCurrentPositions();
    const sections = document.querySelectorAll('.section');
    let currentSection;

    sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 3) {
            currentSection = section.id;
        }
    });

    const position_active = positions.find(p => p.id === currentSection);
    if (position_active) {
        gsap.to(model.position, {
            ...position_active.position,
            duration: 3,
            ease: 'power2.out'
        });
        gsap.to(model.rotation, {
            ...position_active.rotation,
            duration: 3,
            ease: 'power2.out'
        });
    }
}

window.addEventListener('scroll', () => {
    if (model) {
        modelMove();
    }
});

function updateCameraPosition() {
    if (window.innerWidth < 768) {
        camera.position.z = 18;
    } else {
        camera.position.z = 13;
    }
    camera.updateProjectionMatrix();
}

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    composer.setSize(window.innerWidth, window.innerHeight)
    updateCameraPosition();
});

updateCameraPosition();
