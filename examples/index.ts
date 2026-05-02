import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TTControls } from 'ttcontrols'
import { TransformInfoPanel } from 'transform-info-panel'

const scene = new THREE.Scene()
scene.background = new THREE.Color(0xf0f0f0)

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(3, 3, 3)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize( window.innerWidth ,  window.innerHeight)
document.body.appendChild(renderer.domElement)

const geometry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshPhongMaterial({ 
  color: 0x42a5f5,
  shininess: 100
})
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

const edgeGeometry = new THREE.EdgesGeometry(geometry)
const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x1e88e5 })
const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial)
mesh.add(edges)

const light = new THREE.DirectionalLight(0xffffff, 1)
light.position.set(5, 5, 5)
scene.add(light)

const ambientLight = new THREE.AmbientLight(0x505050)
scene.add(ambientLight)

const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0xcccccc)
scene.add(gridHelper)

const orbitControls = new OrbitControls(camera, renderer.domElement)
orbitControls.enableDamping = true
orbitControls.dampingFactor = 0.05

const controls = new TTControls(camera, renderer.domElement)
controls.attach(mesh)
scene.add(controls.getHelper())

const panel = new TransformInfoPanel(controls,{
  theme: "light"
})

;(window as any).__transformPanel = panel

controls.addEventListener('dragging-changed', (event) => {
  orbitControls.enabled = !(event.value as boolean)
})

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

document.getElementById('translate')?.addEventListener('click', () => {
  controls.setMode('translate')
})

document.getElementById('rotate')?.addEventListener('click', () => {
  controls.setMode('rotate')
})

document.getElementById('scale')?.addEventListener('click', () => {
  controls.setMode('scale')
})

document.getElementById('all')?.addEventListener('click', () => {
  controls.setMode('all')
})

document.getElementById('world')?.addEventListener('click', () => {
  controls.setSpace('world')
})

document.getElementById('local')?.addEventListener('click', () => {
  controls.setSpace('local')
})

document.getElementById('enable')?.addEventListener('click', () => {
  controls.enabled = true
})

document.getElementById('disable')?.addEventListener('click', () => {
  controls.enabled = false
})

controls.addEventListener('change', () => {
  console.log('Object transformed:', {
    position: mesh.position.clone(),
    rotation: mesh.rotation.clone(),
    scale: mesh.scale.clone()
  })
})

function animate() {
  requestAnimationFrame(animate)
  orbitControls.update()
  renderer.render(scene, camera)
}

animate()